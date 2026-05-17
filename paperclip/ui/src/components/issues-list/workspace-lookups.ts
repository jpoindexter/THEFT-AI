import {
  shouldIncludeIssueFilterWorkspaceOption,
} from "../../lib/issue-filters";
import type {
  IssueExecutionWorkspaceSummary,
  IssueProjectSummary,
  IssueProjectWorkspaceSummary,
  ProjectOption,
} from "./types";

type ExecutionWorkspaceInput = {
  id: string;
  name: string;
  mode: IssueExecutionWorkspaceSummary["mode"];
  projectWorkspaceId?: string | null;
};

export function buildProjectById(projects?: ProjectOption[]): Map<string, IssueProjectSummary> {
  const map = new Map<string, IssueProjectSummary>();
  for (const project of projects ?? []) {
    map.set(project.id, { name: project.name, color: project.color ?? null });
  }
  return map;
}

export function buildProjectWorkspaceById(projects?: ProjectOption[]): Map<string, IssueProjectWorkspaceSummary> {
  const map = new Map<string, IssueProjectWorkspaceSummary>();
  for (const project of projects ?? []) {
    for (const workspace of project.workspaces ?? []) {
      map.set(workspace.id, { name: workspace.name || project.name });
    }
  }
  return map;
}

export function buildDefaultProjectWorkspaceIdByProjectId(projects?: ProjectOption[]): Map<string, string> {
  const map = new Map<string, string>();
  for (const project of projects ?? []) {
    const defaultWorkspaceId =
      project.executionWorkspacePolicy?.defaultProjectWorkspaceId
      ?? project.primaryWorkspace?.id
      ?? null;
    if (defaultWorkspaceId) map.set(project.id, defaultWorkspaceId);
  }
  return map;
}

export function buildExecutionWorkspaceById(
  executionWorkspaces: ExecutionWorkspaceInput[],
): Map<string, IssueExecutionWorkspaceSummary> {
  const map = new Map<string, IssueExecutionWorkspaceSummary>();
  for (const workspace of executionWorkspaces) {
    map.set(workspace.id, {
      name: workspace.name,
      mode: workspace.mode,
      projectWorkspaceId: workspace.projectWorkspaceId ?? null,
    });
  }
  return map;
}

export function buildWorkspaceNameMap({
  projectWorkspaceById,
  executionWorkspaceById,
  defaultProjectWorkspaceIds,
}: {
  projectWorkspaceById: ReadonlyMap<string, IssueProjectWorkspaceSummary>;
  executionWorkspaceById: ReadonlyMap<string, IssueExecutionWorkspaceSummary>;
  defaultProjectWorkspaceIds: ReadonlySet<string>;
}): Map<string, string> {
  const map = new Map<string, string>();
  for (const [workspaceId, workspace] of projectWorkspaceById) {
    if (!shouldIncludeIssueFilterWorkspaceOption({ id: workspaceId }, defaultProjectWorkspaceIds)) continue;
    map.set(workspaceId, workspace.name);
  }
  for (const [workspaceId, workspace] of executionWorkspaceById) {
    if (!shouldIncludeIssueFilterWorkspaceOption({
      id: workspaceId,
      mode: workspace.mode,
      projectWorkspaceId: workspace.projectWorkspaceId,
    }, defaultProjectWorkspaceIds)) continue;
    map.set(workspaceId, workspace.name);
  }
  return map;
}

export function buildWorkspaceOptions(workspaceNameMap: ReadonlyMap<string, string>): Array<{ id: string; name: string }> {
  const options = new Map<string, string>();
  for (const [workspaceId, workspaceName] of workspaceNameMap) {
    options.set(workspaceId, workspaceName);
  }
  return [...options.entries()]
    .sort((left, right) => left[1].localeCompare(right[1]))
    .map(([id, name]) => ({ id, name }));
}
