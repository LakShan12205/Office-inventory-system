"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { changePassword, getApiErrorMessages } from "@/lib/api";

export function ChangePasswordForm() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [errorList, setErrorList] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setErrorList([]);
    setIsSubmitting(true);

    try {
      await changePassword({ currentPassword, newPassword });
      router.push("/dashboard");
      router.refresh();
    } catch (submitError) {
      const validationIssues = getApiErrorMessages(submitError);

      if (
        validationIssues.some((message) =>
          message.includes("at least 10 characters") ||
          message.includes("uppercase letter") ||
          message.includes("lowercase letter") ||
          message.includes("number")
        )
      ) {
        setError("Please review the password requirements below.");
        setErrorList(
          Array.from(
            new Set(
              validationIssues.map((message) => {
                if (
                  message.includes("at least 10 characters") ||
                  message.includes("uppercase letter") ||
                  message.includes("lowercase letter") ||
                  message.includes("number")
                ) {
                  return "Password must be at least 10 characters and include uppercase, lowercase, and a number.";
                }

                return message;
              })
            )
          )
        );
      } else {
        setError(validationIssues[0] ?? "Failed to change password. Please try again.");
        setErrorList(validationIssues.length > 1 ? validationIssues.slice(1) : []);
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--nav)]">Current Password</label>
        <input
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          type="password"
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        />
      </div>
      <div>
        <label className="mb-2 block text-sm font-medium text-[var(--nav)]">New Password</label>
        <input
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          type="password"
          className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
        />
        <p className="mt-2 text-xs text-[var(--muted)]">
          Use at least 10 characters with uppercase, lowercase, and a number.
        </p>
      </div>
      {error ? (
        <div className="rounded-2xl border border-[#f3c1bb] bg-[#fff3f1] px-4 py-3 text-sm text-[#9f2f2f]">
          <p>{error}</p>
          {errorList.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {errorList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[var(--nav)] px-5 py-3 font-semibold text-white transition hover:bg-[#214067] disabled:opacity-60"
      >
        {isSubmitting ? "Updating..." : "Change Password"}
      </button>
    </form>
  );
}
