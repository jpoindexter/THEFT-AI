import type { QueryClient } from "@tanstack/react-query";

import type { ActiveRunForIssue, LiveRunForIssue } from "@/api/heartbeats";
import { queryKeys } from "@/lib/queryKeys";

export function resolveRunningIssueRun(
  activeRun: ActiveRunForIssue | null | undefined,
  liveRuns: readonly LiveRunForIssue[] | undefined,
) {
  return activeRun?.status === "running"
    ? activeRun
    : (liveRuns ?? []).find((run) => run.status === "running") ?? null;
}

export function dedupeLiveRunsById(liveRuns: readonly LiveRunForIssue[]) {
  const seen = new Set<string>();
  return liveRuns.filter((run) => {
    if (seen.has(run.id)) return false;
    seen.add(run.id);
    return true;
  });
}

export function readIssueRunStateFromCache(queryClient: QueryClient, issueId: string) {
  const liveRuns = queryClient.getQueryData<LiveRunForIssue[]>(
    queryKeys.issues.liveRuns(issueId),
  );
  const activeRun = queryClient.getQueryData<ActiveRunForIssue | null>(
    queryKeys.issues.activeRun(issueId),
  );
  return {
    liveRuns,
    activeRun,
    runningIssueRun: resolveRunningIssueRun(activeRun, liveRuns),
  };
}
