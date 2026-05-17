import { memo, useMemo, type Ref } from "react";
import { useQuery } from "@tanstack/react-query";
import type {
  ActiveRunForIssue,
  LiveRunForIssue,
} from "@/api/heartbeats";
import { activityApi, type RunForIssue } from "@/api/activity";
import { heartbeatsApi } from "@/api/heartbeats";
import { IssueChatThread, type IssueChatComposerHandle } from "@/components/IssueChatThread";
import type { MentionOption } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import type { CompanyUserProfile } from "@/lib/company-members";
import { extractIssueTimelineEvents } from "@/lib/issue-timeline-events";
import { keepPreviousDataForSameQueryTail } from "@/lib/query-placeholder-data";
import { queryKeys } from "@/lib/queryKeys";
import { resolveIssueActiveRun } from "@/lib/issueActiveRun";
import type {
  ActivityEvent,
  Agent,
  AskUserQuestionsAnswer,
  AskUserQuestionsInteraction,
  FeedbackDataSharingPreference,
  FeedbackVote,
  Issue,
  IssueAttachment,
  IssueBlockerAttention,
  IssueRelationIssueSummary,
  IssueThreadInteraction,
  IssueWorkMode,
  RequestConfirmationInteraction,
  SuccessfulRunHandoffState,
  SuggestTasksInteraction,
} from "@paperclipai/shared";

import type {
  ActionableIssueThreadInteraction,
  CommentReassignment,
  IssueDetailComment,
} from "./IssueDetailChatTypes";
import { resolveRunningIssueRun } from "./issueRunState";
import { useIssueDetailCommentRunMeta } from "./useIssueDetailCommentRunMeta";

type IssueDetailChatTabProps = {
  issueId: string;
  companyId: string;
  projectId: string | null;
  issueStatus: Issue["status"];
  issueWorkMode: IssueWorkMode;
  executionRunId: string | null;
  blockedBy: IssueRelationIssueSummary[];
  blockerAttention: IssueBlockerAttention | null;
  successfulRunHandoff: SuccessfulRunHandoffState | null;
  comments: IssueDetailComment[];
  locallyQueuedCommentRunIds: ReadonlyMap<string, string>;
  interactions: IssueThreadInteraction[];
  hasOlderComments: boolean;
  commentsLoadingOlder: boolean;
  onLoadOlderComments: () => void;
  onRefreshLatestComments: () => Promise<unknown> | void;
  onWorkModeChange?: (workMode: IssueWorkMode) => Promise<void> | void;
  composerRef: Ref<IssueChatComposerHandle>;
  feedbackVotes?: FeedbackVote[];
  feedbackDataSharingPreference: FeedbackDataSharingPreference;
  feedbackTermsUrl: string | null;
  agentMap: Map<string, Agent>;
  currentUserId: string | null;
  userLabelMap: ReadonlyMap<string, string> | null;
  userProfileMap: ReadonlyMap<string, CompanyUserProfile> | null;
  draftKey: string;
  reassignOptions: Array<{ id: string; label: string; searchText?: string }>;
  currentAssigneeValue: string;
  suggestedAssigneeValue: string;
  mentions: MentionOption[];
  composerDisabledReason: string | null;
  composerHint: string | null;
  queuedCommentReason: "hold" | "active_run" | "other";
  onVote: (
    commentId: string,
    vote: "up" | "down",
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  onAdd: (body: string, reopen?: boolean, reassignment?: CommentReassignment) => Promise<void>;
  onImageUpload: (file: File) => Promise<string>;
  onAttachImage: (file: File) => Promise<IssueAttachment | void>;
  onInterruptQueued: (runId: string) => Promise<void>;
  onPauseWorkRun?: (runId: string) => Promise<void>;
  onCancelQueued: (commentId: string) => void;
  interruptingQueuedRunId: string | null;
  pausingWorkRunId: string | null;
  onImageClick: (src: string) => void;
  onAcceptInteraction: (
    interaction: ActionableIssueThreadInteraction,
    selectedClientKeys?: string[],
  ) => Promise<void>;
  onRejectInteraction: (interaction: ActionableIssueThreadInteraction, reason?: string) => Promise<void>;
  onSubmitInteractionAnswers: (
    interaction: IssueThreadInteraction,
    answers: AskUserQuestionsAnswer[],
  ) => Promise<void>;
  onCancelInteraction: (interaction: AskUserQuestionsInteraction) => Promise<void>;
};

export const IssueDetailChatTab = memo(function IssueDetailChatTab({
  issueId,
  companyId,
  projectId,
  issueWorkMode,
  issueStatus,
  executionRunId,
  blockedBy,
  blockerAttention,
  successfulRunHandoff,
  comments,
  locallyQueuedCommentRunIds,
  interactions,
  hasOlderComments,
  commentsLoadingOlder,
  onLoadOlderComments,
  onRefreshLatestComments,
  onWorkModeChange,
  composerRef,
  feedbackVotes,
  feedbackDataSharingPreference,
  feedbackTermsUrl,
  agentMap,
  currentUserId,
  userLabelMap,
  userProfileMap,
  draftKey,
  reassignOptions,
  currentAssigneeValue,
  suggestedAssigneeValue,
  mentions,
  composerDisabledReason,
  composerHint,
  queuedCommentReason,
  onVote,
  onAdd,
  onImageUpload,
  onAttachImage,
  onInterruptQueued,
  onPauseWorkRun,
  onCancelQueued,
  interruptingQueuedRunId,
  pausingWorkRunId,
  onImageClick,
  onAcceptInteraction,
  onRejectInteraction,
  onSubmitInteractionAnswers,
  onCancelInteraction,
}: IssueDetailChatTabProps) {
  const { data: activity } = useQuery({
    queryKey: queryKeys.issues.activity(issueId),
    queryFn: () => activityApi.forIssue(issueId),
    placeholderData: keepPreviousDataForSameQueryTail<ActivityEvent[]>(issueId),
  });
  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.issues.liveRuns(issueId),
    queryFn: () => heartbeatsApi.liveRunsForIssue(issueId),
    refetchInterval: 3000,
    placeholderData: keepPreviousDataForSameQueryTail<LiveRunForIssue[]>(issueId),
  });
  const resolvedLiveRuns = liveRuns ?? [];
  const liveRunCount = resolvedLiveRuns.length;
  const { data: activeRun = null } = useQuery({
    queryKey: queryKeys.issues.activeRun(issueId),
    queryFn: () => heartbeatsApi.activeRunForIssue(issueId),
    enabled: !!executionRunId || issueStatus === "in_progress",
    refetchInterval: liveRunCount > 0 ? false : 3000,
    placeholderData: keepPreviousDataForSameQueryTail<ActiveRunForIssue | null>(issueId),
  });
  const resolvedActiveRun = useMemo(
    () => resolveIssueActiveRun({ status: issueStatus, executionRunId }, activeRun),
    [activeRun, executionRunId, issueStatus],
  );
  const hasLiveRuns = liveRunCount > 0 || !!resolvedActiveRun;
  const { data: linkedRuns } = useQuery({
    queryKey: queryKeys.issues.runs(issueId),
    queryFn: () => activityApi.runsForIssue(issueId),
    refetchInterval: hasLiveRuns ? 5000 : false,
    placeholderData: keepPreviousDataForSameQueryTail<RunForIssue[]>(issueId),
  });
  const resolvedActivity = activity ?? [];
  const resolvedLinkedRuns = linkedRuns ?? [];

  const runningIssueRun = useMemo(
    () => resolveRunningIssueRun(resolvedActiveRun, resolvedLiveRuns),
    [resolvedActiveRun, resolvedLiveRuns],
  );
  const liveRunIds = useMemo(() => {
    const ids = new Set<string>();
    for (const run of resolvedLiveRuns) ids.add(run.id);
    if (resolvedActiveRun) ids.add(resolvedActiveRun.id);
    return ids;
  }, [resolvedActiveRun, resolvedLiveRuns]);
  const timelineRuns = useMemo(() => {
    const historicalRuns = liveRunIds.size === 0
      ? resolvedLinkedRuns
      : resolvedLinkedRuns.filter((run) => !liveRunIds.has(run.runId));
    return historicalRuns.map((run) => ({
      ...run,
      adapterType: run.adapterType,
      hasStoredOutput: (run.logBytes ?? 0) > 0,
    }));
  }, [liveRunIds, resolvedLinkedRuns]);
  const commentsWithRunMeta = useIssueDetailCommentRunMeta({
    comments,
    liveRunIds,
    locallyQueuedCommentRunIds,
    queuedCommentReason,
    resolvedActivity,
    resolvedLinkedRuns,
    runningIssueRun,
  });
  const timelineEvents = useMemo(
    () => extractIssueTimelineEvents(resolvedActivity),
    [resolvedActivity],
  );

  return (
    <div className="space-y-3">
      {hasOlderComments ? (
        <div className="flex justify-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={commentsLoadingOlder}
            onClick={onLoadOlderComments}
          >
            {commentsLoadingOlder ? "Loading earlier comments..." : "Load earlier comments"}
          </Button>
        </div>
      ) : null}
      <IssueChatThread
        composerRef={composerRef}
        comments={commentsWithRunMeta}
        interactions={interactions}
        feedbackVotes={feedbackVotes}
        feedbackDataSharingPreference={feedbackDataSharingPreference}
        feedbackTermsUrl={feedbackTermsUrl}
        linkedRuns={timelineRuns}
        timelineEvents={timelineEvents}
        liveRuns={resolvedLiveRuns}
        activeRun={resolvedActiveRun}
        blockedBy={blockedBy ?? []}
        blockerAttention={blockerAttention}
        successfulRunHandoff={successfulRunHandoff}
        companyId={companyId}
        projectId={projectId}
        issueStatus={issueStatus}
        agentMap={agentMap}
        currentUserId={currentUserId}
        userLabelMap={userLabelMap}
        userProfileMap={userProfileMap}
        draftKey={draftKey}
        enableReassign
        reassignOptions={reassignOptions}
        currentAssigneeValue={currentAssigneeValue}
        suggestedAssigneeValue={suggestedAssigneeValue}
        mentions={mentions}
        composerDisabledReason={composerDisabledReason}
        composerHint={composerHint}
        onVote={onVote}
        onAdd={onAdd}
        imageUploadHandler={onImageUpload}
        onAttachImage={onAttachImage}
        onInterruptQueued={onInterruptQueued}
        onCancelQueued={onCancelQueued}
        interruptingQueuedRunId={interruptingQueuedRunId}
        stoppingRunId={pausingWorkRunId}
        onStopRun={onPauseWorkRun}
        stopRunLabel="Pause work"
        stoppingRunLabel="Pausing..."
        stopRunVariant="pause"
        onAcceptInteraction={onAcceptInteraction}
        onRejectInteraction={onRejectInteraction}
        onSubmitInteractionAnswers={(interaction, answers) =>
          onSubmitInteractionAnswers(interaction, answers)
        }
        onCancelInteraction={onCancelInteraction}
        issueWorkMode={issueWorkMode}
        onWorkModeChange={onWorkModeChange}
        onCancelRun={runningIssueRun && onPauseWorkRun
          ? async () => {
              await onPauseWorkRun(runningIssueRun.id);
            }
          : undefined}
        onImageClick={onImageClick}
        onRefreshLatestComments={onRefreshLatestComments}
      />
    </div>
  );
});
