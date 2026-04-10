"use client";

import Link from "next/link";
import { useState } from "react";
import { submitAccessRequest } from "@/lib/api";

export function AccessRequestForm() {
  const [form, setForm] = useState({
    fullName: "",
    employeeId: "",
    email: "",
    requestedUsername: ""
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const result = await submitAccessRequest(form);
      setSuccess(result.message);
      setForm({
        fullName: "",
        employeeId: "",
        email: "",
        requestedUsername: ""
      });
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Failed to submit access request. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {[
        { id: "fullName", label: "Full Name" },
        { id: "employeeId", label: "Employee ID" },
        { id: "email", label: "Email", type: "email" },
        { id: "requestedUsername", label: "Requested Username" }
      ].map((field) => (
        <div key={field.id}>
          <label className="mb-2 block text-sm font-medium text-[var(--nav)]">{field.label}</label>
          <input
            value={form[field.id as keyof typeof form]}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                [field.id]: event.target.value
              }))
            }
            type={field.type ?? "text"}
            className="w-full rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          />
        </div>
      ))}
      {success ? (
        <div className="rounded-2xl border border-[#bfdcbf] bg-[#f4fff4] px-4 py-3 text-sm text-[#2f6b2f]">
          {success}
        </div>
      ) : null}
      {error ? (
        <div className="rounded-2xl border border-[#f3c1bb] bg-[#fff3f1] px-4 py-3 text-sm text-[#9f2f2f]">
          {error}
        </div>
      ) : null}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-2xl bg-[var(--nav)] px-5 py-3 font-semibold text-white transition hover:bg-[#214067] disabled:opacity-60"
      >
        {isSubmitting ? "Submitting..." : "Submit Request"}
      </button>
      <p className="text-sm text-[var(--muted)]">
        Already have credentials?{" "}
        <Link href="/login" className="font-semibold text-[var(--accent)]">
          Go to login
        </Link>
      </p>
    </form>
  );
}
