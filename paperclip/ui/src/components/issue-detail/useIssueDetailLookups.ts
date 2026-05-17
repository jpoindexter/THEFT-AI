import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Agent, Issue } from "@paperclipai/shared";

import { accessApi } from "@/api/access";
import { agentsApi } from "@/api/agents";
import { authApi } from "@/api/auth";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { issuesApi } from "@/api/issues";
import { projectsApi } from "@/api/projects";
import { useProjectOrder } from "@/hooks/useProjectOrder";
import {
  buildCompanyUserLabelMap,
  buildCompanyUserProfileMap,
  buildMarkdownMentionOptions,
} from "@/lib/company-members";
import { queryKeys } from "@/lib/queryKeys";
import { usePluginSlots } from "@/plugins/slots";

type UseIssueDetailLookupsInput = {
  issueId?: string;
  issue: Issue | null | undefined;
  selectedCompanyId: string | null | undefined;
  resolvedCompanyId: string | null | undefined;
  detailTab: string;
};

export function useIssueDetailLookups({
  issueId,
  issue,
  selectedCompanyId,
  resolvedCompanyId,
  detailTab,
}: UseIssueDetailLookupsInput) {
  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const { data: boardAccess } = useQuery({
    queryKey: queryKeys.access.currentBoardAccess,
    queryFn: () => accessApi.getCurrentBoardAccess(),
    enabled: !!session?.user?.id,
    retry: false,
  });
  const canManageTreeControl = Boolean(
    selectedCompanyId
    && boardAccess?.companyIds?.includes(selectedCompanyId),
  );
  const { data: feedbackVotes } = useQuery({
    queryKey: queryKeys.issues.feedbackVotes(issueId!),
    queryFn: () => issuesApi.listFeedbackVotes(issueId!),
    enabled: !!issueId && !!currentUserId,
  });
  const { data: instanceGeneralSettings } = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
    enabled: !!issueId,
    retry: false,
  });
  const keyboardShortcutsEnabled = instanceGeneralSettings?.keyboardShortcuts === true;
  const feedbackDataSharingPreference = instanceGeneralSettings?.feedbackDataSharingPreference ?? "prompt";
  const { orderedProjects } = useProjectOrder({
    projects: projects ?? [],
    companyId: selectedCompanyId,
    userId: currentUserId,
  });
  const { slots: issuePluginDetailSlots } = usePluginSlots({
    slotTypes: ["detailTab"],
    entityType: "issue",
    companyId: resolvedCompanyId,
    enabled: !!resolvedCompanyId,
  });
  const issuePluginTabItems = useMemo(
    () => issuePluginDetailSlots.map((slot) => ({
      value: `plugin:${slot.pluginKey}:${slot.id}`,
      label: slot.displayName,
      slot,
    })),
    [issuePluginDetailSlots],
  );
  const activePluginTab = issuePluginTabItems.find((item) => item.value === detailTab) ?? null;
  const agentMap = useMemo(() => {
    const map = new Map<string, Agent>();
    for (const agent of agents ?? []) map.set(agent.id, agent);
    return map;
  }, [agents]);
  const userProfileMap = useMemo(
    () => buildCompanyUserProfileMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const userLabelMap = useMemo(
    () => buildCompanyUserLabelMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const mentionOptions = useMemo(() => {
    return buildMarkdownMentionOptions({
      agents,
      projects: orderedProjects,
      members: companyMembers?.users,
    });
  }, [agents, companyMembers?.users, orderedProjects]);
  const resolvedProject = useMemo(
    () => (issue?.projectId
      ? orderedProjects.find((project) => project.id === issue.projectId) ?? issue.project ?? null
      : null),
    [issue?.project, issue?.projectId, orderedProjects],
  );

  return {
    agents,
    companyMembers,
    session,
    projects,
    currentUserId,
    canManageTreeControl,
    feedbackVotes,
    keyboardShortcutsEnabled,
    feedbackDataSharingPreference,
    issuePluginTabItems,
    activePluginTab,
    agentMap,
    userProfileMap,
    userLabelMap,
    mentionOptions,
    resolvedProject,
  };
}
