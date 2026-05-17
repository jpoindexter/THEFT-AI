import { useQuery } from "@tanstack/react-query";
import { ISSUE_STATUSES } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { TheftSurface } from "@/components/theft";
import { issuesApi } from "../../api/issues";
import { createIssueDetailPath, withIssueDetailHeaderSeed } from "../../lib/issueDetailBreadcrumb";
import type { SubIssueProgressSummary } from "../../lib/issue-detail-subissues";
import { queryKeys } from "../../lib/queryKeys";
import { cn, formatDurationMs, formatTokens } from "../../lib/utils";
import {
  issueStatusLabels,
  progressSegmentClasses,
  progressSegmentWidthClass,
} from "./constants";

export function SubIssueProgressSummaryStrip({
  summary,
  issueLinkState,
  parentIssueIdForCostSummary,
}: {
  summary: SubIssueProgressSummary;
  issueLinkState?: unknown;
  parentIssueIdForCostSummary?: string;
}) {
  const target = summary.target;
  const targetIssue = target?.issue ?? null;
  const targetPathId = targetIssue?.identifier ?? targetIssue?.id ?? "";
  const targetState = targetIssue ? withIssueDetailHeaderSeed(issueLinkState, targetIssue) : undefined;
  const statusEntries = ISSUE_STATUSES
    .map((status) => ({ status, count: summary.countsByStatus[status] ?? 0 }))
    .filter((entry) => entry.count > 0);

  // Refresh fast enough that the runtime ticks up while a sub-issue is still
  // running, but slow enough not to hammer the recursive CTE on idle trees.
  const hasInProgress = summary.inProgressCount > 0;
  const { data: costSummary } = useQuery({
    queryKey: queryKeys.issues.costSummary(parentIssueIdForCostSummary ?? "pending", { excludeRoot: true }),
    queryFn: () => issuesApi.getCostSummary(parentIssueIdForCostSummary!, { excludeRoot: true }),
    enabled: !!parentIssueIdForCostSummary,
    refetchInterval: hasInProgress ? 5_000 : false,
  });

  const totalTokens = costSummary
    ? costSummary.inputTokens + costSummary.cachedInputTokens + costSummary.outputTokens
    : 0;
  const showCostSummary = !!costSummary && (costSummary.runCount > 0 || totalTokens > 0);

  return (
    <TheftSurface tone="plain" padding="sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="font-medium text-foreground">
              {summary.doneCount}/{summary.totalCount} done
            </span>
            <span className="text-muted-foreground">
              {summary.inProgressCount} in progress
            </span>
            <span className="text-muted-foreground">
              {summary.blockedCount} blocked
            </span>
            {showCostSummary && (
              <>
                <span
                  className="text-muted-foreground tabular-nums"
                  title={`${costSummary.runCount.toLocaleString()} run${
                    costSummary.runCount === 1 ? "" : "s"
                  } across ${costSummary.issueCount} sub-issue${
                    costSummary.issueCount === 1 ? "" : "s"
                  }`}
                >
                  {formatTokens(totalTokens)} tokens
                </span>
                <span className="text-muted-foreground tabular-nums">
                  {formatDurationMs(costSummary.runtimeMs)} runtime
                </span>
              </>
            )}
          </div>
          <div
            role="progressbar"
            aria-label="Sub-issues completion progress"
            aria-valuemin={0}
            aria-valuenow={summary.doneCount}
            aria-valuemax={summary.totalCount}
            className="flex h-2 w-full overflow-hidden rounded-full bg-muted"
          >
            {statusEntries.map(({ status, count }) => (
              <span
                key={status}
                className={cn(
                  "h-full",
                  progressSegmentClasses[status],
                  progressSegmentWidthClass(count, summary.totalCount),
                )}
                title={`${issueStatusLabels[status]}: ${count}`}
                aria-hidden="true"
              />
            ))}
          </div>
        </div>

        <TheftSurface tone="muted" padding="sm" className="min-w-0 px-3 py-2 text-sm lg:w-72">
          {target && targetIssue ? (
            <>
              <div className="text-xs font-medium text-muted-foreground">
                {target.kind === "next" ? "Next up" : "Waiting on blockers"}
              </div>
              <Link
                to={createIssueDetailPath(targetPathId)}
                state={targetState}
                issuePrefetch={targetIssue}
                className="mt-1 block min-w-0 text-foreground underline-offset-2 hover:underline"
              >
                <span className="font-mono text-xs text-muted-foreground">
                  {targetIssue.identifier ?? targetIssue.id.slice(0, 8)}
                </span>{" "}
                <span>{targetIssue.title}</span>
              </Link>
            </>
          ) : summary.totalCount === 0 ? (
            <div className="text-sm font-medium text-foreground">No active sub-issues</div>
          ) : summary.doneCount === summary.totalCount ? (
            <div className="text-sm font-medium text-foreground">All sub-issues done</div>
          ) : (
            <div className="text-sm font-medium text-foreground">No actionable sub-issues</div>
          )}
        </TheftSurface>
      </div>
    </TheftSurface>
  );
}
