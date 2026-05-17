import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { CircleDot } from "lucide-react";
import type { Issue } from "@paperclipai/shared";
import { accessApi } from "../api/access";
import { authApi } from "../api/auth";
import { executionWorkspacesApi } from "../api/execution-workspaces";
import { instanceSettingsApi } from "../api/instanceSettings";
import { issuesApi } from "../api/issues";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { buildCompanyUserLabelMap, buildCompanyUserProfileMap } from "../lib/company-members";
import {
  applyIssueFilters,
  countActiveIssueFilters,
} from "../lib/issue-filters";
import {
  buildSubIssueProgressSummary,
  shouldRenderSubIssueProgressSummary,
} from "../lib/issue-detail-subissues";
import {
  DEFAULT_INBOX_ISSUE_COLUMNS,
  getAvailableInboxIssueColumns,
  normalizeInboxIssueColumns,
  type InboxIssueColumn,
} from "../lib/inbox";
import { queryKeys } from "../lib/queryKeys";
import { buildSubIssueDefaultsForViewer } from "../lib/subIssueDefaults";
import { EmptyState } from "./EmptyState";
import { KanbanBoard } from "./KanbanBoard";
import { PageSkeleton } from "./PageSkeleton";
import { issueTrailingColumns } from "./IssueColumns";
import {
  ISSUE_BOARD_COLUMN_RESULT_LIMIT,
  ISSUE_SEARCH_RESULT_LIMIT,
  boardIssueStatuses,
} from "./issues-list/constants";
import { issueMatchesLocalSearch, sortIssues } from "./issues-list/filtering";
import { buildIssueGroups } from "./issues-list/grouping";
import { IssuesListRows } from "./issues-list/IssuesListRows";
import { IssuesListToolbar } from "./issues-list/IssuesListToolbar";
import { buildCreatorOptions } from "./issues-list/options";
import { SubIssueProgressSummaryStrip } from "./issues-list/SubIssueProgressSummaryStrip";
import type { IssuesListProps, IssueViewState } from "./issues-list/types";
import { useIssueRowPagination } from "./issues-list/useIssueRowPagination";
import {
  getInitialWorkspaceViewState,
  loadIssueColumns,
  saveIssueColumns,
  saveViewState,
} from "./issues-list/view-state";
import { buildWorkflowChecklistMeta } from "./issues-list/workflow-checklist";
import {
  buildDefaultProjectWorkspaceIdByProjectId,
  buildExecutionWorkspaceById,
  buildProjectById,
  buildProjectWorkspaceById,
  buildWorkspaceNameMap,
  buildWorkspaceOptions,
} from "./issues-list/workspace-lookups";

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
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const isolatedWorkspacesEnabled = experimentalSettings?.enableIsolatedWorkspaces === true;

  const scopedKey = selectedCompanyId ? `${viewStateKey}:${selectedCompanyId}` : viewStateKey;
  const initialAssigneesKey = initialAssignees?.join("|") ?? "";
  const initialWorkspacesKey = initialWorkspaces?.join("|") ?? "";

  const [viewState, setViewState] = useState<IssueViewState>(() =>
    getInitialWorkspaceViewState(scopedKey, initialAssignees, initialWorkspaces, defaultSortField),
  );
  const [assigneePickerIssueId, setAssigneePickerIssueId] = useState<string | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState(initialSearch ?? "");
  const [visibleIssueColumns, setVisibleIssueColumns] = useState<InboxIssueColumn[]>(() => loadIssueColumns(scopedKey));
  const deferredIssueSearch = useDeferredValue(issueSearch);
  const normalizedIssueSearch = deferredIssueSearch.trim().toLowerCase();

  useEffect(() => {
    setIssueSearch(initialSearch ?? "");
  }, [initialSearch]);

  const prevViewStateContextKey = useRef(`${scopedKey}::${initialAssigneesKey}::${initialWorkspacesKey}`);
  useEffect(() => {
    const nextContextKey = `${scopedKey}::${initialAssigneesKey}::${initialWorkspacesKey}`;
    if (prevViewStateContextKey.current !== nextContextKey) {
      prevViewStateContextKey.current = nextContextKey;
      setViewState(getInitialWorkspaceViewState(scopedKey, initialAssignees, initialWorkspaces, defaultSortField));
    }
  }, [scopedKey, initialAssignees, initialAssigneesKey, initialWorkspaces, initialWorkspacesKey, defaultSortField]);

  const prevColumnsScopedKey = useRef(scopedKey);
  useEffect(() => {
    if (prevColumnsScopedKey.current !== scopedKey) {
      prevColumnsScopedKey.current = scopedKey;
      setVisibleIssueColumns(loadIssueColumns(scopedKey));
    }
  }, [scopedKey]);

  const updateView = useCallback((patch: Partial<IssueViewState>) => {
    setViewState((prev) => {
      const next = { ...prev, ...patch };
      saveViewState(scopedKey, next);
      return next;
    });
  }, [scopedKey]);

  useEffect(() => {
    const parentIds = new Set(issues.map((issue) => issue.parentId).filter(Boolean) as string[]);
    const pruned = viewState.collapsedParents.filter((id) => parentIds.has(id));
    if (pruned.length !== viewState.collapsedParents.length) {
      updateView({ collapsedParents: pruned });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues]);

  const { data: searchedIssues = [] } = useQuery({
    queryKey: [
      ...queryKeys.issues.search(selectedCompanyId!, normalizedIssueSearch, projectId),
      searchFilters ?? {},
      ISSUE_SEARCH_RESULT_LIMIT,
      enableRoutineVisibilityFilter ? "with-routine-executions" : "without-routine-executions",
    ],
    queryFn: () =>
      issuesApi.list(selectedCompanyId!, {
        q: normalizedIssueSearch,
        projectId,
        limit: ISSUE_SEARCH_RESULT_LIMIT,
        ...searchFilters,
        ...(enableRoutineVisibilityFilter ? { includeRoutineExecutions: true } : {}),
      }),
    enabled: !!selectedCompanyId && normalizedIssueSearch.length > 0 && !searchWithinLoadedIssues,
    placeholderData: (previousData) => previousData,
  });

  const boardIssueQueries = useQueries({
    queries: boardIssueStatuses.map((status) => ({
      queryKey: [
        ...queryKeys.issues.list(selectedCompanyId ?? "__no-company__"),
        "board-column",
        status,
        normalizedIssueSearch,
        projectId ?? "__all-projects__",
        searchFilters ?? {},
        ISSUE_BOARD_COLUMN_RESULT_LIMIT,
        enableRoutineVisibilityFilter ? "with-routine-executions" : "without-routine-executions",
      ],
      queryFn: () =>
        issuesApi.list(selectedCompanyId!, {
          ...searchFilters,
          ...(normalizedIssueSearch.length > 0 ? { q: normalizedIssueSearch } : {}),
          projectId,
          status,
          limit: ISSUE_BOARD_COLUMN_RESULT_LIMIT,
          ...(enableRoutineVisibilityFilter ? { includeRoutineExecutions: true } : {}),
        }),
      enabled: !!selectedCompanyId && viewState.viewMode === "board" && !searchWithinLoadedIssues,
      placeholderData: (previousData: Issue[] | undefined) => previousData,
    })),
  });

  const { data: executionWorkspaces = [] } = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.executionWorkspaces.summaryList(selectedCompanyId)
      : ["execution-workspaces", "__disabled__"],
    queryFn: () => executionWorkspacesApi.listSummaries(selectedCompanyId!),
    enabled: !!selectedCompanyId && isolatedWorkspacesEnabled,
  });

  const agentName = useCallback((id: string | null) => {
    if (!id || !agents) return null;
    return agents.find((agent) => agent.id === id)?.name ?? null;
  }, [agents]);

  const companyUserLabelMap = useMemo(
    () => buildCompanyUserLabelMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const companyUserProfileMap = useMemo(
    () => buildCompanyUserProfileMap(companyMembers?.users),
    [companyMembers?.users],
  );

  const projectById = useMemo(() => buildProjectById(projects), [projects]);
  const projectWorkspaceById = useMemo(() => buildProjectWorkspaceById(projects), [projects]);
  const defaultProjectWorkspaceIdByProjectId = useMemo(
    () => buildDefaultProjectWorkspaceIdByProjectId(projects),
    [projects],
  );
  const defaultProjectWorkspaceIds = useMemo(
    () => new Set(defaultProjectWorkspaceIdByProjectId.values()),
    [defaultProjectWorkspaceIdByProjectId],
  );

  const executionWorkspaceById = useMemo(
    () => buildExecutionWorkspaceById(executionWorkspaces),
    [executionWorkspaces],
  );
  const issueFilterWorkspaceContext = useMemo(() => ({
    executionWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  }), [defaultProjectWorkspaceIdByProjectId, executionWorkspaceById]);

  const workspaceNameMap = useMemo(() => buildWorkspaceNameMap({
    projectWorkspaceById,
    executionWorkspaceById,
    defaultProjectWorkspaceIds,
  }), [defaultProjectWorkspaceIds, executionWorkspaceById, projectWorkspaceById]);
  const workspaceOptions = useMemo(() => buildWorkspaceOptions(workspaceNameMap), [workspaceNameMap]);
  const creatorOptions = useMemo(
    () => buildCreatorOptions({ issues, agents, currentUserId }),
    [agents, currentUserId, issues],
  );

  const visibleIssueColumnSet = useMemo(() => new Set(visibleIssueColumns), [visibleIssueColumns]);
  const availableIssueColumns = useMemo(
    () => getAvailableInboxIssueColumns(isolatedWorkspacesEnabled),
    [isolatedWorkspacesEnabled],
  );
  const availableIssueColumnSet = useMemo(() => new Set(availableIssueColumns), [availableIssueColumns]);
  const visibleTrailingIssueColumns = useMemo(
    () => issueTrailingColumns.filter((column) => visibleIssueColumnSet.has(column) && availableIssueColumnSet.has(column)),
    [availableIssueColumnSet, visibleIssueColumnSet],
  );

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
      issueFilterWorkspaceContext,
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
    issueFilterWorkspaceContext,
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

  const { data: labels } = useQuery({
    queryKey: queryKeys.issues.labels(selectedCompanyId!),
    queryFn: () => issuesApi.listLabels(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const activeFilterCount = countActiveIssueFilters(viewState, enableRoutineVisibilityFilter);

  const groupedContent = useMemo(() => buildIssueGroups({
    issues: filtered,
    viewState,
    issueFilterWorkspaceContext,
    workspaceNameMap,
    projectById,
    issueTitleMap,
    currentUserId,
    companyUserLabelMap,
    agentName,
  }), [
    filtered,
    issueFilterWorkspaceContext,
    viewState,
    workspaceNameMap,
    projectById,
    issueTitleMap,
    currentUserId,
    companyUserLabelMap,
    agentName,
  ]);

  const { renderedIssueRowLimit, remainingIssueRowCount } = useIssueRowPagination({
    rootRef,
    issues: filtered,
    viewMode: viewState.viewMode,
    isLoading,
    hasMoreIssues,
    isLoadingMoreIssues,
    onLoadMoreIssues,
  });

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

  const createActionLabel = createIssueLabel ? `Create ${createIssueLabel}` : "Create Issue";
  const createButtonLabel = createIssueLabel ? `New ${createIssueLabel}` : "New Issue";
  const openCreateIssueDialog = useCallback((groupKey?: string) => {
    openNewIssue(newIssueDefaults(groupKey));
  }, [newIssueDefaults, openNewIssue]);

  const filterToWorkspace = useCallback((workspaceId: string) => {
    updateView({ workspaces: [workspaceId] });
  }, [updateView]);

  const setIssueColumns = useCallback((next: InboxIssueColumn[]) => {
    const normalized = normalizeInboxIssueColumns(next);
    setVisibleIssueColumns(normalized);
    saveIssueColumns(scopedKey, normalized);
  }, [scopedKey]);

  const toggleIssueColumn = useCallback((column: InboxIssueColumn, enabled: boolean) => {
    if (enabled) {
      setIssueColumns([...visibleIssueColumns, column]);
      return;
    }
    setIssueColumns(visibleIssueColumns.filter((value) => value !== column));
  }, [setIssueColumns, visibleIssueColumns]);

  const assignIssue = useCallback((issueId: string, assigneeAgentId: string | null, assigneeUserId: string | null = null) => {
    onUpdateIssue(issueId, { assigneeAgentId, assigneeUserId });
    setAssigneePickerIssueId(null);
    setAssigneeSearch("");
  }, [onUpdateIssue]);

  return (
    <div ref={rootRef} className="space-y-4">
      {progressSummary ? (
        <SubIssueProgressSummaryStrip
          summary={progressSummary}
          issueLinkState={issueLinkState}
          parentIssueIdForCostSummary={parentIssueIdForCostSummary}
        />
      ) : null}

      <IssuesListToolbar
        filteredCount={filtered.length}
        loadedCount={issues.length}
        createButtonLabel={createButtonLabel}
        issueSearch={issueSearch}
        onIssueSearchChange={(nextSearch) => {
          setIssueSearch(nextSearch);
          onSearchChange?.(nextSearch);
        }}
        onCreateIssue={() => openCreateIssueDialog()}
        viewState={viewState}
        updateView={updateView}
        availableIssueColumns={availableIssueColumns}
        visibleIssueColumnSet={visibleIssueColumnSet}
        toggleIssueColumn={toggleIssueColumn}
        resetIssueColumns={() => setIssueColumns(DEFAULT_INBOX_ISSUE_COLUMNS)}
        activeFilterCount={activeFilterCount}
        agents={agents}
        creators={creatorOptions}
        projects={projects}
        labels={labels?.map((label) => ({ id: label.id, name: label.name, color: label.color }))}
        currentUserId={currentUserId}
        enableRoutineVisibilityFilter={enableRoutineVisibilityFilter}
        workspaces={isolatedWorkspacesEnabled ? workspaceOptions : undefined}
      />

      {isLoading && <PageSkeleton variant="issues-list" />}
      {error && <p className="text-sm text-destructive">{error.message}</p>}
      {!searchWithinLoadedIssues && normalizedIssueSearch.length > 0 && searchedIssues.length === ISSUE_SEARCH_RESULT_LIMIT && (
        <p className="text-xs text-muted-foreground">
          Showing up to {ISSUE_SEARCH_RESULT_LIMIT} matches. Refine the search to narrow further.
        </p>
      )}
      {boardColumnLimitReached && (
        <p className="text-xs text-muted-foreground">
          Some board columns are showing up to {ISSUE_BOARD_COLUMN_RESULT_LIMIT} issues. Refine filters or search to reveal the rest.
        </p>
      )}
      {!isLoading && filtered.length === 0 && viewState.viewMode === "list" && (
        <EmptyState
          icon={CircleDot}
          message="No issues match the current filters or search."
          action={createActionLabel}
          onAction={() => openCreateIssueDialog()}
        />
      )}

      {viewState.viewMode === "board" ? (
        <KanbanBoard
          issues={filtered}
          agents={agents}
          liveIssueIds={liveIssueIds}
          onUpdateIssue={onUpdateIssue}
        />
      ) : (
        <>
          <IssuesListRows
            groups={groupedContent}
            rowLimit={renderedIssueRowLimit}
            viewState={viewState}
            updateView={updateView}
            openCreateIssueDialog={openCreateIssueDialog}
            issueLinkState={issueLinkState}
            agents={agents}
            liveIssueIds={liveIssueIds}
            mutedIssueIds={mutedIssueIds}
            issueBadgeById={issueBadgeById}
            issueById={issueById}
            projectById={projectById}
            projectWorkspaceById={projectWorkspaceById}
            executionWorkspaceById={executionWorkspaceById}
            defaultProjectWorkspaceIdByProjectId={defaultProjectWorkspaceIdByProjectId}
            issueFilterWorkspaceContext={issueFilterWorkspaceContext}
            companyUserProfileMap={companyUserProfileMap}
            companyUserLabelMap={companyUserLabelMap}
            currentUserId={currentUserId}
            visibleIssueColumnSet={visibleIssueColumnSet}
            availableIssueColumnSet={availableIssueColumnSet}
            visibleTrailingIssueColumns={visibleTrailingIssueColumns}
            workflowChecklistMeta={workflowChecklistMeta}
            assigneePickerIssueId={assigneePickerIssueId}
            setAssigneePickerIssueId={setAssigneePickerIssueId}
            assigneeSearch={assigneeSearch}
            setAssigneeSearch={setAssigneeSearch}
            assignIssue={assignIssue}
            agentName={agentName}
            filterToWorkspace={filterToWorkspace}
            onUpdateIssue={onUpdateIssue}
          />
          {(remainingIssueRowCount > 0 || hasMoreIssues || isLoadingMoreIssues) && (
            <div className="py-2" data-testid="issues-load-more-sentinel">
              <p className="text-xs text-muted-foreground">
                {isLoadingMoreIssues
                  ? "Loading more issues..."
                  : remainingIssueRowCount > 0
                    ? `Rendering ${Math.min(renderedIssueRowLimit, filtered.length)} of ${filtered.length} issues`
                    : "Scroll to load more issues"}
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
