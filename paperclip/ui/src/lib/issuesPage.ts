import type { Issue } from "@paperclipai/shared";

export const WORKSPACE_FILTER_ISSUE_LIMIT = 1000;
export const ISSUES_PAGE_SIZE = 500;

export function getNextIssuesPageOffset(
  loadedPageSize: number,
  currentOffset: number,
  pageSize: number = ISSUES_PAGE_SIZE,
): number | undefined {
  return loadedPageSize >= pageSize ? currentOffset + pageSize : undefined;
}

export function mergeIssuePagesStable(pages: Issue[][]): Issue[] {
  const seenIssueIds = new Set<string>();
  const merged: Issue[] = [];

  for (const page of pages) {
    for (const issue of page) {
      if (seenIssueIds.has(issue.id)) continue;
      seenIssueIds.add(issue.id);
      merged.push(issue);
    }
  }

  return merged;
}

export function buildIssuesSearchUrl(currentHref: string, search: string): string | null {
  const url = new URL(currentHref);
  const currentSearch = url.searchParams.get("q") ?? "";
  if (currentSearch === search) return null;

  if (search.length > 0) {
    url.searchParams.set("q", search);
  } else {
    url.searchParams.delete("q");
  }

  return `${url.pathname}${url.search}${url.hash}`;
}

export interface FounderTaskBuckets {
  needsAction: Issue[];
  ongoing: Issue[];
  todo: Issue[];
  done: Issue[];
}

function issueUpdatedTime(issue: Issue): number {
  return new Date(issue.updatedAt ?? issue.createdAt ?? 0).getTime();
}

function sortNewestIssues(issues: Issue[]): Issue[] {
  return [...issues].sort((a, b) => issueUpdatedTime(b) - issueUpdatedTime(a));
}

export function needsFounderAction(issue: Issue): boolean {
  return (
    issue.status === "blocked"
    || issue.status === "in_review"
    || issue.productivityReview != null
    || issue.successfulRunHandoff?.required === true
    || issue.blockerAttention?.state === "needs_attention"
    || issue.blockerAttention?.state === "stalled"
  );
}

export function buildFounderTaskBuckets(issues: Issue[]): FounderTaskBuckets {
  const buckets: FounderTaskBuckets = {
    needsAction: [],
    ongoing: [],
    todo: [],
    done: [],
  };

  for (const issue of issues) {
    if (needsFounderAction(issue)) {
      buckets.needsAction.push(issue);
    } else if (issue.status === "done" || issue.status === "cancelled") {
      buckets.done.push(issue);
    } else if (issue.status === "todo" || issue.status === "backlog") {
      buckets.todo.push(issue);
    } else {
      buckets.ongoing.push(issue);
    }
  }

  return {
    needsAction: sortNewestIssues(buckets.needsAction),
    ongoing: sortNewestIssues(buckets.ongoing),
    todo: sortNewestIssues(buckets.todo),
    done: sortNewestIssues(buckets.done),
  };
}
