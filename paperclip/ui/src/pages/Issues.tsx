import { useEffect, useMemo, useCallback, useRef, useState } from "react";
import { useLocation, useSearchParams } from "@/lib/router";
import { Link } from "@/lib/router";
import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { issuesApi } from "../api/issues";
import { agentsApi } from "../api/agents";
import { projectsApi } from "../api/projects";
import { heartbeatsApi } from "../api/heartbeats";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { collectLiveIssueIds } from "../lib/liveIssueIds";
import { queryKeys } from "../lib/queryKeys";
import { createIssueDetailLocationState } from "../lib/issueDetailBreadcrumb";
import { EmptyState } from "../components/EmptyState";
import { IssuesList } from "../components/IssuesList";
import { StatusIcon } from "../components/StatusIcon";
import { AlertTriangle, CheckCircle2, CircleDot, Clock3, ListChecks, type LucideIcon } from "lucide-react";
import type { Issue } from "@paperclipai/shared";

const WORKSPACE_FILTER_ISSUE_LIMIT = 1000;
const ISSUES_PAGE_SIZE = 500;

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

export function Issues() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
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

  if (!selectedCompanyId) {
    return <EmptyState icon={CircleDot} message="Select a company to view issues." />;
  }

  return (
    <div className="space-y-4">
      <TasksMissionHeader buckets={founderBuckets} isLoading={isLoading} issueLinkState={issueLinkState} />
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
    </div>
  );
}

function TasksMissionHeader({
  buckets,
  isLoading,
  issueLinkState,
}: {
  buckets: FounderTaskBuckets;
  isLoading: boolean;
  issueLinkState: ReturnType<typeof createIssueDetailLocationState>;
}) {
  const nextIssue = buckets.needsAction[0] ?? buckets.ongoing[0] ?? buckets.todo[0] ?? null;

  return (
    <section className="theft-panel p-5 md:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 rounded-[10px] border border-border/80 bg-muted/25 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Founder review queue
          </div>
          <div>
            <h1 className="theft-heading text-2xl md:text-3xl">Tasks</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Clear approvals, blocked work, ready outputs, and next actions without dropping into runtime logs first.
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:min-w-[520px]">
          <TaskBucketStat icon={AlertTriangle} label="Needs action" value={buckets.needsAction.length} tone="attention" />
          <TaskBucketStat icon={Clock3} label="Ongoing" value={buckets.ongoing.length} />
          <TaskBucketStat icon={ListChecks} label="Todo" value={buckets.todo.length} />
          <TaskBucketStat icon={CheckCircle2} label="Done" value={buckets.done.length} />
        </div>
      </div>
      <div className="mt-5 border border-border bg-card/70 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted-foreground">Next move</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isLoading ? "Loading active company tasks..." : nextIssue ? "Open the highest leverage item first." : "No active task pressure right now."}
            </p>
          </div>
        </div>
        {nextIssue ? (
          <Link
            to={`/issues/${nextIssue.id}`}
            state={issueLinkState}
            className="flex items-start justify-between gap-4 border border-border bg-background/70 px-4 py-3 text-sm transition hover:border-foreground/60 hover:bg-muted/40"
          >
            <span className="flex min-w-0 items-start gap-3">
              <StatusIcon status={nextIssue.status} blockerAttention={nextIssue.blockerAttention} className="mt-0.5" />
              <span className="min-w-0">
                <span className="block truncate font-medium text-foreground">{nextIssue.title}</span>
                <span className="mt-1 block text-xs text-muted-foreground">
                  {nextIssue.identifier ?? "Unnumbered"} · {nextIssue.status.replace(/_/g, " ")}
                </span>
              </span>
            </span>
            <span className="shrink-0 text-xs text-muted-foreground">Open</span>
          </Link>
        ) : (
          <div className="border border-dashed border-border bg-background/60 px-4 py-5 text-sm text-muted-foreground">
            {isLoading ? "Loading tasks..." : "Create or route the next task when you are ready to advance the company."}
          </div>
        )}
      </div>
    </section>
  );
}

function TaskBucketStat({
  icon: Icon,
  label,
  value,
  tone = "neutral",
}: {
  icon: LucideIcon;
  label: string;
  value: number;
  tone?: "attention" | "neutral";
}) {
  return (
    <div className="border border-border bg-card/70 p-3">
      <div className="flex items-center justify-between gap-3">
        <Icon className={tone === "attention" ? "h-4 w-4 text-foreground" : "h-4 w-4 text-muted-foreground"} />
        <span className="text-2xl font-semibold tabular-nums text-foreground">{value}</span>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
