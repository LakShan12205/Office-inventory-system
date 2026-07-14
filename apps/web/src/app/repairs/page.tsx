import Link from "next/link";
import { redirect } from "next/navigation";
import { RepairReturnButton } from "@/components/repairs/repair-return-button";
import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { ApiError, getRepairs } from "@/lib/api";
import { appendQueryParam } from "@/lib/query";

type RepairPageRecord = {
  id: string;
  reportedDate: string;
  faultDescription: string;
  status: string;
  expectedReturnDate?: string | null;
  asset: {
    id: string;
    assetCode: string;
  };
  workstation: {
    id: string;
    code: string;
  };
  replacementLog?: {
    id: string;
    status: string;
    replacementAsset: {
      id: string;
      assetCode: string;
    };
  } | null;
};

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function isOverdueRepair(repair: RepairPageRecord) {
  if (!repair.expectedReturnDate) return false;
  if (repair.status === "CLOSED" || repair.status === "RETURNED") return false;
  return new Date(repair.expectedReturnDate) < startOfToday();
}

function formatDate(value?: string | null) {
  if (!value) return "Not set";
  return new Date(value).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

export default async function RepairsPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = new URLSearchParams();

  appendQueryParam(query, "status", params?.status);

  let repairs: RepairPageRecord[] = [];

  try {
    repairs = (await getRepairs(
      query.toString() ? `?${query.toString()}` : ""
    )) as RepairPageRecord[];
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }

    console.error("Repairs error:", error);
    return <div>Failed to load repairs</div>;
  }

  const summaryCards = [
    {
      label: "Total Repairs",
      value: repairs.length,
      description: "All repair records in the current result set."
    },
    {
      label: "In Progress Repairs",
      value: repairs.filter((repair) => repair.status === "IN_PROGRESS").length,
      description: "Repairs currently being worked on."
    },
    {
      label: "Returned Repairs",
      value: repairs.filter((repair) => repair.status === "RETURNED").length,
      description: "Repairs marked as returned from service."
    },
    {
      label: "Overdue Repairs",
      value: repairs.filter(isOverdueRepair).length,
      description: "Expected return date has passed without closure."
    },
    {
      label: "Repairs With Active Replacement",
      value: repairs.filter((repair) => repair.replacementLog?.status === "ACTIVE").length,
      description: "Repairs currently supported by an active replacement."
    },
    {
      label: "Closed Repairs",
      value: repairs.filter((repair) => repair.status === "CLOSED").length,
      description: "Repairs fully closed out."
    }
  ];

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

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {summaryCards.map((card) => (
          <div
            key={card.label}
            className="rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.94))] px-5 py-4 shadow-[0_18px_45px_rgba(24,49,83,0.07)]"
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
              {card.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--nav)]">{card.value}</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted)]">{card.description}</p>
          </div>
        ))}
      </div>

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
          headers={[
            "Machine",
            "Workstation",
            "Reported",
            "Fault",
            "Repair status",
            "Expected return",
            "Replacement",
            "Actions"
          ]}
        >
          {repairs.map((repair) => (
            <tr key={repair.id}>
              <td className="px-4 py-4 text-sm font-medium">{repair.asset.assetCode}</td>
              <td className="px-4 py-4 text-sm">{repair.workstation.code}</td>
              <td className="px-4 py-4 text-sm">
                {formatDate(repair.reportedDate)}
              </td>
              <td className="px-4 py-4 text-sm text-[var(--muted)]">
                {repair.faultDescription}
              </td>
              <td className="px-4 py-4 text-sm">
                <StatusBadge value={repair.status} />
              </td>
              <td className="px-4 py-4 text-sm">
                {formatDate(repair.expectedReturnDate)}
              </td>
              <td className="px-4 py-4 text-sm">
                {repair.replacementLog
                  ? repair.replacementLog.replacementAsset.assetCode
                  : "None"}
              </td>
              <td className="px-4 py-4 text-sm">
                <RepairReturnButton repair={repair} />
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
