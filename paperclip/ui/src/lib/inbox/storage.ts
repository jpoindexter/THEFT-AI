import type { InboxDismissal } from "@paperclipai/shared";
import {
  defaultIssueFilterState,
  normalizeIssueFilterState,
} from "../issue-filters";
import { normalizeTimestamp } from "./activity";
import {
  DEFAULT_INBOX_ISSUE_COLUMNS,
  DISMISSED_KEY,
  INBOX_COLLAPSED_GROUPS_KEY_PREFIX,
  INBOX_FILTER_PREFERENCES_KEY_PREFIX,
  INBOX_GROUP_BY_KEY,
  INBOX_ISSUE_COLUMNS_KEY,
  INBOX_LAST_TAB_KEY,
  INBOX_NESTING_KEY,
  READ_ITEMS_KEY,
  inboxIssueColumns,
  type InboxApprovalFilter,
  type InboxCategoryFilter,
  type InboxFilterPreferences,
  type InboxIssueColumn,
  type InboxTab,
  type InboxWorkItemGroupBy,
} from "./types";

const defaultInboxFilterPreferences: InboxFilterPreferences = {
  allCategoryFilter: "everything",
  allApprovalFilter: "all",
  issueFilters: defaultIssueFilterState,
};

function normalizeInboxCategoryFilter(value: unknown): InboxCategoryFilter {
  return value === "issues_i_touched"
    || value === "join_requests"
    || value === "approvals"
    || value === "failed_runs"
    || value === "alerts"
    ? value
    : "everything";
}

function normalizeInboxApprovalFilter(value: unknown): InboxApprovalFilter {
  return value === "actionable" || value === "resolved" ? value : "all";
}

function getInboxFilterPreferencesStorageKey(companyId: string | null | undefined): string | null {
  if (!companyId) return null;
  return `${INBOX_FILTER_PREFERENCES_KEY_PREFIX}:${companyId}`;
}

function getInboxCollapsedGroupsStorageKey(companyId: string | null | undefined): string | null {
  if (!companyId) return null;
  return `${INBOX_COLLAPSED_GROUPS_KEY_PREFIX}:${companyId}`;
}

export function loadInboxFilterPreferences(
  companyId: string | null | undefined,
): InboxFilterPreferences {
  const storageKey = getInboxFilterPreferencesStorageKey(companyId);
  if (!storageKey) {
    return {
      ...defaultInboxFilterPreferences,
      issueFilters: { ...defaultIssueFilterState },
    };
  }

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) {
      return {
        ...defaultInboxFilterPreferences,
        issueFilters: { ...defaultIssueFilterState },
      };
    }
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    return {
      allCategoryFilter: normalizeInboxCategoryFilter(parsed.allCategoryFilter),
      allApprovalFilter: normalizeInboxApprovalFilter(parsed.allApprovalFilter),
      issueFilters: normalizeIssueFilterState(parsed.issueFilters),
    };
  } catch {
    return {
      ...defaultInboxFilterPreferences,
      issueFilters: { ...defaultIssueFilterState },
    };
  }
}

export function saveInboxFilterPreferences(
  companyId: string | null | undefined,
  preferences: InboxFilterPreferences,
) {
  const storageKey = getInboxFilterPreferencesStorageKey(companyId);
  if (!storageKey) return;

  try {
    localStorage.setItem(
      storageKey,
      JSON.stringify({
        allCategoryFilter: normalizeInboxCategoryFilter(preferences.allCategoryFilter),
        allApprovalFilter: normalizeInboxApprovalFilter(preferences.allApprovalFilter),
        issueFilters: normalizeIssueFilterState(preferences.issueFilters),
      }),
    );
  } catch {
    // Ignore localStorage failures.
  }
}

export function loadCollapsedInboxGroupKeys(
  companyId: string | null | undefined,
): Set<string> {
  const storageKey = getInboxCollapsedGroupsStorageKey(companyId);
  if (!storageKey) return new Set();

  try {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    return new Set(Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : []);
  } catch {
    return new Set();
  }
}

export function saveCollapsedInboxGroupKeys(
  companyId: string | null | undefined,
  groupKeys: ReadonlySet<string>,
) {
  const storageKey = getInboxCollapsedGroupsStorageKey(companyId);
  if (!storageKey) return;

  try {
    localStorage.setItem(storageKey, JSON.stringify([...groupKeys]));
  } catch {
    // Ignore localStorage failures.
  }
}

export function loadDismissedInboxAlerts(): Set<string> {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((value): value is string => typeof value === "string" && value.startsWith("alert:")));
  } catch {
    return new Set();
  }
}

export function saveDismissedInboxAlerts(ids: Set<string>) {
  try {
    localStorage.setItem(DISMISSED_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore localStorage failures.
  }
}

export function buildInboxDismissedAtByKey(dismissals: InboxDismissal[]): Map<string, number> {
  return new Map(
    dismissals.map((dismissal) => [dismissal.itemKey, normalizeTimestamp(dismissal.dismissedAt)]),
  );
}

export function isInboxEntityDismissed(
  dismissedAtByKey: ReadonlyMap<string, number>,
  itemKey: string,
  activityAt: string | Date | null | undefined,
): boolean {
  const dismissedAt = dismissedAtByKey.get(itemKey);
  if (dismissedAt == null) return false;
  return dismissedAt >= normalizeTimestamp(activityAt);
}

export function loadReadInboxItems(): Set<string> {
  try {
    const raw = localStorage.getItem(READ_ITEMS_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadInboxItems(ids: Set<string>) {
  try {
    localStorage.setItem(READ_ITEMS_KEY, JSON.stringify([...ids]));
  } catch {
    // Ignore localStorage failures.
  }
}

export function normalizeInboxIssueColumns(columns: Iterable<string | InboxIssueColumn>): InboxIssueColumn[] {
  const selected = new Set(columns);
  return inboxIssueColumns.filter((column) => selected.has(column));
}

export function getAvailableInboxIssueColumns(enableWorkspaceColumn: boolean): InboxIssueColumn[] {
  if (enableWorkspaceColumn) return [...inboxIssueColumns];
  return inboxIssueColumns.filter((column) => column !== "workspace");
}

export function loadInboxIssueColumns(): InboxIssueColumn[] {
  try {
    const raw = localStorage.getItem(INBOX_ISSUE_COLUMNS_KEY);
    if (raw === null) return DEFAULT_INBOX_ISSUE_COLUMNS;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return DEFAULT_INBOX_ISSUE_COLUMNS;
    return normalizeInboxIssueColumns(parsed);
  } catch {
    return DEFAULT_INBOX_ISSUE_COLUMNS;
  }
}

export function saveInboxIssueColumns(columns: InboxIssueColumn[]) {
  try {
    localStorage.setItem(
      INBOX_ISSUE_COLUMNS_KEY,
      JSON.stringify(normalizeInboxIssueColumns(columns)),
    );
  } catch {
    // Ignore localStorage failures.
  }
}

export function loadInboxWorkItemGroupBy(): InboxWorkItemGroupBy {
  try {
    const raw = localStorage.getItem(INBOX_GROUP_BY_KEY);
    return raw === "type" || raw === "assignee" || raw === "project" || raw === "workspace" ? raw : "none";
  } catch {
    return "none";
  }
}

export function saveInboxWorkItemGroupBy(groupBy: InboxWorkItemGroupBy) {
  try {
    localStorage.setItem(INBOX_GROUP_BY_KEY, groupBy);
  } catch {
    // Ignore localStorage failures.
  }
}

export function loadInboxNesting(): boolean {
  try {
    const raw = localStorage.getItem(INBOX_NESTING_KEY);
    return raw !== "false";
  } catch {
    return true;
  }
}

export function saveInboxNesting(enabled: boolean) {
  try {
    localStorage.setItem(INBOX_NESTING_KEY, String(enabled));
  } catch {
    // Ignore localStorage failures.
  }
}

export function loadLastInboxTab(): InboxTab {
  try {
    const raw = localStorage.getItem(INBOX_LAST_TAB_KEY);
    if (raw === "all" || raw === "unread" || raw === "recent" || raw === "mine") return raw;
    if (raw === "new") return "mine";
    return "mine";
  } catch {
    return "mine";
  }
}

export function saveLastInboxTab(tab: InboxTab) {
  try {
    localStorage.setItem(INBOX_LAST_TAB_KEY, tab);
  } catch {
    // Ignore localStorage failures.
  }
}
