import type { ReactNode } from "react";

interface SidebarSectionProps {
  label: string;
  children: ReactNode;
}

export function SidebarSection({ label, children }: SidebarSectionProps) {
  return (
    <div>
      <div className="sr-only">
        {label}
      </div>
      <div className="mt-1 flex flex-col items-center gap-1">{children}</div>
    </div>
  );
}
