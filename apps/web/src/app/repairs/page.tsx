import Link from "next/link";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getRepairs } from "@/lib/api";
import { appendQueryParam } from "@/lib/query";
import { RepairRecord } from "@/lib/types";

export default async function RepairsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  appendQueryParam(query, "status", params?.status);

  const repairs = (await getRepairs(query.toString() ? `?${query.toString()}` : "")) as RepairRecord[];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Repairs"
        description="Track all machine repairs, expected return dates, repeated issues, and active replacement machine use."
        action={
          <Link
            href="/repairs/new"
            className="rounded-2xl bg-[var(--accent)] px-5 py-3 text-sm font-semibold text-white"
          >
            New repair report
          </Link>
        }
      />

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <form className="flex flex-col gap-4 md:flex-row">
          <select
            name="status"
            defaultValue={typeof params?.status === "string" ? params.status : ""}
            className="rounded-2xl border border-[var(--border)] bg-white px-4 py-3"
          >
            <option value="">All repair statuses</option>
            <option value="REPORTED">Reported</option>
            <option value="SENT">Sent</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RETURNED">Returned</option>
            <option value="CLOSED">Closed</option>
          </select>
          <button className="rounded-2xl bg-[var(--nav)] px-5 py-3 text-sm font-semibold text-white">
            Apply filter
          </button>
        </form>
      </div>

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <DataTable
          headers={["Machine", "Workstation", "Reported", "Fault", "Repair status", "Expected return", "Replacement"]}
        >
          {repairs.map((repair) => (
            <tr key={repair.id}>
              <td className="px-4 py-4 text-sm font-medium">{repair.asset.assetCode}</td>
              <td className="px-4 py-4 text-sm">{repair.workstation.code}</td>
              <td className="px-4 py-4 text-sm">{new Date(repair.reportedDate).toLocaleDateString()}</td>
              <td className="px-4 py-4 text-sm text-[var(--muted)]">{repair.faultDescription}</td>
              <td className="px-4 py-4 text-sm">
                <StatusBadge value={repair.status} />
              </td>
              <td className="px-4 py-4 text-sm">
                {repair.expectedReturnDate ? new Date(repair.expectedReturnDate).toLocaleDateString() : "Not set"}
              </td>
              <td className="px-4 py-4 text-sm">
                {repair.replacementLog ? repair.replacementLog.replacementAsset.assetCode : "None"}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
