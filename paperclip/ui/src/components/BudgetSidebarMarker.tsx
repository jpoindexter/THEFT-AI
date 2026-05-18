import { DollarSign } from "lucide-react";

export type BudgetSidebarMarkerLevel = "healthy" | "warning" | "critical";

const levelClasses: Record<BudgetSidebarMarkerLevel, string> = {
  healthy: "bg-chart-2 text-background",
  warning: "bg-chart-3 text-background",
  critical: "bg-destructive text-destructive-foreground",
};

const defaultTitles: Record<BudgetSidebarMarkerLevel, string> = {
  healthy: "Budget healthy",
  warning: "Budget warning",
  critical: "Paused by budget",
};

export function BudgetSidebarMarker({
  title,
  level = "critical",
}: {
  title?: string;
  level?: BudgetSidebarMarkerLevel;
}) {
  const accessibleTitle = title ?? defaultTitles[level];

  return (
    <span
      title={accessibleTitle}
      aria-label={accessibleTitle}
      className={`ml-auto inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${levelClasses[level]}`}
    >
      <DollarSign className="h-3 w-3" />
    </span>
  );
}
