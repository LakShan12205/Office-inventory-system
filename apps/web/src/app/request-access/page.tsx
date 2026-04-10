import { AccessRequestForm } from "@/components/auth/access-request-form";

export default function RequestAccessPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f1e6,#fffdf8)] px-4 py-10">
      <div className="w-full max-w-2xl rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-[0_24px_80px_rgba(24,49,83,0.12)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Office Inventory</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--nav)]">Request Access</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          Submit your details for administrator review. This form does not create a login account automatically.
        </p>
        <div className="mt-8">
          <AccessRequestForm />
        </div>
      </div>
    </div>
  );
}
