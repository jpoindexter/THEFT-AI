import type { ExecutionWorkspace, Issue } from "@paperclipai/shared";
import { projectWorkspaceUrl } from "@/lib/utils";

export const EXECUTION_WORKSPACE_OPTIONS = [
  { value: "shared_workspace", label: "Project default" },
  { value: "isolated_workspace", label: "New isolated workspace" },
  { value: "reuse_existing", label: "Reuse existing workspace" },
] as const;

export const NO_REUSABLE_WORKSPACE_SELECT_VALUE = "__paperclip_no_reusable_workspace__";
export const NO_ENVIRONMENT_SELECT_VALUE = "__paperclip_no_environment__";

export function issueModeForExistingWorkspace(mode: string | null | undefined) {
  if (mode === "isolated_workspace" || mode === "operator_branch" || mode === "shared_workspace") return mode;
  if (mode === "adapter_managed" || mode === "cloud_sandbox") return "agent_default";
  return "shared_workspace";
}

export function shouldPresentExistingWorkspaceSelection(
  issue: Pick<
    Issue,
    "executionWorkspaceId" | "executionWorkspacePreference" | "executionWorkspaceSettings" | "currentExecutionWorkspace"
  >,
) {
  const persistedMode =
    issue.currentExecutionWorkspace?.mode
    ?? issue.executionWorkspaceSettings?.mode
    ?? issue.executionWorkspacePreference;
  return Boolean(
    issue.executionWorkspaceId &&
    (persistedMode === "isolated_workspace" || persistedMode === "operator_branch"),
  );
}

export function defaultExecutionWorkspaceModeForProject(
  project: { executionWorkspacePolicy?: { enabled?: boolean; defaultMode?: string | null } | null } | null | undefined,
) {
  const defaultMode = project?.executionWorkspacePolicy?.enabled ? project.executionWorkspacePolicy.defaultMode : null;
  if (defaultMode === "isolated_workspace" || defaultMode === "operator_branch") return defaultMode;
  if (defaultMode === "adapter_default") return "agent_default";
  return "shared_workspace";
}

export function workspaceModeLabel(mode: string | null | undefined) {
  switch (mode) {
    case "isolated_workspace": return "Isolated workspace";
    case "operator_branch": return "Operator branch";
    case "cloud_sandbox": return "Cloud sandbox";
    case "adapter_managed": return "Adapter managed";
    default: return "Workspace";
  }
}

export function configuredWorkspaceLabel(
  selection: string | null | undefined,
  reusableWorkspace: ExecutionWorkspace | null,
) {
  switch (selection) {
    case "isolated_workspace":
      return "New isolated workspace";
    case "reuse_existing":
      return reusableWorkspace?.mode === "isolated_workspace"
        ? "Existing isolated workspace"
        : "Reuse existing workspace";
    default:
      return "Project default";
  }
}

export function projectWorkspaceDetailLink(input: {
  projectId: string | null | undefined;
  projectWorkspaceId: string | null | undefined;
}) {
  if (!input.projectId || !input.projectWorkspaceId) return null;
  return projectWorkspaceUrl({ id: input.projectId, urlKey: input.projectId }, input.projectWorkspaceId);
}

export function workspaceDetailLink(input: {
  projectId: string | null | undefined;
  issueProjectWorkspaceId: string | null | undefined;
  workspace: ExecutionWorkspace | null | undefined;
}) {
  const linkedProjectWorkspaceId = input.workspace?.projectWorkspaceId ?? input.issueProjectWorkspaceId ?? null;
  if (input.workspace?.mode === "shared_workspace") {
    return projectWorkspaceDetailLink({
      projectId: input.projectId,
      projectWorkspaceId: linkedProjectWorkspaceId,
    });
  }
  return input.workspace ? `/execution-workspaces/${input.workspace.id}` : null;
}
