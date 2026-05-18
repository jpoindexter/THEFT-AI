import { useRef } from "react";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { IssuesListContent } from "./issues-list/IssuesListContent";
import type { IssuesListProps } from "./issues-list/types";
import { useIssueRowPagination } from "./issues-list/useIssueRowPagination";
import { useIssuesListModel } from "./issues-list/useIssuesListModel";
import { useIssuesListRemoteData } from "./issues-list/useIssuesListRemoteData";
import { useIssuesListState } from "./issues-list/useIssuesListState";

export type { IssueSortField, IssueViewState } from "./issues-list/types";

export function IssuesList({
  issues,
  isLoading,
  error,
  agents,
  projects,
  liveIssueIds,
  projectId,
  viewStateKey,
  issueLinkState,
  initialAssignees,
  initialWorkspaces,
  initialSearch,
  searchFilters,
  searchWithinLoadedIssues = false,
  baseCreateIssueDefaults,
  createIssueLabel,
  defaultSortField,
  showProgressSummary = false,
  parentIssueIdForCostSummary,
  enableRoutineVisibilityFilter = false,
  hasMoreIssues = false,
  isLoadingMoreIssues = false,
  mutedIssueIds,
  issueBadgeById,
  onLoadMoreIssues,
  onSearchChange,
  onUpdateIssue,
}: IssuesListProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const { selectedCompanyId } = useCompany();
  const { openNewIssue } = useDialogActions();

  const state = useIssuesListState({
    issues,
    selectedCompanyId,
    viewStateKey,
    initialAssignees,
    initialWorkspaces,
    initialSearch,
    defaultSortField,
    onSearchChange,
  });

  const remote = useIssuesListRemoteData({
    selectedCompanyId,
    normalizedIssueSearch: state.normalizedIssueSearch,
    projectId,
    searchFilters,
    searchWithinLoadedIssues,
    enableRoutineVisibilityFilter,
    viewMode: state.viewState.viewMode,
  });

  const model = useIssuesListModel({
    issues,
    isLoading,
    error,
    agents,
    projects,
    liveIssueIds,
    projectId,
    viewStateKey,
    issueLinkState,
    initialAssignees,
    initialWorkspaces,
    initialSearch,
    searchFilters,
    searchWithinLoadedIssues,
    baseCreateIssueDefaults,
    createIssueLabel,
    defaultSortField,
    showProgressSummary,
    parentIssueIdForCostSummary,
    enableRoutineVisibilityFilter,
    hasMoreIssues,
    isLoadingMoreIssues,
    mutedIssueIds,
    issueBadgeById,
    onLoadMoreIssues,
    onSearchChange,
    onUpdateIssue,
    viewState: state.viewState,
    updateView: state.updateView,
    normalizedIssueSearch: state.normalizedIssueSearch,
    visibleIssueColumnSet: state.visibleIssueColumnSet,
    currentUserId: remote.currentUserId,
    isolatedWorkspacesEnabled: remote.isolatedWorkspacesEnabled,
    companyMembers: remote.companyMembers,
    searchedIssues: remote.searchedIssues,
    boardIssueQueries: remote.boardIssueQueries,
    executionWorkspaces: remote.executionWorkspaces,
    labels: remote.labels,
    openNewIssue,
    setAssigneePickerIssueId: state.setAssigneePickerIssueId,
    setAssigneeSearch: state.setAssigneeSearch,
  });

  const { renderedIssueRowLimit, remainingIssueRowCount } = useIssueRowPagination({
    rootRef,
    issues: model.filtered,
    viewMode: state.viewState.viewMode,
    isLoading,
    hasMoreIssues,
    isLoadingMoreIssues,
    onLoadMoreIssues,
  });

  return (
    <IssuesListContent
      rootRef={rootRef}
      state={state}
      model={model}
      issues={issues}
      isLoading={isLoading}
      error={error}
      agents={agents}
      projects={projects}
      liveIssueIds={liveIssueIds}
      enableRoutineVisibilityFilter={enableRoutineVisibilityFilter}
      hasMoreIssues={hasMoreIssues}
      isLoadingMoreIssues={isLoadingMoreIssues}
      onUpdateIssue={onUpdateIssue}
      isolatedWorkspacesEnabled={remote.isolatedWorkspacesEnabled}
      currentUserId={remote.currentUserId}
      renderedIssueRowLimit={renderedIssueRowLimit}
      remainingIssueRowCount={remainingIssueRowCount}
    />
  );
}
