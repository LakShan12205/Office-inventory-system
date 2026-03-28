import { DataTable } from "@/components/ui/data-table";
import { PageHeader } from "@/components/ui/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getReplacements } from "@/lib/api";
import { ReplacementRecord } from "@/lib/types";

export default async function ReplacementsPage() {
  const replacements = (await getReplacements()) as ReplacementRecord[];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Temporary replacements"
        description="See which workstations are using replacement machines, when they were assigned, and whether the original machine has already returned."
      />

      <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
        <DataTable
          headers={["Workstation", "Original machine", "Replacement", "Replacement date", "Status", "Original return"]}
        >
          {replacements.map((replacement) => (
            <tr key={replacement.id}>
              <td className="px-4 py-4 text-sm">{replacement.workstation.code}</td>
              <td className="px-4 py-4 text-sm">{replacement.originalAsset.assetCode}</td>
              <td className="px-4 py-4 text-sm font-medium">{replacement.replacementAsset.assetCode}</td>
              <td className="px-4 py-4 text-sm">
                {new Date(replacement.replacementDate).toLocaleDateString()}
              </td>
              <td className="px-4 py-4 text-sm">
                <StatusBadge value={replacement.status} />
              </td>
              <td className="px-4 py-4 text-sm">
                {replacement.repair.actualReturnDate
                  ? new Date(replacement.repair.actualReturnDate).toLocaleDateString()
                  : "Still away"}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>
    </div>
  );
}
