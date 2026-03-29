export function DataTable({
  headers,
  children,
  stickyHeader = false
}: {
  headers: string[];
  children: React.ReactNode;
  stickyHeader?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-white/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead
            className={`bg-gradient-to-r from-[var(--panel-strong)] via-[#f5ecde] to-[var(--panel-strong)] ${
              stickyHeader ? "sticky top-0 z-10" : ""
            }`}
          >
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  className="px-4 py-4 text-left text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] bg-white [&_tr]:transition [&_tr]:duration-200 [&_tr:hover]:bg-[#fcf8f1] [&_tr:hover]:shadow-[inset_4px_0_0_rgba(24,49,83,0.12)]">
            {children}
          </tbody>
        </table>
      </div>
    </div>
  );
}
