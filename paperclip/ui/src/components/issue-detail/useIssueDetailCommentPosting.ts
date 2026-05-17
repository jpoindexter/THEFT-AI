import { useCallback, type Dispatch, type MutableRefObject, type SetStateAction } from "react";
import { useMutation, useQueryClient, type QueryClient, type InfiniteData } from "@tanstack/react-query";

import { issuesApi } from "@/api/issues";
import { useToastActions } from "@/context/ToastContext";
import {
  applyOptimisticIssueCommentUpdate,
  createOptimisticIssueComment,
  upsertIssueCommentInPages,
  type OptimisticIssueComment,
} from "@/lib/optimistic-issue-comments";
import { queryKeys } from "@/lib/queryKeys";
import type { Issue, IssueComment } from "@paperclipai/shared";
import type { CommentReassignment } from "./IssueDetailChatTypes";
import { readIssueRunStateFromCache } from "./issueRunState";

type SetOptimisticComments = Dispatch<SetStateAction<OptimisticIssueComment[]>>;
type SetQueuedRunIds = Dispatch<SetStateAction<Map<string, string>>>;

type AddCommentVariables = {
  body: string;
  interrupt?: boolean;
  reopen?: boolean;
};

type AddCommentAndReassignVariables = AddCommentVariables & {
  reassignment: CommentReassignment;
};

type OptimisticCommentContext = {
  optimisticCommentId: string | null;
  previousIssue: Issue | undefined;
  queuedCommentTargetRunId: string | null;
};

type UseIssueDetailCommentPostingInput = {
  cancelledQueuedOptimisticCommentIdsRef: MutableRefObject<Set<string>>;
  currentUserId: string | null;
  invalidateIssueCollections: () => void;
  invalidateIssueDetail: () => void;
  invalidateIssueRunState: () => void;
  invalidateIssueThreadLazily: () => void;
  issue: Issue | null | undefined;
  issueId: string | undefined;
  setLocallyQueuedCommentRunIds: SetQueuedRunIds;
  setOptimisticComments: SetOptimisticComments;
};

function upsertCommentInCache(queryClient: QueryClient, issueId: string, comment: IssueComment) {
  queryClient.setQueryData<InfiniteData<IssueComment[], string | null>>(
    queryKeys.issues.comments(issueId),
    (current) => current ? {
      ...current,
      pages: upsertIssueCommentInPages(current.pages, comment),
    } : {
      pageParams: [null],
      pages: upsertIssueCommentInPages(undefined, comment),
    },
  );
}

export function useIssueDetailCommentPosting({
  cancelledQueuedOptimisticCommentIdsRef,
  currentUserId,
  invalidateIssueCollections,
  invalidateIssueDetail,
  invalidateIssueRunState,
  invalidateIssueThreadLazily,
  issue,
  issueId,
  setLocallyQueuedCommentRunIds,
  setOptimisticComments,
}: UseIssueDetailCommentPostingInput) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const stageOptimisticComment = useCallback(async ({
    body,
    interrupt,
    reassignment,
    reopen,
  }: AddCommentVariables & { reassignment?: CommentReassignment }): Promise<OptimisticCommentContext> => {
    await queryClient.cancelQueries({ queryKey: queryKeys.issues.comments(issueId!) });
    await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId!) });

    const previousIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId!));
    const queuedComment = !interrupt ? readIssueRunStateFromCache(queryClient, issueId!).runningIssueRun : null;
    const optimisticComment = issue
      ? createOptimisticIssueComment({
          companyId: issue.companyId,
          issueId: issue.id,
          body,
          authorUserId: currentUserId,
          clientStatus: queuedComment ? "queued" : "pending",
          queueTargetRunId: queuedComment?.id ?? null,
        })
      : null;

    if (optimisticComment) {
      setOptimisticComments((current) => [...current, optimisticComment]);
    }
    if (previousIssue) {
      queryClient.setQueryData(
        queryKeys.issues.detail(issueId!),
        applyOptimisticIssueCommentUpdate(previousIssue, { reopen, reassignment }),
      );
    }

    return {
      optimisticCommentId: optimisticComment?.clientId ?? null,
      previousIssue,
      queuedCommentTargetRunId: queuedComment?.id ?? null,
    };
  }, [currentUserId, issue, issueId, queryClient, setOptimisticComments]);

  const settlePostedComment = useCallback(async (
    comment: IssueComment,
    context: OptimisticCommentContext | undefined,
  ) => {
    if (context?.optimisticCommentId) {
      setOptimisticComments((current) =>
        current.filter((entry) => entry.clientId !== context.optimisticCommentId),
      );
    }
    if (context?.optimisticCommentId && cancelledQueuedOptimisticCommentIdsRef.current.has(context.optimisticCommentId)) {
      cancelledQueuedOptimisticCommentIdsRef.current.delete(context.optimisticCommentId);
      try {
        await issuesApi.cancelComment(issueId!, comment.id);
        invalidateIssueDetail();
        invalidateIssueThreadLazily();
        invalidateIssueCollections();
        return;
      } catch (err) {
        pushToast({
          title: "Cancel failed",
          body: err instanceof Error ? err.message : "Unable to cancel the queued comment",
          tone: "error",
        });
      }
    }
    if (context?.queuedCommentTargetRunId) {
      setLocallyQueuedCommentRunIds((current) => {
        const next = new Map(current);
        next.set(comment.id, context.queuedCommentTargetRunId!);
        return next;
      });
    }
    upsertCommentInCache(queryClient, issueId!, comment);
  }, [
    cancelledQueuedOptimisticCommentIdsRef,
    invalidateIssueCollections,
    invalidateIssueDetail,
    invalidateIssueThreadLazily,
    issueId,
    pushToast,
    queryClient,
    setLocallyQueuedCommentRunIds,
    setOptimisticComments,
  ]);

  const addComment = useMutation({
    mutationFn: ({ body, reopen, interrupt }: AddCommentVariables) =>
      issuesApi.addComment(issueId!, body, reopen, interrupt),
    onMutate: stageOptimisticComment,
    onSuccess: async (comment, _variables, context) => {
      await settlePostedComment(comment, context);
    },
    onError: (err, _variables, context) => {
      if (context?.optimisticCommentId) {
        setOptimisticComments((current) =>
          current.filter((entry) => entry.clientId !== context.optimisticCommentId),
        );
      }
      if (context?.previousIssue) {
        queryClient.setQueryData(queryKeys.issues.detail(issueId!), context.previousIssue);
      }
      pushToast({
        title: "Comment failed",
        body: err instanceof Error ? err.message : "Unable to post comment",
        tone: "error",
      });
    },
    onSettled: (_result, _error, variables) => {
      invalidateIssueThreadLazily();
      if (variables.interrupt) {
        invalidateIssueRunState();
      }
      if (variables.reopen) {
        invalidateIssueCollections();
      }
    },
  });

  const addCommentAndReassign = useMutation({
    mutationFn: ({
      body,
      reopen,
      interrupt,
      reassignment,
    }: AddCommentAndReassignVariables) =>
      issuesApi.update(issueId!, {
        comment: body,
        assigneeAgentId: reassignment.assigneeAgentId,
        assigneeUserId: reassignment.assigneeUserId,
        ...(reopen ? { status: "todo" } : {}),
        ...(interrupt ? { interrupt } : {}),
      }),
    onMutate: stageOptimisticComment,
    onSuccess: async (result, _variables, context) => {
      const { comment, ...nextIssue } = result;
      queryClient.setQueryData(queryKeys.issues.detail(issueId!), nextIssue);
      if (comment) {
        await settlePostedComment(comment, context);
      }
    },
    onError: (err, _variables, context) => {
      if (context?.optimisticCommentId) {
        setOptimisticComments((current) =>
          current.filter((entry) => entry.clientId !== context.optimisticCommentId),
        );
      }
      if (context?.previousIssue) {
        queryClient.setQueryData(queryKeys.issues.detail(issueId!), context.previousIssue);
      }
      pushToast({
        title: "Comment failed",
        body: err instanceof Error ? err.message : "Unable to post comment",
        tone: "error",
      });
    },
    onSettled: (_result, _error, variables) => {
      invalidateIssueThreadLazily();
      if (variables.interrupt) {
        invalidateIssueRunState();
      }
      invalidateIssueCollections();
    },
  });

  const handleChatAdd = useCallback(async (body: string, reopen?: boolean, reassignment?: CommentReassignment) => {
    if (reassignment) {
      await addCommentAndReassign.mutateAsync({ body, reopen, reassignment });
      return;
    }
    await addComment.mutateAsync({ body, reopen });
  }, [addComment, addCommentAndReassign]);

  return {
    handleChatAdd,
  };
}
