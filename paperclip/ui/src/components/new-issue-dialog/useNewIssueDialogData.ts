import { useMemo, type Dispatch, type SetStateAction } from "react";
import { useQuery } from "@tanstack/react-query";

import { accessApi } from "../../api/access";
import { agentsApi } from "../../api/agents";
import { authApi } from "../../api/auth";
import { executionWorkspacesApi } from "../../api/execution-workspaces";
import { instanceSettingsApi } from "../../api/instanceSettings";
import { projectsApi } from "../../api/projects";
import { useProjectOrder } from "../../hooks/useProjectOrder";
import { queryKeys } from "../../lib/queryKeys";
import { getRecentProjectIds } from "../../lib/recent-projects";
import { orderReusableExecutionWorkspaces } from "../../lib/reusable-execution-workspaces";
import type { InlineEntityOption } from "../InlineEntitySelector";
import type { IssueModelLane } from "../../lib/issue-assignee-overrides";
import { useNewIssueAssigneeData } from "./useNewIssueAssigneeData";

type UseNewIssueDialogDataInput = {
  assigneeModelLane: IssueModelLane;
  assigneeThinkingEffort: string;
  assigneeValue: string;
  companyId: string | null | undefined;
  newIssueOpen: boolean;
  projectId: string;
  projectWorkspaceId: string;
  selectedExecutionWorkspaceId: string;
  onAssigneeChromeChange: Dispatch<SetStateAction<boolean>>;
  onAssigneeModelLaneChange: Dispatch<SetStateAction<IssueModelLane>>;
  onAssigneeModelOverrideChange: Dispatch<SetStateAction<string>>;
  onAssigneeOptionsOpenChange: Dispatch<SetStateAction<boolean>>;
  onAssigneeThinkingEffortChange: Dispatch<SetStateAction<string>>;
};

export function useNewIssueDialogData(input: UseNewIssueDialogDataInput) {
  const {
    assigneeModelLane,
    assigneeThinkingEffort,
    assigneeValue,
    companyId,
    newIssueOpen,
    projectId,
    projectWorkspaceId,
    selectedExecutionWorkspaceId,
    onAssigneeChromeChange,
    onAssigneeModelLaneChange,
    onAssigneeModelOverrideChange,
    onAssigneeOptionsOpenChange,
    onAssigneeThinkingEffortChange,
  } = input;

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(companyId!),
    queryFn: () => agentsApi.list(companyId!),
    enabled: !!companyId && newIssueOpen,
  });
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(companyId!),
    queryFn: () => projectsApi.list(companyId!),
    enabled: !!companyId && newIssueOpen,
  });
  const { data: reusableExecutionWorkspaces } = useQuery({
    queryKey: queryKeys.executionWorkspaces.list(companyId!, {
      projectId,
      projectWorkspaceId: projectWorkspaceId || undefined,
      reuseEligible: true,
    }),
    queryFn: () =>
      executionWorkspacesApi.list(companyId!, {
        projectId,
        projectWorkspaceId: projectWorkspaceId || undefined,
        reuseEligible: true,
      }),
    enabled: Boolean(companyId) && newIssueOpen && Boolean(projectId),
  });
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(companyId!),
    queryFn: () => accessApi.listUserDirectory(companyId!),
    enabled: Boolean(companyId) && newIssueOpen,
  });
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    enabled: newIssueOpen,
    retry: false,
  });

  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const activeProjects = useMemo(
    () => (projects ?? []).filter((project) => !project.archivedAt),
    [projects],
  );
  const { orderedProjects } = useProjectOrder({ projects: activeProjects, companyId, userId: currentUserId });
  const assigneeData = useNewIssueAssigneeData({
    companyId,
    newIssueOpen,
    agents: agents ?? [],
    orderedProjects,
    companyMembers,
    currentUserId,
    assigneeValue,
    assigneeModelLane,
    assigneeThinkingEffort,
    onAssigneeOptionsOpenChange,
    onAssigneeModelLaneChange,
    onAssigneeModelOverrideChange,
    onAssigneeThinkingEffortChange,
    onAssigneeChromeChange,
  });
  const currentProject = orderedProjects.find((project) => project.id === projectId);
  const currentProjectExecutionWorkspacePolicy =
    experimentalSettings?.enableIsolatedWorkspaces === true
      ? currentProject?.executionWorkspacePolicy ?? null
      : null;
  const deduplicatedReusableWorkspaces = useMemo(
    () => orderReusableExecutionWorkspaces(reusableExecutionWorkspaces ?? []),
    [reusableExecutionWorkspaces],
  );
  const selectedReusableExecutionWorkspace = deduplicatedReusableWorkspaces.find((workspace) => {
    return workspace.id === selectedExecutionWorkspaceId;
  });
  const recentProjectIds = useMemo(() => getRecentProjectIds(), [newIssueOpen]);
  const projectOptions = useMemo<InlineEntityOption[]>(
    () =>
      orderedProjects.map((project) => ({
        id: project.id,
        label: project.name,
        searchText: project.description ?? "",
      })),
    [orderedProjects],
  );

  return {
    ...assigneeData,
    agents,
    currentProject,
    currentProjectSupportsExecutionWorkspace: Boolean(currentProjectExecutionWorkspacePolicy?.enabled),
    deduplicatedReusableWorkspaces,
    experimentalSettings,
    orderedProjects,
    projectOptions,
    recentProjectIds,
    selectedReusableExecutionWorkspace,
  };
}
