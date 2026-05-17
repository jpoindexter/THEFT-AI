import type { Issue } from "@paperclipai/shared";
import {
  issuePriorityOrder,
  issueStatusOrder,
} from "../../lib/issue-filters";
import { workflowSort } from "../../lib/workflow-sort";
import type { IssueViewState } from "./types";

export function sortIssues(issues: Issue[], state: IssueViewState): Issue[] {
  if (state.sortField === "workflow") {
    const ordered = workflowSort(issues);
    return state.sortDir === "desc" ? [...ordered].reverse() : ordered;
  }
  const sorted = [...issues];
  const dir = state.sortDir === "asc" ? 1 : -1;
  sorted.sort((a, b) => {
    switch (state.sortField) {
      case "status":
        return dir * (issueStatusOrder.indexOf(a.status) - issueStatusOrder.indexOf(b.status));
      case "priority":
        return dir * (issuePriorityOrder.indexOf(a.priority) - issuePriorityOrder.indexOf(b.priority));
      case "title":
        return dir * a.title.localeCompare(b.title);
      case "created":
        return dir * (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      case "updated":
        return dir * (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
      default:
        return 0;
    }
  });
  return sorted;
}

export function issueMatchesLocalSearch(issue: Issue, normalizedSearch: string): boolean {
  if (!normalizedSearch) return true;
  return [
    issue.identifier,
    issue.title,
    issue.description,
  ].some((value) => value?.toLowerCase().includes(normalizedSearch));
}
