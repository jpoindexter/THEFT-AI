import { useCallback, useMemo } from "react";
import type { Issue, IssueLabel } from "@paperclipai/shared";
import {
  applyIssueFilters,
  countActiveIssueFilters,
} from "../../lib/issue-filters";
import {
  buildSubIssueProgressSummary,
  shouldRenderSubIssueProgressSummary,
} from "../../lib/issue-detail-subissues";
import {
  type InboxIssueColumn,
} from "../../lib/inbox";
import { buildSubIssueDefaultsForViewer } from "../../lib/subIssueDefaults";
import {
  ISSUE_BOARD_COLUMN_RESULT_LIMIT,
  ISSUE_SEARCH_RESULT_LIMIT,
} from "./constants";
import { issueMatchesLocalSearch, sortIssues } from "./filtering";
import { buildIssueGroups } from "./grouping";
import type { IssuesListProps, IssueViewState } from "./types";
import { useIssuesListLookups } from "./useIssuesListLookups";
import { buildWorkflowChecklistMeta } from "./workflow-checklist";
import {
  buildExecutionWorkspaceById,
} from "./workspace-lookups";

type BoardIssueQueryResult = {
  data?: Issue[];
  isPending: boolean;
};

export function useIssuesListModel({
  issues,
  agents,
  projects,
  liveIssueIds,
  projectId,
  issueLinkState,
  searchWithinLoadedIssues,
  baseCreateIssueDefaults,
  createIssueLabel,
  defaultSortField,
  showProgressSummary,
  parentIssueIdForCostSummary,
  enableRoutineVisibilityFilter,
  mutedIssueIds,
  issueBadgeById,
  onUpdateIssue,
  viewState,
  updateView,
  normalizedIssueSearch,
  visibleIssueColumnSet,
  currentUserId,
  isolatedWorkspacesEnabled,
  companyMembers,
  searchedIssues,
  boardIssueQueries,
  executionWorkspaces,
  labels,
  openNewIssue,
  setAssigneePickerIssueId,
  setAssigneeSearch,
}: IssuesListProps & {
  viewState: IssueViewState;
  updateView: (patch: Partial<IssueViewState>) => void;
  normalizedIssueSearch: string;
  visibleIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  currentUserId: string | null;
  isolatedWorkspacesEnabled: boolean;
  companyMembers?: Parameters<typeof useIssuesListLookups>[0]["companyMembers"];
  searchedIssues: Issue[];
  boardIssueQueries: ReadonlyArray<BoardIssueQueryResult>;
  executionWorkspaces: Parameters<typeof buildExecutionWorkspaceById>[0];
  labels?: IssueLabel[];
  openNewIssue: (defaults?: Record<string, unknown>) => void;
  setAssigneePickerIssueId: (issueId: string | null) => void;
  setAssigneeSearch: (search: string) => void;
}) {
  const lookups = useIssuesListLookups({
    issues,
    agents,
    projects,
    currentUserId,
    companyMembers,
    executionWorkspaces,
    isolatedWorkspacesEnabled,
    visibleIssueColumnSet,
  });

  const issueById = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const issue of issues) {
      map.set(issue.id, issue);
    }
    return map;
  }, [issues]);

  const issueTitleMap = useMemo(() => {
    const map = new Map<string, string>();
    for (const issue of issues) {
      map.set(issue.id, issue.identifier ? `${issue.identifier}: ${issue.title}` : issue.title);
    }
    return map;
  }, [issues]);

  const boardIssues = useMemo(() => {
    if (viewState.viewMode !== "board" || searchWithinLoadedIssues) return null;
    const merged = new Map<string, Issue>();
    let isPending = false;
    for (const query of boardIssueQueries) {
      isPending ||= query.isPending;
      for (const issue of query.data ?? []) {
        merged.set(issue.id, issue);
      }
    }
    if (merged.size > 0) return [...merged.values()];
    return isPending ? issues : [];
  }, [boardIssueQueries, issues, searchWithinLoadedIssues, viewState.viewMode]);
  const boardColumnLimitReached = useMemo(
    () =>
      viewState.viewMode === "board"
      && !searchWithinLoadedIssues
      && boardIssueQueries.some((query) => (query.data?.length ?? 0) === ISSUE_BOARD_COLUMN_RESULT_LIMIT),
    [boardIssueQueries, searchWithinLoadedIssues, viewState.viewMode],
  );

  const filtered = useMemo(() => {
    const useRemoteSearch = normalizedIssueSearch.length > 0 && !searchWithinLoadedIssues;
    const sourceIssues = boardIssues ?? (useRemoteSearch ? searchedIssues : issues);
    const searchScopedIssues = normalizedIssueSearch.length > 0 && searchWithinLoadedIssues
      ? sourceIssues.filter((issue) => issueMatchesLocalSearch(issue, normalizedIssueSearch))
      : sourceIssues;
    const filteredByControls = applyIssueFilters(
      searchScopedIssues,
      viewState,
      currentUserId,
      enableRoutineVisibilityFilter,
      liveIssueIds,
      lookups.issueFilterWorkspaceContext,
    );
    return sortIssues(filteredByControls, viewState);
  }, [
    boardIssues,
    issues,
    searchedIssues,
    searchWithinLoadedIssues,
    viewState,
    normalizedIssueSearch,
    currentUserId,
    enableRoutineVisibilityFilter,
    liveIssueIds,
    lookups.issueFilterWorkspaceContext,
  ]);

  const progressSummary = useMemo(
    () => shouldRenderSubIssueProgressSummary(showProgressSummary, issues.length)
      ? buildSubIssueProgressSummary(issues)
      : null,
    [issues, showProgressSummary],
  );
  const checklistAffordanceEnabled = useMemo(
    () =>
      defaultSortField === "workflow"
      && viewState.groupBy === "none",
    [defaultSortField, viewState.groupBy],
  );
  const workflowChecklistMeta = useMemo(() => {
    if (!checklistAffordanceEnabled) return null;
    return buildWorkflowChecklistMeta(filtered, issueById, viewState.nestingEnabled);
  }, [checklistAffordanceEnabled, filtered, issueById, viewState.nestingEnabled]);

  const activeFilterCount = countActiveIssueFilters(viewState, enableRoutineVisibilityFilter);

  const groupedContent = useMemo(() => buildIssueGroups({
    issues: filtered,
    viewState,
    issueFilterWorkspaceContext: lookups.issueFilterWorkspaceContext,
    workspaceNameMap: lookups.workspaceNameMap,
    projectById: lookups.projectById,
    issueTitleMap,
    currentUserId,
    companyUserLabelMap: lookups.companyUserLabelMap,
    agentName: lookups.agentName,
  }), [
    filtered,
    lookups.issueFilterWorkspaceContext,
    viewState,
    lookups.workspaceNameMap,
    lookups.projectById,
    issueTitleMap,
    currentUserId,
    lookups.companyUserLabelMap,
    lookups.agentName,
  ]);

  const newIssueDefaults = useCallback((groupKey?: string) => {
    const defaults: Record<string, unknown> = { ...(baseCreateIssueDefaults ?? {}) };
    if (projectId && defaults.projectId === undefined) defaults.projectId = projectId;
    if (groupKey) {
      if (viewState.groupBy === "status") defaults.status = groupKey;
      else if (viewState.groupBy === "priority") defaults.priority = groupKey;
      else if (viewState.groupBy === "assignee" && groupKey !== "__unassigned") {
        if (groupKey.startsWith("__user:")) defaults.assigneeUserId = groupKey.slice("__user:".length);
        else defaults.assigneeAgentId = groupKey;
      }
      else if (viewState.groupBy === "project" && groupKey !== "__no_project") defaults.projectId = groupKey;
      else if (viewState.groupBy === "parent" && groupKey !== "__no_parent") {
        const parentIssue = issueById.get(groupKey);
        if (parentIssue) Object.assign(defaults, buildSubIssueDefaultsForViewer(parentIssue, currentUserId));
        else defaults.parentId = groupKey;
      }
    }
    return defaults;
  }, [baseCreateIssueDefaults, currentUserId, issueById, projectId, viewState.groupBy]);

  const openCreateIssueDialog = useCallback((groupKey?: string) => {
    openNewIssue(newIssueDefaults(groupKey));
  }, [newIssueDefaults, openNewIssue]);

  const filterToWorkspace = useCallback((workspaceId: string) => {
    updateView({ workspaces: [workspaceId] });
  }, [updateView]);

  const assignIssue = useCallback((issueId: string, assigneeAgentId: string | null, assigneeUserId: string | null = null) => {
    onUpdateIssue(issueId, { assigneeAgentId, assigneeUserId });
    setAssigneePickerIssueId(null);
    setAssigneeSearch("");
  }, [onUpdateIssue, setAssigneePickerIssueId, setAssigneeSearch]);

  return {
    filtered,
    progressSummary,
    boardColumnLimitReached,
    groupedContent,
    createActionLabel: createIssueLabel ? `Create ${createIssueLabel}` : "Create Issue",
    createButtonLabel: createIssueLabel ? `New ${createIssueLabel}` : "New Issue",
    openCreateIssueDialog,
    filterToWorkspace,
    assignIssue,
    availableIssueColumns: lookups.availableIssueColumns,
    availableIssueColumnSet: lookups.availableIssueColumnSet,
    visibleTrailingIssueColumns: lookups.visibleTrailingIssueColumns,
    issueById,
    projectById: lookups.projectById,
    projectWorkspaceById: lookups.projectWorkspaceById,
    executionWorkspaceById: lookups.executionWorkspaceById,
    defaultProjectWorkspaceIdByProjectId: lookups.defaultProjectWorkspaceIdByProjectId,
    issueFilterWorkspaceContext: lookups.issueFilterWorkspaceContext,
    companyUserProfileMap: lookups.companyUserProfileMap,
    companyUserLabelMap: lookups.companyUserLabelMap,
    workflowChecklistMeta,
    activeFilterCount,
    creatorOptions: lookups.creatorOptions,
    toolbarLabels: labels?.map((label) => ({ id: label.id, name: label.name, color: label.color })),
    workspaceOptions: lookups.workspaceOptions,
    issueLinkState,
    parentIssueIdForCostSummary,
    mutedIssueIds,
    issueBadgeById,
    agentName: lookups.agentName,
    searchResultLimitReached: !searchWithinLoadedIssues
      && normalizedIssueSearch.length > 0
      && searchedIssues.length === ISSUE_SEARCH_RESULT_LIMIT,
  };
}

export type IssuesListModel = ReturnType<typeof useIssuesListModel>;
