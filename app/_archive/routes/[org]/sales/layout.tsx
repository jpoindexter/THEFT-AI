"use client";

import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Pipeline",    path: "pipeline" },
  { label: "Leads",       path: "leads" },
  { label: "Competitors", path: "competitors" },
] as const;

export default function SalesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams<{ org: string }>();
  const org = params.org;

  return (
    <div className="absolute inset-0 flex overflow-hidden">
      <nav
        aria-label="Sales navigation"
        className="w-44 shrink-0 border-r border-line/70 bg-paper flex flex-col py-4 px-2 gap-0.5"
      >
        <div className="px-2 mb-3">
          <span className="text-2xs uppercase tracking-[0.14em] text-ink-soft">Sales</span>
        </div>
        {NAV_ITEMS.map((item) => {
          const href = `/${org}/sales/${item.path}`;
          const isActive = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={item.path}
              href={href}
              className={cn(
                "flex items-center rounded-md px-2 py-1.5 text-sm transition-colors",
                isActive
                  ? "bg-cream text-ink font-medium"
                  : "text-ink-muted hover:text-ink hover:bg-cream/60",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="flex-1 relative overflow-hidden">
        {children}
      </div>
    </div>
  );
}
