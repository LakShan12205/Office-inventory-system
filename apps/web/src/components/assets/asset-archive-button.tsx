"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { archiveAsset } from "@/lib/api";

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M4.5 7.5h15" />
      <path d="M9.5 3.5h5" />
      <path d="M7.5 7.5v11a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-11" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
    </svg>
  );
}

export function AssetArchiveButton({
  assetId,
  assetCode,
  assetStatus
}: {
  assetId: string;
  assetCode: string;
  assetStatus: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isArchived = assetStatus === "ARCHIVED";

  function closeModal() {
    if (isPending) return;
    setIsOpen(false);
    setError(null);
  }

  function handleArchive() {
    setError(null);
    startTransition(async () => {
      try {
        await archiveAsset(assetId);
        setIsOpen(false);
        router.refresh();
      } catch (archiveError) {
        setError(
          archiveError instanceof Error
            ? archiveError.message
            : "Failed to archive asset. Please try again."
        );
      }
    });
  }

  return (
    <>
      <button
        type="button"
        disabled={isArchived}
        onClick={() => {
          setError(null);
          setIsOpen(true);
        }}
        className={`inline-flex items-center justify-center rounded-xl border px-3 py-2 transition ${
          isArchived
            ? "cursor-not-allowed border-slate-200 bg-slate-100 text-slate-400"
            : "border-[var(--border)] bg-white text-[var(--danger,#9f2f2f)] hover:bg-[#fff3f1]"
        }`}
        aria-label={isArchived ? `${assetCode} is already archived` : `Archive ${assetCode}`}
        title={isArchived ? "Already archived" : "Archive asset"}
      >
        <TrashIcon />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`archive-title-${assetId}`}
            className="w-full max-w-md rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,251,245,0.97))] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.24)]"
          >
            <div className="space-y-3">
              <h2
                id={`archive-title-${assetId}`}
                className="text-lg font-semibold text-[var(--nav)]"
              >
                Archive asset?
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">{assetCode}</span> will be
                moved to archived status. Repairs, replacements, and assignment history will be
                preserved.
              </p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                If this asset still has an active assignment, archiving will be blocked until it is
                safely unassigned.
              </p>
              {error ? (
                <div className="rounded-2xl border border-[#f3c1bb] bg-[#fff3f1] px-4 py-3 text-sm text-[#9f2f2f]">
                  {error}
                </div>
              ) : null}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={isPending}
                className="rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleArchive}
                disabled={isPending}
                className="rounded-xl bg-[#9f2f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#872727] disabled:cursor-not-allowed disabled:bg-[#c18484]"
              >
                {isPending ? "Archiving..." : "Archive Asset"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
