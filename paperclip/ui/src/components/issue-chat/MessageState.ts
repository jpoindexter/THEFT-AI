import type { ThreadMessage } from "@assistant-ui/react";
import type { FeedbackVoteValue } from "@paperclipai/shared";

export function issueChatMessageCustom(message: ThreadMessage): Record<string, unknown> {
  return (message.metadata?.custom ?? {}) as Record<string, unknown>;
}

export function issueChatMessageKind(message: ThreadMessage): string {
  const custom = issueChatMessageCustom(message);
  return typeof custom.kind === "string" ? custom.kind : message.role;
}

export function issueChatMessageCommentId(message: ThreadMessage): string | null {
  const custom = issueChatMessageCustom(message);
  return typeof custom.commentId === "string" ? custom.commentId : null;
}

export function issueChatMessageRunId(message: ThreadMessage): string | null {
  const custom = issueChatMessageCustom(message);
  return typeof custom.runId === "string" ? custom.runId : null;
}

export function issueChatMessageQueueTargetRunId(message: ThreadMessage): string | null {
  const custom = issueChatMessageCustom(message);
  return typeof custom.queueTargetRunId === "string" ? custom.queueTargetRunId : null;
}

export function issueChatMessageActiveVote(
  message: ThreadMessage,
  feedbackVoteByTargetId: ReadonlyMap<string, FeedbackVoteValue>,
): FeedbackVoteValue | null {
  const commentId = issueChatMessageCommentId(message);
  return commentId ? feedbackVoteByTargetId.get(commentId) ?? null : null;
}

export function issueChatMessageRunIsActive(
  message: ThreadMessage,
  activeRunIds: ReadonlySet<string>,
): boolean {
  const runId = issueChatMessageRunId(message);
  return Boolean(runId && activeRunIds.has(runId));
}

export function issueChatMessageRunIsStopping(
  message: ThreadMessage,
  stoppingRunId: string | null | undefined,
): boolean {
  const runId = issueChatMessageRunId(message);
  return Boolean(runId && stoppingRunId === runId);
}

export function issueChatMessageQueuedRunIsInterrupting(
  message: ThreadMessage,
  interruptingQueuedRunId: string | null | undefined,
): boolean {
  const queueTargetRunId = issueChatMessageQueueTargetRunId(message);
  return Boolean(queueTargetRunId && interruptingQueuedRunId === queueTargetRunId);
}

export function issueChatMessageAnchorId(message: ThreadMessage): string | null {
  const custom = message.metadata.custom as { anchorId?: unknown } | undefined;
  return typeof custom?.anchorId === "string" ? custom.anchorId : null;
}

export function findMessageAnchorIndex(messages: readonly ThreadMessage[], anchorId: string): number {
  return messages.findIndex((message) => issueChatMessageAnchorId(message) === anchorId);
}

export function findLatestCommentMessageIndex(messages: readonly ThreadMessage[]): number {
  for (let index = messages.length - 1; index >= 0; index -= 1) {
    const anchorId = issueChatMessageAnchorId(messages[index]);
    if (anchorId && anchorId.startsWith("comment-")) return index;
  }
  return -1;
}
