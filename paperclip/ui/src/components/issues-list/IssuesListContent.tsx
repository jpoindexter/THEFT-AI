import type { RefObject } from "react";
import { CircleDot } from "lucide-react";
import { DEFAULT_INBOX_ISSUE_COLUMNS } from "../../lib/inbox";
import { EmptyState } from "../EmptyState";
import { KanbanBoard } from "../KanbanBoard";
import { PageSkeleton } from "../PageSkeleton";
import {
  ISSUE_BOARD_COLUMN_RESULT_LIMIT,
  ISSUE_SEARCH_RESULT_LIMIT,
} from "./constants";
import { IssuesListRows } from "./IssuesListRows";
import { IssuesListToolbar } from "./IssuesListToolbar";
import { SubIssueProgressSummaryStrip } from "./SubIssueProgressSummaryStrip";
import type { IssuesListProps } from "./types";
import type { IssuesListModel } from "./useIssuesListModel";
import type { useIssuesListState } from "./useIssuesListState";

type IssuesListState = ReturnType<typeof useIssuesListState>;

export function IssuesListContent({
  rootRef,
  state,
  model,
  issues,
  isLoading,
  error,
  agents,
  projects,
  liveIssueIds,
  enableRoutineVisibilityFilter,
  hasMoreIssues,
  isLoadingMoreIssues,
  onUpdateIssue,
  isolatedWorkspacesEnabled,
  currentUserId,
  renderedIssueRowLimit,
  remainingIssueRowCount,
}: {
  rootRef: RefObject<HTMLDivElement | null>;
  state: IssuesListState;
  model: IssuesListModel;
  issues: IssuesListProps["issues"];
  isLoading?: IssuesListProps["isLoading"];
  error?: IssuesListProps["error"];
  agents?: IssuesListProps["agents"];
  projects?: IssuesListProps["projects"];
  liveIssueIds?: IssuesListProps["liveIssueIds"];
  enableRoutineVisibilityFilter: boolean;
  hasMoreIssues: boolean;
  isLoadingMoreIssues: boolean;
  onUpdateIssue: IssuesListProps["onUpdateIssue"];
  isolatedWorkspacesEnabled: boolean;
  currentUserId: string | null;
  renderedIssueRowLimit: number;
  remainingIssueRowCount: number;
}) {
  return (
    <div ref={rootRef} className="space-y-4">
      {model.progressSummary ? (
        <SubIssueProgressSummaryStrip
          summary={model.progressSummary}
          issueLinkState={model.issueLinkState}
          parentIssueIdForCostSummary={model.parentIssueIdForCostSummary}
        />
      ) : null}

      <IssuesListToolbar
        filteredCount={model.filtered.length}
        loadedCount={issues.length}
        createButtonLabel={model.createButtonLabel}
        issueSearch={state.issueSearch}
        onIssueSearchChange={state.handleIssueSearchChange}
        onCreateIssue={() => model.openCreateIssueDialog()}
        viewState={state.viewState}
        updateView={state.updateView}
        availableIssueColumns={model.availableIssueColumns}
        visibleIssueColumnSet={state.visibleIssueColumnSet}
        toggleIssueColumn={state.toggleIssueColumn}
        resetIssueColumns={() => state.setIssueColumns(DEFAULT_INBOX_ISSUE_COLUMNS)}
        activeFilterCount={model.activeFilterCount}
        agents={agents}
        creators={model.creatorOptions}
        projects={projects}
        labels={model.toolbarLabels}
        currentUserId={currentUserId}
        enableRoutineVisibilityFilter={enableRoutineVisibilityFilter}
        workspaces={isolatedWorkspacesEnabled ? model.workspaceOptions : undefined}
      />

      {isLoading && <PageSkeleton variant="issues-list" />}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {model.searchResultLimitReached && (
        <p className="text-xs text-muted-foreground">
          Showing up to {ISSUE_SEARCH_RESULT_LIMIT} matches. Refine the search to narrow further.
        </p>
      )}
      {model.boardColumnLimitReached && (
        <p className="text-xs text-muted-foreground">
          Some board columns are showing up to {ISSUE_BOARD_COLUMN_RESULT_LIMIT} issues. Refine filters or search to reveal the rest.
        </p>
      )}
      {!isLoading && model.filtered.length === 0 && state.viewState.viewMode === "list" && (
        <EmptyState
          icon={CircleDot}
          message="No issues match the current filters or search."
          action={model.createActionLabel}
          onAction={() => model.openCreateIssueDialog()}
        />
      )}

      {state.viewState.viewMode === "board" ? (
        <KanbanBoard
          issues={model.filtered}
          agents={agents}
          liveIssueIds={liveIssueIds}
          onUpdateIssue={onUpdateIssue}
        />
      ) : (
        <>
          <IssuesListRows
            groups={model.groupedContent}
            rowLimit={renderedIssueRowLimit}
            viewState={state.viewState}
            updateView={state.updateView}
            openCreateIssueDialog={model.openCreateIssueDialog}
            issueLinkState={model.issueLinkState}
            agents={agents}
            liveIssueIds={liveIssueIds}
            mutedIssueIds={model.mutedIssueIds}
            issueBadgeById={model.issueBadgeById}
            issueById={model.issueById}
            projectById={model.projectById}
            projectWorkspaceById={model.projectWorkspaceById}
            executionWorkspaceById={model.executionWorkspaceById}
            defaultProjectWorkspaceIdByProjectId={model.defaultProjectWorkspaceIdByProjectId}
            issueFilterWorkspaceContext={model.issueFilterWorkspaceContext}
            companyUserProfileMap={model.companyUserProfileMap}
            companyUserLabelMap={model.companyUserLabelMap}
            currentUserId={currentUserId}
            visibleIssueColumnSet={state.visibleIssueColumnSet}
            availableIssueColumnSet={model.availableIssueColumnSet}
            visibleTrailingIssueColumns={model.visibleTrailingIssueColumns}
            workflowChecklistMeta={model.workflowChecklistMeta}
            assigneePickerIssueId={state.assigneePickerIssueId}
            setAssigneePickerIssueId={state.setAssigneePickerIssueId}
            assigneeSearch={state.assigneeSearch}
            setAssigneeSearch={state.setAssigneeSearch}
            assignIssue={model.assignIssue}
            agentName={model.agentName}
            filterToWorkspace={model.filterToWorkspace}
            onUpdateIssue={onUpdateIssue}
          />
          {(remainingIssueRowCount > 0 || hasMoreIssues || isLoadingMoreIssues) && (
            <div className="py-2" data-testid="issues-load-more-sentinel">
              <p className="text-xs text-muted-foreground">
                {isLoadingMoreIssues
                  ? "Loading more issues..."
                  : remainingIssueRowCount > 0
                    ? `Rendering ${Math.min(renderedIssueRowLimit, model.filtered.length)} of ${model.filtered.length} issues`
                    : "Scroll to load more issues"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
