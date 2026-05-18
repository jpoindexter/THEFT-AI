import type {
  ExecutionWorkspace,
  ExecutionWorkspaceMode,
  IssueExecutionWorkspaceSettings,
  Project,
  RoutineVariable,
} from "@paperclipai/shared";

export function buildInitialValues(variables: RoutineVariable[]) {
  return Object.fromEntries(variables.map((variable) => [variable.name, variable.defaultValue ?? ""]));
}

export function buildInitialRunSelection(input: {
  defaultAssigneeAgentId?: string | null;
  defaultProjectId?: string | null;
}) {
  return {
    assigneeAgentId: input.defaultAssigneeAgentId ?? "",
    projectId: input.defaultProjectId ?? "",
  };
}

function defaultProjectWorkspaceIdForProject(project: Project | null | undefined) {
  if (!project) return null;
  return project.executionWorkspacePolicy?.defaultProjectWorkspaceId
    ?? project.workspaces?.find((workspace) => workspace.isPrimary)?.id
    ?? project.workspaces?.[0]?.id
    ?? null;
}

export function defaultExecutionWorkspaceModeForProject(project: Project | null | undefined): ExecutionWorkspaceMode {
  const defaultMode = project?.executionWorkspacePolicy?.enabled ? project.executionWorkspacePolicy.defaultMode : null;
  if (
    defaultMode === "isolated_workspace" ||
    defaultMode === "operator_branch" ||
    defaultMode === "adapter_default"
  ) {
    return defaultMode === "adapter_default" ? "agent_default" : defaultMode;
  }
  return "shared_workspace";
}

function issueModeForExistingWorkspace(mode: string | null | undefined): ExecutionWorkspaceMode {
  if (mode === "isolated_workspace" || mode === "operator_branch" || mode === "shared_workspace") return mode;
  if (mode === "adapter_managed" || mode === "cloud_sandbox") return "agent_default";
  return "shared_workspace";
}

function issueWorkspacePreferenceFromDraft(value: unknown, fallback: ExecutionWorkspaceMode): ExecutionWorkspaceMode {
  if (
    value === "inherit" ||
    value === "shared_workspace" ||
    value === "isolated_workspace" ||
    value === "operator_branch" ||
    value === "reuse_existing" ||
    value === "agent_default"
  ) {
    return value;
  }
  return fallback;
}

export type RoutineRunWorkspaceConfig = {
  executionWorkspaceId: string | null;
  executionWorkspacePreference: ExecutionWorkspaceMode;
  executionWorkspaceSettings: IssueExecutionWorkspaceSettings;
  projectWorkspaceId: string | null;
};

export interface RoutineRunDialogSubmitData {
  variables?: Record<string, string | number | boolean>;
  assigneeAgentId?: string | null;
  projectId?: string | null;
  executionWorkspaceId?: string | null;
  executionWorkspacePreference?: string | null;
  executionWorkspaceSettings?: IssueExecutionWorkspaceSettings | null;
}

export function buildInitialWorkspaceConfig(
  project: Project | null | undefined,
  defaultExecutionWorkspace?: ExecutionWorkspace | null,
): RoutineRunWorkspaceConfig {
  if (defaultExecutionWorkspace && defaultExecutionWorkspace.projectId === project?.id) {
    return {
      executionWorkspaceId: defaultExecutionWorkspace.id,
      executionWorkspacePreference: "reuse_existing",
      executionWorkspaceSettings: {
        mode: issueModeForExistingWorkspace(defaultExecutionWorkspace.mode),
      },
      projectWorkspaceId: defaultExecutionWorkspace.projectWorkspaceId ?? defaultProjectWorkspaceIdForProject(project),
    };
  }

  const defaultMode = defaultExecutionWorkspaceModeForProject(project);
  return {
    executionWorkspaceId: null,
    executionWorkspacePreference: defaultMode,
    executionWorkspaceSettings: { mode: defaultMode },
    projectWorkspaceId: defaultProjectWorkspaceIdForProject(project),
  };
}

function workspaceConfigEquals(
  a: RoutineRunWorkspaceConfig,
  b: RoutineRunWorkspaceConfig,
) {
  return a.executionWorkspaceId === b.executionWorkspaceId
    && a.executionWorkspacePreference === b.executionWorkspacePreference
    && a.projectWorkspaceId === b.projectWorkspaceId
    && JSON.stringify(a.executionWorkspaceSettings ?? null) === JSON.stringify(b.executionWorkspaceSettings ?? null);
}

export function applyWorkspaceDraft(
  current: RoutineRunWorkspaceConfig,
  data: Record<string, unknown>,
) {
  const next = {
    ...current,
    executionWorkspaceId: (data.executionWorkspaceId as string | null | undefined) ?? null,
    executionWorkspacePreference: issueWorkspacePreferenceFromDraft(
      data.executionWorkspacePreference,
      current.executionWorkspacePreference,
    ),
    executionWorkspaceSettings:
      (data.executionWorkspaceSettings as IssueExecutionWorkspaceSettings | null | undefined)
      ?? current.executionWorkspaceSettings,
  };
  return workspaceConfigEquals(current, next) ? current : next;
}

export function isMissingRequiredValue(value: unknown) {
  return value == null || (typeof value === "string" && value.trim().length === 0);
}

export function supportsRoutineRunWorkspaceSelection(
  project: Project | null | undefined,
  isolatedWorkspacesEnabled: boolean,
) {
  return isolatedWorkspacesEnabled && Boolean(project?.executionWorkspacePolicy?.enabled);
}
