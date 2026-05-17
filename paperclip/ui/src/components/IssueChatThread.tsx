import {
  AssistantRuntimeProvider,
} from "@assistant-ui/react";
import type {
  TextMessagePart,
  ThreadMessage,
} from "@assistant-ui/react";
import {
  createContext,
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
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MarkdownBody } from "./MarkdownBody";
import type { MentionOption } from "./MarkdownEditor";
import { Identity } from "./Identity";
import type { InlineEntityOption } from "./InlineEntitySelector";
import { IssueThreadInteractionCard } from "./IssueThreadInteractionCard";
import { AgentIcon } from "./AgentIconPicker";
import type { CompanyUserProfile } from "../lib/company-members";
import { timeAgo } from "../lib/timeAgo";
import {
  isSuccessfulRunHandoffComment,
  isSuccessfulRunHandoffEscalationComment,
} from "../lib/successful-run-handoff";
import { cn, formatDateTime } from "../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AlertTriangle, ArrowRight, Check, ChevronDown, Copy, Loader2, MoreHorizontal, PauseCircle, Search, Square } from "lucide-react";
import { IssueBlockedNotice } from "./IssueBlockedNotice";
import { IssueChatChainOfThought, type IssueChatCoTPart } from "./issue-chat/ChainOfThoughtParts";
import { toIsoString } from "./issue-chat/ComposerHelpers";
import {
  IssueChatComposer,
  type CommentReassignment,
  type IssueChatComposerHandle,
} from "./issue-chat/IssueChatComposer";
import { IssueChatFeedbackButtons } from "./issue-chat/FeedbackButtons";
import {
  IssueChatErrorBoundary,
  commentDateLabel,
} from "./issue-chat/IssueChatErrorBoundary";
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

export type { IssueChatComposerHandle };

interface IssueChatMessageContext {
  feedbackDataSharingPreference: FeedbackDataSharingPreference;
  feedbackTermsUrl: string | null;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
  userProfileMap?: ReadonlyMap<string, CompanyUserProfile> | null;
  onVote?: (
    commentId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  onStopRun?: (runId: string) => Promise<void>;
  stopRunLabel?: string;
  stoppingRunLabel?: string;
  stopRunVariant?: "stop" | "pause";
  onInterruptQueued?: (runId: string) => Promise<void>;
  onCancelQueued?: (commentId: string) => void;
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
  issueStatus?: string;
  successfulRunHandoff?: SuccessfulRunHandoffState | null;
}

const IssueChatCtx = createContext<IssueChatMessageContext>({
  feedbackDataSharingPreference: "prompt",
  feedbackTermsUrl: null,
  issueStatus: undefined,
  successfulRunHandoff: null,
});

export function resolveAssistantMessageFoldedState(args: {
  messageId: string;
  currentFolded: boolean;
  isFoldable: boolean;
  previousMessageId: string | null;
  previousIsFoldable: boolean;
}) {
  const {
    messageId,
    currentFolded,
    isFoldable,
    previousMessageId,
    previousIsFoldable,
  } = args;

  if (messageId !== previousMessageId) return isFoldable;
  if (!isFoldable) return false;
  if (!previousIsFoldable) return true;
  return currentFolded;
}

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

function IssueAssigneePausedNotice({ agent }: { agent: Agent | null }) {
  if (!agent || agent.status !== "paused") return null;

  const pauseDetail =
    agent.pauseReason === "budget"
      ? "It was paused by a budget hard stop."
      : agent.pauseReason === "system"
        ? "It was paused by the system."
        : "It was paused manually.";

  return (
    <div className="mb-3 rounded-md border border-orange-300/70 bg-orange-50/90 px-3 py-2.5 text-sm text-orange-950 shadow-sm dark:border-orange-500/40 dark:bg-orange-500/10 dark:text-orange-100">
      <div className="flex items-start gap-2">
        <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-orange-600 dark:text-orange-300" />
        <p className="min-w-0 leading-5">
          <span className="font-medium">{agent.name}</span> is paused. New runs will not start until the agent is resumed. {pauseDetail}
        </p>
      </div>
    </div>
  );
}

const IssueChatTextPart = memo(function IssueChatTextPart({ text, recessed }: { text: string; recessed?: boolean }) {
  const { onImageClick } = useContext(IssueChatCtx);
  if (isSuccessfulRunHandoffComment(text)) {
    return <SuccessfulRunHandoffCommentCallout text={text} recessed={recessed} onImageClick={onImageClick} />;
  }
  return (
    <MarkdownBody
      className={cn("text-sm leading-6", recessed && "opacity-60")}
      softBreaks
      onImageClick={onImageClick}
    >
      {text}
    </MarkdownBody>
  );
});

export function SuccessfulRunHandoffCommentCallout({
  text,
  recessed,
  onImageClick,
}: {
  text: string;
  recessed?: boolean;
  onImageClick?: (src: string) => void;
}) {
  const escalated = isSuccessfulRunHandoffEscalationComment(text);
  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2.5 text-sm shadow-sm",
        escalated
          ? "border-red-500/35 bg-red-500/10 text-red-950 dark:text-red-100"
          : "border-amber-300/70 bg-amber-50/90 text-amber-950 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100",
        recessed && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <AlertTriangle
          className={cn(
            "mt-1 h-4 w-4 shrink-0",
            escalated ? "text-red-600 dark:text-red-300" : "text-amber-600 dark:text-amber-300",
          )}
        />
        <MarkdownBody className="min-w-0 text-sm leading-6" softBreaks onImageClick={onImageClick}>
          {text}
        </MarkdownBody>
      </div>
    </div>
  );
}

export function resolveIssueChatHumanAuthor(args: {
  authorName?: string | null;
  authorUserId?: string | null;
  currentUserId?: string | null;
  userProfileMap?: ReadonlyMap<string, CompanyUserProfile> | null;
}) {
  const { authorName, authorUserId, currentUserId, userProfileMap } = args;
  const profile = authorUserId ? userProfileMap?.get(authorUserId) ?? null : null;
  const isCurrentUser = Boolean(authorUserId && currentUserId && authorUserId === currentUserId);
  const resolvedAuthorName = profile?.label?.trim()
    || authorName?.trim()
    || (authorUserId === "local-board" ? "Board" : (isCurrentUser ? "You" : "User"));

  return {
    isCurrentUser,
    authorName: resolvedAuthorName,
    avatarUrl: profile?.image ?? null,
  };
}

function getThreadMessageCopyText(message: ThreadMessage) {
  return message.content
    .filter((part): part is TextMessagePart => part.type === "text")
    .map((part) => part.text)
    .join("\n\n");
}

const IssueChatTextParts = memo(function IssueChatTextParts({
  message,
  recessed = false,
}: {
  message: ThreadMessage;
  recessed?: boolean;
}) {
  return (
    <>
      {message.content
        .filter((part): part is TextMessagePart => part.type === "text")
        .map((part, index) => (
          <IssueChatTextPart
            key={`${message.id}:text:${index}`}
            text={part.text}
            recessed={recessed}
          />
        ))}
    </>
  );
});

function groupAssistantParts(
  content: readonly ThreadMessage["content"][number][],
): Array<
  | { type: "text"; part: TextMessagePart; index: number }
  | { type: "cot"; parts: IssueChatCoTPart[]; startIndex: number }
> {
  const groups: Array<
    | { type: "text"; part: TextMessagePart; index: number }
    | { type: "cot"; parts: IssueChatCoTPart[]; startIndex: number }
  > = [];
  let pendingCoT: IssueChatCoTPart[] = [];
  let pendingStartIndex = -1;

  const flushCoT = () => {
    if (pendingCoT.length === 0) return;
    groups.push({ type: "cot", parts: pendingCoT, startIndex: pendingStartIndex });
    pendingCoT = [];
    pendingStartIndex = -1;
  };

  content.forEach((part, index) => {
    if (part.type === "reasoning" || part.type === "tool-call") {
      if (pendingCoT.length === 0) pendingStartIndex = index;
      pendingCoT.push(part);
      return;
    }
    flushCoT();
    if (part.type === "text") {
      groups.push({ type: "text", part, index });
    }
  });
  flushCoT();

  return groups;
}

const IssueChatAssistantParts = memo(function IssueChatAssistantParts({
  message,
  hasCoT,
}: {
  message: ThreadMessage;
  hasCoT: boolean;
}) {
  const { agentMap } = useContext(IssueChatCtx);
  const groupedParts = useMemo(() => groupAssistantParts(message.content), [message.content]);
  return (
    <>
      {groupedParts.map((group) => {
        if (group.type === "text") {
          return (
            <IssueChatTextPart
              key={`${message.id}:text:${group.index}`}
              text={group.part.text}
              recessed={hasCoT}
            />
          );
        }
        return (
          <IssueChatChainOfThought
            key={`${message.id}:cot:${group.startIndex}`}
            message={message}
            cotParts={group.parts}
            agentMap={agentMap}
          />
        );
      })}
    </>
  );
});

function IssueChatUserMessage({
  message,
  isInterruptingQueuedRun,
}: {
  message: ThreadMessage;
  isInterruptingQueuedRun: boolean;
}) {
  const {
    onInterruptQueued,
    onCancelQueued,
    currentUserId,
    userProfileMap,
  } = useContext(IssueChatCtx);
  const custom = message.metadata.custom as Record<string, unknown>;
  const anchorId = typeof custom.anchorId === "string" ? custom.anchorId : undefined;
  const commentId = typeof custom.commentId === "string" ? custom.commentId : message.id;
  const authorName = typeof custom.authorName === "string" ? custom.authorName : null;
  const authorUserId = typeof custom.authorUserId === "string" ? custom.authorUserId : null;
  const queued = custom.queueState === "queued" || custom.clientStatus === "queued";
  const followUpRequested = custom.followUpRequested === true;
  const queueReason = typeof custom.queueReason === "string" ? custom.queueReason : null;
  const queueBadgeLabel = queueReason === "hold" ? "\u23f8 Deferred wake" : "Queued";
  const pending = custom.clientStatus === "pending";
  const queueTargetRunId = typeof custom.queueTargetRunId === "string" ? custom.queueTargetRunId : null;
  const [copied, setCopied] = useState(false);
  const {
    isCurrentUser,
    authorName: resolvedAuthorName,
    avatarUrl,
  } = resolveIssueChatHumanAuthor({
    authorName,
    authorUserId,
    currentUserId,
    userProfileMap,
  });
  const authorAvatar = (
    <Avatar size="sm" className="shrink-0">
      {avatarUrl ? <AvatarImage src={avatarUrl} alt={resolvedAuthorName} /> : null}
      <AvatarFallback>{initialsForName(resolvedAuthorName)}</AvatarFallback>
    </Avatar>
  );
  const messageBody = (
    <div className={cn("flex min-w-0 max-w-3xl flex-col", isCurrentUser && "items-end")}>
      <div className={cn("mb-1 flex items-center gap-2 px-1", isCurrentUser ? "justify-end" : "justify-start")}>
        <span className="text-sm font-medium text-foreground">{resolvedAuthorName}</span>
        {followUpRequested ? (
          <Badge variant="outline" className="text-micro uppercase tracking-widest">
            Follow-up
          </Badge>
        ) : null}
      </div>
      <div
        className={cn(
          "min-w-0 max-w-full overflow-hidden break-all rounded-2xl px-4 py-2.5",
          queued
            ? "bg-amber-50/80 dark:bg-amber-500/10"
            : "bg-muted",
          pending && "opacity-80",
        )}
      >
        {queued ? (
          <div className="mb-1.5 flex items-center gap-2">
            <span className="inline-flex items-center rounded-full border border-amber-400/60 bg-amber-100/70 px-2 py-0.5 text-micro font-medium uppercase tracking-widest text-amber-800 dark:border-amber-400/40 dark:bg-amber-500/20 dark:text-amber-200">
              {queueBadgeLabel}
            </span>
            {queueTargetRunId && onInterruptQueued ? (
              <Button
                size="sm"
                variant="outline"
                className="h-6 border-red-300 px-2 text-micro text-red-700 hover:bg-red-50 hover:text-red-800 dark:border-red-500/40 dark:text-red-300 dark:hover:bg-red-500/10"
                disabled={isInterruptingQueuedRun}
                onClick={() => void onInterruptQueued(queueTargetRunId)}
              >
                {isInterruptingQueuedRun ? "Interrupting..." : "Interrupt"}
              </Button>
            ) : null}
            {onCancelQueued ? (
              <Button
                size="sm"
                variant="outline"
                className="h-6 border-amber-300 px-2 text-micro text-amber-900 hover:bg-amber-100/80 hover:text-amber-950 dark:border-amber-500/40 dark:text-amber-100 dark:hover:bg-amber-500/10"
                onClick={() => onCancelQueued(commentId)}
              >
                Cancel
              </Button>
            ) : null}
          </div>
        ) : null}
        <div className="min-w-0 max-w-full space-y-3">
          <IssueChatTextParts message={message} />
        </div>
      </div>

      {pending ? (
        <div className={cn("mt-1 flex px-1 text-micro text-muted-foreground", isCurrentUser ? "justify-end" : "justify-start")}>
          Sending...
        </div>
      ) : (
        <div
          className={cn(
            "mt-1 flex items-center gap-1.5 px-1 opacity-0 transition-opacity group-hover:opacity-100",
            isCurrentUser ? "justify-end" : "justify-start",
          )}
        >
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={anchorId ? `#${anchorId}` : undefined}
                className="text-micro text-muted-foreground hover:text-foreground hover:underline"
              >
                {message.createdAt ? commentDateLabel(message.createdAt) : ""}
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {message.createdAt ? formatDateTime(message.createdAt) : ""}
            </TooltipContent>
          </Tooltip>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            title="Copy message"
            aria-label="Copy message"
            onClick={() => {
              const text = message.content
                .filter((p): p is { type: "text"; text: string } => p.type === "text")
                .map((p) => p.text)
                .join("\n\n");
              void navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <div id={anchorId}>
      <div className={cn("group flex items-start gap-2.5", isCurrentUser && "justify-end")}>
        {isCurrentUser ? (
          <>
            {messageBody}
            {authorAvatar}
          </>
        ) : (
          <>
            {authorAvatar}
            {messageBody}
          </>
        )}
      </div>
    </div>
  );
}

function IssueChatAssistantMessage({
  message,
  activeVote,
  isRunActive,
  isStoppingRun,
}: {
  message: ThreadMessage;
  activeVote: FeedbackVoteValue | null;
  isRunActive: boolean;
  isStoppingRun: boolean;
}) {
  const {
    feedbackDataSharingPreference,
    feedbackTermsUrl,
    onVote,
    agentMap,
    onStopRun,
    stopRunLabel = "Stop run",
    stoppingRunLabel = "Stopping...",
    stopRunVariant = "stop",
  } = useContext(IssueChatCtx);
  const custom = message.metadata.custom as Record<string, unknown>;
  const anchorId = typeof custom.anchorId === "string" ? custom.anchorId : undefined;
  const authorName = typeof custom.authorName === "string"
    ? custom.authorName
    : typeof custom.runAgentName === "string"
      ? custom.runAgentName
      : "Agent";
  const authorAgentId = typeof custom.authorAgentId === "string" ? custom.authorAgentId : null;
  const runId = typeof custom.runId === "string" ? custom.runId : null;
  const runAgentId = typeof custom.runAgentId === "string" ? custom.runAgentId : null;
  const runStatus = typeof custom.runStatus === "string" ? custom.runStatus : null;
  const agentId = authorAgentId ?? runAgentId;
  const agentIcon = agentId ? agentMap?.get(agentId)?.icon : undefined;
  const commentId = typeof custom.commentId === "string" ? custom.commentId : null;
  const notices = Array.isArray(custom.notices)
    ? custom.notices.filter((notice): notice is string => typeof notice === "string" && notice.length > 0)
    : [];
  const waitingText = typeof custom.waitingText === "string" ? custom.waitingText : "";
  const isRunning = message.role === "assistant" && message.status?.type === "running";
  const runHref = runId && runAgentId ? `/agents/${runAgentId}/runs/${runId}` : null;
  const canStopRun = Boolean(runId) && (isRunActive || runStatus === "queued" || runStatus === "running");
  const chainOfThoughtLabel = typeof custom.chainOfThoughtLabel === "string" ? custom.chainOfThoughtLabel : null;
  const hasCoT = message.content.some((p) => p.type === "reasoning" || p.type === "tool-call");
  const isFoldable = !isRunning && !!chainOfThoughtLabel;
  const [folded, setFolded] = useState(isFoldable);
  const [prevFoldKey, setPrevFoldKey] = useState({ messageId: message.id, isFoldable });
  const [copied, setCopied] = useState(false);
  const copyText = getThreadMessageCopyText(message);

  // Derive fold state synchronously during render (not in useEffect) so the
  // browser never paints the un-folded intermediate state — prevents the
  // visible "jump" when loading a page with already-folded work sections.
  if (message.id !== prevFoldKey.messageId || isFoldable !== prevFoldKey.isFoldable) {
    const nextFolded = resolveAssistantMessageFoldedState({
      messageId: message.id,
      currentFolded: folded,
      isFoldable,
      previousMessageId: prevFoldKey.messageId,
      previousIsFoldable: prevFoldKey.isFoldable,
    });
    setPrevFoldKey({ messageId: message.id, isFoldable });
    if (nextFolded !== folded) {
      setFolded(nextFolded);
    }
  }

  const handleVote = async (
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => {
    if (!commentId || !onVote) return;
    await onVote(commentId, vote, options);
  };

  const followUpRequested = custom.followUpRequested === true;

  return (
    <div id={anchorId}>
      <div className="flex items-start gap-2.5 py-1.5">
        <Avatar size="sm" className="shrink-0">
          {agentIcon ? (
            <AvatarFallback><AgentIcon icon={agentIcon} className="h-3.5 w-3.5" /></AvatarFallback>
          ) : (
            <AvatarFallback>{initialsForName(authorName)}</AvatarFallback>
          )}
        </Avatar>

        <div className="min-w-0 flex-1">
          {isFoldable ? (
            <Button
              type="button"
              variant="ghost"
              className="group h-auto w-full justify-start gap-2 px-0 py-0.5 text-left hover:bg-transparent"
              onClick={() => setFolded((v) => !v)}
            >
              <span className="text-sm font-medium text-foreground">{authorName}</span>
              <span className="text-xs text-muted-foreground/60">{chainOfThoughtLabel?.toLowerCase()}</span>
              <span className="ml-auto flex items-center gap-1.5">
                {message.createdAt ? (
                  <span className="text-micro text-muted-foreground/50">
                    {commentDateLabel(message.createdAt)}
                  </span>
                ) : null}
                <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/40 transition-transform", !folded && "rotate-180")} />
              </span>
            </Button>
          ) : (
            <div className="mb-1.5 flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">{authorName}</span>
              {followUpRequested ? (
                <Badge variant="outline" className="text-micro uppercase tracking-widest">
                  Follow-up
                </Badge>
              ) : null}
              {isRunning ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-cyan-400/40 bg-cyan-500/10 px-2 py-0.5 text-micro font-medium uppercase tracking-widest text-cyan-700 dark:text-cyan-200">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Running
                </span>
              ) : null}
            </div>
          )}

          {!folded ? (
            <>
              <div className="space-y-3">
                <IssueChatAssistantParts message={message} hasCoT={hasCoT} />
                {message.content.length === 0 && waitingText ? (
                  <div className="flex items-center gap-2.5 rounded-lg px-1 py-2">
                    <span className="inline-flex items-center gap-2 text-sm font-medium text-foreground/80">
                      {agentIcon ? (
                        <AgentIcon icon={agentIcon} className="h-4 w-4 shrink-0" />
                      ) : (
                        <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                      )}
                      <span className="shimmer-text">{waitingText}</span>
                    </span>
                  </div>
                ) : null}
                {notices.length > 0 ? (
                  <div className="space-y-2">
                    {notices.map((notice, index) => (
                      <div
                        key={`${message.id}:notice:${index}`}
                        className="rounded-sm border border-border/60 bg-accent/20 px-3 py-2 text-sm text-muted-foreground"
                      >
                        {notice}
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>

              <div className="mt-2 flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="h-7 w-7 text-muted-foreground hover:text-foreground"
                  title="Copy message"
                  aria-label="Copy message"
                  onClick={() => {
                    void navigator.clipboard.writeText(copyText).then(() => {
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    });
                  }}
                >
                  {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                {commentId && onVote ? (
                  <IssueChatFeedbackButtons
                    activeVote={activeVote}
                    sharingPreference={feedbackDataSharingPreference}
                    termsUrl={feedbackTermsUrl ?? null}
                    onVote={handleVote}
                  />
                ) : null}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <a
                      href={anchorId ? `#${anchorId}` : undefined}
                      className="text-micro text-muted-foreground hover:text-foreground hover:underline"
                    >
                      {message.createdAt ? commentDateLabel(message.createdAt) : ""}
                    </a>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" className="text-xs">
                    {message.createdAt ? formatDateTime(message.createdAt) : ""}
                  </TooltipContent>
                </Tooltip>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="text-muted-foreground hover:text-foreground"
                      title="More actions"
                      aria-label="More actions"
                    >
                      <MoreHorizontal className="h-3.5 w-3.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => {
                        void navigator.clipboard.writeText(copyText);
                      }}
                    >
                      <Copy className="mr-2 h-3.5 w-3.5" />
                      Copy message
                    </DropdownMenuItem>
                    {canStopRun && onStopRun && runId ? (
                      <DropdownMenuItem
                        disabled={isStoppingRun}
                        className={cn(
                          stopRunVariant === "pause"
                            ? "text-amber-700 focus:text-amber-800 dark:text-amber-300 dark:focus:text-amber-200"
                            : "text-red-700 focus:text-red-800 dark:text-red-300 dark:focus:text-red-200",
                        )}
                        onSelect={() => {
                          void onStopRun(runId);
                        }}
                      >
                        {stopRunVariant === "pause" ? (
                          <PauseCircle className="mr-2 h-3.5 w-3.5" />
                        ) : (
                          <Square className="mr-2 h-3.5 w-3.5 fill-current" />
                        )}
                        {isStoppingRun ? stoppingRunLabel : stopRunLabel}
                      </DropdownMenuItem>
                    ) : null}
                    {runHref ? (
                      <DropdownMenuItem asChild>
                        <Link to={runHref} target="_blank" rel="noreferrer noopener">
                          <Search className="mr-2 h-3.5 w-3.5" />
                          View run
                        </Link>
                      </DropdownMenuItem>
                    ) : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
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
