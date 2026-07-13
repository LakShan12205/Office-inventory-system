import { redirect } from "next/navigation";
import { ChangePasswordForm } from "@/components/auth/change-password-form";
import { getCurrentUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  let user = null;

  try {
    const response = await getCurrentUser();
    user = response.user;
  } catch {
    redirect("/login");
  }

  if (!user) {
    redirect("/login");
  }

  if (!user.mustChangePassword) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#f7f1e6,#fffdf8)] px-4 py-10">
      <div className="w-full max-w-md rounded-[2rem] border border-white/70 bg-white/95 p-8 shadow-[0_24px_80px_rgba(24,49,83,0.12)]">
        <p className="text-xs uppercase tracking-[0.24em] text-[var(--muted)]">Security</p>
        <h1 className="mt-3 text-3xl font-semibold text-[var(--nav)]">Change Password</h1>
        <p className="mt-3 text-sm leading-6 text-[var(--muted)]">
          You must change your temporary password before accessing the system.
        </p>
        <div className="mt-8">
          <ChangePasswordForm />
        </div>
      </div>
    </div>
  );
}
