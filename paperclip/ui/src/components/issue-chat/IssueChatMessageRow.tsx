import type { ThreadMessage } from "@assistant-ui/react";
import type { FeedbackVoteValue } from "@paperclipai/shared";
import { memo } from "react";

import { IssueChatAssistantMessage } from "./IssueChatAssistantMessage";
import { IssueChatSystemMessage } from "./IssueChatSystemMessage";
import { IssueChatUserMessage } from "./IssueChatUserMessage";
import {
  issueChatMessageActiveVote,
  issueChatMessageKind,
  issueChatMessageRunIsActive,
  issueChatMessageRunIsStopping,
  issueChatMessageQueuedRunIsInterrupting,
} from "./MessageState";

interface IssueChatMessageRowProps {
  message: ThreadMessage;
  feedbackVoteByTargetId: ReadonlyMap<string, FeedbackVoteValue>;
  activeRunIds: ReadonlySet<string>;
  stoppingRunId?: string | null;
  interruptingQueuedRunId?: string | null;
}

export const IssueChatMessageRow = memo(function IssueChatMessageRow({
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
