import type { UserProfileWindowStats } from "@paperclipai/shared";
import { formatCents, formatNumber, formatTokens } from "../../lib/utils";
import { completionRate, totalTokens } from "./model";

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <div className="min-w-0">
      <div className="truncate text-xl font-semibold tabular-nums">{value}</div>
      <div className="mt-0.5 text-micro text-muted-foreground">{label}</div>
    </div>
  );
}

function WindowColumn({ stats }: { stats: UserProfileWindowStats }) {
  const tokens = totalTokens(stats);
  return (
    <div className="flex min-w-0 flex-col gap-4 border-l border-border pl-5 first:border-l-0 first:pl-0">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="theft-label-compact font-medium text-muted-foreground">{stats.label}</h2>
        <span className="text-micro text-muted-foreground tabular-nums">{completionRate(stats)} done</span>
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-3">
        <Metric value={formatNumber(stats.touchedIssues)} label="Touched" />
        <Metric value={formatNumber(stats.completedIssues)} label="Completed" />
        <Metric value={formatNumber(stats.commentCount)} label="Comments" />
        <Metric value={formatNumber(stats.activityCount)} label="Actions" />
      </div>

      <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 pt-3 text-xs tabular-nums text-muted-foreground">
        <span>Tokens</span>
        <span className="text-right text-foreground">{formatTokens(tokens)}</span>
        <span>Spend</span>
        <span className="text-right text-foreground">{formatCents(stats.costCents)}</span>
        <span>Created</span>
        <span className="text-right text-foreground">{formatNumber(stats.createdIssues)}</span>
        <span>Open</span>
        <span className="text-right text-foreground">{formatNumber(stats.assignedOpenIssues)}</span>
      </div>
    </div>
  );
}

export function StatsWindows({ stats }: { stats: UserProfileWindowStats[] }) {
  return (
    <section className="grid gap-8 border-b border-border pb-8 lg:grid-cols-3">
      {stats.map((entry) => <WindowColumn key={entry.key} stats={entry} />)}
    </section>
  );
}
