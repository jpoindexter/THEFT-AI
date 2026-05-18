import type {
  ThreadAssistantMessage,
  ThreadMessage,
  ThreadSystemMessage,
  ThreadUserMessage,
} from "@assistant-ui/react";
import type { Agent } from "@paperclipai/shared";
import { formatAssigneeUserLabel } from "../assignees";
import {
  buildIssueThreadInteractionSummary,
  type IssueThreadInteraction,
} from "../issue-thread-interactions";
import type { IssueTimelineEvent } from "../issue-timeline-events";
import { createAssistantMetadata } from "./metadata";
import { formatStatusLabel, toDate } from "./timing";
import type { IssueChatComment } from "./types";

function authorNameForComment(
  comment: IssueChatComment,
  agentMap?: Map<string, Agent>,
  currentUserId?: string | null,
  userLabelMap?: ReadonlyMap<string, string> | null,
) {
  if (comment.authorAgentId) {
    return agentMap?.get(comment.authorAgentId)?.name ?? comment.authorAgentId.slice(0, 8);
  }
  const authorUserId = comment.authorUserId ?? null;
  if (!authorUserId) return "You";
  const userLabel = userLabelMap?.get(authorUserId)?.trim();
  if (userLabel) return userLabel;
  return formatAssigneeUserLabel(authorUserId, currentUserId, userLabelMap) ?? "You";
}

export function createCommentMessage(args: {
  comment: IssueChatComment;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
  companyId?: string | null;
  projectId?: string | null;
}): ThreadMessage {
  const { comment, agentMap, currentUserId, userLabelMap, companyId, projectId } = args;
  const createdAt = toDate(comment.createdAt);
  const authorName = authorNameForComment(comment, agentMap, currentUserId, userLabelMap);
  const isSystemNotice = comment.authorType === "system";
  const custom = {
    kind: isSystemNotice ? "system_notice" : "comment",
    commentId: comment.id,
    anchorId: `comment-${comment.id}`,
    authorName,
    authorType: comment.authorType,
    authorAgentId: comment.authorAgentId,
    authorUserId: comment.authorUserId,
    companyId: companyId ?? comment.companyId,
    projectId: projectId ?? null,
    runId: comment.runId ?? null,
    runAgentId: comment.runAgentId ?? null,
    clientStatus: comment.clientStatus ?? null,
    queueState: comment.queueState ?? null,
    queueTargetRunId: comment.queueTargetRunId ?? null,
    queueReason: comment.queueReason ?? null,
    interruptedRunId: comment.interruptedRunId ?? null,
    followUpRequested: comment.followUpRequested === true,
    presentation: comment.presentation ?? null,
    commentMetadata: comment.metadata ?? null,
  };

  if (isSystemNotice) {
    const message: ThreadSystemMessage = {
      id: comment.id,
      role: "system",
      createdAt,
      content: [{ type: "text", text: comment.body }],
      metadata: { custom },
    };
    return message;
  }

  if (comment.authorAgentId) {
    const message: ThreadAssistantMessage = {
      id: comment.id,
      role: "assistant",
      createdAt,
      content: [{ type: "text", text: comment.body }],
      status: { type: "complete", reason: "stop" },
      metadata: createAssistantMetadata(custom),
    };
    return message;
  }

  const message: ThreadUserMessage = {
    id: comment.id,
    role: "user",
    createdAt,
    content: [{ type: "text", text: comment.body }],
    attachments: [],
    metadata: { custom },
  };
  return message;
}

export function createTimelineEventMessage(args: {
  event: IssueTimelineEvent;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
}) {
  const { event, agentMap, currentUserId, userLabelMap } = args;
  const actorName = event.actorType === "agent"
    ? (agentMap?.get(event.actorId)?.name ?? event.actorId.slice(0, 8))
    : event.actorType === "system"
      ? "System"
      : (formatAssigneeUserLabel(event.actorId, currentUserId, userLabelMap) ?? "Board");

  const lines: string[] = [
    event.followUpRequested ? `${actorName} requested follow-up` : `${actorName} updated this issue`,
  ];
  if (event.statusChange) {
    lines.push(
      `Status: ${event.statusChange.from ?? "none"} -> ${event.statusChange.to ?? "none"}`,
    );
  }
  if (event.assigneeChange) {
    const from = event.assigneeChange.from.agentId
      ? (agentMap?.get(event.assigneeChange.from.agentId)?.name ?? event.assigneeChange.from.agentId.slice(0, 8))
      : (formatAssigneeUserLabel(event.assigneeChange.from.userId, currentUserId, userLabelMap) ?? "Unassigned");
    const to = event.assigneeChange.to.agentId
      ? (agentMap?.get(event.assigneeChange.to.agentId)?.name ?? event.assigneeChange.to.agentId.slice(0, 8))
      : (formatAssigneeUserLabel(event.assigneeChange.to.userId, currentUserId, userLabelMap) ?? "Unassigned");
    lines.push(`Assignee: ${from} -> ${to}`);
  }
  if (event.workspaceChange) {
    lines.push(
      `Workspace: ${event.workspaceChange.from.label ?? "none"} -> ${event.workspaceChange.to.label ?? "none"}`,
    );
  }

  const message: ThreadSystemMessage = {
    id: `activity:${event.id}`,
    role: "system",
    createdAt: toDate(event.createdAt),
    content: [{ type: "text", text: lines.join("\n") }],
    metadata: {
      custom: {
        kind: "event",
        anchorId: `activity-${event.id}`,
        eventId: event.id,
        actorName,
        actorType: event.actorType,
        actorId: event.actorId,
        statusChange: event.statusChange ?? null,
        assigneeChange: event.assigneeChange ?? null,
        workspaceChange: event.workspaceChange ?? null,
        followUpRequested: event.followUpRequested === true,
      },
    },
  };
  return message;
}

export function createInteractionMessage(interaction: IssueThreadInteraction) {
  const message: ThreadSystemMessage = {
    id: `interaction:${interaction.id}`,
    role: "system",
    createdAt: toDate(interaction.createdAt),
    content: [{ type: "text", text: buildIssueThreadInteractionSummary(interaction) }],
    metadata: {
      custom: {
        kind: "interaction",
        anchorId: `interaction-${interaction.id}`,
        interaction,
      },
    },
  };
  return message;
}

export { type IssueThreadInteraction, formatStatusLabel };
