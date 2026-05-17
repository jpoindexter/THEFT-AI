import type { ThreadMessage } from "@assistant-ui/react";
import type {
  Agent,
  FeedbackVoteValue,
  IssueBlockerAttention,
  IssueRelationIssueSummary,
  SuccessfulRunHandoffState,
} from "@paperclipai/shared";
import type { RefObject } from "react";

import { cn } from "../../lib/utils";
import { IssueBlockedNotice } from "../IssueBlockedNotice";
import { IssueAssigneePausedNotice } from "./IssueChatMessageContent";
import { IssueChatMessageRow } from "./IssueChatMessageRow";
import {
  VIRTUALIZED_THREAD_ROW_THRESHOLD,
  VirtualizedIssueChatThreadList,
  type VirtualizedIssueChatThreadListHandle,
} from "./VirtualizedThreadList";

export function IssueChatThreadViewport({
  activeRunIds,
  agentMap,
  assignedAgent,
  blockerAttention,
  bottomAnchorRef,
  bottomSpacerHeight,
  feedbackVoteByTargetId,
  interruptingQueuedRunId,
  issueStatus,
  messages,
  resolvedEmptyMessage,
  showComposer,
  stoppingRunId,
  successfulRunHandoff,
  unresolvedBlockers,
  variant,
  virtualizedThreadRef,
}: {
  activeRunIds: ReadonlySet<string>;
  agentMap?: Map<string, Agent>;
  assignedAgent: Agent | null;
  blockerAttention?: IssueBlockerAttention | null;
  bottomAnchorRef: RefObject<HTMLDivElement | null>;
  bottomSpacerHeight: number;
  feedbackVoteByTargetId: ReadonlyMap<string, FeedbackVoteValue>;
  interruptingQueuedRunId?: string | null;
  issueStatus?: string;
  messages: readonly ThreadMessage[];
  resolvedEmptyMessage: string;
  showComposer: boolean;
  stoppingRunId?: string | null;
  successfulRunHandoff?: SuccessfulRunHandoffState | null;
  unresolvedBlockers: IssueRelationIssueSummary[];
  variant: "full" | "embedded";
  virtualizedThreadRef: RefObject<VirtualizedIssueChatThreadListHandle | null>;
}) {
  return (
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
  );
}
