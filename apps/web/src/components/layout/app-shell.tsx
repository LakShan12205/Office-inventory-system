"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SystemLogo } from "@/components/branding/system-logo";
import {
  ApiError,
  clearBrowserAuthSession,
  getAccessRequests,
  getCurrentUser,
  hasClientLoggedOut,
  logoutUser
} from "@/lib/api";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workstations", label: "Workstations" },
  { href: "/assets", label: "Assets" },
  { href: "/repairs", label: "Repairs" },
  { href: "/replacements", label: "Replacements" },
  { href: "/alerts", label: "Alerts" }
];

const adminNavigation = [{ href: "/admin/access-requests", label: "Access Requests" }];

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/workstations": "Workstation Management",
  "/assets": "Asset Management",
  "/repairs": "Repair Management",
  "/replacements": "Temporary Replacements",
  "/alerts": "Alert Center"
};

function getPageTitle(pathname: string) {
  if (pathname.startsWith("/workstations/")) {
    return "Workstation Detail";
  }

  if (pathname.startsWith("/assets/")) {
    return "Asset Detail";
  }

  if (pathname.startsWith("/repairs/new")) {
    return "Report Faulty Machine";
  }

  return pageTitles[pathname] ?? "Office Inventory";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [hasMounted, setHasMounted] = useState(false);
  const [logoutError, setLogoutError] = useState<string | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pendingAccessRequestCount, setPendingAccessRequestCount] = useState(0);
  const [hasSessionEnded, setHasSessionEnded] = useState(false);

  const isAuthPage = useMemo(() => {
    return (
      pathname === "/login" ||
      pathname === "/request-access" ||
      pathname === "/change-password"
    );
  }, [pathname]);


  useEffect(() => {
    setHasMounted(true);
  }, []);

  useEffect(() => {
    if (!hasMounted || isAuthPage || isLoggingOut || hasSessionEnded || hasClientLoggedOut()) {
      return;
    }

    let isMounted = true;

    async function loadCurrentUser() {
      try {
        const { user } = await getCurrentUser();

        if (isMounted && user) {
          const adminUser = user.role === "ADMIN";
          setIsAdmin(adminUser);

          if (adminUser) {
            const { requests } = await getAccessRequests();

            if (isMounted) {
              setPendingAccessRequestCount(
                requests.filter((request) => request.status === "PENDING").length
              );
            }
          } else {
            setPendingAccessRequestCount(0);
          }
        } else if (isMounted) {
          setIsAdmin(false);
          setPendingAccessRequestCount(0);
        }
      } catch (error) {
        if (isMounted) {
          setIsAdmin(false);
          setPendingAccessRequestCount(0);
        }

        if (error instanceof ApiError && error.status === 401) {
          clearBrowserAuthSession(true);
          setHasSessionEnded(true);
          router.replace("/login");
          router.refresh();
        }
      }
    }

    loadCurrentUser();

    return () => {
      isMounted = false;
    };
  }, [hasMounted, hasSessionEnded, isAuthPage, isLoggingOut, router]);

  async function handleLogout() {
    if (isLoggingOut) {
      return;
    }

    if (hasClientLoggedOut()) {
      clearBrowserAuthSession(true);
      setHasSessionEnded(true);
      router.replace("/login");
      router.refresh();
      return;
    }

    setLogoutError(null);
    setIsLoggingOut(true);

    try {
      await logoutUser();
      setHasSessionEnded(true);
      setIsAdmin(false);
      setPendingAccessRequestCount(0);
      router.replace("/login");
      router.refresh();
    } catch (error) {
      setLogoutError(
        error instanceof Error ? error.message : "Logout failed. Please try again."
      );
    } finally {
      setIsLoggingOut(false);
    }
  }

  if (isAuthPage) {
    return <main>{children}</main>;
  }

  return (
    <div className="min-h-screen bg-[#f6f7f4]">
      <div className="flex min-h-screen gap-4 px-3 py-4 lg:gap-6 lg:px-6 xl:px-8 2xl:px-10">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] bg-[var(--nav)] p-6 text-white shadow-2xl lg:flex lg:flex-col">
          <div>
            <SystemLogo />
            <p className="mt-5 text-sm leading-6 text-slate-200">
              Track assigned assets, repair movement, replacement machines, and office alerts in one place.
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            {navigation.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`block rounded-2xl px-4 py-3 text-sm transition ${
                    active ? "bg-white text-[var(--nav)]" : "text-slate-100 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}

            {hasMounted && isAdmin
              ? adminNavigation.map((item) => {
                  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                        active ? "bg-white text-[var(--nav)]" : "text-slate-100 hover:bg-white/10"
                      }`}
                    >
                      <span>{item.label}</span>
                      {pendingAccessRequestCount > 0 ? (
                        <span
                          className={`inline-flex min-w-[1.5rem] items-center justify-center rounded-full px-1.5 py-0.5 text-[0.72rem] font-semibold ${
                            active ? "bg-[#c44949] text-white" : "bg-[#d95c5c] text-white"
                          }`}
                        >
                          {pendingAccessRequestCount > 9 ? "9+" : pendingAccessRequestCount}
                        </span>
                      ) : null}
                    </Link>
                  );
                })
              : null}
          </nav>

          <div className="mt-auto rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">Production-style MVP</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Built specifically for 12 office workstations and machine repair follow-up.
            </p>

            {logoutError ? (
              <p className="mt-4 rounded-2xl border border-white/10 bg-[rgba(196,73,73,0.18)] px-3 py-2 text-sm text-white">
                {logoutError}
              </p>
            ) : null}

            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="mt-4 inline-flex w-full items-center justify-center rounded-2xl border border-white/12 bg-white/8 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-5 rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)]/90 px-5 py-4 shadow-sm backdrop-blur lg:px-6 xl:px-7">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div className="flex items-start gap-4">
                <div className="hidden md:block md:w-[72px] md:shrink-0">
                  <SystemLogo />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                    Office Workstation Inventory
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">{getPageTitle(pathname)}</h2>
                </div>
              </div>

              <div className="flex flex-col items-stretch gap-3 md:items-end">
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center justify-center rounded-2xl border border-[var(--border)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoggingOut ? "Logging out..." : "Logout"}
                </button>

                <div className="rounded-2xl bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted)]">
                  Monitor machine repairs, replacements, and overdue follow-up without losing history.
                </div>

                {logoutError ? (
                  <p className="text-sm text-[var(--danger)]">{logoutError}</p>
                ) : null}
              </div>
            </div>
          </header>

          <main className="pb-4">{children}</main>
        </div>
      </div>
    </div>
  );
}
