import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { agentsApi } from "@/api/agents";
import { projectsApi } from "@/api/projects";
import { issuesApi } from "@/api/issues";
import { heartbeatsApi } from "@/api/heartbeats";
import { accessApi } from "@/api/access";
import { buildMarkdownMentionOptions } from "@/lib/company-members";
import { collectLiveIssueIds } from "@/lib/liveIssueIds";
import { getRecentAssigneeIds, sortAgentsByRecency } from "@/lib/recent-assignees";
import { getRecentProjectIds } from "@/lib/recent-projects";
import { queryKeys } from "@/lib/queryKeys";
import type { InlineEntityOption } from "@/components/InlineEntitySelector";
import type { MentionOption } from "@/components/MarkdownEditor";
import type { RoutineDraft, RoutinesTab } from "./routinesModel";

export function useRoutinesPageData({
  activeTab,
  composerOpen,
  draft,
  selectedCompanyId,
}: {
  activeTab: RoutinesTab;
  composerOpen: boolean;
  draft: RoutineDraft;
  selectedCompanyId: string | null;
}) {
  const agentsQuery = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const companyMembersQuery = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const routineExecutionIssuesQuery = useQuery({
    queryKey: [...queryKeys.issues.list(selectedCompanyId!), "routine-executions"],
    queryFn: () => issuesApi.list(selectedCompanyId!, { originKind: "routine_execution" }),
    enabled: !!selectedCompanyId && activeTab === "runs",
  });
  const liveRunsQuery = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId && activeTab === "runs",
    refetchInterval: 5000,
  });

  const agents = agentsQuery.data;
  const projects = projectsQuery.data;
  const recentAssigneeIds = useMemo(() => getRecentAssigneeIds(), [composerOpen]);
  const recentProjectIds = useMemo(() => getRecentProjectIds(), [composerOpen]);
  const mentionOptions = useMemo<MentionOption[]>(
    () => buildMarkdownMentionOptions({ agents, projects, members: companyMembersQuery.data?.users }),
    [agents, companyMembersQuery.data?.users, projects],
  );
  const assigneeOptions = useMemo<InlineEntityOption[]>(
    () =>
      sortAgentsByRecency(
        (agents ?? []).filter((agent) => agent.status !== "terminated"),
        recentAssigneeIds,
      ).map((agent) => ({
        id: agent.id,
        label: agent.name,
        searchText: `${agent.name} ${agent.role} ${agent.title ?? ""}`,
      })),
    [agents, recentAssigneeIds],
  );
  const projectOptions = useMemo<InlineEntityOption[]>(
    () => (projects ?? []).map((project) => ({
      id: project.id,
      label: project.name,
      searchText: project.description ?? "",
    })),
    [projects],
  );
  const agentById = useMemo(() => new Map((agents ?? []).map((agent) => [agent.id, agent])), [agents]);
  const projectById = useMemo(() => new Map((projects ?? []).map((project) => [project.id, project])), [projects]);

  return {
    agents,
    projects,
    mentionOptions,
    recentAssigneeIds,
    recentProjectIds,
    assigneeOptions,
    projectOptions,
    agentById,
    projectById,
    currentAssignee: draft.assigneeAgentId ? agentById.get(draft.assigneeAgentId) ?? null : null,
    currentProject: draft.projectId ? projectById.get(draft.projectId) ?? null : null,
    liveIssueIds: collectLiveIssueIds(liveRunsQuery.data),
    routineExecutionIssues: routineExecutionIssuesQuery.data,
    recentRunsLoading: routineExecutionIssuesQuery.isLoading,
    recentRunsError: routineExecutionIssuesQuery.error,
  };
}
