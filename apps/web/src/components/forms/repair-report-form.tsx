"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createRepair } from "@/lib/api";
import { AssetRecord, WorkstationListItem } from "@/lib/types";

type MachineOption = {
  id: string;
  assetCode: string;
  currentWorkstationId?: string;
  currentWorkstationCode?: string;
  status: string;
};

function toDateTimeInputValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

export function RepairReportForm({
  workstations,
  machineAssets
}: {
  workstations: WorkstationListItem[];
  machineAssets: AssetRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const machineOptions: MachineOption[] = useMemo(
    () =>
      machineAssets.map((asset) => ({
        id: asset.id,
        assetCode: asset.assetCode,
        currentWorkstationId: asset.workstationAssignments[0]?.workstation.id,
        currentWorkstationCode: asset.workstationAssignments[0]?.workstation.code,
        status: asset.status
      })),
    [machineAssets]
  );

  const defaultMachine = machineOptions.find((asset) => asset.status === "ACTIVE");
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    workstationId: defaultMachine?.currentWorkstationId || workstations[0]?.id || "",
    assetId: defaultMachine?.id || "",
    reportedDate: toDateTimeInputValue(),
    faultDescription: "",
    sentTo: "",
    repairType: "SENT_TO_SHOP",
    sentDate: toDateTimeInputValue(),
    expectedReturnDate: "",
    actualReturnDate: "",
    diagnosis: "",
    repairAction: "",
    partsChanged: "",
    cost: "",
    handledBy: "",
    notes: "",
    status: "SENT",
    replacementAssetId: "",
    replacementDate: "",
    replacementStatus: "ACTIVE",
    replacementNotes: ""
  });

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  function onMachineChange(assetId: string) {
    const asset = machineOptions.find((item) => item.id === assetId);
    setForm((current) => ({
      ...current,
      assetId,
      workstationId: asset?.currentWorkstationId || current.workstationId
    }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createRepair({
          workstationId: form.workstationId,
          assetId: form.assetId,
          reportedDate: new Date(form.reportedDate).toISOString(),
          faultDescription: form.faultDescription,
          sentTo: form.sentTo || null,
          repairType: form.repairType,
          sentDate: form.sentDate ? new Date(form.sentDate).toISOString() : null,
          expectedReturnDate: form.expectedReturnDate
            ? new Date(form.expectedReturnDate).toISOString()
            : null,
          actualReturnDate: form.actualReturnDate ? new Date(form.actualReturnDate).toISOString() : null,
          diagnosis: form.diagnosis || null,
          repairAction: form.repairAction || null,
          partsChanged: form.partsChanged || null,
          cost: form.cost ? Number(form.cost) : null,
          handledBy: form.handledBy || null,
          notes: form.notes || null,
          status: form.status,
          replacementAssetId: form.replacementAssetId || null,
          replacementDate: form.replacementDate
            ? new Date(form.replacementDate).toISOString()
            : null,
          replacementStatus: form.replacementAssetId ? form.replacementStatus : undefined,
          replacementNotes: form.replacementNotes || null
        });

        router.push("/repairs");
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Failed to submit repair");
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className="grid gap-5 rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm"
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Workstation</span>
          <select
            value={form.workstationId}
            onChange={(event) => updateField("workstationId", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            {workstations.map((workstation) => (
              <option key={workstation.id} value={workstation.id}>
                {workstation.code} - {workstation.name}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Faulty machine</span>
          <select
            value={form.assetId}
            onChange={(event) => onMachineChange(event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            {machineOptions.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.assetCode} {asset.currentWorkstationCode ? `(${asset.currentWorkstationCode})` : ""}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Repair type</span>
          <select
            value={form.repairType}
            onChange={(event) => updateField("repairType", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="SENT_TO_SHOP">Sent to Shop</option>
            <option value="ON_SITE">On-site</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Reported date</span>
          <input
            type="datetime-local"
            value={form.reportedDate}
            onChange={(event) => updateField("reportedDate", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Sent date</span>
          <input
            type="datetime-local"
            value={form.sentDate}
            onChange={(event) => updateField("sentDate", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Expected return date</span>
          <input
            type="datetime-local"
            value={form.expectedReturnDate}
            onChange={(event) => updateField("expectedReturnDate", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Sent to person or shop</span>
          <input
            value={form.sentTo}
            onChange={(event) => updateField("sentTo", event.target.value)}
            placeholder="TechFix Workshop"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Repair status</span>
          <select
            value={form.status}
            onChange={(event) => updateField("status", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="REPORTED">Reported</option>
            <option value="SENT">Sent</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RETURNED">Returned</option>
            <option value="CLOSED">Closed</option>
          </select>
        </label>

        <label className="grid gap-2 text-sm">
          <span className="font-medium">Handled by</span>
          <input
            value={form.handledBy}
            onChange={(event) => updateField("handledBy", event.target.value)}
            placeholder="Staff member or mechanic"
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>

        <label className="grid gap-2 text-sm xl:col-span-3">
          <span className="font-medium">Fault description</span>
          <textarea
            value={form.faultDescription}
            onChange={(event) => updateField("faultDescription", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Diagnosis</span>
          <textarea
            value={form.diagnosis}
            onChange={(event) => updateField("diagnosis", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Repair action</span>
          <textarea
            value={form.repairAction}
            onChange={(event) => updateField("repairAction", event.target.value)}
            rows={3}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Parts changed</span>
          <input
            value={form.partsChanged}
            onChange={(event) => updateField("partsChanged", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Cost</span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.cost}
            onChange={(event) => updateField("cost", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Temporary replacement machine</span>
          <select
            value={form.replacementAssetId}
            onChange={(event) => updateField("replacementAssetId", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">No replacement</option>
            {machineOptions
              .filter((asset) => asset.id !== form.assetId && asset.status !== "IN_REPAIR")
              .map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.assetCode}
                </option>
              ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Replacement date</span>
          <input
            type="datetime-local"
            value={form.replacementDate}
            onChange={(event) => updateField("replacementDate", event.target.value)}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </label>
      </div>

      <label className="grid gap-2 text-sm">
        <span className="font-medium">Notes</span>
        <textarea
          value={form.notes}
          onChange={(event) => updateField("notes", event.target.value)}
          rows={3}
          className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        />
      </label>

      {error ? (
        <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
        >
          {isPending ? "Submitting..." : "Create repair record"}
        </button>
      </div>
    </form>
  );
}
