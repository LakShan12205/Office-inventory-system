"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { returnRepair } from "@/lib/api";

type RepairReturnButtonProps = {
  repair: {
    id: string;
    reportedDate: string;
    faultDescription: string;
    status: string;
    expectedReturnDate?: string | null;
    asset: {
      assetCode: string;
    };
    workstation: {
      code: string;
    };
    replacementLog?: {
      id: string;
      status: string;
      replacementAsset: {
        assetCode: string;
      };
    } | null;
  };
};

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export function RepairReturnButton({ repair }: RepairReturnButtonProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"RETURN_TO_WORKSTATION" | "MOVE_TO_STORE">(
    "RETURN_TO_WORKSTATION"
  );
  const [repairedBy, setRepairedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasActiveReplacement = useMemo(
    () => repair.replacementLog?.status === "ACTIVE",
    [repair.replacementLog]
  );

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!repairedBy.trim()) {
      setError("Please enter the technician or staff member who completed the repair.");
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await returnRepair(repair.id, {
        action,
        repairedBy: repairedBy.trim(),
        notes: notes.trim() || null
      });

      setSuccess("Repair completed successfully.");
      setOpen(false);
      setNotes("");
      setRepairedBy("");
      router.refresh();
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to complete repair. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (repair.status === "CLOSED" || repair.status === "RETURNED") {
    return null;
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setError(null);
          setOpen(true);
        }}
        className="rounded-full border border-[var(--border)] bg-white px-3 py-2 text-xs font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
      >
        Return / Close Repair
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.45)] p-4">
          <div className="w-full max-w-2xl rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-[var(--nav)]">Complete Repair</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  Close the repair and decide where the repaired asset should go next.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full border border-[var(--border)] px-3 py-1.5 text-sm text-[var(--muted)] transition hover:bg-white"
              >
                Close
              </button>
            </div>

            <div className="mt-5 rounded-[1.4rem] border border-[var(--border)] bg-white/80 p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                Repair Summary
              </p>
              <div className="mt-3 grid gap-3 text-sm text-[var(--text)] sm:grid-cols-2">
                <p>
                  <span className="font-medium">Machine:</span> {repair.asset.assetCode}
                </p>
                <p>
                  <span className="font-medium">Workstation:</span> {repair.workstation.code}
                </p>
                <p>
                  <span className="font-medium">Reported:</span> {formatDate(repair.reportedDate)}
                </p>
                <p>
                  <span className="font-medium">Expected return:</span>{" "}
                  {formatDate(repair.expectedReturnDate)}
                </p>
                {hasActiveReplacement ? (
                  <p className="sm:col-span-2">
                    <span className="font-medium">Active replacement:</span>{" "}
                    {repair.replacementLog?.replacementAsset.assetCode}
                  </p>
                ) : null}
                <p className="sm:col-span-2">
                  <span className="font-medium">Fault:</span> {repair.faultDescription}
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--nav)]">
                  Repaired By
                </label>
                <input
                  value={repairedBy}
                  onChange={(event) => setRepairedBy(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  placeholder="Technician name"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--nav)]">Notes</label>
                <textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
                  placeholder="Optional repair return notes"
                />
              </div>

              <fieldset>
                <legend className="mb-3 text-sm font-medium text-[var(--nav)]">Action</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
                    <input
                      type="radio"
                      name="return-action"
                      value="RETURN_TO_WORKSTATION"
                      checked={action === "RETURN_TO_WORKSTATION"}
                      onChange={() => setAction("RETURN_TO_WORKSTATION")}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--nav)]">
                        Return to Original Workstation
                      </p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Restore the repaired machine to {repair.workstation.code}.
                      </p>
                    </div>
                  </label>

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-[var(--border)] bg-white px-4 py-4">
                    <input
                      type="radio"
                      name="return-action"
                      value="MOVE_TO_STORE"
                      checked={action === "MOVE_TO_STORE"}
                      onChange={() => setAction("MOVE_TO_STORE")}
                      className="mt-1"
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--nav)]">Move to Store</p>
                      <p className="mt-1 text-sm text-[var(--muted)]">
                        Return the repaired machine to the main store after closure.
                      </p>
                    </div>
                  </label>
                </div>
              </fieldset>

              {error ? (
                <div className="rounded-2xl border border-[#f3c1bb] bg-[#fff3f1] px-4 py-3 text-sm text-[#9f2f2f]">
                  {error}
                </div>
              ) : null}

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#214067] disabled:opacity-60"
                >
                  {isSubmitting ? "Completing..." : "Complete Repair"}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="fixed bottom-4 right-4 z-50 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900 shadow-lg">
          {success}
        </div>
      ) : null}
    </>
  );
}
