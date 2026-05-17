import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import { usePaperclipIssueRuntime } from "../hooks/usePaperclipIssueRuntime";
import { Button } from "@/components/ui/button";
import { cn } from "../lib/utils";
import {
  IssueChatComposer,
  type IssueChatComposerHandle,
} from "./issue-chat/IssueChatComposer";
import { IssueChatErrorBoundary } from "./issue-chat/IssueChatErrorBoundary";
import {
  IssueChatCtx,
} from "./issue-chat/IssueChatMessageContext";
import {
  findLatestCommentMessageIndex,
  issueChatMessageCommentId,
  issueChatMessageCustom,
  issueChatMessageQueueTargetRunId,
  issueChatMessageRunId,
} from "./issue-chat/MessageState";
import {
  VIRTUALIZED_THREAD_ROW_THRESHOLD,
} from "./issue-chat/VirtualizedThreadList";
import { IssueChatThreadViewport } from "./issue-chat/IssueChatThreadViewport";
import type { IssueChatThreadProps } from "./issue-chat/IssueChatThreadTypes";
import { useIssueChatMessages } from "./issue-chat/useIssueChatMessages";
import { useIssueChatMessageContext } from "./issue-chat/useIssueChatMessageContext";
import { useIssueChatScrollController } from "./issue-chat/useIssueChatScrollController";
import { useIssueChatThreadDerivedState } from "./issue-chat/useIssueChatThreadDerivedState";

export {
  VIRTUALIZED_THREAD_ROW_THRESHOLD,
  findLatestCommentMessageIndex,
};

export {
  SuccessfulRunHandoffCommentCallout,
  resolveIssueChatHumanAuthor,
} from "./issue-chat/IssueChatMessageContent";

export { resolveAssistantMessageFoldedState } from "./issue-chat/IssueChatAssistantMessage";

export type { IssueChatComposerHandle };

export function canStopIssueChatRun(args: {
  runId: string | null;
  runStatus: string | null;
  activeRunIds: ReadonlySet<string>;
}) {
  const { runId, runStatus, activeRunIds } = args;
  if (!runId) return false;
  if (activeRunIds.has(runId)) return true;
  return runStatus === "queued" || runStatus === "running";
}

export function IssueChatThread({
  comments,
  interactions = [],
  feedbackVotes = [],
  feedbackDataSharingPreference = "prompt",
  feedbackTermsUrl = null,
  linkedRuns = [],
  timelineEvents = [],
  liveRuns = [],
  activeRun = null,
  blockedBy = [],
  blockerAttention = null,
  successfulRunHandoff = null,
  companyId,
  projectId,
  issueStatus,
  agentMap,
  currentUserId,
  userLabelMap,
  userProfileMap,
  onVote,
  onAdd,
  onCancelRun,
  onStopRun,
  stopRunLabel,
  stoppingRunLabel,
  stopRunVariant,
  imageUploadHandler,
  onAttachImage,
  draftKey,
  enableReassign = false,
  reassignOptions = [],
  currentAssigneeValue = "",
  suggestedAssigneeValue,
  mentions = [],
  composerDisabledReason = null,
  composerHint = null,
  showComposer = true,
  showJumpToLatest,
  emptyMessage,
  variant = "full",
  enableLiveTranscriptPolling = true,
  transcriptsByRunId,
  hasOutputForRun: hasOutputForRunOverride,
  includeSucceededRunsWithoutOutput = false,
  onInterruptQueued,
  onCancelQueued,
  interruptingQueuedRunId = null,
  stoppingRunId = null,
  onImageClick,
  onAcceptInteraction,
  onRejectInteraction,
  onSubmitInteractionAnswers,
  onCancelInteraction,
  composerRef,
  issueWorkMode,
  onWorkModeChange,
  onRefreshLatestComments,
}: IssueChatThreadProps) {
  const {
    activeRunIds,
    isRunning,
    messages,
  } = useIssueChatMessages({
    activeRun,
    agentMap,
    comments,
    companyId,
    currentUserId,
    enableLiveTranscriptPolling,
    hasOutputForRunOverride,
    includeSucceededRunsWithoutOutput,
    interactions,
    linkedRuns,
    liveRuns,
    projectId,
    timelineEvents,
    transcriptsByRunId,
    userLabelMap,
  });
  const {
    assignedAgent,
    errorBoundaryResetKey,
    feedbackVoteByTargetId,
    unresolvedBlockers,
  } = useIssueChatThreadDerivedState({
    agentMap,
    blockedBy,
    currentAssigneeValue,
    feedbackVotes,
    messages,
  });
  const {
    virtualizedThreadRef,
    bottomAnchorRef,
    composerViewportAnchorRef,
    bottomSpacerHeight,
    prepareSubmitScroll,
    handleJumpToLatest,
  } = useIssueChatScrollController({
    messages,
    onRefreshLatestComments,
  });

  const runtime = usePaperclipIssueRuntime({
    messages,
    isRunning,
    onSend: ({ body, reopen, reassignment }) => {
      prepareSubmitScroll();
      return onAdd(body, reopen, reassignment);
    },
    onCancel: onCancelRun,
  });

  const chatCtx = useIssueChatMessageContext({
    agentMap,
    currentUserId,
    feedbackDataSharingPreference,
    feedbackTermsUrl,
    issueStatus,
    onAcceptInteraction,
    onCancelInteraction,
    onCancelQueued,
    onImageClick,
    onInterruptQueued,
    onRejectInteraction,
    onStopRun,
    onSubmitInteractionAnswers,
    onVote,
    stopRunLabel,
    stoppingRunLabel,
    stopRunVariant,
    successfulRunHandoff,
    userLabelMap,
    userProfileMap,
  });

  const resolvedShowJumpToLatest = showJumpToLatest ?? variant === "full";
  const resolvedEmptyMessage = emptyMessage
    ?? (variant === "embedded"
      ? "No run output yet."
      : "This issue conversation is empty. Start with a message below.");
  return (
    <AssistantRuntimeProvider runtime={runtime}>
      <IssueChatCtx.Provider value={chatCtx}>
      <div className={cn(variant === "embedded" ? "space-y-3" : "space-y-4")}>
        {resolvedShowJumpToLatest ? (
          <div className="flex justify-end">
            <Button
              type="button"
              onClick={handleJumpToLatest}
              variant="ghost"
              size="xs"
              className="text-muted-foreground hover:text-foreground"
            >
              Jump to latest
            </Button>
          </div>
        ) : null}

        <IssueChatErrorBoundary
          resetKey={errorBoundaryResetKey}
          messages={messages}
          emptyMessage={resolvedEmptyMessage}
          variant={variant}
        >
          <IssueChatThreadViewport
            activeRunIds={activeRunIds}
            agentMap={agentMap}
            assignedAgent={assignedAgent}
            blockerAttention={blockerAttention}
            bottomAnchorRef={bottomAnchorRef}
            bottomSpacerHeight={bottomSpacerHeight}
            feedbackVoteByTargetId={feedbackVoteByTargetId}
            interruptingQueuedRunId={interruptingQueuedRunId}
            issueStatus={issueStatus}
            messages={messages}
            resolvedEmptyMessage={resolvedEmptyMessage}
            showComposer={showComposer}
            stoppingRunId={stoppingRunId}
            successfulRunHandoff={successfulRunHandoff}
            unresolvedBlockers={unresolvedBlockers}
            variant={variant}
            virtualizedThreadRef={virtualizedThreadRef}
          />
        </IssueChatErrorBoundary>

        {showComposer ? (
          <div
            ref={composerViewportAnchorRef}
            data-testid="issue-chat-composer-dock"
            // The safe-area CSS env offset keeps the sticky composer clear of
            // mobile browser chrome; keep it local until a shared dock utility exists.
            className="issue-chat-composer-dock sticky z-20 space-y-2 bg-gradient-to-t from-background via-background/95 to-background/0 pt-6"
          >
            <IssueChatComposer
              ref={composerRef}
              onImageUpload={imageUploadHandler}
              onAttachImage={onAttachImage}
              draftKey={draftKey}
              enableReassign={enableReassign}
              reassignOptions={reassignOptions}
              currentAssigneeValue={currentAssigneeValue}
              suggestedAssigneeValue={suggestedAssigneeValue}
              mentions={mentions}
              agentMap={agentMap}
              composerDisabledReason={composerDisabledReason}
              composerHint={composerHint}
              issueStatus={issueStatus}
              issueWorkMode={issueWorkMode}
              onWorkModeChange={onWorkModeChange}
            />
          </div>
        ) : null}
      </div>
      </IssueChatCtx.Provider>
    </AssistantRuntimeProvider>
  );
}
