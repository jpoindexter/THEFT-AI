import type { Issue, Project } from "@paperclipai/shared";
import type { issuesApi } from "../../api/issues";
import type { CompanyUserProfile } from "../../lib/company-members";
import type { IssueFilterState, IssueFilterWorkspaceContext } from "../../lib/issue-filters";

export type IssueSortField = "status" | "priority" | "title" | "created" | "updated" | "workflow";

export type IssueGroupBy = "status" | "priority" | "assignee" | "project" | "workspace" | "parent" | "none";

export type IssueViewState = IssueFilterState & {
  sortField: IssueSortField;
  sortDir: "asc" | "desc";
  groupBy: IssueGroupBy;
  viewMode: "list" | "board";
  nestingEnabled: boolean;
  collapsedGroups: string[];
  collapsedParents: string[];
};

export interface Agent {
  id: string;
  name: string;
}

export type CreatorOption = {
  id: string;
  label: string;
  kind: "agent" | "user";
  searchText?: string;
};

export type ProjectOption = Pick<Project, "id" | "name"> &
  Partial<Pick<Project, "color" | "workspaces" | "executionWorkspacePolicy" | "primaryWorkspace">>;

export type IssueListRequestFilters = NonNullable<Parameters<typeof issuesApi.list>[1]>;

export interface IssuesListProps {
  issues: Issue[];
  isLoading?: boolean;
  error?: Error | null;
  agents?: Agent[];
  projects?: ProjectOption[];
  liveIssueIds?: Set<string>;
  projectId?: string;
  viewStateKey: string;
  issueLinkState?: unknown;
  initialAssignees?: string[];
  initialWorkspaces?: string[];
  initialSearch?: string;
  searchFilters?: Omit<IssueListRequestFilters, "q" | "projectId" | "limit" | "includeRoutineExecutions">;
  searchWithinLoadedIssues?: boolean;
  baseCreateIssueDefaults?: Record<string, unknown>;
  createIssueLabel?: string;
  defaultSortField?: IssueSortField;
  showProgressSummary?: boolean;
  /**
   * When set together with `showProgressSummary`, the progress strip fetches
   * the recursive cost-summary for this parent issue and renders aggregate
   * tokens + wall-clock runtime for every run in the tree.
   */
  parentIssueIdForCostSummary?: string;
  enableRoutineVisibilityFilter?: boolean;
  hasMoreIssues?: boolean;
  isLoadingMoreIssues?: boolean;
  mutedIssueIds?: Set<string>;
  issueBadgeById?: Map<string, string>;
  onLoadMoreIssues?: () => void;
  onSearchChange?: (search: string) => void;
  onUpdateIssue: (id: string, data: Record<string, unknown>) => void;
}

export type IssueProjectSummary = {
  name: string;
  color: string | null;
};

export type IssueProjectWorkspaceSummary = {
  name: string;
};

export type IssueExecutionWorkspaceSummary = {
  name: string;
  mode: "shared_workspace" | "isolated_workspace" | "operator_branch" | "adapter_managed" | "cloud_sandbox";
  projectWorkspaceId: string | null;
};

export type IssueGroup = {
  key: string;
  label: string | null;
  items: Issue[];
};

export type IssueListUserProfileMap = ReadonlyMap<string, CompanyUserProfile>;

export type IssueListWorkspaceContext = IssueFilterWorkspaceContext;
