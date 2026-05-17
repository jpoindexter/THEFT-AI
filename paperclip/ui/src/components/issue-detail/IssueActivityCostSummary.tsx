import { useMemo } from "react";
import type { IssueCostSummary } from "@paperclipai/shared";

import type { RunForIssue } from "@/api/activity";
import { formatDurationMs, formatTokens, visibleRunCostUsd } from "@/lib/utils";

type DirectRunCostSummary = {
  input: number;
  output: number;
  cached: number;
  cost: number;
  totalTokens: number;
  hasCost: boolean;
  hasTokens: boolean;
  runtimeMs: number;
  runCount: number;
  hasRuntime: boolean;
};

type IssueActivityCostSummaryProps = {
  linkedRuns?: RunForIssue[];
  issueTreeCostSummary?: IssueCostSummary;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function usageNumber(usage: Record<string, unknown> | null, ...keys: string[]) {
  for (const key of keys) {
    const value = usage?.[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return 0;
}

function useDirectRunCostSummary(linkedRuns?: RunForIssue[]): DirectRunCostSummary {
  return useMemo(() => {
    let input = 0;
    let output = 0;
    let cached = 0;
    let cost = 0;
    let runtimeMs = 0;
    let runCount = 0;
    let hasCost = false;
    let hasTokens = false;
    const nowMs = Date.now();

    for (const run of linkedRuns ?? []) {
      const usage = asRecord(run.usageJson);
      const result = asRecord(run.resultJson);
      const runInput = usageNumber(usage, "inputTokens", "input_tokens");
      const runOutput = usageNumber(usage, "outputTokens", "output_tokens");
      const runCached = usageNumber(
        usage,
        "cachedInputTokens",
        "cached_input_tokens",
        "cache_read_input_tokens",
      );
      const runCost = visibleRunCostUsd(usage, result);
      if (runCost > 0) hasCost = true;
      if (runInput + runOutput + runCached > 0) hasTokens = true;
      input += runInput;
      output += runOutput;
      cached += runCached;
      cost += runCost;

      if (run.startedAt) {
        const startMs = new Date(run.startedAt).getTime();
        const endMs = run.finishedAt ? new Date(run.finishedAt).getTime() : nowMs;
        if (Number.isFinite(startMs) && Number.isFinite(endMs) && endMs >= startMs) {
          runtimeMs += endMs - startMs;
          runCount += 1;
        }
      }
    }

    return {
      input,
      output,
      cached,
      cost,
      totalTokens: input + output,
      hasCost,
      hasTokens,
      runtimeMs,
      runCount,
      hasRuntime: runtimeMs > 0,
    };
  }, [linkedRuns]);
}

export function IssueActivityCostSummary({
  linkedRuns,
  issueTreeCostSummary,
}: IssueActivityCostSummaryProps) {
  const issueCostSummary = useDirectRunCostSummary(linkedRuns);
  const issueTreeCostTokens =
    (issueTreeCostSummary?.inputTokens ?? 0) + (issueTreeCostSummary?.outputTokens ?? 0);
  const hasIssueTreeCost =
    !!issueTreeCostSummary
    && (issueTreeCostSummary.costCents > 0
      || issueTreeCostTokens > 0
      || issueTreeCostSummary.cachedInputTokens > 0
      || issueTreeCostSummary.runtimeMs > 0
      || issueTreeCostSummary.issueCount > 1);

  if (!(linkedRuns && linkedRuns.length > 0) && !hasIssueTreeCost) return null;

  return (
    <div className="mb-3 rounded-lg border border-border px-3 py-2">
      <div className="mb-1 text-sm font-medium text-muted-foreground">Cost Summary</div>
      {!issueCostSummary.hasCost && !issueCostSummary.hasTokens && !hasIssueTreeCost ? (
        <div className="text-xs text-muted-foreground">No cost data yet.</div>
      ) : (
        <div className="space-y-1 text-xs tabular-nums text-muted-foreground">
          <div className="flex flex-wrap gap-3">
            <span className="font-medium text-foreground">This issue</span>
            {issueCostSummary.hasCost ? (
              <span className="font-medium text-foreground">
                ${issueCostSummary.cost.toFixed(4)}
              </span>
            ) : null}
            {issueCostSummary.hasTokens ? (
              <span>
                Tokens {formatTokens(issueCostSummary.totalTokens)}
                {issueCostSummary.cached > 0
                  ? ` (in ${formatTokens(issueCostSummary.input)}, out ${formatTokens(issueCostSummary.output)}, cached ${formatTokens(issueCostSummary.cached)})`
                  : ` (in ${formatTokens(issueCostSummary.input)}, out ${formatTokens(issueCostSummary.output)})`}
              </span>
            ) : null}
            {issueCostSummary.hasRuntime ? (
              <span>
                Runtime {formatDurationMs(issueCostSummary.runtimeMs)}
                {` (${issueCostSummary.runCount} run${issueCostSummary.runCount === 1 ? "" : "s"})`}
              </span>
            ) : null}
            {!issueCostSummary.hasCost && !issueCostSummary.hasTokens && !issueCostSummary.hasRuntime ? (
              <span>No direct cost data.</span>
            ) : null}
          </div>
          {hasIssueTreeCost && issueTreeCostSummary ? (
            <div className="flex flex-wrap gap-3">
              <span className="font-medium text-foreground">
                Including sub-issues {(issueTreeCostSummary.costCents / 100).toLocaleString(undefined, {
                  style: "currency",
                  currency: "USD",
                  minimumFractionDigits: 4,
                  maximumFractionDigits: 4,
                })}
              </span>
              <span>
                Tokens {formatTokens(issueTreeCostTokens)}
                {issueTreeCostSummary.cachedInputTokens > 0
                  ? ` (in ${formatTokens(issueTreeCostSummary.inputTokens)}, out ${formatTokens(issueTreeCostSummary.outputTokens)}, cached ${formatTokens(issueTreeCostSummary.cachedInputTokens)})`
                  : ` (in ${formatTokens(issueTreeCostSummary.inputTokens)}, out ${formatTokens(issueTreeCostSummary.outputTokens)})`}
              </span>
              {issueTreeCostSummary.runCount > 0 ? (
                <span>
                  Runtime {formatDurationMs(issueTreeCostSummary.runtimeMs)}
                  {` (${issueTreeCostSummary.runCount} run${issueTreeCostSummary.runCount === 1 ? "" : "s"})`}
                </span>
              ) : null}
              <span>
                {issueTreeCostSummary.issueCount} issue
                {issueTreeCostSummary.issueCount === 1 ? "" : "s"}
              </span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
