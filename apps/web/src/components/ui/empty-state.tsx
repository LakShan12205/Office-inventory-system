export function EmptyState({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--panel-strong)] px-5 py-10 text-center">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-[var(--muted)]">{message}</p>
    </div>
  );
}
