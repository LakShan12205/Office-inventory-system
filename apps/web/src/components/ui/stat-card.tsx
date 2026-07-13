export function StatCard({
  label,
  value,
  icon,
  badge = "Live",
  tone = "navy",
  compact = false,
  interactive = false
}: {
  label: string;
  value: number | string;
  icon?: React.ReactNode;
  badge?: string;
  tone?: "navy" | "amber" | "emerald" | "rose";
  compact?: boolean;
  interactive?: boolean;
}) {
  const toneStyles = {
    navy: "from-slate-900 via-[var(--nav)] to-slate-800 text-white",
    amber: "from-[#d4873b] via-[var(--accent)] to-[#a95b24] text-white",
    emerald: "from-emerald-800 via-[var(--success)] to-emerald-700 text-white",
    rose: "from-rose-700 via-[var(--danger)] to-rose-600 text-white"
  };

  return (
    <div
      className={`group relative flex h-full flex-col overflow-hidden rounded-[1.5rem] border border-white/70 bg-[linear-gradient(180deg,rgba(255,255,255,0.98),rgba(255,253,248,0.96))] shadow-[0_14px_42px_rgba(24,49,83,0.09)] transition duration-300 hover:-translate-y-0.5 hover:shadow-[0_22px_65px_rgba(24,49,83,0.13)] ${
        compact ? "min-h-[145px] justify-between p-4 hover:scale-[1.005]" : "min-h-[190px] justify-between p-5 hover:scale-[1.01]"
      } ${
        interactive ? "cursor-pointer hover:border-[#d7c2a6]" : ""
      }`}
    >
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[var(--accent)] via-[var(--nav)] to-transparent" />
      <div className="absolute -right-8 top-8 h-20 w-20 rounded-full bg-[var(--accent)]/10 blur-2xl transition duration-300 group-hover:bg-[var(--accent)]/15" />
      <div className="absolute -left-4 bottom-4 h-16 w-16 rounded-full bg-[var(--nav)]/8 blur-2xl" />
      <div className="relative flex items-center justify-between gap-3">
        <div className="flex items-center">
          <span className="inline-flex rounded-full border border-[var(--border)] bg-[var(--panel-strong)] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--nav)]">
            {badge}
          </span>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-[1rem] bg-gradient-to-br ${toneStyles[tone]} shadow-[0_12px_28px_rgba(24,49,83,0.16)] transition duration-300 group-hover:scale-105`}>
          {icon}
        </div>
      </div>

      <div
        className={`relative flex flex-1 flex-col items-center px-1 text-center ${
          compact ? "justify-center py-2" : "justify-center py-4"
        }`}
      >
        <p className={`font-semibold tracking-tight text-[var(--text)] ${compact ? "text-[1.9rem]" : "text-[2.25rem] lg:text-[2.4rem]"}`}>
          {value}
        </p>
        <p className={`mt-1.5 max-w-[12rem] font-medium leading-5 text-[var(--muted)] ${compact ? "text-[13px]" : "text-sm"}`}>
          {label}
        </p>
      </div>
    </div>
  );
}
