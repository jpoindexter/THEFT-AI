import type { HeartbeatRun, Issue } from "@paperclipai/shared";
import { approvalLabel } from "../../components/ApprovalPayload";
import { createIssueDetailPath } from "../../lib/issueDetailBreadcrumb";
import { timeAgo } from "../../lib/timeAgo";
import { approvalStatusLabel, formatJoinRequestInboxLabel } from "./InboxDecisionRows";
import type { InboxWorkItem } from "../../lib/inbox";

export function firstNonEmptyLine(value: string | null | undefined): string | null {
  if (!value) return null;
  const line = value.split("\n").map((chunk) => chunk.trim()).find(Boolean);
  return line ?? null;
}

export function runFailureMessage(run: HeartbeatRun): string {
  return firstNonEmptyLine(run.error) ?? firstNonEmptyLine(run.stderrExcerpt) ?? "Run exited with an error.";
}

export function readIssueIdFromRun(run: HeartbeatRun): string | null {
  const context = run.contextSnapshot;
  if (!context) return null;

  const issueId = context["issueId"];
  if (typeof issueId === "string" && issueId.length > 0) return issueId;

  const taskId = context["taskId"];
  if (typeof taskId === "string" && taskId.length > 0) return taskId;

  return null;
}

export function reviewItemHref(item: InboxWorkItem): string {
  if (item.kind === "issue") return createIssueDetailPath(item.issue.identifier ?? item.issue.id);
  if (item.kind === "approval") return `/approvals/${item.approval.id}`;
  if (item.kind === "failed_run") {
    const issueId = readIssueIdFromRun(item.run);
    return issueId ? createIssueDetailPath(issueId) : `/agents/${item.run.agentId}`;
  }
  return "/company/settings/access";
}

export function reviewItemCategory(item: InboxWorkItem): string {
  if (item.kind === "approval") return "Approval";
  if (item.kind === "failed_run") return "Failed run";
  if (item.kind === "join_request") return "Clarification";
  if (item.issue.status === "blocked" || (item.issue.blockedBy?.length ?? 0) > 0) return "Blocked dependency";
  if (item.issue.status === "in_review" || item.issue.status === "done") return "Ready output";
  return "Clarification";
}

export function reviewItemTitle(item: InboxWorkItem, agentById: Map<string, string>, issueById: Map<string, Issue>): string {
  if (item.kind === "issue") return item.issue.title;
  if (item.kind === "approval") return approvalLabel(item.approval.type, item.approval.payload as Record<string, unknown> | null);
  if (item.kind === "join_request") return formatJoinRequestInboxLabel(item.joinRequest);
  const issueId = readIssueIdFromRun(item.run);
  const issue = issueId ? issueById.get(issueId) : null;
  return issue?.title ?? `${agentById.get(item.run.agentId) ?? "Agent"} run failed`;
}

export function reviewItemDetail(item: InboxWorkItem, agentById: Map<string, string>, issueById: Map<string, Issue>): string {
  if (item.kind === "issue") return `${item.issue.identifier ?? "Task"} · ${item.issue.status.replace(/_/g, " ")} · updated ${timeAgo(item.issue.updatedAt)}`;
  if (item.kind === "approval") return `${approvalStatusLabel(item.approval.status)} · updated ${timeAgo(item.approval.updatedAt)}`;
  if (item.kind === "join_request") return "Access decision required";
  const issueId = readIssueIdFromRun(item.run);
  const issue = issueId ? issueById.get(issueId) : null;
  return `${agentById.get(item.run.agentId) ?? "Agent"} · ${issue?.identifier ?? "Runtime"} · ${runFailureMessage(item.run)}`;
}
