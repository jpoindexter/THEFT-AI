import type { Issue } from "@paperclipai/shared";
import { formatAssigneeUserLabel } from "../../lib/assignees";
import { groupBy } from "../../lib/groupBy";
import {
  issueFilterLabel,
  issuePriorityOrder,
  issueStatusOrder,
  resolveIssueFilterWorkspaceId,
} from "../../lib/issue-filters";
import type {
  IssueGroup,
  IssueListWorkspaceContext,
  IssueProjectSummary,
  IssueViewState,
} from "./types";

export function buildIssueGroups({
  issues,
  viewState,
  issueFilterWorkspaceContext,
  workspaceNameMap,
  projectById,
  issueTitleMap,
  currentUserId,
  companyUserLabelMap,
  agentName,
}: {
  issues: Issue[];
  viewState: IssueViewState;
  issueFilterWorkspaceContext: IssueListWorkspaceContext;
  workspaceNameMap: ReadonlyMap<string, string>;
  projectById: ReadonlyMap<string, IssueProjectSummary>;
  issueTitleMap: ReadonlyMap<string, string>;
  currentUserId: string | null;
  companyUserLabelMap: ReadonlyMap<string, string>;
  agentName: (id: string | null) => string | null;
}): IssueGroup[] {
  if (viewState.groupBy === "none") {
    return [{ key: "__all", label: null, items: issues }];
  }
  if (viewState.groupBy === "status") {
    const groups = groupBy(issues, (issue) => issue.status);
    return issueStatusOrder
      .filter((status) => groups[status]?.length)
      .map((status) => ({ key: status, label: issueFilterLabel(status), items: groups[status]! }));
  }
  if (viewState.groupBy === "priority") {
    const groups = groupBy(issues, (issue) => issue.priority);
    return issuePriorityOrder
      .filter((priority) => groups[priority]?.length)
      .map((priority) => ({ key: priority, label: issueFilterLabel(priority), items: groups[priority]! }));
  }
  if (viewState.groupBy === "workspace") {
    const groups = groupBy(
      issues,
      (issue) => resolveIssueFilterWorkspaceId(issue, issueFilterWorkspaceContext) ?? "__no_workspace",
    );
    return Object.keys(groups)
      .sort((left, right) => {
        if (left === "__no_workspace") return 1;
        if (right === "__no_workspace") return -1;
        return (groups[right]?.length ?? 0) - (groups[left]?.length ?? 0);
      })
      .map((key) => ({
        key,
        label: key === "__no_workspace" ? "No Workspace" : (workspaceNameMap.get(key) ?? key.slice(0, 8)),
        items: groups[key]!,
      }));
  }
  if (viewState.groupBy === "project") {
    const groups = groupBy(issues, (issue) => issue.projectId ?? "__no_project");
    return Object.keys(groups)
      .sort((left, right) => {
        if (left === "__no_project") return 1;
        if (right === "__no_project") return -1;
        const labelA = projectById.get(left)?.name ?? left;
        const labelB = projectById.get(right)?.name ?? right;
        return labelA.localeCompare(labelB);
      })
      .map((key) => ({
        key,
        label: key === "__no_project" ? "No Project" : (projectById.get(key)?.name ?? key.slice(0, 8)),
        items: groups[key]!,
      }));
  }
  if (viewState.groupBy === "parent") {
    const groups = groupBy(issues, (issue) => issue.parentId ?? "__no_parent");
    return Object.keys(groups)
      .sort((left, right) => {
        if (left === "__no_parent") return 1;
        if (right === "__no_parent") return -1;
        return (groups[right]?.length ?? 0) - (groups[left]?.length ?? 0);
      })
      .map((key) => ({
        key,
        label: key === "__no_parent" ? "No Parent" : (issueTitleMap.get(key) ?? key.slice(0, 8)),
        items: groups[key]!,
      }));
  }

  const groups = groupBy(
    issues,
    (issue) => issue.assigneeAgentId ?? (issue.assigneeUserId ? `__user:${issue.assigneeUserId}` : "__unassigned"),
  );
  return Object.keys(groups).map((key) => ({
    key,
    label:
      key === "__unassigned"
        ? "Unassigned"
        : key.startsWith("__user:")
          ? (formatAssigneeUserLabel(key.slice("__user:".length), currentUserId, companyUserLabelMap) ?? "User")
          : (agentName(key) ?? key.slice(0, 8)),
    items: groups[key]!,
  }));
}
