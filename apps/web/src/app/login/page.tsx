import { redirect } from "next/navigation";
import { SystemLogo } from "@/components/branding/system-logo";
import { LoginForm } from "@/components/auth/login-form";
import { ApiError, getCurrentUser } from "@/lib/api";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  let user = null;

  try {
    const response = await getCurrentUser();
    user = response.user;
  } catch (error) {
    if (!(error instanceof ApiError) || error.status !== 401) {
      console.error("Login auth check failed:", error);
    }
  }

  if (user?.mustChangePassword === true) {
    redirect("/change-password");
  }

  if (user?.mustChangePassword === false) {
    redirect("/dashboard");
  }

  return renderLoginPage();
}

function renderLoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-[#eef6f1] via-white to-[#e6f4ec]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="flex items-center justify-center px-8 py-12 lg:px-16 bg-white/40">
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center text-center">
            <div className="w-full max-w-[460px]">
              <SystemLogo />
            </div>

            <h1 className="mt-8 text-4xl font-bold tracking-tight text-[#22386f] sm:text-5xl xl:text-6xl">
              Eagle Eyes CCTV Solutions
            </h1>

            <p className="mt-4 text-xl font-medium tracking-[0.18em] text-[#5b6f95] sm:text-2xl">
              Inventory Management System
            </p>
          </div>
        </section>

        <section className="flex items-center justify-start pl-10 pr-6 py-12 sm:pl-14 lg:pl-20 xl:pl-24">
          <div className="w-full max-w-[620px]">
            <LoginForm />
          </div>
        </section>
      </div>
    </main>
  );
}
