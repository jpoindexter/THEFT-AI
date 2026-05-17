import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { RunForIssue } from "@/api/activity";
import { heartbeatsApi, type ActiveRunForIssue, type LiveRunForIssue } from "@/api/heartbeats";
import { issuesApi } from "@/api/issues";
import { useToastActions } from "@/context/ToastContext";
import { takeOptimisticIssueComment, type OptimisticIssueComment } from "@/lib/optimistic-issue-comments";
import { clearIssueExecutionRun, removeLiveRunById, upsertInterruptedRun } from "@/lib/optimistic-issue-runs";
import { queryKeys } from "@/lib/queryKeys";
import type { Issue } from "@paperclipai/shared";
import { dedupeLiveRunsById, resolveRunningIssueRun } from "./issueRunState";

type SetOptimisticComments = Dispatch<SetStateAction<OptimisticIssueComment[]>>;
type SetQueuedRunIds = Dispatch<SetStateAction<Map<string, string>>>;

type UseIssueDetailQueuedCommentActionsInput = {
  cancelledQueuedOptimisticCommentIdsRef: MutableRefObject<Set<string>>;
  invalidateIssueCollections: () => void;
  invalidateIssueDetail: () => void;
  invalidateIssueRunState: () => void;
  invalidateIssueThreadLazily: () => void;
  issueCacheRefs: string[];
  issueId: string | undefined;
  locallyQueuedCommentRunIds: Map<string, string>;
  removeCommentFromCache: (commentId: string) => void;
  restoreQueuedCommentDraft: (body: string) => void;
  setLocallyQueuedCommentRunIds: SetQueuedRunIds;
  setOptimisticComments: SetOptimisticComments;
};

export function useIssueDetailQueuedCommentActions({
  cancelledQueuedOptimisticCommentIdsRef,
  invalidateIssueCollections,
  invalidateIssueDetail,
  invalidateIssueRunState,
  invalidateIssueThreadLazily,
  issueCacheRefs,
  issueId,
  locallyQueuedCommentRunIds,
  removeCommentFromCache,
  restoreQueuedCommentDraft,
  setLocallyQueuedCommentRunIds,
  setOptimisticComments,
}: UseIssueDetailQueuedCommentActionsInput) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const interruptQueuedComment = useMutation({
    mutationFn: (runId: string) => heartbeatsApi.cancel(runId),
    onMutate: async (runId) => {
      await Promise.all(issueCacheRefs.flatMap((ref) => [
        queryClient.cancelQueries({ queryKey: queryKeys.issues.runs(ref) }),
        queryClient.cancelQueries({ queryKey: queryKeys.issues.liveRuns(ref) }),
        queryClient.cancelQueries({ queryKey: queryKeys.issues.activeRun(ref) }),
        queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(ref) }),
      ]));

      const previousRunState = issueCacheRefs.map((ref) => ({
        ref,
        runs: queryClient.getQueryData<RunForIssue[]>(queryKeys.issues.runs(ref)),
        liveRuns: queryClient.getQueryData<LiveRunForIssue[]>(queryKeys.issues.liveRuns(ref)),
        activeRun: queryClient.getQueryData<ActiveRunForIssue | null>(queryKeys.issues.activeRun(ref)),
        issue: queryClient.getQueryData<Issue>(queryKeys.issues.detail(ref)),
      }));
      const previousLocalQueuedCommentRunIds = locallyQueuedCommentRunIds;
      const cachedActiveRun =
        previousRunState.find((state) => state.activeRun?.id === runId)?.activeRun ??
        previousRunState.find((state) => state.activeRun)?.activeRun ??
        null;
      const liveRunList = dedupeLiveRunsById(previousRunState.flatMap((state) => state.liveRuns ?? []));
      const runningIssueRun = resolveRunningIssueRun(cachedActiveRun, liveRunList);
      const targetRun =
        cachedActiveRun?.id === runId
          ? cachedActiveRun
          : liveRunList?.find((run) => run.id === runId) ?? runningIssueRun ?? null;

      if (targetRun) {
        const interruptedAt = new Date().toISOString();
        for (const ref of issueCacheRefs) {
          queryClient.setQueryData<RunForIssue[] | undefined>(
            queryKeys.issues.runs(ref),
            (current) => upsertInterruptedRun(current, targetRun, interruptedAt),
          );
        }
      }

      for (const ref of issueCacheRefs) {
        queryClient.setQueryData(
          queryKeys.issues.liveRuns(ref),
          (current: LiveRunForIssue[] | undefined) => removeLiveRunById(current, runId),
        );
        queryClient.setQueryData(
          queryKeys.issues.activeRun(ref),
          (current: ActiveRunForIssue | null | undefined) => (current?.id === runId ? null : current),
        );
        queryClient.setQueryData(
          queryKeys.issues.detail(ref),
          (current: Issue | undefined) => clearIssueExecutionRun(current, runId),
        );
      }
      setLocallyQueuedCommentRunIds((current) => {
        const next = new Map([...current].filter(([, targetRunId]) => targetRunId !== runId));
        return next.size === current.size ? current : next;
      });

      return {
        previousRunState,
        previousLocalQueuedCommentRunIds,
      };
    },
    onSuccess: () => {
      invalidateIssueDetail();
      invalidateIssueRunState();
      pushToast({
        title: "Interrupt requested",
        body: "The active run is stopping so queued comments can continue next.",
        tone: "success",
      });
    },
    onError: (err, _runId, context) => {
      for (const state of context?.previousRunState ?? []) {
        queryClient.setQueryData(queryKeys.issues.runs(state.ref), state.runs);
        queryClient.setQueryData(queryKeys.issues.liveRuns(state.ref), state.liveRuns);
        queryClient.setQueryData(queryKeys.issues.activeRun(state.ref), state.activeRun);
        queryClient.setQueryData(queryKeys.issues.detail(state.ref), state.issue);
      }
      if (context?.previousLocalQueuedCommentRunIds) {
        setLocallyQueuedCommentRunIds(context.previousLocalQueuedCommentRunIds);
      }
      pushToast({
        title: "Interrupt failed",
        body: err instanceof Error ? err.message : "Unable to interrupt the active run",
        tone: "error",
      });
    },
  });

  const cancelQueuedComment = useMutation({
    mutationFn: async ({ commentId }: { commentId: string }) => issuesApi.cancelComment(issueId!, commentId),
    onSuccess: (comment) => {
      setLocallyQueuedCommentRunIds((current) => {
        if (!current.has(comment.id)) return current;
        const next = new Map(current);
        next.delete(comment.id);
        return next;
      });
      removeCommentFromCache(comment.id);
      restoreQueuedCommentDraft(comment.body);
      invalidateIssueDetail();
      invalidateIssueThreadLazily();
      invalidateIssueCollections();
      pushToast({
        title: "Queued comment canceled",
        body: "The queued message was restored to the composer.",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Cancel failed",
        body: err instanceof Error ? err.message : "Unable to cancel the queued comment",
        tone: "error",
      });
    },
  });

  const handleInterruptQueuedRun = useCallback(async (runId: string) => {
    await interruptQueuedComment.mutateAsync(runId);
  }, [interruptQueuedComment]);

  const handleCancelQueuedComment = useCallback((commentId: string) => {
    if (commentId.startsWith("optimistic-")) {
      cancelledQueuedOptimisticCommentIdsRef.current.add(commentId);
      let cancelledCommentBody: string | null = null;
      setOptimisticComments((current) => {
        const next = takeOptimisticIssueComment(current, commentId);
        cancelledCommentBody = next.comment?.body ?? null;
        return next.comments;
      });
      if (cancelledCommentBody) {
        restoreQueuedCommentDraft(cancelledCommentBody);
        pushToast({
          title: "Queued comment canceled",
          body: "The queued message was restored to the composer.",
          tone: "success",
        });
      }
      return;
    }

    void cancelQueuedComment.mutateAsync({ commentId });
  }, [cancelQueuedComment, cancelledQueuedOptimisticCommentIdsRef, restoreQueuedCommentDraft, setOptimisticComments, pushToast]);

  return {
    handleCancelQueuedComment,
    handleInterruptQueuedRun,
    interruptingQueuedRunId: interruptQueuedComment.isPending ? interruptQueuedComment.variables ?? null : null,
  };
}
