import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useLocation, useSearchParams } from "@/lib/router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";
import { issuesApi } from "../api/issues";
import { agentsApi } from "../api/agents";
import { projectsApi } from "../api/projects";
import { heartbeatsApi } from "../api/heartbeats";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useDialogActions } from "../context/DialogContext";
import { collectLiveIssueIds } from "../lib/liveIssueIds";
import { queryKeys } from "../lib/queryKeys";
import { createIssueDetailLocationState } from "../lib/issueDetailBreadcrumb";
import { EmptyState } from "../components/EmptyState";
import { IssuesList } from "../components/IssuesList";
import { TasksMissionHeader, TheftWorkbenchTemplate, type TasksOperatorPromptKind } from "@/components/theft";
import { CircleDot } from "lucide-react";
import {
  ISSUES_PAGE_SIZE,
  WORKSPACE_FILTER_ISSUE_LIMIT,
  buildFounderTaskBuckets,
  buildIssuesSearchUrl,
  getNextIssuesPageOffset,
  mergeIssuePagesStable,
} from "../lib/issuesPage";

export {
  buildFounderTaskBuckets,
  buildIssuesSearchUrl,
  getNextIssuesPageOffset,
  mergeIssuePagesStable,
  needsFounderAction,
} from "../lib/issuesPage";

export function Issues() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { openNewIssue } = useDialogActions();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const fetchNextPageInFlightRef = useRef(false);

  const urlSearch = searchParams.get("q") ?? "";
  const [searchOverride, setSearchOverride] = useState<{ search: string; locationSearch: string } | null>(null);
  const syncedSearch = useMemo(() => {
    if (typeof window !== "undefined" && searchOverride?.locationSearch === window.location.search) {
      return searchOverride.search;
    }
    return urlSearch;
  }, [searchOverride, urlSearch, location.search]);
  const participantAgentId = searchParams.get("participantAgentId") ?? undefined;
  const initialWorkspaces = searchParams.getAll("workspace").filter((workspaceId) => workspaceId.length > 0);
  const workspaceIdFilter = initialWorkspaces.length === 1 ? initialWorkspaces[0] : undefined;
  const handleSearchChange = useCallback((search: string) => {
    const nextUrl = buildIssuesSearchUrl(window.location.href, search);
    if (!nextUrl) {
      setSearchOverride(null);
      return;
    }
    window.history.replaceState(window.history.state, "", nextUrl);
    setSearchOverride({ search, locationSearch: window.location.search });
  }, []);

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 5000,
  });

  const liveIssueIds = useMemo(() => collectLiveIssueIds(liveRuns), [liveRuns]);

  const issueLinkState = useMemo(
    () =>
      createIssueDetailLocationState(
        "Tasks",
        `${location.pathname}${location.search}${location.hash}`,
        "issues",
      ),
    [location.pathname, location.search, location.hash],
  );

  useEffect(() => {
    setBreadcrumbs([{ label: "Tasks" }]);
  }, [setBreadcrumbs]);

  const issuePageSize = workspaceIdFilter ? WORKSPACE_FILTER_ISSUE_LIMIT : ISSUES_PAGE_SIZE;

  const {
    data: issuePages,
    isLoading,
    isFetchingNextPage,
    error,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery({
    queryKey: [
      ...queryKeys.issues.list(selectedCompanyId!),
      "participant-agent",
      participantAgentId ?? "__all__",
      "workspace",
      workspaceIdFilter ?? "__all__",
      "with-routine-executions",
      "infinite",
      issuePageSize,
    ],
    queryFn: ({ pageParam }) => issuesApi.list(selectedCompanyId!, {
      participantAgentId,
      workspaceId: workspaceIdFilter,
      includeRoutineExecutions: true,
      limit: issuePageSize,
      offset: pageParam,
    }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, _allPages, lastPageParam) =>
      getNextIssuesPageOffset(lastPage.length, lastPageParam, issuePageSize),
    enabled: !!selectedCompanyId,
    placeholderData: (previousData) => previousData,
  });

  const issues = useMemo(() => mergeIssuePagesStable(issuePages?.pages ?? []), [issuePages]);
  const founderBuckets = useMemo(() => buildFounderTaskBuckets(issues), [issues]);
  const hasMoreServerIssues = syncedSearch.trim().length === 0
    && hasNextPage === true;
  const loadMoreServerIssues = useCallback(() => {
    if (!hasNextPage || isFetchingNextPage || fetchNextPageInFlightRef.current) return;
    fetchNextPageInFlightRef.current = true;
    void fetchNextPage({ cancelRefetch: false }).finally(() => {
      fetchNextPageInFlightRef.current = false;
    });
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const updateIssue = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      issuesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId!) });
    },
  });
  const handleOperatorPrompt = useCallback((kind: TasksOperatorPromptKind, issue: Issue | null) => {
    openNewIssue(buildOperatorPromptIssueDefaults(kind, issue));
  }, [openNewIssue]);

  if (!selectedCompanyId) {
    return <EmptyState icon={CircleDot} message="Select a company to view issues." />;
  }

  return (
    <TheftWorkbenchTemplate
      className="min-h-0 bg-background text-foreground"
      contentClassName="block space-y-5 overflow-x-hidden px-1 pb-24 md:px-3"
    >
      <TasksMissionHeader
        buckets={founderBuckets}
        isLoading={isLoading}
        issueLinkState={issueLinkState}
        agents={agents}
        onOperatorPrompt={handleOperatorPrompt}
      />
      <IssuesList
        issues={issues ?? []}
        isLoading={isLoading}
        isLoadingMoreIssues={isFetchingNextPage}
        error={error as Error | null}
        agents={agents}
        projects={projects}
        liveIssueIds={liveIssueIds}
        viewStateKey="theft:tasks-review-queue"
        issueLinkState={issueLinkState}
        initialAssignees={searchParams.get("assignee") ? [searchParams.get("assignee")!] : undefined}
        initialWorkspaces={initialWorkspaces.length > 0 ? initialWorkspaces : undefined}
        initialSearch={syncedSearch}
        onSearchChange={handleSearchChange}
        enableRoutineVisibilityFilter
        hasMoreIssues={hasMoreServerIssues}
        onLoadMoreIssues={loadMoreServerIssues}
        onUpdateIssue={(id, data) => updateIssue.mutate({ id, data })}
        searchFilters={participantAgentId || workspaceIdFilter ? { participantAgentId, workspaceId: workspaceIdFilter } : undefined}
        createIssueLabel="Task"
        defaultSortField="workflow"
      />
    </TheftWorkbenchTemplate>
  );
}

function buildOperatorPromptIssueDefaults(kind: TasksOperatorPromptKind, issue: Issue | null) {
  const issueLabel = issue ? `${issue.identifier ?? "Task"}: ${issue.title}` : "the current company queue";
  const baseContext = issue
    ? [
      `Source task: ${issueLabel}`,
      `Current status: ${issue.status.replace(/_/g, " ")}`,
    ].join("\n")
    : "Source task: no active task is currently pressuring the queue.";

  if (kind === "summarize") {
    return {
      title: issue ? `Summarize bottleneck: ${issue.title}` : "Summarize the current company bottleneck",
      description: [
        "Founder request: summarize what is blocking progress and recommend the next concrete move.",
        baseContext,
        "Expected Library output: a short decision brief with the bottleneck, recommendation, and evidence needed.",
      ].join("\n\n"),
      assigneeAgentId: issue?.assigneeAgentId ?? undefined,
      status: "todo",
    };
  }

  if (kind === "approval") {
    return {
      title: issue ? `Draft approval comment for ${issue.title}` : "Draft the next approval comment",
      description: [
        "Founder request: draft the approval or revision comment needed to move the work forward.",
        baseContext,
        "Expected Library output: an approval-ready comment plus any conditions that must be checked before completion.",
      ].join("\n\n"),
      assigneeAgentId: issue?.assigneeAgentId ?? undefined,
      status: "todo",
    };
  }

  return {
    title: issue ? `Route next step for ${issue.title}` : "Route the next company task to a department",
    description: [
      "Founder request: choose the right department owner and define the next task that should create durable output.",
      baseContext,
      "Expected Library output: a routed task brief with owner, acceptance criteria, and artifact target.",
    ].join("\n\n"),
    assigneeAgentId: issue?.assigneeAgentId ?? undefined,
    status: "todo",
  };
}
