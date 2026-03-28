"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createAsset } from "@/lib/api";
import { AssetType } from "@/lib/types";

export function AssetForm({ assetTypes }: { assetTypes: AssetType[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    assetCode: "",
    assetTypeId: assetTypes[0]?.id ?? "",
    brand: "",
    model: "",
    serialNumber: "",
    specification: "",
    purchaseDate: "",
    status: "IN_STORE",
    currentLocation: "Main Store",
    notes: ""
  });

  function updateField(name: string, value: string) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    startTransition(async () => {
      try {
        await createAsset({
          ...form,
          specification: form.specification || null,
          purchaseDate: form.purchaseDate ? new Date(form.purchaseDate).toISOString() : null,
          currentLocation: form.currentLocation || null,
          notes: form.notes || null
        });
        router.push("/assets");
        router.refresh();
      } catch (submissionError) {
        setError(submissionError instanceof Error ? submissionError.message : "Failed to create asset");
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
          <span className="font-medium">Asset code</span>
          <input value={form.assetCode} onChange={(e) => updateField("assetCode", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Asset type</span>
          <select value={form.assetTypeId} onChange={(e) => updateField("assetTypeId", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
            {assetTypes.map((assetType) => (
              <option key={assetType.id} value={assetType.id}>{assetType.name}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Brand</span>
          <input value={form.brand} onChange={(e) => updateField("brand", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Model</span>
          <input value={form.model} onChange={(e) => updateField("model", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Serial number</span>
          <input value={form.serialNumber} onChange={(e) => updateField("serialNumber", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Purchase date</span>
          <input type="date" value={form.purchaseDate} onChange={(e) => updateField("purchaseDate", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Status</span>
          <select value={form.status} onChange={(e) => updateField("status", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3">
            <option value="ACTIVE">Active</option>
            <option value="IN_REPAIR">In Repair</option>
            <option value="IN_STORE">In Store</option>
            <option value="TEMPORARY_REPLACEMENT">Temporary Replacement</option>
            <option value="DAMAGED">Damaged</option>
            <option value="RETIRED">Retired</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm">
          <span className="font-medium">Current location</span>
          <input value={form.currentLocation} onChange={(e) => updateField("currentLocation", e.target.value)} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm xl:col-span-3">
          <span className="font-medium">Specification</span>
          <textarea value={form.specification} onChange={(e) => updateField("specification", e.target.value)} rows={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
        <label className="grid gap-2 text-sm xl:col-span-3">
          <span className="font-medium">Notes</span>
          <textarea value={form.notes} onChange={(e) => updateField("notes", e.target.value)} rows={3} className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3" />
        </label>
      </div>
      {error ? <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div> : null}
      <div className="flex justify-end">
        <button type="submit" disabled={isPending} className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {isPending ? "Saving..." : "Create asset"}
        </button>
      </div>
    </form>
  );
}
