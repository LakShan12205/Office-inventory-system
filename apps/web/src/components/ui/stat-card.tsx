export function StatCard({
  label,
  value,
  hint
}: {
  label: string;
  value: number | string;
  hint: string;
}) {
  return (
    <div className="rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] p-5 shadow-sm">
      <p className="text-sm text-[var(--muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold">{value}</p>
      <p className="mt-3 text-sm leading-6 text-[var(--muted)]">{hint}</p>
    </div>
  );
}
