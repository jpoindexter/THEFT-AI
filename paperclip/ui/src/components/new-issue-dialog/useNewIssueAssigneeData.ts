import { useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Agent, Project } from "@paperclipai/shared";

import { useAdapterCapabilities } from "../../adapters/use-adapter-capabilities";
import { agentsApi } from "../../api/agents";
import type { CompanyUserDirectoryResponse } from "../../api/access";
import { buildCompanyUserInlineOptions, buildMarkdownMentionOptions } from "../../lib/company-members";
import { queryKeys } from "../../lib/queryKeys";
import { getRecentAssigneeIds, sortAgentsByRecency } from "../../lib/recent-assignees";
import {
  assigneeValueFromSelection,
  currentUserAssigneeOption,
  parseAssigneeValue,
} from "../../lib/assignees";
import { extractProviderIdWithFallback } from "../../lib/model-utils";
import {
  ISSUE_OVERRIDE_ADAPTER_TYPES,
  type IssueModelLane,
} from "../../lib/issue-assignee-overrides";
import type { InlineEntityOption } from "../InlineEntitySelector";
import type { MentionOption } from "../MarkdownEditor";
import { ISSUE_THINKING_EFFORT_OPTIONS } from "./issueDialogDefaults";

type UseNewIssueAssigneeDataArgs = {
  companyId: string | null | undefined;
  newIssueOpen: boolean;
  agents: Agent[];
  orderedProjects: Project[];
  companyMembers: CompanyUserDirectoryResponse | undefined;
  currentUserId: string | null;
  assigneeValue: string;
  assigneeModelLane: IssueModelLane;
  assigneeThinkingEffort: string;
  onAssigneeOptionsOpenChange: (open: boolean) => void;
  onAssigneeModelLaneChange: (lane: IssueModelLane) => void;
  onAssigneeModelOverrideChange: (model: string) => void;
  onAssigneeThinkingEffortChange: (effort: string) => void;
  onAssigneeChromeChange: (chrome: boolean) => void;
};

export function useNewIssueAssigneeData({
  companyId,
  newIssueOpen,
  agents,
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
}: UseNewIssueAssigneeDataArgs) {
  const selectedAssignee = useMemo(() => parseAssigneeValue(assigneeValue), [assigneeValue]);
  const selectedAssigneeAgentId = selectedAssignee.assigneeAgentId;
  const selectedAssigneeUserId = selectedAssignee.assigneeUserId;
  const currentAssignee = selectedAssigneeAgentId
    ? agents.find((agent) => agent.id === selectedAssigneeAgentId) ?? null
    : null;
  const assigneeAdapterType = currentAssignee?.adapterType ?? null;
  const supportsAssigneeOverrides = Boolean(
    assigneeAdapterType && ISSUE_OVERRIDE_ADAPTER_TYPES.has(assigneeAdapterType),
  );
  const getAdapterCapabilities = useAdapterCapabilities();
  const assigneeAdapterCapabilities = assigneeAdapterType
    ? getAdapterCapabilities(assigneeAdapterType)
    : null;
  const assigneeSupportsCheapLane = Boolean(
    supportsAssigneeOverrides && assigneeAdapterCapabilities?.supportsModelProfiles,
  );

  const { data: assigneeCheapProfiles } = useQuery({
    queryKey: companyId && assigneeAdapterType
      ? queryKeys.agents.adapterModelProfiles(companyId, assigneeAdapterType)
      : ["agents", "none", "adapter-model-profiles", assigneeAdapterType ?? "none"],
    queryFn: () => agentsApi.adapterModelProfiles(companyId!, assigneeAdapterType!),
    enabled: Boolean(companyId) && newIssueOpen && assigneeSupportsCheapLane,
  });
  const { data: assigneeAdapterModels } = useQuery({
    queryKey:
      companyId && assigneeAdapterType
        ? queryKeys.agents.adapterModels(companyId, assigneeAdapterType)
        : ["agents", "none", "adapter-models", assigneeAdapterType ?? "none"],
    queryFn: () => agentsApi.adapterModels(companyId!, assigneeAdapterType!),
    enabled: Boolean(companyId) && newIssueOpen && supportsAssigneeOverrides,
  });

  const thinkingEffortOptions =
    assigneeAdapterType === "codex_local"
      ? ISSUE_THINKING_EFFORT_OPTIONS.codex_local
      : assigneeAdapterType === "opencode_local"
        ? ISSUE_THINKING_EFFORT_OPTIONS.opencode_local
        : ISSUE_THINKING_EFFORT_OPTIONS.claude_local;

  useEffect(() => {
    if (!supportsAssigneeOverrides) {
      onAssigneeOptionsOpenChange(false);
      onAssigneeModelLaneChange("primary");
      onAssigneeModelOverrideChange("");
      onAssigneeThinkingEffortChange("");
      onAssigneeChromeChange(false);
      return;
    }
    if (!assigneeSupportsCheapLane && assigneeModelLane === "cheap") {
      onAssigneeModelLaneChange("primary");
    }
    if (!thinkingEffortOptions.some((option) => option.value === assigneeThinkingEffort)) {
      onAssigneeThinkingEffortChange("");
    }
  }, [
    assigneeModelLane,
    assigneeSupportsCheapLane,
    assigneeThinkingEffort,
    onAssigneeChromeChange,
    onAssigneeModelLaneChange,
    onAssigneeModelOverrideChange,
    onAssigneeOptionsOpenChange,
    onAssigneeThinkingEffortChange,
    supportsAssigneeOverrides,
    thinkingEffortOptions,
  ]);

  const assigneeCheapProfile = useMemo(
    () => (assigneeCheapProfiles ?? []).find((profile) => profile.key === "cheap") ?? null,
    [assigneeCheapProfiles],
  );
  const mentionOptions = useMemo<MentionOption[]>(() => {
    return buildMarkdownMentionOptions({
      agents,
      projects: orderedProjects,
      members: companyMembers?.users,
    });
  }, [agents, companyMembers?.users, orderedProjects]);
  const recentAssigneeIds = useMemo(() => getRecentAssigneeIds(), [newIssueOpen]);
  const recentAssigneeOptionIds = useMemo(
    () => recentAssigneeIds.map((id) => assigneeValueFromSelection({ assigneeAgentId: id })),
    [recentAssigneeIds],
  );
  const assigneeOptions = useMemo<InlineEntityOption[]>(
    () => [
      ...currentUserAssigneeOption(currentUserId),
      ...buildCompanyUserInlineOptions(companyMembers?.users, { excludeUserIds: [currentUserId] }),
      ...sortAgentsByRecency(
        agents.filter((agent) => agent.status !== "terminated"),
        recentAssigneeIds,
      ).map((agent) => ({
        id: assigneeValueFromSelection({ assigneeAgentId: agent.id }),
        label: agent.name,
        searchText: `${agent.name} ${agent.role} ${agent.title ?? ""}`,
      })),
    ],
    [agents, companyMembers?.users, currentUserId, recentAssigneeIds],
  );
  const modelOverrideOptions = useMemo<InlineEntityOption[]>(() => {
    return [...(assigneeAdapterModels ?? [])]
      .sort((a, b) => {
        const providerA = extractProviderIdWithFallback(a.id);
        const providerB = extractProviderIdWithFallback(b.id);
        const byProvider = providerA.localeCompare(providerB);
        if (byProvider !== 0) return byProvider;
        return a.id.localeCompare(b.id);
      })
      .map((model) => ({
        id: model.id,
        label: model.label,
        searchText: `${model.id} ${extractProviderIdWithFallback(model.id)}`,
      }));
  }, [assigneeAdapterModels]);
  const assigneeOptionsTitle =
    assigneeAdapterType === "claude_local"
      ? "Claude options"
      : assigneeAdapterType === "codex_local"
        ? "Codex options"
        : assigneeAdapterType === "opencode_local"
          ? "OpenCode options"
          : "Agent options";

  return {
    assigneeAdapterType,
    assigneeCheapProfile,
    assigneeOptions,
    assigneeOptionsTitle,
    assigneeSupportsCheapLane,
    currentAssignee,
    mentionOptions,
    modelOverrideOptions,
    recentAssigneeOptionIds,
    selectedAssigneeAgentId,
    selectedAssigneeUserId,
    supportsAssigneeOverrides,
    thinkingEffortOptions,
  };
}
