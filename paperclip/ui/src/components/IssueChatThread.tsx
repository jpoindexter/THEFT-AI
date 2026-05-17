import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import type { ThreadMessage } from "@assistant-ui/react";
import {
  memo,
  useContext,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type Ref,
} from "react";
import { Link } from "@/lib/router";
import type {
  Agent,
  FeedbackDataSharingPreference,
  FeedbackVote,
  FeedbackVoteValue,
  IssueAttachment,
  IssueBlockerAttention,
  IssueRelationIssueSummary,
  SuccessfulRunHandoffState,
  IssueWorkMode,
} from "@paperclipai/shared";
import type { ActiveRunForIssue, LiveRunForIssue } from "../api/heartbeats";
import { useLiveRunTranscripts } from "./transcript/useLiveRunTranscripts";
import { usePaperclipIssueRuntime } from "../hooks/usePaperclipIssueRuntime";
import {
  buildIssueChatMessages,
  stabilizeThreadMessages,
  type IssueChatComment,
  type IssueChatLinkedRun,
  type StableThreadMessageCacheEntry,
  type IssueChatTranscriptEntry,
} from "../lib/issue-chat-messages";
import type {
  AskUserQuestionsAnswer,
  AskUserQuestionsInteraction,
  IssueThreadInteraction,
  RequestConfirmationInteraction,
  SuggestTasksInteraction,
} from "../lib/issue-thread-interactions";
import { buildIssueThreadInteractionSummary, isIssueThreadInteraction } from "../lib/issue-thread-interactions";
import { resolveIssueChatTranscriptRuns } from "../lib/issueChatTranscriptRuns";
import {
  formatTimelineWorkspaceLabel,
  type IssueTimelineAssignee,
  type IssueTimelineEvent,
} from "../lib/issue-timeline-events";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { MentionOption } from "./MarkdownEditor";
import { Identity } from "./Identity";
import type { InlineEntityOption } from "./InlineEntitySelector";
import { IssueThreadInteractionCard } from "./IssueThreadInteractionCard";
import { AgentIcon } from "./AgentIconPicker";
import type { CompanyUserProfile } from "../lib/company-members";
import { timeAgo } from "../lib/timeAgo";
import { cn } from "../lib/utils";
import { ArrowRight, ChevronDown } from "lucide-react";
import { IssueBlockedNotice } from "./IssueBlockedNotice";
import { toIsoString } from "./issue-chat/ComposerHelpers";
import {
  IssueChatComposer,
  type CommentReassignment,
  type IssueChatComposerHandle,
} from "./issue-chat/IssueChatComposer";
import { IssueChatErrorBoundary } from "./issue-chat/IssueChatErrorBoundary";
import { IssueChatAssistantMessage } from "./issue-chat/IssueChatAssistantMessage";
import {
  IssueAssigneePausedNotice,
} from "./issue-chat/IssueChatMessageContent";
import {
  IssueChatCtx,
  type IssueChatMessageContext,
} from "./issue-chat/IssueChatMessageContext";
import { IssueChatUserMessage } from "./issue-chat/IssueChatUserMessage";
import {
  findLatestCommentMessageIndex,
  issueChatMessageActiveVote,
  issueChatMessageCommentId,
  issueChatMessageCustom,
  issueChatMessageKind,
  issueChatMessageQueueTargetRunId,
  issueChatMessageRunId,
  issueChatMessageRunIsActive,
  issueChatMessageRunIsStopping,
  issueChatMessageQueuedRunIsInterrupting,
} from "./issue-chat/MessageState";
import { SystemNoticeCommentRow } from "./issue-chat/SystemNoticeCommentRow";
import {
  formatInteractionActorLabel,
  formatRunStatusLabel,
  formatTimelineAssigneeLabel,
  humanizeValue,
  initialsForName,
  isTimelineWorkspaceChange,
  runStatusClass,
} from "./issue-chat/SystemMessageHelpers";
import {
  VIRTUALIZED_THREAD_ROW_THRESHOLD,
  VirtualizedIssueChatThreadList,
} from "./issue-chat/VirtualizedThreadList";
import { useIssueChatScrollController } from "./issue-chat/useIssueChatScrollController";

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

function useStableEvent<T extends (...args: never[]) => unknown>(callback: T | undefined): T | undefined {
  const callbackRef = useRef(callback);
  useLayoutEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useMemo(() => {
    if (!callback) return undefined;
    return ((...args: Parameters<T>) => callbackRef.current?.(...args)) as T;
    // Keep the wrapper stable while the callback identity changes; the ref above
    // carries the current callback implementation.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [Boolean(callback)]);
}

interface IssueChatThreadProps {
  comments: IssueChatComment[];
  interactions?: IssueThreadInteraction[];
  feedbackVotes?: FeedbackVote[];
  feedbackDataSharingPreference?: FeedbackDataSharingPreference;
  feedbackTermsUrl?: string | null;
  linkedRuns?: IssueChatLinkedRun[];
  timelineEvents?: IssueTimelineEvent[];
  liveRuns?: LiveRunForIssue[];
  activeRun?: ActiveRunForIssue | null;
  blockedBy?: IssueRelationIssueSummary[];
  blockerAttention?: IssueBlockerAttention | null;
  successfulRunHandoff?: SuccessfulRunHandoffState | null;
  companyId?: string | null;
  projectId?: string | null;
  issueStatus?: string;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
  userProfileMap?: ReadonlyMap<string, CompanyUserProfile> | null;
  onVote?: (
    commentId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  onAdd: (body: string, reopen?: boolean, reassignment?: CommentReassignment) => Promise<void>;
  onCancelRun?: () => Promise<void>;
  onStopRun?: (runId: string) => Promise<void>;
  stopRunLabel?: string;
  stoppingRunLabel?: string;
  stopRunVariant?: "stop" | "pause";
  imageUploadHandler?: (file: File) => Promise<string>;
  onAttachImage?: (file: File) => Promise<IssueAttachment | void>;
  draftKey?: string;
  enableReassign?: boolean;
  reassignOptions?: InlineEntityOption[];
  currentAssigneeValue?: string;
  suggestedAssigneeValue?: string;
  mentions?: MentionOption[];
  composerDisabledReason?: string | null;
  composerHint?: string | null;
  onWorkModeChange?: (workMode: IssueWorkMode) => Promise<void> | void;
  showComposer?: boolean;
  showJumpToLatest?: boolean;
  emptyMessage?: string;
  variant?: "full" | "embedded";
  enableLiveTranscriptPolling?: boolean;
  transcriptsByRunId?: ReadonlyMap<string, readonly IssueChatTranscriptEntry[]>;
  hasOutputForRun?: (runId: string) => boolean;
  includeSucceededRunsWithoutOutput?: boolean;
  onInterruptQueued?: (runId: string) => Promise<void>;
  onCancelQueued?: (commentId: string) => void;
  interruptingQueuedRunId?: string | null;
  stoppingRunId?: string | null;
  onImageClick?: (src: string) => void;
  onAcceptInteraction?: (
    interaction: SuggestTasksInteraction | RequestConfirmationInteraction,
    selectedClientKeys?: string[],
  ) => Promise<void> | void;
  onRejectInteraction?: (
    interaction: SuggestTasksInteraction | RequestConfirmationInteraction,
    reason?: string,
  ) => Promise<void> | void;
  onSubmitInteractionAnswers?: (
    interaction: AskUserQuestionsInteraction,
    answers: AskUserQuestionsAnswer[],
  ) => Promise<void> | void;
  onCancelInteraction?: (
    interaction: AskUserQuestionsInteraction,
  ) => Promise<void> | void;
  composerRef?: Ref<IssueChatComposerHandle>;
  issueWorkMode?: IssueWorkMode;
  /**
   * Hook for the parent to refetch comments when the user explicitly asks
   * to jump to the latest comment. Used to make sure the absolute newest
   * comment is in the loaded set before we scroll to it.
   */
  onRefreshLatestComments?: () => Promise<unknown> | void;
}

function ExpiredRequestConfirmationActivity({
  message,
  anchorId,
  interaction,
}: {
  message: ThreadMessage;
  anchorId?: string;
  interaction: RequestConfirmationInteraction;
}) {
  const {
    agentMap,
    currentUserId,
    userLabelMap,
    onAcceptInteraction,
    onRejectInteraction,
    onCancelInteraction,
  } = useContext(IssueChatCtx);
  const [expanded, setExpanded] = useState(false);
  const hasResolvedActor = Boolean(interaction.resolvedByAgentId || interaction.resolvedByUserId);
  const actorAgentId = hasResolvedActor
    ? interaction.resolvedByAgentId ?? null
    : interaction.createdByAgentId ?? null;
  const actorUserId = hasResolvedActor
    ? interaction.resolvedByUserId ?? null
    : interaction.createdByUserId ?? null;
  const actorName = formatInteractionActorLabel({
    agentId: actorAgentId,
    userId: actorUserId,
    agentMap,
    currentUserId,
    userLabelMap,
  });
  const actorIcon = actorAgentId ? agentMap?.get(actorAgentId)?.icon : undefined;
  const isCurrentUser = Boolean(actorUserId && currentUserId && actorUserId === currentUserId);
  const detailsId = anchorId ? `${anchorId}-details` : `${interaction.id}-details`;
  const summary = buildIssueThreadInteractionSummary(interaction);

  const rowContent = (
    <div className="min-w-0 flex-1">
      <div className={cn("flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs", isCurrentUser && "justify-end")}>
        <span className="font-medium text-foreground">{actorName}</span>
        <span className="text-muted-foreground">updated this task</span>
        <a
          href={anchorId ? `#${anchorId}` : undefined}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
        >
          {timeAgo(message.createdAt)}
        </a>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className="h-auto border-border/70 bg-background/70 px-1.5 py-0.5 text-micro text-muted-foreground hover:border-border hover:text-foreground"
          aria-expanded={expanded}
          aria-controls={detailsId}
          onClick={() => setExpanded((current) => !current)}
        >
          <ChevronDown className={cn("h-3 w-3 transition-transform", expanded && "rotate-180")} />
          {expanded ? "Hide confirmation" : "Expired confirmation"}
        </Button>
      </div>
      {expanded ? (
        <p className={cn("mt-1 text-xs text-muted-foreground", isCurrentUser && "text-right")}>
          {summary}
        </p>
      ) : null}
    </div>
  );

  return (
    <div id={anchorId}>
      {isCurrentUser ? (
        <div className="flex items-start justify-end gap-2 py-1">
          {rowContent}
        </div>
      ) : (
        <div className="flex items-start gap-2.5 py-1">
          <Avatar size="sm" className="mt-0.5">
            {actorIcon ? (
              <AvatarFallback><AgentIcon icon={actorIcon} className="h-3.5 w-3.5" /></AvatarFallback>
            ) : (
              <AvatarFallback>{initialsForName(actorName)}</AvatarFallback>
            )}
          </Avatar>
          {rowContent}
        </div>
      )}
      {expanded ? (
        <div id={detailsId} className="mt-2">
          <IssueThreadInteractionCard
            interaction={interaction}
            agentMap={agentMap}
            currentUserId={currentUserId}
            userLabelMap={userLabelMap}
            onAcceptInteraction={onAcceptInteraction}
            onRejectInteraction={onRejectInteraction}
            onCancelInteraction={onCancelInteraction}
          />
        </div>
      ) : null}
    </div>
  );
}

function IssueChatSystemMessage({ message }: { message: ThreadMessage }) {
  const {
    agentMap,
    currentUserId,
    userLabelMap,
    issueStatus,
    successfulRunHandoff,
    onImageClick,
    onAcceptInteraction,
    onRejectInteraction,
    onSubmitInteractionAnswers,
    onCancelInteraction,
  } = useContext(IssueChatCtx);
  const custom = message.metadata.custom as Record<string, unknown>;
  const anchorId = typeof custom.anchorId === "string" ? custom.anchorId : undefined;
  const runId = typeof custom.runId === "string" ? custom.runId : null;
  const runAgentId = typeof custom.runAgentId === "string" ? custom.runAgentId : null;
  const runAgentName = typeof custom.runAgentName === "string" ? custom.runAgentName : null;
  const runStatus = typeof custom.runStatus === "string" ? custom.runStatus : null;
  const actorName = typeof custom.actorName === "string" ? custom.actorName : null;
  const actorType = typeof custom.actorType === "string" ? custom.actorType : null;
  const actorId = typeof custom.actorId === "string" ? custom.actorId : null;
  const statusChange = typeof custom.statusChange === "object" && custom.statusChange
    ? custom.statusChange as { from: string | null; to: string | null }
    : null;
  const assigneeChange = typeof custom.assigneeChange === "object" && custom.assigneeChange
    ? custom.assigneeChange as {
        from: IssueTimelineAssignee;
        to: IssueTimelineAssignee;
      }
    : null;
  const workspaceChange = isTimelineWorkspaceChange(custom.workspaceChange) ? custom.workspaceChange : null;
  const interaction = isIssueThreadInteraction(custom.interaction)
    ? custom.interaction
    : null;

  if (custom.kind === "system_notice") {
    return (
      <SystemNoticeCommentRow
        message={message}
        anchorId={anchorId}
        agentMap={agentMap}
        issueStatus={issueStatus}
        successfulRunHandoff={successfulRunHandoff}
        onImageClick={onImageClick}
      />
    );
  }

  if (custom.kind === "interaction" && interaction) {
    if (interaction.kind === "request_confirmation" && interaction.status === "expired") {
      return (
        <ExpiredRequestConfirmationActivity
          message={message}
          anchorId={anchorId}
          interaction={interaction}
        />
      );
    }

    return (
      <div id={anchorId}>
        <div className="py-1.5">
          <IssueThreadInteractionCard
            interaction={interaction}
            agentMap={agentMap}
            currentUserId={currentUserId}
            userLabelMap={userLabelMap}
            onAcceptInteraction={onAcceptInteraction}
            onRejectInteraction={onRejectInteraction}
            onSubmitInteractionAnswers={onSubmitInteractionAnswers}
            onCancelInteraction={onCancelInteraction}
          />
        </div>
      </div>
    );
  }

  if (custom.kind === "event" && actorName) {
    const isCurrentUser = actorType === "user" && !!currentUserId && actorId === currentUserId;
    const isAgent = actorType === "agent";
    const agentIcon = isAgent && actorId ? agentMap?.get(actorId)?.icon : undefined;

    const eventContent = (
      <div className="min-w-0 space-y-1">
        <div className={cn("flex flex-wrap items-baseline gap-x-1.5 gap-y-0.5 text-xs", isCurrentUser && "justify-end")}>
          <span className="font-medium text-foreground">{actorName}</span>
          <span className="text-muted-foreground">
            {custom.followUpRequested === true ? "requested follow-up" : "updated this task"}
          </span>
          <a
            href={anchorId ? `#${anchorId}` : undefined}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
          >
            {timeAgo(message.createdAt)}
          </a>
        </div>

        {statusChange ? (
          <div className={cn("flex flex-wrap items-center gap-1.5 text-xs", isCurrentUser && "justify-end")}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Status
            </span>
            <span className="text-muted-foreground">{humanizeValue(statusChange.from)}</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-foreground">{humanizeValue(statusChange.to)}</span>
          </div>
        ) : null}

        {assigneeChange ? (
          <div className={cn("flex flex-wrap items-center gap-1.5 text-xs", isCurrentUser && "justify-end")}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Assignee
            </span>
            <span className="text-muted-foreground">
              {formatTimelineAssigneeLabel(assigneeChange.from, agentMap, currentUserId, userLabelMap)}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {formatTimelineAssigneeLabel(assigneeChange.to, agentMap, currentUserId, userLabelMap)}
            </span>
          </div>
        ) : null}

        {workspaceChange ? (
          <div className={cn("flex flex-wrap items-center gap-1.5 text-xs", isCurrentUser && "justify-end")}>
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Workspace
            </span>
            <span className="text-muted-foreground">
              {formatTimelineWorkspaceLabel(workspaceChange.from)}
            </span>
            <ArrowRight className="h-3 w-3 text-muted-foreground" />
            <span className="font-medium text-foreground">
              {formatTimelineWorkspaceLabel(workspaceChange.to)}
            </span>
          </div>
        ) : null}
      </div>
    );

    if (isCurrentUser) {
      return (
        <div id={anchorId}>
          <div className="flex items-start justify-end gap-2 py-1">
            {eventContent}
          </div>
        </div>
      );
    }

    return (
      <div id={anchorId}>
        <div className="flex items-start gap-2.5 py-1">
          <Avatar size="sm" className="mt-0.5">
            {agentIcon ? (
              <AvatarFallback><AgentIcon icon={agentIcon} className="h-3.5 w-3.5" /></AvatarFallback>
            ) : (
              <AvatarFallback>{initialsForName(actorName)}</AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1">
            {eventContent}
          </div>
        </div>
      </div>
    );
  }

  const displayedRunAgentName = runAgentName ?? (runAgentId ? agentMap?.get(runAgentId)?.name ?? runAgentId.slice(0, 8) : null);
  const runAgentIcon = runAgentId ? agentMap?.get(runAgentId)?.icon : undefined;
  if (custom.kind === "run" && runId && runAgentId && displayedRunAgentName && runStatus) {
    return (
      <div id={anchorId}>
        <div className="flex items-center gap-2.5 py-1">
          <Avatar size="sm">
            {runAgentIcon ? (
              <AvatarFallback><AgentIcon icon={runAgentIcon} className="h-3.5 w-3.5" /></AvatarFallback>
            ) : (
              <AvatarFallback>{initialsForName(displayedRunAgentName)}</AvatarFallback>
            )}
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs">
              <Link to={`/agents/${runAgentId}`} className="font-medium text-foreground transition-colors hover:underline">
                {displayedRunAgentName}
              </Link>
              <span className="text-muted-foreground">run</span>
              <Link
                to={`/agents/${runAgentId}/runs/${runId}`}
                className="inline-flex items-center rounded-md border border-border bg-accent/40 px-1.5 py-0.5 font-mono text-micro text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
              >
                {runId.slice(0, 8)}
              </Link>
              <span className={cn("font-medium", runStatusClass(runStatus))}>
                {formatRunStatusLabel(runStatus)}
              </span>
              <a
                href={anchorId ? `#${anchorId}` : undefined}
                className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
              >
                {timeAgo(message.createdAt)}
              </a>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface IssueChatMessageRowProps {
  message: ThreadMessage;
  feedbackVoteByTargetId: ReadonlyMap<string, FeedbackVoteValue>;
  activeRunIds: ReadonlySet<string>;
  stoppingRunId?: string | null;
  interruptingQueuedRunId?: string | null;
}

const IssueChatMessageRow = memo(function IssueChatMessageRow({
  message,
  feedbackVoteByTargetId,
  activeRunIds,
  stoppingRunId,
  interruptingQueuedRunId,
}: IssueChatMessageRowProps) {
  const kind = issueChatMessageKind(message);
  const activeVote = issueChatMessageActiveVote(message, feedbackVoteByTargetId);
  const isRunActive = issueChatMessageRunIsActive(message, activeRunIds);
  const isStoppingRun = issueChatMessageRunIsStopping(message, stoppingRunId);
  const isInterruptingQueuedRun = issueChatMessageQueuedRunIsInterrupting(message, interruptingQueuedRunId);
  const renderedMessage = message.role === "user"
    ? (
      <IssueChatUserMessage
        message={message}
        isInterruptingQueuedRun={isInterruptingQueuedRun}
      />
    )
    : message.role === "assistant"
      ? (
        <IssueChatAssistantMessage
          message={message}
          activeVote={activeVote}
          isRunActive={isRunActive}
          isStoppingRun={isStoppingRun}
        />
      )
      : <IssueChatSystemMessage message={message} />;

  return (
    <div
      data-testid="issue-chat-message-row"
      data-message-role={message.role}
      data-message-kind={kind}
    >
      {renderedMessage}
    </div>
  );
}, areIssueChatMessageRowPropsEqual);

function areIssueChatMessageRowPropsEqual(
  prev: IssueChatMessageRowProps,
  next: IssueChatMessageRowProps,
) {
  if (prev.message !== next.message) return false;
  if (issueChatMessageActiveVote(prev.message, prev.feedbackVoteByTargetId) !== issueChatMessageActiveVote(next.message, next.feedbackVoteByTargetId)) return false;
  if (issueChatMessageRunIsActive(prev.message, prev.activeRunIds) !== issueChatMessageRunIsActive(next.message, next.activeRunIds)) return false;
  if (issueChatMessageRunIsStopping(prev.message, prev.stoppingRunId) !== issueChatMessageRunIsStopping(next.message, next.stoppingRunId)) return false;
  if (issueChatMessageQueuedRunIsInterrupting(prev.message, prev.interruptingQueuedRunId) !== issueChatMessageQueuedRunIsInterrupting(next.message, next.interruptingQueuedRunId)) return false;
  return true;
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
  const displayLiveRuns = useMemo(() => {
    const deduped = new Map<string, LiveRunForIssue>();
    for (const run of liveRuns) {
      deduped.set(run.id, run);
    }
    if (activeRun) {
      deduped.set(activeRun.id, {
        id: activeRun.id,
        status: activeRun.status,
        invocationSource: activeRun.invocationSource,
        triggerDetail: activeRun.triggerDetail,
        startedAt: toIsoString(activeRun.startedAt),
        finishedAt: toIsoString(activeRun.finishedAt),
        createdAt: toIsoString(activeRun.createdAt) ?? new Date().toISOString(),
        agentId: activeRun.agentId,
        agentName: activeRun.agentName,
        adapterType: activeRun.adapterType,
        logBytes: activeRun.logBytes,
        lastOutputBytes: activeRun.lastOutputBytes,
      });
    }
    return [...deduped.values()].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [activeRun, liveRuns]);
  const transcriptRuns = useMemo(() => {
    return resolveIssueChatTranscriptRuns({
      linkedRuns,
      liveRuns: displayLiveRuns,
      activeRun,
    });
  }, [activeRun, displayLiveRuns, linkedRuns]);
  const activeRunIds = useMemo(() => {
    const ids = new Set<string>();
    for (const run of displayLiveRuns) {
      if (run.status === "queued" || run.status === "running") {
        ids.add(run.id);
      }
    }
    return ids;
  }, [displayLiveRuns]);
  const { transcriptByRun, hasOutputForRun } = useLiveRunTranscripts({
    runs: enableLiveTranscriptPolling ? transcriptRuns : [],
    companyId,
  });
  const resolvedTranscriptByRun = transcriptsByRunId ?? transcriptByRun;
  const resolvedHasOutputForRun = hasOutputForRunOverride ?? hasOutputForRun;
  const rawMessages = useMemo(
    () =>
      buildIssueChatMessages({
        comments,
        interactions,
        timelineEvents,
        linkedRuns,
        liveRuns,
        activeRun,
        transcriptsByRunId: resolvedTranscriptByRun,
        hasOutputForRun: resolvedHasOutputForRun,
        includeSucceededRunsWithoutOutput,
        companyId,
        projectId,
        agentMap,
        currentUserId,
        userLabelMap,
      }),
    [
      comments,
      interactions,
      timelineEvents,
      linkedRuns,
      liveRuns,
      activeRun,
      resolvedTranscriptByRun,
      resolvedHasOutputForRun,
      includeSucceededRunsWithoutOutput,
      companyId,
      projectId,
      agentMap,
      currentUserId,
      userLabelMap,
    ],
  );
  const stableMessagesRef = useRef<readonly ThreadMessage[]>([]);
  const stableMessageCacheRef = useRef<Map<string, StableThreadMessageCacheEntry>>(new Map());
  const messages = useMemo(() => {
    const stabilized = stabilizeThreadMessages(
      rawMessages,
      stableMessagesRef.current,
      stableMessageCacheRef.current,
    );
    stableMessagesRef.current = stabilized.messages;
    stableMessageCacheRef.current = stabilized.cache;
    return stabilized.messages;
  }, [rawMessages]);

  const isRunning = displayLiveRuns.some((run) => run.status === "queued" || run.status === "running");
  const unresolvedBlockers = useMemo(
    () => blockedBy.filter((blocker) => blocker.status !== "done" && blocker.status !== "cancelled"),
    [blockedBy],
  );
  const assignedAgent = useMemo(() => {
    if (!currentAssigneeValue.startsWith("agent:")) return null;
    const assigneeAgentId = currentAssigneeValue.slice("agent:".length);
    return agentMap?.get(assigneeAgentId) ?? null;
  }, [agentMap, currentAssigneeValue]);
  const feedbackVoteByTargetId = useMemo(() => {
    const map = new Map<string, FeedbackVoteValue>();
    for (const feedbackVote of feedbackVotes) {
      if (feedbackVote.targetType !== "issue_comment") continue;
      map.set(feedbackVote.targetId, feedbackVote.vote);
    }
    return map;
  }, [feedbackVotes]);
  const useVirtualizedThread = messages.length >= VIRTUALIZED_THREAD_ROW_THRESHOLD;
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

  const stableOnVote = useStableEvent(onVote);
  const stableOnStopRun = useStableEvent(onStopRun);
  const stableOnInterruptQueued = useStableEvent(onInterruptQueued);
  const stableOnCancelQueued = useStableEvent(onCancelQueued);
  const stableOnImageClick = useStableEvent(onImageClick);
  const stableOnAcceptInteraction = useStableEvent(onAcceptInteraction);
  const stableOnRejectInteraction = useStableEvent(onRejectInteraction);
  const stableOnSubmitInteractionAnswers = useStableEvent(onSubmitInteractionAnswers);
  const stableOnCancelInteraction = useStableEvent(onCancelInteraction);

  const chatCtx = useMemo<IssueChatMessageContext>(
    () => ({
      feedbackDataSharingPreference,
      feedbackTermsUrl,
      agentMap,
      currentUserId,
      userLabelMap,
      userProfileMap,
      onVote: stableOnVote,
      onStopRun: stableOnStopRun,
      stopRunLabel,
      stoppingRunLabel,
      stopRunVariant,
      onInterruptQueued: stableOnInterruptQueued,
      onCancelQueued: stableOnCancelQueued,
      onImageClick: stableOnImageClick,
      onAcceptInteraction: stableOnAcceptInteraction,
      onRejectInteraction: stableOnRejectInteraction,
      onSubmitInteractionAnswers: stableOnSubmitInteractionAnswers,
      onCancelInteraction: stableOnCancelInteraction,
      issueStatus,
      successfulRunHandoff,
    }),
    [
      feedbackDataSharingPreference,
      feedbackTermsUrl,
      agentMap,
      currentUserId,
      userLabelMap,
      userProfileMap,
      stableOnVote,
      stableOnStopRun,
      stopRunLabel,
      stoppingRunLabel,
      stopRunVariant,
      stableOnInterruptQueued,
      stableOnCancelQueued,
      stableOnImageClick,
      stableOnAcceptInteraction,
      stableOnRejectInteraction,
      stableOnSubmitInteractionAnswers,
      stableOnCancelInteraction,
      issueStatus,
      successfulRunHandoff,
    ],
  );

  const resolvedShowJumpToLatest = showJumpToLatest ?? variant === "full";
  const resolvedEmptyMessage = emptyMessage
    ?? (variant === "embedded"
      ? "No run output yet."
      : "This issue conversation is empty. Start with a message below.");
  const previousErrorBoundaryMessagesRef = useRef<readonly ThreadMessage[] | null>(null);
  const errorBoundaryResetVersionRef = useRef(0);
  if (previousErrorBoundaryMessagesRef.current !== messages) {
    previousErrorBoundaryMessagesRef.current = messages;
    errorBoundaryResetVersionRef.current += 1;
  }
  const errorBoundaryResetKey = String(errorBoundaryResetVersionRef.current);

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
          <div data-testid="thread-root">
            <div
              data-testid="thread-viewport"
              className={variant === "embedded" ? "space-y-3" : "space-y-4"}
            >
              {messages.length === 0 ? (
                <div className={cn(
                  "text-center text-sm text-muted-foreground",
                  variant === "embedded"
                    ? "rounded-xl border border-dashed border-border/70 bg-background/60 px-4 py-6"
                    : "rounded-2xl border border-dashed border-border bg-card px-6 py-10",
                )}>
                  {resolvedEmptyMessage}
                </div>
              ) : messages.length >= VIRTUALIZED_THREAD_ROW_THRESHOLD ? (
                <VirtualizedIssueChatThreadList
                  ref={virtualizedThreadRef}
                  messages={messages}
                  variant={variant}
                  renderMessageRow={(message) => (
                    <IssueChatMessageRow
                      message={message}
                      feedbackVoteByTargetId={feedbackVoteByTargetId}
                      activeRunIds={activeRunIds}
                      stoppingRunId={stoppingRunId}
                      interruptingQueuedRunId={interruptingQueuedRunId}
                    />
                  )}
                />
              ) : (
                // Keep transcript rendering independent from assistant-ui's
                // index-scoped message providers; live transcripts can shrink
                // or regroup while the runtime still holds stale indices.
                messages.map((message) => (
                  <IssueChatMessageRow
                    key={message.id}
                    message={message}
                    feedbackVoteByTargetId={feedbackVoteByTargetId}
                    activeRunIds={activeRunIds}
                    stoppingRunId={stoppingRunId}
                    interruptingQueuedRunId={interruptingQueuedRunId}
                  />
              ))
            )}
              {showComposer ? (
                <div data-testid="issue-chat-thread-notices" className="space-y-2">
                  <IssueBlockedNotice
                    issueStatus={issueStatus}
                    blockers={unresolvedBlockers}
                    blockerAttention={blockerAttention}
                    successfulRunHandoff={successfulRunHandoff}
                    agentName={
                      successfulRunHandoff?.assigneeAgentId
                        ? agentMap?.get(successfulRunHandoff.assigneeAgentId)?.name ?? null
                        : null
                    }
                  />
                  <IssueAssigneePausedNotice agent={assignedAgent} />
                </div>
              ) : null}
              <div ref={bottomAnchorRef} />
              {showComposer ? (
                <div
                  aria-hidden
                  data-testid="issue-chat-bottom-spacer"
                  // Composer anchoring depends on the measured dock height.
                  style={{ height: bottomSpacerHeight }}
                />
              ) : null}
            </div>
          </div>
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
