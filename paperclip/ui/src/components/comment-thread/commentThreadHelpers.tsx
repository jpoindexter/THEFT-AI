import type { Agent } from "@paperclipai/shared";
import type { ReactNode } from "react";
import { formatAssigneeUserLabel } from "../../lib/assignees";
import { formatTimelineWorkspaceLabel, type IssueTimelineAssignee, type IssueTimelineEvent } from "../../lib/issue-timeline-events";
import type { CommentReassignment, LinkedRunItem } from "./CommentThreadTypes";

export const DRAFT_DEBOUNCE_MS = 800;

export function loadDraft(draftKey: string): string {
  try {
    return localStorage.getItem(draftKey) ?? "";
  } catch {
    return "";
  }
}

export function saveDraft(draftKey: string, value: string) {
  try {
    if (value.trim()) {
      localStorage.setItem(draftKey, value);
    } else {
      localStorage.removeItem(draftKey);
    }
  } catch {
    // Ignore localStorage failures.
  }
}

export function clearDraft(draftKey: string) {
  try {
    localStorage.removeItem(draftKey);
  } catch {
    // Ignore localStorage failures.
  }
}

export function parseReassignment(target: string): CommentReassignment | null {
  if (!target || target === "__none__") {
    return { assigneeAgentId: null, assigneeUserId: null };
  }
  if (target.startsWith("agent:")) {
    const assigneeAgentId = target.slice("agent:".length);
    return assigneeAgentId ? { assigneeAgentId, assigneeUserId: null } : null;
  }
  if (target.startsWith("user:")) {
    const assigneeUserId = target.slice("user:".length);
    return assigneeUserId ? { assigneeAgentId: null, assigneeUserId } : null;
  }
  return null;
}

export function shouldImplicitlyReopenComment(issueStatus: string | undefined, assigneeValue: string) {
  const resumesToTodo = issueStatus === "done" || issueStatus === "cancelled" || issueStatus === "blocked";
  return resumesToTodo && assigneeValue.startsWith("agent:");
}

export function humanizeValue(value: string | null): string {
  if (!value) return "None";
  return value.replace(/_/g, " ");
}

export function formatTimelineAssigneeLabel(
  assignee: IssueTimelineAssignee,
  agentMap?: Map<string, Agent>,
  currentUserId?: string | null,
) {
  if (assignee.agentId) {
    return agentMap?.get(assignee.agentId)?.name ?? assignee.agentId.slice(0, 8);
  }
  if (assignee.userId) {
    return formatAssigneeUserLabel(assignee.userId, currentUserId) ?? "Board";
  }
  return "Unassigned";
}

export function formatTimelineActorName(
  actorType: IssueTimelineEvent["actorType"],
  actorId: string,
  agentMap?: Map<string, Agent>,
  currentUserId?: string | null,
) {
  if (actorType === "agent") {
    return agentMap?.get(actorId)?.name ?? actorId.slice(0, 8);
  }
  if (actorType === "system") {
    return "System";
  }
  return formatAssigneeUserLabel(actorId, currentUserId) ?? "Board";
}

export function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatRunStatusLabel(status: string) {
  switch (status) {
    case "timed_out":
      return "timed out";
    default:
      return status.replace(/_/g, " ");
  }
}

export function runTimestamp(run: LinkedRunItem) {
  return run.finishedAt ?? run.startedAt ?? run.createdAt;
}

export function runStatusClass(status: string) {
  switch (status) {
    case "succeeded":
      return "text-chart-2";
    case "failed":
    case "error":
      return "text-destructive";
    case "timed_out":
      return "text-destructive";
    case "running":
      return "text-chart-1";
    case "queued":
    case "pending":
      return "text-chart-3";
    case "cancelled":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

export function workspaceLabel(path: string) {
  return <BreakablePath text={path} />;
}

function BreakablePath({ text }: { text: string }) {
  const parts: ReactNode[] = [];
  const segments = text.split(/(?<=[\/-])/);
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) parts.push(<wbr key={i} />);
    parts.push(segments[i]);
  }
  return <>{parts}</>;
}

export { formatTimelineWorkspaceLabel };
