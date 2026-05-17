import type { ThreadMessage } from "@assistant-ui/react";
import type { FeedbackVoteValue } from "@paperclipai/shared";
import { useContext, useState } from "react";
import { Link } from "@/lib/router";
import { Check, ChevronDown, Copy, Loader2, MoreHorizontal, PauseCircle, Search, Square } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { AgentIcon } from "../AgentIconPicker";
import { cn, formatDateTime } from "../../lib/utils";
import { IssueChatFeedbackButtons } from "./FeedbackButtons";
import { commentDateLabel } from "./IssueChatErrorBoundary";
import {
  getThreadMessageCopyText,
  IssueChatAssistantParts,
} from "./IssueChatMessageContent";
import { IssueChatCtx } from "./IssueChatMessageContext";
import { initialsForName } from "./SystemMessageHelpers";

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

export function IssueChatAssistantMessage({
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
  // browser never paints the un-folded intermediate state.
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
