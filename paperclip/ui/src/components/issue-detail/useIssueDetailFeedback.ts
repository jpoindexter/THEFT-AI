import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { FeedbackVote } from "@paperclipai/shared";

import { issuesApi } from "@/api/issues";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

import { mergeOptimisticFeedbackVote } from "./IssueDetailUtils";

type FeedbackSharingPreference = "allowed" | "not_allowed" | "prompt";

type FeedbackVoteVariables = {
  targetType: "issue_comment" | "issue_document_revision";
  targetId: string;
  vote: "up" | "down";
  reason?: string;
  allowSharing?: boolean;
  sharingPreferenceAtSubmit: FeedbackSharingPreference;
};

type UseIssueDetailFeedbackInput = {
  currentUserId: string | null;
  feedbackDataSharingPreference: FeedbackSharingPreference;
  issueId?: string;
};

export function useIssueDetailFeedback({
  currentUserId,
  feedbackDataSharingPreference,
  issueId,
}: UseIssueDetailFeedbackInput) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const feedbackVoteMutation = useMutation({
    mutationFn: (variables: FeedbackVoteVariables) =>
      issuesApi.upsertFeedbackVote(issueId!, {
        targetType: variables.targetType,
        targetId: variables.targetId,
        vote: variables.vote,
        ...(variables.reason ? { reason: variables.reason } : {}),
        ...(variables.allowSharing ? { allowSharing: true } : {}),
      }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.feedbackVotes(issueId!) });
      const previousVotes = queryClient.getQueryData<FeedbackVote[]>(
        queryKeys.issues.feedbackVotes(issueId!),
      );
      queryClient.setQueryData<FeedbackVote[]>(
        queryKeys.issues.feedbackVotes(issueId!),
        mergeOptimisticFeedbackVote(
          previousVotes,
          {
            issueId: issueId!,
            targetType: variables.targetType,
            targetId: variables.targetId,
            vote: variables.vote,
            reason: variables.reason,
          },
          currentUserId,
        ),
      );
      return { previousVotes };
    },
    onSuccess: (_savedVote, variables) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.feedbackVotes(issueId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings });
      pushToast({
        title:
          variables.sharingPreferenceAtSubmit === "prompt"
            ? variables.allowSharing
              ? "Feedback saved. Future votes will share"
              : "Feedback saved. Future votes will stay local"
            : variables.allowSharing
              ? "Feedback saved and sharing enabled"
              : "Feedback saved",
        tone: "success",
      });
    },
    onError: (err, _variables, context) => {
      if (context?.previousVotes) {
        queryClient.setQueryData(queryKeys.issues.feedbackVotes(issueId!), context.previousVotes);
      }
      pushToast({
        title: "Failed to save feedback",
        body: err instanceof Error ? err.message : "Unknown error",
        tone: "error",
      });
    },
  });

  const handleCommentVote = useCallback(async (
    commentId: string,
    vote: "up" | "down",
    options?: { allowSharing?: boolean; reason?: string },
  ) => {
    await feedbackVoteMutation.mutateAsync({
      targetType: "issue_comment",
      targetId: commentId,
      vote,
      reason: options?.reason,
      allowSharing: options?.allowSharing,
      sharingPreferenceAtSubmit: feedbackDataSharingPreference,
    });
  }, [feedbackDataSharingPreference, feedbackVoteMutation]);

  const handleDocumentVote = useCallback(async (
    revisionId: string,
    vote: "up" | "down",
    options?: { allowSharing?: boolean; reason?: string },
  ) => {
    await feedbackVoteMutation.mutateAsync({
      targetType: "issue_document_revision",
      targetId: revisionId,
      vote,
      reason: options?.reason,
      allowSharing: options?.allowSharing,
      sharingPreferenceAtSubmit: feedbackDataSharingPreference,
    });
  }, [feedbackDataSharingPreference, feedbackVoteMutation]);

  return {
    handleCommentVote,
    handleDocumentVote,
  };
}
