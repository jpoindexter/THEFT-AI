import { createElement, useMemo, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { User } from "lucide-react";

import { accessApi } from "@/api/access";
import { agentsApi } from "@/api/agents";
import { authApi } from "@/api/auth";
import { projectsApi } from "@/api/projects";
import { AgentIcon } from "@/components/AgentIconPicker";
import { InlineEntitySelector, type InlineEntityOption } from "@/components/InlineEntitySelector";
import { useProjectOrder } from "@/hooks/useProjectOrder";
import {
  assigneeValueFromSelection,
  currentUserAssigneeOption,
  parseAssigneeValue,
} from "@/lib/assignees";
import { buildCompanyUserInlineOptions } from "@/lib/company-members";
import { queryKeys } from "@/lib/queryKeys";
import {
  getRecentAssigneeSelectionIds,
  sortAgentsByRecency,
  trackRecentAssignee,
  trackRecentAssigneeUser,
} from "@/lib/recent-assignees";
import { getRecentProjectIds, trackRecentProject } from "@/lib/recent-projects";

import { useHostContext } from "./bridge.js";
import type { PluginAssigneePickerProps, PluginProjectPickerProps } from "./bridge-sdk-types";

export function PluginSdkAssigneePicker({
  companyId,
  value,
  onChange,
  placeholder = "Assignee",
  noneLabel = "No assignee",
  searchPlaceholder = "Search assignees...",
  emptyMessage = "No assignees found.",
  includeUsers = true,
  includeTerminatedAgents = false,
  className,
  onConfirm,
}: PluginAssigneePickerProps) {
  const hostContext = useHostContext();
  const resolvedCompanyId = companyId ?? hostContext.companyId ?? null;
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    enabled: includeUsers,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(resolvedCompanyId ?? "__no-company__"),
    queryFn: () => agentsApi.list(resolvedCompanyId!),
    enabled: !!resolvedCompanyId,
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(resolvedCompanyId ?? "__no-company__"),
    queryFn: () => accessApi.listUserDirectory(resolvedCompanyId!),
    enabled: !!resolvedCompanyId && includeUsers,
  });
  const recentAssigneeSelectionIds = useMemo(() => getRecentAssigneeSelectionIds(), []);
  const recentAssigneeIds = useMemo(
    () => recentAssigneeSelectionIds
      .map((id) => id.startsWith("agent:") ? id.slice("agent:".length) : null)
      .filter((id): id is string => Boolean(id)),
    [recentAssigneeSelectionIds],
  );
  const sortedAgents = useMemo(
    () => sortAgentsByRecency(
      (agents ?? []).filter((agent) => includeTerminatedAgents || agent.status !== "terminated"),
      recentAssigneeIds,
    ),
    [agents, includeTerminatedAgents, recentAssigneeIds],
  );
  const options = useMemo<InlineEntityOption[]>(
    () => [
      ...(includeUsers ? currentUserAssigneeOption(currentUserId) : []),
      ...(includeUsers
        ? buildCompanyUserInlineOptions(companyMembers?.users, { excludeUserIds: [currentUserId] })
        : []),
      ...sortedAgents.map((agent) => ({
        id: assigneeValueFromSelection({ assigneeAgentId: agent.id }),
        label: agent.name,
        searchText: `${agent.name} ${agent.role} ${agent.title ?? ""}`,
      })),
    ],
    [companyMembers?.users, currentUserId, includeUsers, sortedAgents],
  );
  const selectedAssignee = parseAssigneeValue(value);
  const selectedAgent = selectedAssignee.assigneeAgentId
    ? sortedAgents.find((agent) => agent.id === selectedAssignee.assigneeAgentId) ?? null
    : null;

  return createElement(InlineEntitySelector, {
    value,
    options,
    recentOptionIds: recentAssigneeSelectionIds,
    placeholder,
    noneLabel,
    searchPlaceholder,
    emptyMessage,
    className,
    onConfirm,
    onChange: (nextValue: string) => {
      const selection = parseAssigneeValue(nextValue);
      if (selection.assigneeAgentId) trackRecentAssignee(selection.assigneeAgentId);
      if (selection.assigneeUserId) trackRecentAssigneeUser(selection.assigneeUserId);
      onChange(nextValue, selection);
    },
    renderTriggerValue: (option: InlineEntityOption | null) =>
      renderAssigneeOption(option, placeholder, selectedAgent),
    renderOption: (option: InlineEntityOption) =>
      renderAssigneeOption(
        option,
        placeholder,
        parseAssigneeValue(option.id).assigneeAgentId
          ? sortedAgents.find((entry) => entry.id === parseAssigneeValue(option.id).assigneeAgentId) ?? null
          : null,
      ),
  });
}

export function PluginSdkProjectPicker({
  companyId,
  value,
  onChange,
  placeholder = "Project",
  noneLabel = "No project",
  searchPlaceholder = "Search projects...",
  emptyMessage = "No projects found.",
  includeArchived = false,
  className,
  onConfirm,
}: PluginProjectPickerProps) {
  const hostContext = useHostContext();
  const resolvedCompanyId = companyId ?? hostContext.companyId ?? null;
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(resolvedCompanyId ?? "__no-company__"),
    queryFn: () => projectsApi.list(resolvedCompanyId!),
    enabled: !!resolvedCompanyId,
  });
  const visibleProjects = useMemo(
    () => (projects ?? []).filter((project) => includeArchived || !project.archivedAt),
    [includeArchived, projects],
  );
  const { orderedProjects } = useProjectOrder({
    projects: visibleProjects,
    companyId: resolvedCompanyId,
    userId: currentUserId,
  });
  const recentProjectIds = useMemo(() => getRecentProjectIds(), []);
  const options = useMemo<InlineEntityOption[]>(
    () => orderedProjects.map((project) => ({
      id: project.id,
      label: project.name,
      searchText: project.description ?? "",
    })),
    [orderedProjects],
  );
  const selectedProject = orderedProjects.find((project) => project.id === value) ?? null;

  return createElement(InlineEntitySelector, {
    value,
    options,
    recentOptionIds: recentProjectIds,
    placeholder,
    noneLabel,
    searchPlaceholder,
    emptyMessage,
    className,
    onConfirm,
    onChange: (nextProjectId: string) => {
      if (nextProjectId) trackRecentProject(nextProjectId);
      onChange(nextProjectId);
    },
    renderTriggerValue: (option: InlineEntityOption | null) => {
      if (!option || !selectedProject) return createElement("span", { className: "text-muted-foreground" }, placeholder);
      return renderProjectOption(option.label, selectedProject.color);
    },
    renderOption: (option: InlineEntityOption) => {
      if (!option.id) return createElement("span", { className: "truncate" }, option.label);
      const project = orderedProjects.find((entry) => entry.id === option.id);
      return renderProjectOption(option.label, project?.color);
    },
  });
}

function renderAssigneeOption(
  option: InlineEntityOption | null,
  placeholder: string,
  agent: { icon?: string | null } | null,
) {
  if (!option) return createElement("span", { className: "text-muted-foreground" }, placeholder);
  return createElement(
    FragmentSafe,
    null,
    agent
      ? createElement(AgentIcon, { icon: agent.icon, className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" })
      : option.id
        ? createElement(User, { className: "h-3.5 w-3.5 shrink-0 text-muted-foreground" })
        : null,
    createElement("span", { className: "truncate" }, option.label),
  );
}

function renderProjectOption(label: string, color?: string | null) {
  return createElement(
    FragmentSafe,
    null,
    createElement("span", {
      className: "h-3.5 w-3.5 shrink-0 rounded-sm bg-muted",
      style: color ? { backgroundColor: color } : undefined,
    }),
    createElement("span", { className: "truncate" }, label),
  );
}

function FragmentSafe({ children }: { children?: ReactNode }) {
  return createElement("span", { className: "contents" }, children);
}
