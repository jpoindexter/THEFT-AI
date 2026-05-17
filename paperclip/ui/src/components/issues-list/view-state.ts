import type { InboxIssueColumn } from "../../lib/inbox";
import {
  DEFAULT_INBOX_ISSUE_COLUMNS,
  normalizeInboxIssueColumns,
} from "../../lib/inbox";
import {
  defaultIssueFilterState,
  normalizeIssueFilterState,
} from "../../lib/issue-filters";
import type { IssueSortField, IssueViewState } from "./types";

export const defaultViewState: IssueViewState = {
  ...defaultIssueFilterState,
  sortField: "updated",
  sortDir: "desc",
  groupBy: "none",
  viewMode: "list",
  nestingEnabled: true,
  collapsedGroups: [],
  collapsedParents: [],
};

export function getViewState(key: string): IssueViewState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...defaultViewState, ...parsed, ...normalizeIssueFilterState(parsed) };
    }
  } catch {
    // Ignore storage failures.
  }
  return { ...defaultViewState };
}

export function saveViewState(key: string, state: IssueViewState) {
  localStorage.setItem(key, JSON.stringify(state));
}

export function getInitialViewState(
  key: string,
  initialAssignees?: string[],
  defaultSortField?: IssueSortField,
): IssueViewState {
  const hasStored = hasStoredViewState(key);
  const stored = getViewState(key);
  const base = !hasStored && defaultSortField
    ? { ...stored, sortField: defaultSortField, sortDir: "asc" as const }
    : stored;
  if (!initialAssignees) return base;
  return {
    ...base,
    assignees: initialAssignees,
    statuses: [],
  };
}

export function getInitialWorkspaceViewState(
  key: string,
  initialAssignees?: string[],
  initialWorkspaces?: string[],
  defaultSortField?: IssueSortField,
): IssueViewState {
  const stored = getInitialViewState(key, initialAssignees, defaultSortField);
  if (!initialWorkspaces) return stored;
  return {
    ...stored,
    workspaces: initialWorkspaces,
    statuses: [],
  };
}

function hasStoredViewState(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch {
    return false;
  }
}

function getIssueColumnsStorageKey(key: string): string {
  return `${key}:issue-columns`;
}

export function loadIssueColumns(key: string): InboxIssueColumn[] {
  try {
    const raw = localStorage.getItem(getIssueColumnsStorageKey(key));
    if (raw === null) return DEFAULT_INBOX_ISSUE_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_INBOX_ISSUE_COLUMNS;
    return normalizeInboxIssueColumns(parsed);
  } catch {
    return DEFAULT_INBOX_ISSUE_COLUMNS;
  }
}

export function saveIssueColumns(key: string, columns: InboxIssueColumn[]) {
  try {
    localStorage.setItem(
      getIssueColumnsStorageKey(key),
      JSON.stringify(normalizeInboxIssueColumns(columns)),
    );
  } catch {
    // Ignore localStorage failures.
  }
}
