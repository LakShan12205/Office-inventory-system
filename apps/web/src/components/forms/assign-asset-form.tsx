"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createWorkstationAssignment } from "@/lib/api";
import { AssetRecord, WorkstationDetail } from "@/lib/types";

export function AssignAssetForm({
  workstation,
  assets
}: {
  workstation: WorkstationDetail;
  assets: AssetRecord[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const assignableAssets = useMemo(
    () =>
      assets.filter(
        (asset) =>
          asset.status !== "RETIRED" &&
          asset.status !== "DAMAGED" &&
          asset.workstationAssignments.length === 0
      ),
    [assets]
  );
  const [form, setForm] = useState({
    assetId: assignableAssets[0]?.id ?? "",
    assignmentType: "PRIMARY",
    assignedDate: new Date().toISOString().slice(0, 16),
    notes: ""
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createWorkstationAssignment(workstation.id, {
          assetId: form.assetId,
          assignmentType: form.assignmentType,
          assignedDate: new Date(form.assignedDate).toISOString(),
          notes: form.notes || null
        });
        router.push(`/workstations/${workstation.id}`);
        router.refresh();
      } catch (submissionError) {
        setError(
          submissionError instanceof Error ? submissionError.message : "Failed to assign asset"
        );
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-5 rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Workstation</span>
          <input value={`${workstation.code} - ${workstation.name}`} readOnly className="rounded-2xl border border-[var(--border)] bg-[var(--panel-strong)] px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Asset</span>
          <select value={form.assetId} onChange={(e) => setForm((c) => ({ ...c, assetId: e.target.value }))} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
            {assignableAssets.map((asset) => (
              <option key={asset.id} value={asset.id}>
                {asset.assetCode} - {asset.assetType.name} - {asset.brand} {asset.model}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Assignment type</span>
          <select value={form.assignmentType} onChange={(e) => setForm((c) => ({ ...c, assignmentType: e.target.value }))} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
            <option value="PRIMARY">Primary</option>
            <option value="TEMPORARY_REPLACEMENT">Temporary Replacement</option>
            <option value="SPARE">Spare</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Assigned date</span>
          <input type="datetime-local" value={form.assignedDate} onChange={(e) => setForm((c) => ({ ...c, assignedDate: e.target.value }))} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
      </div>
      <label className="grid gap-2 text-sm">
        <span className="font-medium">Notes</span>
        <textarea value={form.notes} onChange={(e) => setForm((c) => ({ ...c, notes: e.target.value }))} rows={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
      </label>
      {assignableAssets.length === 0 ? <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">No unassigned assets are available right now.</div> : null}
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="flex justify-end">
        <button type="submit" disabled={isPending || assignableAssets.length === 0} className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {isPending ? "Assigning..." : "Assign asset"}
        </button>
      </div>
    </form>
  );
}
