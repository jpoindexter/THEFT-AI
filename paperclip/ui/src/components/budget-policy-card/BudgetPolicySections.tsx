import type { BudgetPolicySummary } from "@paperclipai/shared";
import { PauseCircle } from "lucide-react";
import { cn, formatCents } from "../../lib/utils";

const BUDGET_PROGRESS_WIDTH_CLASSES = [
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

function budgetProgressWidthClass(percent: number) {
  const clamped = Math.min(Math.max(percent, 0), 100);
  return BUDGET_PROGRESS_WIDTH_CLASSES[Math.round((clamped / 100) * (BUDGET_PROGRESS_WIDTH_CLASSES.length - 1))];
}

export function BudgetPolicyMetricGrid({
  summary,
  isPlain,
}: {
  summary: BudgetPolicySummary;
  isPlain: boolean;
}) {
  const metricContent = (
    <>
      <BudgetMetric
        label="Observed"
        value={formatCents(summary.observedAmount)}
        detail={summary.amount > 0 ? `${summary.utilizationPercent}% of limit` : "No cap configured"}
        isPlain={isPlain}
      />
      <BudgetMetric
        label="Budget"
        value={summary.amount > 0 ? formatCents(summary.amount) : "Disabled"}
        detail={`Soft alert at ${summary.warnPercent}%${summary.paused && summary.pauseReason ? ` · ${summary.pauseReason} pause` : ""}`}
        isPlain={isPlain}
      />
    </>
  );

  if (isPlain) {
    return <div className="grid gap-6 sm:grid-cols-2">{metricContent}</div>;
  }

  return <div className="grid gap-3 sm:grid-cols-2">{metricContent}</div>;
}

function BudgetMetric({
  label,
  value,
  detail,
  isPlain,
}: {
  label: string;
  value: string;
  detail: string;
  isPlain: boolean;
}) {
  return (
    <div className={cn(!isPlain && "theft-surface-muted px-4 py-3")}>
      <div className="theft-label-compact">{label}</div>
      <div className="mt-2 text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{detail}</div>
    </div>
  );
}

export function BudgetPolicyProgress({
  summary,
  isPlain,
}: {
  summary: BudgetPolicySummary;
  isPlain: boolean;
}) {
  const progress = summary.amount > 0 ? Math.min(100, summary.utilizationPercent) : 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>Remaining</span>
        <span>{summary.amount > 0 ? formatCents(summary.remainingAmount) : "Unlimited"}</span>
      </div>
      <div
        role="progressbar"
        aria-label="Budget utilization"
        aria-valuemin={0}
        aria-valuenow={progress}
        aria-valuemax={100}
        className={cn("h-2 overflow-hidden rounded-full", isPlain ? "bg-border/70" : "bg-muted/70")}
      >
        <div
          className={cn(
            "h-full rounded-full transition-[width,background-color] duration-200",
            budgetProgressWidthClass(progress),
            summary.status === "hard_stop"
              ? "bg-destructive"
              : summary.status === "warning"
                ? "bg-muted-foreground"
                : "bg-primary",
          )}
        />
      </div>
    </div>
  );
}

export function BudgetPolicyPausedPane({ summary }: { summary: BudgetPolicySummary }) {
  if (!summary.paused) return null;

  return (
    <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-foreground">
      <PauseCircle className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        {summary.scopeType === "project"
          ? "Execution is paused for this project until the budget is raised or the incident is dismissed."
          : "Heartbeats are paused for this scope until the budget is raised or the incident is dismissed."}
      </div>
    </div>
  );
}
