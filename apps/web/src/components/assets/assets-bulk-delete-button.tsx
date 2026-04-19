"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAllAssetsPermanently } from "@/lib/api";

function TrashStackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current stroke-[1.8]">
      <path d="M4.5 7.5h15" />
      <path d="M9.5 3.5h5" />
      <path d="M7.5 7.5v11a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-11" />
      <path d="M10 11v5" />
      <path d="M14 11v5" />
      <path d="M5 20.5h14" />
    </svg>
  );
}

export function AssetsBulkDeleteButton() {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [confirmationText, setConfirmationText] = useState("");
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  const canDelete = useMemo(() => confirmationText.trim() === "DELETE", [confirmationText]);

  function closeModal() {
    if (isPending) return;
    setIsOpen(false);
    setConfirmationText("");
    setFeedback(null);
  }

  function handleDeleteAll() {
    if (!canDelete) return;

    setFeedback(null);
    startTransition(async () => {
      try {
        const result = await deleteAllAssetsPermanently();
        setFeedback({
          type: "success",
          message: `Deleted ${result.deleted} asset(s). Skipped ${result.skipped} asset(s) with related history.`
        });
        window.setTimeout(() => {
          setIsOpen(false);
          setConfirmationText("");
          router.refresh();
        }, 900);
      } catch (error) {
        setFeedback({
          type: "error",
          message:
            error instanceof Error
              ? error.message
              : "Failed to delete removable assets. Please try again."
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
          setConfirmationText("");
          setIsOpen(true);
        }}
        className="inline-flex items-center gap-2 rounded-2xl border border-[#f3c1bb] bg-[#fff3f1] px-5 py-3 text-sm font-semibold text-[#9f2f2f] transition hover:bg-[#fde7e3]"
      >
        <TrashStackIcon />
        Delete All Assets
      </button>

      {isOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(15,23,42,0.42)] px-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-all-assets-title"
            className="w-full max-w-lg rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.99),rgba(255,251,245,0.97))] p-6 shadow-[0_25px_80px_rgba(15,23,42,0.24)]"
          >
            <div className="space-y-3">
              <h2 id="delete-all-assets-title" className="text-lg font-semibold text-[var(--nav)]">
                Delete all removable assets?
              </h2>
              <p className="text-sm leading-6 text-[var(--muted)]">
                This will permanently delete all removable assets. This action cannot be undone.
              </p>
              <p className="text-sm leading-6 text-[var(--muted)]">
                Assets with assignments, repairs, replacement logs, or alerts will be skipped automatically.
              </p>
              <div className="space-y-2">
                <label htmlFor="delete-all-confirmation" className="text-sm font-semibold text-[var(--nav)]">
                  Type <span className="font-bold">DELETE</span> to continue
                </label>
                <input
                  id="delete-all-confirmation"
                  value={confirmationText}
                  onChange={(event) => setConfirmationText(event.target.value)}
                  className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3 text-sm"
                  placeholder="DELETE"
                />
              </div>
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
                onClick={handleDeleteAll}
                disabled={!canDelete || isPending}
                className="rounded-xl bg-[#9f2f2f] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#872727] disabled:cursor-not-allowed disabled:bg-[#c18484]"
              >
                {isPending ? "Deleting..." : "Delete All Assets"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
