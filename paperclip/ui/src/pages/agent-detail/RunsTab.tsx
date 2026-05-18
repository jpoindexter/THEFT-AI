import type { ReactNode } from "react";
import { Link } from "@/lib/router";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Loader2,
  Slash,
  Timer,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import type { HeartbeatRun } from "@paperclipai/shared";

import { useSidebar } from "../../context/SidebarContext";
import { cn, formatTokens, relativeTime, visibleRunCostUsd } from "../../lib/utils";

export const runStatusIcons: Record<string, { icon: LucideIcon; color: string }> = {
  succeeded: { icon: CheckCircle2, color: "text-green-600 dark:text-green-400" },
  failed: { icon: XCircle, color: "text-red-600 dark:text-red-400" },
  running: { icon: Loader2, color: "text-cyan-600 dark:text-cyan-400" },
  queued: { icon: Clock, color: "text-yellow-600 dark:text-yellow-400" },
  scheduled_retry: { icon: Clock, color: "text-sky-600 dark:text-sky-400" },
  timed_out: { icon: Timer, color: "text-orange-600 dark:text-orange-400" },
  cancelled: { icon: Slash, color: "text-neutral-500 dark:text-neutral-400" },
};

export const defaultRunStatusInfo = { icon: Clock, color: "text-neutral-400" };

export const sourceLabels: Record<string, string> = {
  timer: "Timer",
  assignment: "Assignment",
  on_demand: "On-demand",
  automation: "Automation",
};

function usageNumber(usage: Record<string, unknown> | null, ...keys: string[]) {
  if (!usage) return 0;
  for (const key of keys) {
    const value = usage[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

export function runMetrics(run: HeartbeatRun) {
  const usage = (run.usageJson ?? null) as Record<string, unknown> | null;
  const result = (run.resultJson ?? null) as Record<string, unknown> | null;
  const input = usageNumber(usage, "inputTokens", "input_tokens");
  const output = usageNumber(usage, "outputTokens", "output_tokens");
  const cached = usageNumber(
    usage,
    "cachedInputTokens",
    "cached_input_tokens",
    "cache_read_input_tokens",
  );
  const cost = visibleRunCostUsd(usage, result);
  const provider = asNonEmptyString(usage?.provider) ?? null;
  const model = asNonEmptyString(usage?.model) ?? null;
  return {
    input,
    output,
    cached,
    cost,
    totalTokens: input + output,
    provider,
    model,
  };
}

function RunListItem({
  run,
  isSelected,
  agentId,
}: {
  run: HeartbeatRun;
  isSelected: boolean;
  agentId: string;
}) {
  const statusInfo = runStatusIcons[run.status] ?? defaultRunStatusInfo;
  const StatusIcon = statusInfo.icon;
  const metrics = runMetrics(run);
  const summary = run.resultJson
    ? String((run.resultJson as Record<string, unknown>).summary ?? (run.resultJson as Record<string, unknown>).result ?? "")
    : run.error ?? "";

  return (
    <Link
      to={isSelected ? `/agents/${agentId}/runs` : `/agents/${agentId}/runs/${run.id}`}
      className={cn(
        "flex w-full flex-col gap-1 border-b border-border px-3 py-2.5 text-left text-inherit no-underline transition-colors last:border-b-0",
        isSelected ? "bg-accent/40" : "hover:bg-accent/20",
      )}
    >
      <div className="flex items-center gap-2">
        <StatusIcon className={cn("h-3.5 w-3.5 shrink-0", statusInfo.color, run.status === "running" && "animate-spin")} />
        <span className="font-mono text-xs text-muted-foreground">
          {run.id.slice(0, 8)}
        </span>
        <span
          className={cn(
            "inline-flex shrink-0 items-center rounded-full px-1.5 py-0.5 text-nano font-medium",
            run.invocationSource === "timer" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
              : run.invocationSource === "assignment" ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
              : run.invocationSource === "on_demand" ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
              : "bg-muted text-muted-foreground",
          )}
        >
          {sourceLabels[run.invocationSource] ?? run.invocationSource}
        </span>
        <span className="ml-auto shrink-0 text-micro text-muted-foreground">
          {relativeTime(run.createdAt)}
        </span>
      </div>
      {summary && (
        <span className="truncate pl-5.5 text-xs text-muted-foreground">
          {summary.slice(0, 60)}
        </span>
      )}
      {(metrics.totalTokens > 0 || metrics.cost > 0) && (
        <div className="flex items-center gap-2 pl-5.5 text-micro text-muted-foreground tabular-nums">
          {metrics.totalTokens > 0 && <span>{formatTokens(metrics.totalTokens)} tok</span>}
          {metrics.cost > 0 && <span>${metrics.cost.toFixed(3)}</span>}
        </div>
      )}
    </Link>
  );
}

export function RunsTab({
  runs,
  agentRouteId,
  selectedRunId,
  renderRunDetail,
}: {
  runs: HeartbeatRun[];
  agentRouteId: string;
  selectedRunId: string | null;
  renderRunDetail: (run: HeartbeatRun) => ReactNode;
}) {
  const { isMobile } = useSidebar();

  if (runs.length === 0) {
    return <p className="text-sm text-muted-foreground">No runs yet.</p>;
  }

  const sorted = [...runs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const effectiveRunId = isMobile ? selectedRunId : (selectedRunId ?? sorted[0]?.id ?? null);
  const selectedRun = sorted.find((run) => run.id === effectiveRunId) ?? null;

  if (isMobile) {
    if (selectedRun) {
      return (
        <div className="min-w-0 space-y-3 overflow-x-hidden">
          <Link
            to={`/agents/${agentRouteId}/runs`}
            className="flex items-center gap-1.5 text-sm text-muted-foreground no-underline transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to runs
          </Link>
          {renderRunDetail(selectedRun)}
        </div>
      );
    }
    return (
      <div className="overflow-x-hidden rounded-lg border border-border">
        {sorted.map((run) => (
          <RunListItem key={run.id} run={run} isSelected={false} agentId={agentRouteId} />
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-0">
      <div
        className={cn(
          "shrink-0 rounded-lg border border-border",
          selectedRun ? "w-72" : "w-full",
        )}
      >
        <div className="sticky top-4 max-h-screen overflow-y-auto">
          {sorted.map((run) => (
            <RunListItem key={run.id} run={run} isSelected={run.id === effectiveRunId} agentId={agentRouteId} />
          ))}
        </div>
      </div>

      {selectedRun && (
        <div className="min-w-0 flex-1 pl-4">
          {renderRunDetail(selectedRun)}
        </div>
      )}
    </div>
  );
}
