import { useMemo } from "react";
import type { Agent, ExecutionWorkspaceSummary, Issue, Project } from "@paperclipai/shared";
import type { InboxWorkspaceGroupingOptions } from "../../lib/inbox";

export function useInboxWorkspaceGrouping({
  agents,
  companyUserLabelMap,
  currentUserId,
  executionWorkspaces,
  issues,
  projects,
}: {
  agents: Agent[] | undefined;
  companyUserLabelMap: Map<string, string>;
  currentUserId: string | null;
  executionWorkspaces: ExecutionWorkspaceSummary[];
  issues: Issue[] | undefined;
  projects: Project[] | undefined;
}) {
  const agentById = useMemo(() => {
    const map = new Map<string, string>();
    for (const agent of agents ?? []) map.set(agent.id, agent.name);
    return map;
  }, [agents]);

  const issueById = useMemo(() => {
    const map = new Map<string, Issue>();
    for (const issue of issues ?? []) map.set(issue.id, issue);
    return map;
  }, [issues]);

  const projectById = useMemo(() => {
    const map = new Map<string, { name: string; color: string | null }>();
    for (const project of projects ?? []) map.set(project.id, { name: project.name, color: project.color });
    return map;
  }, [projects]);

  const projectWorkspaceById = useMemo(() => {
    const map = new Map<string, { name: string }>();
    for (const project of projects ?? []) {
      for (const workspace of project.workspaces ?? []) map.set(workspace.id, { name: workspace.name });
    }
    return map;
  }, [projects]);

  const defaultProjectWorkspaceIdByProjectId = useMemo(() => {
    const map = new Map<string, string>();
    for (const project of projects ?? []) {
      const defaultWorkspaceId =
        project.executionWorkspacePolicy?.defaultProjectWorkspaceId ??
        project.primaryWorkspace?.id ??
        null;
      if (defaultWorkspaceId) map.set(project.id, defaultWorkspaceId);
    }
    return map;
  }, [projects]);

  const executionWorkspaceById = useMemo(() => {
    const map = new Map<string, {
      name: string;
      mode: "shared_workspace" | "isolated_workspace" | "operator_branch" | "adapter_managed" | "cloud_sandbox";
      projectWorkspaceId: string | null;
    }>();
    for (const workspace of executionWorkspaces) {
      map.set(workspace.id, {
        name: workspace.name,
        mode: workspace.mode,
        projectWorkspaceId: workspace.projectWorkspaceId ?? null,
      });
    }
    return map;
  }, [executionWorkspaces]);

  const inboxWorkspaceGrouping = useMemo<InboxWorkspaceGroupingOptions>(
    () => ({
      agentById,
      executionWorkspaceById,
      projectWorkspaceById,
      defaultProjectWorkspaceIdByProjectId,
      projectById,
      userLabelById: companyUserLabelMap,
      currentUserId,
    }),
    [
      agentById,
      companyUserLabelMap,
      currentUserId,
      defaultProjectWorkspaceIdByProjectId,
      executionWorkspaceById,
      projectById,
      projectWorkspaceById,
    ],
  );

  return {
    agentById,
    defaultProjectWorkspaceIdByProjectId,
    executionWorkspaceById,
    inboxWorkspaceGrouping,
    issueById,
    projectById,
    projectWorkspaceById,
  };
}
