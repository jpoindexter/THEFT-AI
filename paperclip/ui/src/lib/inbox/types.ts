import type {
  Approval,
  HeartbeatRun,
  Issue,
  JoinRequest,
} from "@paperclipai/shared";
import type { IssueFilterState } from "../issue-filters";

export const RECENT_ISSUES_LIMIT = 100;
export const FAILED_RUN_STATUSES = new Set(["failed", "timed_out"]);
export const ACTIONABLE_APPROVAL_STATUSES = new Set(["pending", "revision_requested"]);
export const DISMISSED_KEY = "paperclip:inbox:dismissed";
export const READ_ITEMS_KEY = "paperclip:inbox:read-items";
export const INBOX_LAST_TAB_KEY = "paperclip:inbox:last-tab";
export const INBOX_ISSUE_COLUMNS_KEY = "paperclip:inbox:issue-columns";
export const INBOX_NESTING_KEY = "paperclip:inbox:nesting";
export const INBOX_GROUP_BY_KEY = "paperclip:inbox:group-by";
export const INBOX_FILTER_PREFERENCES_KEY_PREFIX = "paperclip:inbox:filters";
export const INBOX_COLLAPSED_GROUPS_KEY_PREFIX = "paperclip:inbox:collapsed-groups";

export type InboxTab = "mine" | "recent" | "unread" | "all";
export type InboxCategoryFilter =
  | "everything"
  | "issues_i_touched"
  | "join_requests"
  | "approvals"
  | "failed_runs"
  | "alerts";
export type InboxApprovalFilter = "all" | "actionable" | "resolved";
export type InboxWorkItemGroupBy = "none" | "type" | "assignee" | "project" | "workspace";

export const inboxIssueColumns = [
  "status",
  "id",
  "assignee",
  "project",
  "workspace",
  "parent",
  "labels",
  "updated",
] as const;
export type InboxIssueColumn = (typeof inboxIssueColumns)[number];
export const DEFAULT_INBOX_ISSUE_COLUMNS: InboxIssueColumn[] = ["status", "id", "updated"];

export interface InboxFilterPreferences {
  allCategoryFilter: InboxCategoryFilter;
  allApprovalFilter: InboxApprovalFilter;
  issueFilters: IssueFilterState;
}

export type InboxWorkItem =
  | {
      kind: "issue";
      timestamp: number;
      issue: Issue;
    }
  | {
      kind: "approval";
      timestamp: number;
      approval: Approval;
    }
  | {
      kind: "failed_run";
      timestamp: number;
      run: HeartbeatRun;
    }
  | {
      kind: "join_request";
      timestamp: number;
      joinRequest: JoinRequest;
    };

export interface InboxBadgeData {
  inbox: number;
  approvals: number;
  failedRuns: number;
  joinRequests: number;
  mineIssues: number;
  alerts: number;
}

export interface InboxWorkItemGroup {
  key: string;
  label: string | null;
  items: InboxWorkItem[];
}

export type InboxSearchSection = "none" | "archived" | "other";

export interface InboxGroupedSection {
  key: string;
  label: string | null;
  displayItems: InboxWorkItem[];
  childrenByIssueId: Map<string, Issue[]>;
  searchSection: InboxSearchSection;
}

export interface InboxKeyboardGroupSection {
  key: string;
  label?: string | null;
  displayItems: InboxWorkItem[];
  childrenByIssueId: ReadonlyMap<string, Issue[]>;
}

export type InboxKeyboardNavEntry =
  | {
      type: "group";
      groupKey: string;
      label: string;
      collapsed: boolean;
    }
  | {
      type: "top";
      itemKey: string;
      item: InboxWorkItem;
    }
  | {
      type: "child";
      issueId: string;
      issue: Issue;
    };

export interface InboxProjectWorkspaceLookup {
  name: string;
}

export interface InboxExecutionWorkspaceLookup {
  name: string;
  mode: "shared_workspace" | "isolated_workspace" | "operator_branch" | "adapter_managed" | "cloud_sandbox";
  projectWorkspaceId: string | null;
}

export interface InboxWorkspaceGroupingOptions {
  executionWorkspaceById?: ReadonlyMap<string, InboxExecutionWorkspaceLookup>;
  projectWorkspaceById?: ReadonlyMap<string, InboxProjectWorkspaceLookup>;
  defaultProjectWorkspaceIdByProjectId?: ReadonlyMap<string, string>;
  projectById?: ReadonlyMap<string, { name: string | null | undefined }>;
  agentById?: ReadonlyMap<string, string | null | undefined>;
  userLabelById?: ReadonlyMap<string, string>;
  currentUserId?: string | null;
}
