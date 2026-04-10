"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { approveAccessRequest, rejectAccessRequest } from "@/lib/api";
import type { AccessRequestRecord } from "@/lib/types";

const ROLE_OPTIONS = ["EMPLOYEE", "MANAGER", "SUPERVISOR", "ADMIN"] as const;

export function AccessRequestsAdmin({ requests }: { requests: AccessRequestRecord[] }) {
  const router = useRouter();
  const [selectedRoles, setSelectedRoles] = useState<Record<string, typeof ROLE_OPTIONS[number]>>(
    Object.fromEntries(requests.map((request) => [request.id, "EMPLOYEE"]))
  );
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [temporaryCredential, setTemporaryCredential] = useState<{
    requestId: string;
    password: string;
  } | null>(null);

  useEffect(() => {
    if (!temporaryCredential) {
      return;
    }

    // Show the temporary password only briefly so it does not linger in long-lived UI state.
    const timeoutId = window.setTimeout(() => {
      setTemporaryCredential(null);
    }, 45000);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [temporaryCredential]);

  async function handleApprove(requestId: string) {
    setBusyId(requestId);
    setMessages((current) => ({ ...current, [requestId]: "" }));
    setTemporaryCredential(null);
    try {
      const result = await approveAccessRequest(requestId, {
        role: selectedRoles[requestId] ?? "EMPLOYEE"
      });
      setMessages((current) => ({
        ...current,
        [requestId]: "Approved. Share the temporary password securely with the user."
      }));
      setTemporaryCredential({
        requestId,
        password: result.temporaryPassword
      });
      router.refresh();
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [requestId]:
          error instanceof Error ? error.message : "Failed to approve access request."
      }));
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(requestId: string) {
    setBusyId(requestId);
    setMessages((current) => ({ ...current, [requestId]: "" }));
    try {
      await rejectAccessRequest(requestId);
      setMessages((current) => ({
        ...current,
        [requestId]: "Request rejected."
      }));
      router.refresh();
    } catch (error) {
      setMessages((current) => ({
        ...current,
        [requestId]:
          error instanceof Error ? error.message : "Failed to reject access request."
      }));
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="space-y-4">
      {requests.map((request) => (
        <div
          key={request.id}
          className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,255,255,0.94))] p-5 shadow-[0_18px_40px_rgba(24,49,83,0.06)]"
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--nav)]">{request.fullName}</h3>
              <div className="grid gap-2 text-sm text-[var(--muted)] sm:grid-cols-2">
                <p>Employee ID: {request.employeeId}</p>
                <p>Email: {request.email}</p>
                <p>Requested Username: {request.requestedUsername}</p>
                <p>Status: {request.status}</p>
              </div>
            </div>
            {request.status === "PENDING" ? (
              <div className="w-full max-w-sm space-y-3">
                <select
                  value={selectedRoles[request.id] ?? "EMPLOYEE"}
                  onChange={(event) =>
                    setSelectedRoles((current) => ({
                      ...current,
                      [request.id]: event.target.value as typeof ROLE_OPTIONS[number]
                    }))
                  }
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                >
                  {ROLE_OPTIONS.map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
                <div className="flex gap-3">
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => handleApprove(request.id)}
                    className="flex-1 rounded-2xl bg-[var(--nav)] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#214067] disabled:opacity-60"
                  >
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busyId === request.id}
                    onClick={() => handleReject(request.id)}
                    className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)] disabled:opacity-60"
                  >
                    Reject
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted)]">
                Reviewed {request.reviewedAt ? new Date(request.reviewedAt).toLocaleString() : "earlier"}
              </div>
            )}
          </div>
          {messages[request.id] ? (
            <div className="mt-4 rounded-2xl border border-[var(--border)] bg-white/80 px-4 py-3 text-sm text-[var(--text)]">
              {messages[request.id]}
            </div>
          ) : null}
          {temporaryCredential?.requestId === request.id ? (
            <div className="mt-4 rounded-2xl border border-[#d8e6f4] bg-[#f4f8fc] px-4 py-3 text-sm text-[#173d67]">
              <p className="font-semibold">Temporary password</p>
              <p className="mt-1 font-mono tracking-[0.04em]">{temporaryCredential.password}</p>
              <p className="mt-2 text-xs text-[#6b7b8d]">
                This password is shown once and will disappear shortly. Ask the user to change it on first login.
              </p>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
