import Link from "next/link";
import { SystemLogo } from "@/components/system-logo";

const quickLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/workstations", label: "Workstations" },
  { href: "/assets", label: "Assets" },
  { href: "/repairs", label: "Repairs" },
  { href: "/replacements", label: "Replacements" }
];

const supportLinks = [
  { href: "/alerts", label: "Alerts" },
  { href: "/request-access", label: "Request Access" },
  { href: "mailto:admin@eagleeyes.local", label: "Contact Admin" },
  { href: "/dashboard#guide", label: "Help Guide" }
];

export function DashboardFooter() {
  return (
    <footer className="overflow-hidden rounded-[2rem] border border-[#dbe6e1] bg-[#18211f] text-white shadow-[0_24px_64px_rgba(15,23,42,0.18)]">
      <div className="h-1 w-full bg-[linear-gradient(90deg,#7fc8bb_0%,#8adcb0_50%,#6ab3d6_100%)]" />

      <div className="border-b border-white/10 px-6 py-7 sm:px-8 lg:px-10">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-[-0.02em] text-white">
              Need Help With the System?
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
              Contact the administrator or check the user guide for assistance.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="mailto:admin@eagleeyes.local"
              className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#6fc6b5,#7cd49b)] px-5 py-2.5 text-sm font-semibold text-[#143129] transition hover:brightness-105"
            >
              Contact Admin
            </Link>
            <Link
              href="/dashboard#guide"
              className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              View Guide
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-8 px-6 py-8 sm:px-8 lg:grid-cols-[1.25fr_0.85fr_0.85fr_0.75fr] lg:px-10 lg:py-10">
        <div>
          <SystemLogo compact tone="dark" />
          <p className="mt-5 max-w-md text-sm leading-7 text-slate-300">
            Internal system for managing office assets, repairs, and operations.
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#93d8bf]">
            Quick Links
          </h3>
          <div className="mt-4 space-y-3">
            {quickLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-sm text-slate-300 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#93d8bf]">
            Support
          </h3>
          <div className="mt-4 space-y-3">
            {supportLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="block text-sm text-slate-300 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold uppercase tracking-[0.22em] text-[#93d8bf]">
            System Info
          </h3>
          <div className="mt-4 space-y-3 text-sm text-slate-300">
            <p>
              <span className="text-white">Version</span>: 1.0.0
            </p>
            <p>
              <span className="text-white">Environment</span>: Production
            </p>
            <p>
              <span className="text-white">Last Updated</span>: April 2026
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 border-t border-white/10 px-6 py-4 text-sm text-slate-400 sm:px-8 lg:flex-row lg:items-center lg:justify-between lg:px-10">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3">
          <span>© 2026 Eagle Eyes CCTV Solutions</span>
          <span className="hidden text-white/20 sm:inline">•</span>
          <span>Inventory Management System</span>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <Link href="/dashboard#privacy" className="transition hover:text-white">
            Privacy Policy
          </Link>
          <Link href="mailto:admin@eagleeyes.local" className="transition hover:text-white">
            Contact
          </Link>
        </div>
      </div>
    </footer>
  );
}
