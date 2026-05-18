import { createElement, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { agentsApi } from "@/api/agents";
import { heartbeatsApi } from "@/api/heartbeats";
import { issuesApi } from "@/api/issues";
import { projectsApi } from "@/api/projects";
import { IssuesList as HostIssuesList } from "@/components/IssuesList";
import { collectLiveIssueIds } from "@/lib/liveIssueIds";
import { queryKeys } from "@/lib/queryKeys";

import type { PluginIssuesListFilters, PluginIssuesListProps } from "./bridge-sdk-types";

function compactIssueFilters(filters: PluginIssuesListFilters): PluginIssuesListFilters {
  return Object.fromEntries(
    Object.entries(filters).filter(([, value]) =>
      value !== undefined && value !== null && value !== "" && value !== false,
    ),
  ) as PluginIssuesListFilters;
}

export function PluginSdkIssuesList({
  companyId,
  projectId = null,
  filters,
  viewStateKey = "paperclip:plugin-issues-view",
  initialSearch,
  createIssueLabel,
  searchWithinLoadedIssues = true,
}: PluginIssuesListProps) {
  const queryClient = useQueryClient();
  const issueFilters = useMemo(
    () => compactIssueFilters({
      ...(filters ?? {}),
      projectId: filters?.projectId ?? projectId ?? undefined,
    }),
    [filters, projectId],
  );
  const originKindPrefix = issueFilters.originKindPrefix ?? null;
  const resolvedProjectId = issueFilters.projectId ?? projectId ?? null;
  const issuesQueryKey = useMemo(
    () => ["plugins", "sdk-ui", "issues-list", companyId ?? "__no-company__", issueFilters] as const,
    [companyId, issueFilters],
  );

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(companyId ?? "__no-company__"),
    queryFn: () => agentsApi.list(companyId!),
    enabled: !!companyId,
  });
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(companyId ?? "__no-company__"),
    queryFn: () => projectsApi.list(companyId!),
    enabled: !!companyId,
  });
  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(companyId ?? "__no-company__"),
    queryFn: () => heartbeatsApi.liveRunsForCompany(companyId!),
    enabled: !!companyId,
    refetchInterval: 5000,
  });
  const liveIssueIds = useMemo(() => collectLiveIssueIds(liveRuns), [liveRuns]);

  const { data: issues, isLoading, error } = useQuery({
    queryKey: issuesQueryKey,
    queryFn: () => issuesApi.list(companyId!, issueFilters),
    enabled: !!companyId,
  });

  const updateIssue = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) =>
      issuesApi.update(id, data),
    onSuccess: () => {
      if (!companyId) return;
      queryClient.invalidateQueries({ queryKey: ["plugins", "sdk-ui", "issues-list", companyId] });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(companyId) });
      if (resolvedProjectId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByProject(companyId, resolvedProjectId) });
        if (originKindPrefix) {
          queryClient.invalidateQueries({
            queryKey: queryKeys.issues.listPluginOperationsByProject(companyId, resolvedProjectId, originKindPrefix),
          });
        }
      }
    },
  });

  if (!companyId) {
    return createElement("div", { className: "text-sm text-muted-foreground" }, "Select a company to view issues.");
  }

  return createElement(HostIssuesList, {
    issues: issues ?? [],
    isLoading,
    error: error as Error | null,
    agents,
    projects,
    liveIssueIds,
    projectId: resolvedProjectId ?? undefined,
    viewStateKey,
    initialSearch,
    createIssueLabel,
    searchWithinLoadedIssues,
    onUpdateIssue: (id: string, data: Record<string, unknown>) => updateIssue.mutate({ id, data }),
  });
}
