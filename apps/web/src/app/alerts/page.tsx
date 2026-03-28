import { AlertCard } from "@/components/ui/alert-card";
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

  return (
    <div className="space-y-5">
      <PageHeader
        title="Alerts"
        description="Automatic reminders for overdue repairs, machines sent for repair, active replacements, returned originals, incomplete records, and repeated repair patterns."
      />

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <form className="grid gap-4 md:grid-cols-3">
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All statuses</option>
            <option value="NEW">New</option>
            <option value="READ">Read</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <select
            name="priority"
            defaultValue={typeof params?.priority === "string" ? params.priority : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All priorities</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
          <button className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white">
            Apply filters
          </button>
        </form>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {alerts.map((alert) => (
          <AlertCard key={alert.id} alert={alert} />
        ))}
      </div>
    </div>
  );
}
