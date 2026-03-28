export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex flex-col gap-4 rounded-[1.75rem] border border-[var(--border)] bg-[var(--panel)] px-5 py-5 shadow-sm md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold">{title}</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[var(--muted)]">{description}</p>
      </div>
      {action}
    </div>
  );
}
