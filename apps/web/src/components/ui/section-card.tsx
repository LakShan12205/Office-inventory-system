export function SectionCard({
  title,
  description,
  action,
  children
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden rounded-[1.9rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,253,248,0.98),rgba(255,255,255,0.94))] p-5 shadow-[0_22px_70px_rgba(24,49,83,0.08)]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--border)] to-transparent" />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description ? <p className="mt-1 text-sm text-[var(--muted)]">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
