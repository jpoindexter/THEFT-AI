import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExecutionWorkspace, Issue, Project } from "@paperclipai/shared";
import { agentsApi } from "@/api/agents";
import { heartbeatsApi } from "@/api/heartbeats";
import { issuesApi } from "@/api/issues";
import { IssuesList } from "@/components/IssuesList";
import { collectLiveIssueIds } from "@/lib/liveIssueIds";
import { queryKeys } from "@/lib/queryKeys";

export function ExecutionWorkspaceIssuesList({
  companyId,
  workspace,
  issues,
  isLoading,
  error,
  project,
}: {
  companyId: string;
  workspace: ExecutionWorkspace;
  issues: Issue[];
  isLoading: boolean;
  error: Error | null;
  project: Project | null;
}) {
  const queryClient = useQueryClient();

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(companyId),
    queryFn: () => agentsApi.list(companyId),
    enabled: !!companyId,
  });

  const { data: liveRuns } = useQuery({
    queryKey: queryKeys.liveRuns(companyId),
    queryFn: () => heartbeatsApi.liveRunsForCompany(companyId),
    enabled: !!companyId,
    refetchInterval: 5000,
  });

  const liveIssueIds = useMemo(() => collectLiveIssueIds(liveRuns), [liveRuns]);

  const updateIssue = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => issuesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByExecutionWorkspace(companyId, workspace.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(companyId) });
      if (project?.id) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByProject(companyId, project.id) });
      }
    },
  });

  const projectOptions = useMemo(
    () => (project ? [{ id: project.id, name: project.name, workspaces: project.workspaces ?? [] }] : undefined),
    [project],
  );
  const createIssueDefaults = useMemo(
    () => ({
      projectId: workspace.projectId,
      ...(workspace.projectWorkspaceId ? { projectWorkspaceId: workspace.projectWorkspaceId } : {}),
      executionWorkspaceId: workspace.id,
      executionWorkspaceMode: "reuse_existing",
    }),
    [workspace.id, workspace.projectId, workspace.projectWorkspaceId],
  );

  return (
    <IssuesList
      issues={issues}
      isLoading={isLoading}
      error={error}
      agents={agents}
      projects={projectOptions}
      liveIssueIds={liveIssueIds}
      projectId={project?.id}
      viewStateKey="paperclip:execution-workspace-issues-view"
      baseCreateIssueDefaults={createIssueDefaults}
      onUpdateIssue={(id, data) => updateIssue.mutate({ id, data })}
    />
  );
}
