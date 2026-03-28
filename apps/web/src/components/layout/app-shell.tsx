"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workstations", label: "Workstations" },
  { href: "/assets", label: "Assets" },
  { href: "/repairs", label: "Repairs" },
  { href: "/replacements", label: "Replacements" },
  { href: "/alerts", label: "Alerts" }
];

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

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen max-w-[1600px] gap-5 px-3 py-4 lg:px-5">
        <aside className="hidden w-72 shrink-0 rounded-[2rem] bg-[var(--nav)] p-6 text-white shadow-2xl lg:flex lg:flex-col">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-[var(--nav-muted)]">
              Office Ops
            </p>
            <h1 className="mt-3 text-2xl font-semibold leading-tight">
              Workstation Inventory Control
            </h1>
            <p className="mt-3 text-sm leading-6 text-slate-200">
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
          </nav>

          <div className="mt-auto rounded-[1.75rem] border border-white/10 bg-white/5 p-4">
            <p className="text-sm font-medium">Production-style MVP</p>
            <p className="mt-2 text-sm leading-6 text-slate-200">
              Built specifically for 12 office workstations and machine repair follow-up.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="mb-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)]/90 px-5 py-4 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-xs uppercase tracking-[0.28em] text-[var(--muted)]">
                  Office Workstation Inventory
                </p>
                <h2 className="mt-2 text-2xl font-semibold">{getPageTitle(pathname)}</h2>
              </div>
              <div className="rounded-2xl bg-[var(--panel-strong)] px-4 py-3 text-sm text-[var(--muted)]">
                Monitor machine repairs, replacements, and overdue follow-up without losing history.
              </div>
            </div>
          </header>

          <main>{children}</main>
        </div>
      </div>
    </div>
  );
}
