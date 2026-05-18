import { cn } from "../../lib/utils";

const QUOTA_WIDTH_CLASSES = [
  "w-0",
  "w-1/12",
  "w-1/6",
  "w-1/4",
  "w-1/3",
  "w-5/12",
  "w-1/2",
  "w-7/12",
  "w-2/3",
  "w-3/4",
  "w-5/6",
  "w-11/12",
  "w-full",
];

function quotaWidthClass(usedPercent: number | null) {
  if (usedPercent == null) return QUOTA_WIDTH_CLASSES[0];
  const clamped = Math.min(Math.max(usedPercent, 0), 100);
  return QUOTA_WIDTH_CLASSES[Math.round((clamped / 100) * (QUOTA_WIDTH_CLASSES.length - 1))];
}

function quotaFillClass(usedPercent: number | null) {
  if (usedPercent == null) return "bg-muted-foreground";
  if (usedPercent >= 90) return "bg-destructive";
  if (usedPercent >= 70) return "bg-chart-3";
  return "bg-primary/70";
}

export function QuotaProgressBar({ usedPercent }: { usedPercent: number | null }) {
  const value = usedPercent == null ? 0 : Math.min(Math.max(usedPercent, 0), 100);

  return (
    <div
      role="progressbar"
      aria-label="Quota used"
      aria-valuemin={0}
      aria-valuenow={value}
      aria-valuemax={100}
      className="mt-3 h-2 overflow-hidden bg-muted"
    >
      <div
        className={cn(
          "h-full transition-[width] duration-200",
          quotaFillClass(usedPercent),
          quotaWidthClass(usedPercent),
        )}
      />
    </div>
  );
}
