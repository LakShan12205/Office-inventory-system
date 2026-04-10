import type { ReactNode } from "react";
import { SystemLogo } from "@/components/system-logo";

type HeaderProps = {
  actions?: ReactNode;
};

export function Header({ actions }: HeaderProps) {
  return (
    <header className="rounded-[1.75rem] border border-[#dde6e1] bg-white px-5 py-4 shadow-[0_12px_32px_rgba(15,23,42,0.06)]">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SystemLogo />

        <div className="flex flex-wrap items-center justify-start gap-3 md:justify-end">
          {actions ?? (
            <>
              <div className="rounded-full border border-[#d8e5df] bg-[#f7faf8] px-4 py-2 text-sm font-medium text-[#5c726c]">
                Profile Actions
              </div>
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full border border-[#cfe1d8] bg-[linear-gradient(135deg,#eef8f2,#e4f2ec)] px-4 py-2 text-sm font-semibold text-[#1c5c45] transition hover:border-[#b7d7ca] hover:bg-[linear-gradient(135deg,#f4fbf7,#e8f5ef)]"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
