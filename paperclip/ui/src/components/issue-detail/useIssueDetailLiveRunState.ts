import { useEffect, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";

import { heartbeatsApi, type ActiveRunForIssue, type LiveRunForIssue } from "@/api/heartbeats";
import { shouldTrackIssueActiveRun } from "@/lib/issueActiveRun";
import { keepPreviousDataForSameQueryTail } from "@/lib/query-placeholder-data";
import { queryKeys } from "@/lib/queryKeys";
import type { Issue } from "@paperclipai/shared";

type UseIssueDetailLiveRunStateInput = {
  issue: Issue | null | undefined;
  issueId: string | undefined;
  locallyQueuedCommentRunIds: Map<string, string>;
  setLocallyQueuedCommentRunIds: Dispatch<SetStateAction<Map<string, string>>>;
};

export function useIssueDetailLiveRunState({
  issue,
  issueId,
  locallyQueuedCommentRunIds,
  setLocallyQueuedCommentRunIds,
}: UseIssueDetailLiveRunStateInput) {
  const { data: liveRunCount = 0 } = useQuery<LiveRunForIssue[], Error, number>({
    queryKey: queryKeys.issues.liveRuns(issueId!),
    queryFn: () => heartbeatsApi.liveRunsForIssue(issueId!),
    enabled: !!issueId,
    refetchInterval: 3000,
    select: (runs) => runs.length,
    placeholderData: keepPreviousDataForSameQueryTail<LiveRunForIssue[]>(issueId ?? "pending"),
  });

  const { data: hasActiveRun = false } = useQuery<ActiveRunForIssue | null, Error, boolean>({
    queryKey: queryKeys.issues.activeRun(issueId!),
    queryFn: () => heartbeatsApi.activeRunForIssue(issueId!),
    enabled: !!issueId && (!!issue?.executionRunId || issue?.status === "in_progress"),
    refetchInterval: liveRunCount > 0 ? false : 3000,
    select: (run) => !!run,
    placeholderData: keepPreviousDataForSameQueryTail<ActiveRunForIssue | null>(issueId ?? "pending"),
  });

  const resolvedHasActiveRun = issue ? shouldTrackIssueActiveRun(issue) && hasActiveRun : hasActiveRun;
  const hasLiveRuns = liveRunCount > 0 || resolvedHasActiveRun;

  useEffect(() => {
    if (!hasLiveRuns && locallyQueuedCommentRunIds.size > 0) {
      setLocallyQueuedCommentRunIds(new Map());
    }
  }, [hasLiveRuns, locallyQueuedCommentRunIds.size, setLocallyQueuedCommentRunIds]);

  return { hasLiveRuns };
}
