import type { UserProfileDailyPoint } from "@paperclipai/shared";
import { cn } from "../../lib/utils";
import { formatCents, formatShortDate, formatTokens } from "../../lib/utils";
import type { UsageRow } from "./model";
import { totalTokens } from "./model";

const BAR_HEIGHT_CLASSES = [
  "h-px",
  "h-2",
  "h-4",
  "h-6",
  "h-8",
  "h-10",
  "h-12",
  "h-16",
  "h-20",
  "h-24",
  "h-28",
  "h-32",
  "h-36",
] as const;
const COMPLETION_OPACITY_CLASSES = ["opacity-40", "opacity-60", "opacity-80", "opacity-100"] as const;

function barHeightClass(value: number, max: number) {
  if (value === 0) return BAR_HEIGHT_CLASSES[0];
  const index = Math.max(1, Math.ceil((value / max) * (BAR_HEIGHT_CLASSES.length - 1)));
  return BAR_HEIGHT_CLASSES[index] ?? BAR_HEIGHT_CLASSES.at(-1)!;
}

function completionOpacityClass(value: number, max: number) {
  if (value === 0) return COMPLETION_OPACITY_CLASSES[0];
  const index = Math.max(0, Math.ceil((value / max) * COMPLETION_OPACITY_CLASSES.length) - 1);
  return COMPLETION_OPACITY_CLASSES[index] ?? COMPLETION_OPACITY_CLASSES.at(-1)!;
}

export function UsageChart({ points }: { points: UserProfileDailyPoint[] }) {
  const totals = points.map((point) => totalTokens(point));
  const maxTokens = Math.max(1, ...totals);
  const maxCompleted = Math.max(1, ...points.map((point) => point.completedIssues));
  const totalTokensSum = totals.reduce((sum, value) => sum + value, 0);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-sm font-semibold">Last 14 days</h2>
        <div className="flex items-baseline gap-4 text-xs text-muted-foreground">
          <span className="tabular-nums text-foreground">{formatTokens(totalTokensSum)}</span>
          <span>tokens total</span>
        </div>
      </div>
      <div className="mt-6 flex h-36 items-end gap-1.5 sm:gap-2">
        {points.map((point) => {
          const tokens = totalTokens(point);
          return (
            <div key={point.date} className="group flex h-36 flex-1 flex-col justify-end">
              <div
                className={cn("w-full bg-foreground/80 transition-opacity group-hover:bg-foreground", barHeightClass(tokens, maxTokens))}
                title={`${formatShortDate(point.date)}: ${formatTokens(tokens)} tokens, ${point.completedIssues} completed`}
              />
              {point.completedIssues > 0 ? (
                <div className={cn("mt-1 h-0.5 w-full rounded-full bg-muted-foreground/70", completionOpacityClass(point.completedIssues, maxCompleted))} />
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 text-nano tabular-nums text-muted-foreground sm:gap-2">
        {points.map((point, index) => (
          <div key={point.date} className="flex-1 text-center">
            {index === 0 || index === 6 || index === 13 ? formatShortDate(point.date) : null}
          </div>
        ))}
      </div>
      <div className="theft-label-nano mt-4 flex flex-wrap items-center gap-4 text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 bg-foreground/80" /> tokens / day
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-0.5 w-4 rounded-full bg-muted-foreground/70" /> completions
        </span>
      </div>
    </section>
  );
}

export function UsageList({ title, empty, rows }: { title: string; empty: string; rows: UsageRow[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-sm font-semibold">{title}</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{rows.length}</span>
      </div>
      {rows.length === 0 ? (
        <div className="pt-4 text-sm text-muted-foreground">{empty}</div>
      ) : (
        <ul className="divide-y divide-border">
          {rows.map((row) => (
            <li key={row.key} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm font-medium">{row.label}</div>
                <div className="truncate text-xs text-muted-foreground">{row.sublabel}</div>
              </div>
              <div className="flex shrink-0 items-baseline gap-4 text-xs tabular-nums sm:justify-end">
                <span className="text-muted-foreground">{formatTokens(totalTokens(row))}</span>
                <span className="font-medium">{formatCents(row.costCents)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
