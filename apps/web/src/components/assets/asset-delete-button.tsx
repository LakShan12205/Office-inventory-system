"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAssetPermanently } from "@/lib/api";

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

export function AssetDeleteButton({
  assetId,
  assetCode
}: {
  assetId: string;
  assetCode: string;
}) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  function closeModal() {
    if (isPending) return;
    setIsOpen(false);
    setFeedback(null);
  }

  function handleDelete() {
    setFeedback(null);

    startTransition(async () => {
      try {
        await deleteAssetPermanently(assetId);
        setFeedback({
          type: "success",
          message: `${assetCode} was permanently deleted.`
        });
        window.setTimeout(() => {
          setIsOpen(false);
          router.refresh();
        }, 700);
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete asset. Please try again."
        });
      }
    });
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFeedback(null);
          setIsOpen(true);
        }}
        className="inline-flex items-center justify-center rounded-xl border border-[#f3c1bb] bg-[#fff3f1] px-3 py-2 text-[#9f2f2f] transition hover:bg-[#fde7e3]"
        aria-label={`Delete ${assetCode}`}
        title="Delete asset"
      >
        <TrashIcon />
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={`delete-title-${assetId}`}
            className="w-full max-w-md rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,251,245,0.97))] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.24)]"
          >
            <div className="space-y-3">
              <h2 id={`delete-title-${assetId}`} className="text-lg font-semibold text-[var(--nav)]">
                Delete asset permanently?
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Are you sure you want to permanently delete this asset? This action cannot be undone.
              </p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                <span className="font-semibold text-[var(--text)]">{assetCode}</span> will be removed only if it has no assignments, repairs, replacement logs, or alerts.
              </p>
              {feedback ? (
                <div
                  className={`rounded-2xl px-4 py-3 text-sm ${
                    feedback.type === "success"
                      ? "border border-[#cce8d6] bg-[#effaf3] text-[#226348]"
                      : "border border-[#f3c1bb] bg-[#fff3f1] text-[#9f2f2f]"
                  }`}
                >
                  {feedback.message}
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
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-xl bg-[#9f2f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#872727] disabled:cursor-not-allowed disabled:bg-[#c18484]"
              >
                {isPending ? "Deleting..." : "Delete Asset"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
