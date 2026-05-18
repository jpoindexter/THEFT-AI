import type { Approval, HeartbeatRun, Issue, JoinRequest } from "@paperclipai/shared";
import {
  ACTIONABLE_APPROVAL_STATUSES,
  FAILED_RUN_STATUSES,
  RECENT_ISSUES_LIMIT,
  type InboxApprovalFilter,
  type InboxTab,
  type InboxWorkItem,
} from "./types";

export function getLatestFailedRunsByAgent(runs: HeartbeatRun[]): HeartbeatRun[] {
  const sorted = [...runs].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
  const latestByAgent = new Map<string, HeartbeatRun>();

  for (const run of sorted) {
    if (!latestByAgent.has(run.agentId)) {
      latestByAgent.set(run.agentId, run);
    }
  }

  return Array.from(latestByAgent.values()).filter((run) => FAILED_RUN_STATUSES.has(run.status));
}

export function normalizeTimestamp(value: string | Date | null | undefined): number {
  if (!value) return 0;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export function issueLastActivityTimestamp(issue: Issue): number {
  const lastActivityAt = normalizeTimestamp(issue.lastActivityAt);
  if (lastActivityAt > 0) return lastActivityAt;

  const lastExternalCommentAt = normalizeTimestamp(issue.lastExternalCommentAt);
  if (lastExternalCommentAt > 0) return lastExternalCommentAt;

  return normalizeTimestamp(issue.updatedAt);
}

export function sortIssuesByMostRecentActivity(a: Issue, b: Issue): number {
  const activityDiff = issueLastActivityTimestamp(b) - issueLastActivityTimestamp(a);
  if (activityDiff !== 0) return activityDiff;
  return normalizeTimestamp(b.updatedAt) - normalizeTimestamp(a.updatedAt);
}

export function getRecentTouchedIssues(issues: Issue[]): Issue[] {
  return [...issues].sort(sortIssuesByMostRecentActivity).slice(0, RECENT_ISSUES_LIMIT);
}

export function getUnreadTouchedIssues(issues: Issue[]): Issue[] {
  return issues.filter((issue) => issue.isUnreadForMe);
}

export function getApprovalsForTab(
  approvals: Approval[],
  tab: InboxTab,
  filter: InboxApprovalFilter,
  currentUserId?: string | null,
): Approval[] {
  const sortedApprovals = [...approvals].sort(
    (a, b) => normalizeTimestamp(b.updatedAt) - normalizeTimestamp(a.updatedAt),
  );

  if (tab === "mine") {
    return sortedApprovals.filter((approval) => isApprovalVisibleInMine(approval, currentUserId));
  }
  if (tab === "recent") return sortedApprovals;
  if (tab === "unread") {
    return sortedApprovals.filter((approval) => ACTIONABLE_APPROVAL_STATUSES.has(approval.status));
  }
  if (filter === "all") return sortedApprovals;

  return sortedApprovals.filter((approval) => {
    const isActionable = ACTIONABLE_APPROVAL_STATUSES.has(approval.status);
    return filter === "actionable" ? isActionable : !isActionable;
  });
}

export function isApprovalVisibleInMine(
  approval: Approval,
  currentUserId?: string | null,
): boolean {
  if (ACTIONABLE_APPROVAL_STATUSES.has(approval.status)) return true;
  if (!currentUserId) return false;
  return approval.requestedByUserId === currentUserId || approval.decidedByUserId === currentUserId;
}

export function approvalActivityTimestamp(approval: Approval): number {
  const updatedAt = normalizeTimestamp(approval.updatedAt);
  if (updatedAt > 0) return updatedAt;
  return normalizeTimestamp(approval.createdAt);
}

export function getInboxWorkItems({
  issues,
  approvals,
  failedRuns = [],
  joinRequests = [],
}: {
  issues: Issue[];
  approvals: Approval[];
  failedRuns?: HeartbeatRun[];
  joinRequests?: JoinRequest[];
}): InboxWorkItem[] {
  return [
    ...issues.map((issue) => ({
      kind: "issue" as const,
      timestamp: issueLastActivityTimestamp(issue),
      issue,
    })),
    ...approvals.map((approval) => ({
      kind: "approval" as const,
      timestamp: approvalActivityTimestamp(approval),
      approval,
    })),
    ...failedRuns.map((run) => ({
      kind: "failed_run" as const,
      timestamp: normalizeTimestamp(run.createdAt),
      run,
    })),
    ...joinRequests.map((joinRequest) => ({
      kind: "join_request" as const,
      timestamp: normalizeTimestamp(joinRequest.createdAt),
      joinRequest,
    })),
  ].sort((a, b) => {
    const timestampDiff = b.timestamp - a.timestamp;
    if (timestampDiff !== 0) return timestampDiff;

    if (a.kind === "issue" && b.kind === "issue") {
      return sortIssuesByMostRecentActivity(a.issue, b.issue);
    }
    if (a.kind === "approval" && b.kind === "approval") {
      return approvalActivityTimestamp(b.approval) - approvalActivityTimestamp(a.approval);
    }

    return a.kind === "approval" ? -1 : 1;
  });
}
