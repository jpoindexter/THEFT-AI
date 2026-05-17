import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { issuesApi } from "@/api/issues";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";
import type { ActionableIssueThreadInteraction } from "./IssueDetailChatTypes";
import type {
  AskUserQuestionsAnswer,
  AskUserQuestionsInteraction,
  Issue,
  IssueThreadInteraction,
} from "@paperclipai/shared";

type UseIssueDetailInteractionsInput = {
  invalidateIssueCollections: () => void;
  invalidateIssueDetail: () => void;
  issue: Issue | undefined;
  issueId: string | undefined;
  resolvedCompanyId: string | null | undefined;
  upsertInteractionInCache: (interaction: IssueThreadInteraction) => void;
};

export function useIssueDetailInteractions({
  invalidateIssueCollections,
  invalidateIssueDetail,
  issue,
  issueId,
  resolvedCompanyId,
  upsertInteractionInCache,
}: UseIssueDetailInteractionsInput) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const acceptInteraction = useMutation({
    mutationFn: ({
      interaction,
      selectedClientKeys,
    }: {
      interaction: ActionableIssueThreadInteraction;
      selectedClientKeys?: string[];
    }) => issuesApi.acceptInteraction(issueId!, interaction.id, { selectedClientKeys }),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      if (interaction.kind === "suggest_tasks" && resolvedCompanyId && issue?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByParent(resolvedCompanyId, issue.id) });
      }
      invalidateIssueDetail();
      invalidateIssueCollections();
      const createdCount = interaction.kind === "suggest_tasks"
        ? interaction.result?.createdTasks?.length ?? 0
        : 0;
      const skippedCount = interaction.kind === "suggest_tasks"
        ? interaction.result?.skippedClientKeys?.length ?? 0
        : 0;
      pushToast({
        title: interaction.kind === "request_confirmation"
          ? "Request confirmed"
          : skippedCount > 0
          ? `Accepted ${createdCount} draft${createdCount === 1 ? "" : "s"} and skipped ${skippedCount}`
          : "Suggested tasks accepted",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Accept failed",
        body: err instanceof Error ? err.message : "Unable to accept the suggested tasks",
        tone: "error",
      });
    },
  });

  const rejectInteraction = useMutation({
    mutationFn: ({ interaction, reason }: { interaction: ActionableIssueThreadInteraction; reason?: string }) =>
      issuesApi.rejectInteraction(issueId!, interaction.id, reason),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      invalidateIssueDetail();
      invalidateIssueCollections();
      pushToast({
        title: interaction.kind === "request_confirmation" ? "Request declined" : "Suggestion rejected",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Reject failed",
        body: err instanceof Error ? err.message : "Unable to reject the suggested tasks",
        tone: "error",
      });
    },
  });

  const answerInteraction = useMutation({
    mutationFn: ({
      interaction,
      answers,
    }: {
      interaction: IssueThreadInteraction;
      answers: AskUserQuestionsAnswer[];
    }) => issuesApi.respondToInteraction(issueId!, interaction.id, { answers }),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      invalidateIssueDetail();
      invalidateIssueCollections();
      pushToast({
        title: "Answers submitted",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Submit failed",
        body: err instanceof Error ? err.message : "Unable to submit answers",
        tone: "error",
      });
    },
  });

  const cancelInteraction = useMutation({
    mutationFn: ({ interaction }: { interaction: AskUserQuestionsInteraction }) =>
      issuesApi.cancelInteraction(issueId!, interaction.id),
    onSuccess: (interaction) => {
      upsertInteractionInCache(interaction);
      invalidateIssueDetail();
      invalidateIssueCollections();
      pushToast({
        title: "Question cancelled",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Cancel failed",
        body: err instanceof Error ? err.message : "Unable to cancel the question",
        tone: "error",
      });
    },
  });

  const handleAcceptInteraction = useCallback(async (
    interaction: ActionableIssueThreadInteraction,
    selectedClientKeys?: string[],
  ) => {
    await acceptInteraction.mutateAsync({ interaction, selectedClientKeys });
  }, [acceptInteraction]);

  const handleRejectInteraction = useCallback(async (interaction: ActionableIssueThreadInteraction, reason?: string) => {
    await rejectInteraction.mutateAsync({ interaction, reason });
  }, [rejectInteraction]);

  const handleSubmitInteractionAnswers = useCallback(async (
    interaction: IssueThreadInteraction,
    answers: AskUserQuestionsAnswer[],
  ) => {
    await answerInteraction.mutateAsync({ interaction, answers });
  }, [answerInteraction]);

  const handleCancelInteraction = useCallback(async (interaction: AskUserQuestionsInteraction) => {
    await cancelInteraction.mutateAsync({ interaction });
  }, [cancelInteraction]);

  return {
    handleAcceptInteraction,
    handleCancelInteraction,
    handleRejectInteraction,
    handleSubmitInteractionAnswers,
  };
}
