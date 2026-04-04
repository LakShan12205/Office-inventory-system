import { AlertCard } from "@/components/ui/alert-card";
import { AlertsFilters } from "@/components/alerts/alerts-filters";
import { PageHeader } from "@/components/ui/page-header";
import { getAlerts } from "@/lib/api";
import { appendQueryParam } from "@/lib/query";
import { AlertRecord } from "@/lib/types";

export default async function AlertsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  appendQueryParam(query, "status", params?.status);
  appendQueryParam(query, "priority", params?.priority);

  const alerts = (await getAlerts(query.toString() ? `?${query.toString()}` : "")) as AlertRecord[];
  const allAlerts = (await getAlerts()) as AlertRecord[];
  const totalAlerts = allAlerts.length;
  const highPriorityAlerts = allAlerts.filter((alert) => alert.priority === "HIGH").length;
  const unreadAlerts = allAlerts.filter((alert) => alert.status === "NEW").length;
  const groupedAlerts = ["HIGH", "MEDIUM", "LOW"].map((priority) => ({
    priority,
    items: alerts.filter((alert) => alert.priority === priority)
  })).filter((group) => group.items.length > 0);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alerts"
        description="Automatic reminders for overdue repairs, machines sent for repair, active replacements, returned originals, incomplete records, and repeated repair patterns."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Total alerts</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{totalAlerts}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">High priority</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{highPriorityAlerts}</p>
        </div>
        <div className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">Unread alerts</p>
          <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{unreadAlerts}</p>
        </div>
      </div>

      <AlertsFilters />

      <div className="space-y-6">
        {groupedAlerts.map((group) => (
          <section key={group.priority} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                {group.priority} priority
              </h2>
              <span className="rounded-full bg-[var(--panel-strong)] px-3 py-1 text-xs font-semibold text-[var(--nav)]">
                {group.items.length}
              </span>
            </div>
            <div className="grid gap-4 xl:grid-cols-2">
              {group.items.map((alert) => (
                <AlertCard key={alert.id} alert={alert} showActions />
              ))}
            </div>
          </section>
        ))}
        {alerts.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-white/60 px-5 py-10 text-center">
            <p className="text-sm font-semibold text-[var(--nav)]">No alerts match your filters</p>
            <p className="mt-2 text-sm text-[var(--muted)]">Try changing the status or priority filters.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
