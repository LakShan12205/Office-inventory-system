import Link from "next/link";
import { SectionCard } from "@/components/ui/section-card";
import { StatCard } from "@/components/ui/stat-card";
import { getDashboard } from "@/lib/api";
import { DashboardData } from "@/lib/types";

function HeroIllustration() {
  return (
    <div className="relative h-[9.5rem] overflow-hidden rounded-[1.8rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_38%),linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.03))] p-4">
      <div className="dashboard-grid-glow absolute inset-0 opacity-30" />
      <div className="dashboard-dots absolute inset-y-0 right-0 w-1/2 opacity-30" />
      <div className="absolute -left-6 top-5 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute left-5 top-5 h-14 w-20 rounded-[1.2rem] border border-white/20 bg-white/10 backdrop-blur-md" />
      <div className="absolute left-14 top-12 h-10 w-16 rounded-[1rem] border border-white/20 bg-[#f7d9b0]/20 backdrop-blur-md" />
      <div className="absolute right-6 top-5 h-20 w-24 rounded-[1.5rem] border border-white/20 bg-[var(--accent)]/14 backdrop-blur-md" />
      <div className="absolute right-14 top-9 h-12 w-14 rounded-[1.1rem] border border-white/20 bg-white/12 backdrop-blur-md" />
      <div className="absolute bottom-4 left-8 right-8 flex items-end gap-3">
        <div className="h-8 flex-1 rounded-t-[1rem] bg-white/15 shadow-[0_0_20px_rgba(255,255,255,0.08)]" />
        <div className="h-12 flex-1 rounded-t-[1rem] bg-white/20 shadow-[0_0_20px_rgba(255,255,255,0.08)]" />
        <div className="h-10 flex-1 rounded-t-[1rem] bg-[#f6d3aa]/25 shadow-[0_0_20px_rgba(246,211,170,0.12)]" />
        <div className="h-14 flex-1 rounded-t-[1rem] bg-white/25 shadow-[0_0_20px_rgba(255,255,255,0.10)]" />
      </div>
    </div>
  );
}

function ClipboardIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <rect x="6" y="5" width="12" height="15" rx="2" />
      <path d="M9 5.5h6" />
      <path d="M9 10h6" />
      <path d="M9 14h4" />
    </svg>
  );
}

function SparkSwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h10" />
      <path d="m14 4 3 3-3 3" />
      <path d="M17 17H7" />
      <path d="m10 14-3 3 3 3" />
      <path d="M5 5h.01" />
    </svg>
  );
}

function BoxIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M4 8.5 12 4l8 4.5v7L12 20l-8-4.5v-7Z" />
      <path d="M12 12v8" />
      <path d="M4.5 8.8 12 13l7.5-4.2" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <rect x="3.5" y="4.5" width="17" height="11" rx="2" />
      <path d="M9 19.5h6" />
      <path d="M12 15.5v4" />
    </svg>
  );
}

function StackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M4 7.5 12 4l8 3.5L12 11 4 7.5Z" />
      <path d="M4 12.5 12 16l8-3.5" />
      <path d="M4 16.5 12 20l8-3.5" />
    </svg>
  );
}

function WrenchIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M14 6a4 4 0 0 0 4.7 4.7l-8.4 8.4a2 2 0 1 1-2.8-2.8l8.4-8.4A4 4 0 0 0 14 6Z" />
      <path d="m13 7 4 4" />
    </svg>
  );
}

function SwapIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M7 7h11" />
      <path d="m15 4 3 3-3 3" />
      <path d="M17 17H6" />
      <path d="m9 14-3 3 3 3" />
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]">
      <path d="M12 4 3.5 19h17L12 4Z" />
      <path d="M12 9v4.5" />
      <path d="M12 17h.01" />
    </svg>
  );
}

export default async function DashboardPage() {
  const data = (await getDashboard()) as DashboardData;

  return (
    <div className="space-y-7">
      <section className="relative overflow-hidden rounded-[2rem] bg-[linear-gradient(135deg,#142946_0%,#1c3d63_52%,#2f5876_100%)] px-5 py-5 text-white shadow-[0_20px_60px_rgba(24,49,83,0.22)] lg:px-6 lg:py-5">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(247,208,165,0.20),transparent_28%),radial-gradient(circle_at_bottom_right,rgba(255,255,255,0.12),transparent_30%)]" />
        <div className="absolute -left-14 top-4 h-24 w-24 rounded-full bg-[#f7d0a5]/18 blur-3xl" />
        <div className="absolute right-8 top-6 h-28 w-28 rounded-full bg-white/10 blur-3xl" />
        <div className="relative grid gap-4 xl:grid-cols-[1.25fr_0.75fr] xl:items-center">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/65">Dashboard</p>
            <h1 className="mt-2 max-w-2xl text-3xl font-semibold tracking-tight text-white lg:text-[2.2rem]">
              Office Inventory Command Center
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-200">
              Monitor assets, repairs, replacements, and alerts in one view.
            </p>
          </div>

          <HeroIllustration />
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          {
            href: "/workstations",
            label: "Total Workstations",
            value: data.stats.totalWorkstations,
            icon: <MonitorIcon />,
            badge: "Live" as const,
            tone: "navy" as const
          },
          {
            href: "/assets",
            label: "Total Assets",
            value: data.stats.totalAssets,
            icon: <StackIcon />,
            badge: "Assets" as const,
            tone: "amber" as const
          },
          {
            href: "/repairs",
            label: "Machines in Repair",
            value: data.stats.machinesInRepair,
            icon: <WrenchIcon />,
            badge: "Repair" as const,
            tone: "rose" as const
          },
          {
            href: "/replacements?status=active",
            label: "Active Replacements",
            value: data.stats.activeTemporaryReplacements,
            icon: <SwapIcon />,
            badge: "Active" as const,
            tone: "navy" as const
          },
          {
            href: "/alerts",
            label: "Follow-up Alerts",
            value: data.stats.followUpAlerts,
            icon: <AlertIcon />,
            badge: "Alerts" as const,
            tone: "emerald" as const
          }
        ].map((card) => (
          <Link key={card.label} href={card.href} className="block h-full">
            <StatCard
              compact
              interactive
              label={card.label}
              value={card.value}
              icon={card.icon}
              badge={card.badge}
              tone={card.tone}
            />
          </Link>
        ))}
      </div>

      <SectionCard title="Main Actions">
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              title: "Add Inventory",
              description: "Add and manage office assets",
              icon: <BoxIcon />,
              actions: [
                { href: "/assets/new", label: "Add Asset" },
                { href: "/assets", label: "View Assets" }
              ]
            },
            {
              title: "Repair Details",
              description: "Track repair records and machine issues",
              icon: <ClipboardIcon />,
              actions: [
                { href: "/repairs/new", label: "Log Repair" },
                { href: "/repairs", label: "View Repairs" }
              ]
            },
            {
              title: "Replacements",
              description: "Manage temporary and returned replacements",
              icon: <SparkSwapIcon />,
              actions: [
                { href: "/replacements", label: "Assign Replacement" },
                { href: "/replacements", label: "View Replacements" }
              ]
            }
          ].map((card) => (
            <div
              key={card.title}
              className="group flex h-full min-h-[240px] flex-col justify-between rounded-[1.7rem] border border-[var(--border)] bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-6 py-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-[#d7c2a6] hover:shadow-[0_20px_50px_rgba(24,49,83,0.10)]"
            >
              <div className="flex min-h-[136px] flex-col">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,rgba(24,49,83,0.96),rgba(201,111,45,0.86))] text-white shadow-[0_16px_36px_rgba(24,49,83,0.20)] transition duration-300 group-hover:scale-105">
                  {card.icon}
                </span>
                <h3 className="mt-4 text-lg font-semibold text-[var(--nav)]">{card.title}</h3>
                <p className="mt-2 max-w-xs text-sm leading-6 text-[var(--muted)]">{card.description}</p>
              </div>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                {card.actions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="inline-flex min-w-[138px] items-center justify-center rounded-full border border-[var(--border)] bg-white px-4 py-2 text-sm font-semibold text-[var(--nav)] transition hover:bg-[var(--panel-strong)]"
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </SectionCard>
    </div>
  );
}
