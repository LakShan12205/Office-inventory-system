import Image from "next/image";
import Link from "next/link";

type SystemLogoProps = {
  compact?: boolean;
  href?: string;
  className?: string;
  tone?: "light" | "dark";
};

function cn(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function LogoContent({
  compact = false,
  tone = "light"
}: {
  compact?: boolean;
  tone?: "light" | "dark";
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={cn(
          "relative shrink-0 overflow-hidden rounded-2xl border border-[#dce8e3] bg-white shadow-[0_10px_24px_rgba(15,23,42,0.08)]",
          compact ? "h-11 w-11 p-2" : "h-14 w-14 p-2.5"
        )}
      >
        <Image
          src="/logo.png"
          alt="Eagle Eyes CCTV Solutions logo"
          fill
          sizes={compact ? "44px" : "56px"}
          className={cn("object-contain", compact ? "p-2" : "p-2.5")}
          priority
        />
      </div>

      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-semibold tracking-[-0.02em]",
            tone === "dark" ? "text-white" : "text-[#1b2f2c]",
            compact ? "text-sm sm:text-[0.95rem]" : "text-base sm:text-lg"
          )}
        >
          Eagle Eyes CCTV Solutions
        </p>
        <p
          className={cn(
            "truncate",
            tone === "dark" ? "text-slate-300" : "text-[#5e7771]",
            compact ? "text-xs sm:text-sm" : "text-sm"
          )}
        >
          Inventory Management System
        </p>
      </div>
    </div>
  );
}

export function SystemLogo({
  compact = false,
  href = "/dashboard",
  className,
  tone = "light"
}: SystemLogoProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex max-w-full rounded-2xl transition hover:opacity-95",
        className
      )}
    >
      <LogoContent compact={compact} tone={tone} />
    </Link>
  );
}
