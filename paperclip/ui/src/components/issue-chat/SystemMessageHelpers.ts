import type { Agent } from "@paperclipai/shared";

import { formatAssigneeUserLabel } from "@/lib/assignees";
import type {
  IssueTimelineAssignee,
  IssueTimelineEvent,
  IssueTimelineWorkspace,
} from "@/lib/issue-timeline-events";

export function humanizeValue(value: string | null) {
  if (!value) return "None";
  return value.replace(/_/g, " ");
}

export function formatTimelineAssigneeLabel(
  assignee: IssueTimelineAssignee,
  agentMap?: Map<string, Agent>,
  currentUserId?: string | null,
  userLabelMap?: ReadonlyMap<string, string> | null,
) {
  if (assignee.agentId) {
    return agentMap?.get(assignee.agentId)?.name ?? assignee.agentId.slice(0, 8);
  }
  if (assignee.userId) {
    return formatAssigneeUserLabel(assignee.userId, currentUserId, userLabelMap) ?? "Board";
  }
  return "Unassigned";
}

export function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function formatInteractionActorLabel(args: {
  agentId?: string | null;
  userId?: string | null;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  userLabelMap?: ReadonlyMap<string, string> | null;
}) {
  const { agentId, userId, agentMap, currentUserId, userLabelMap } = args;
  if (agentId) return agentMap?.get(agentId)?.name ?? agentId.slice(0, 8);
  if (userId) {
    return userLabelMap?.get(userId)
      ?? formatAssigneeUserLabel(userId, currentUserId, userLabelMap)
      ?? "Board";
  }
  return "System";
}

export function formatRunStatusLabel(status: string) {
  switch (status) {
    case "timed_out":
      return "timed out";
    default:
      return status.replace(/_/g, " ");
  }
}

export function runStatusClass(status: string) {
  switch (status) {
    case "succeeded":
      return "text-green-700 dark:text-green-300";
    case "failed":
    case "error":
      return "text-red-700 dark:text-red-300";
    case "timed_out":
      return "text-orange-700 dark:text-orange-300";
    case "running":
      return "text-cyan-700 dark:text-cyan-300";
    case "queued":
    case "pending":
      return "text-amber-700 dark:text-amber-300";
    case "cancelled":
      return "text-muted-foreground";
    default:
      return "text-foreground";
  }
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isTimelineWorkspace(value: unknown): value is IssueTimelineWorkspace {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const workspace = value as Record<string, unknown>;
  return isNullableString(workspace.label)
    && isNullableString(workspace.projectWorkspaceId)
    && isNullableString(workspace.executionWorkspaceId)
    && isNullableString(workspace.mode);
}

export function isTimelineWorkspaceChange(value: unknown): value is NonNullable<IssueTimelineEvent["workspaceChange"]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const change = value as Record<string, unknown>;
  return isTimelineWorkspace(change.from) && isTimelineWorkspace(change.to);
}
