import type { Issue } from "@paperclipai/shared";
import { applyIssueFilters, type IssueFilterState } from "../issue-filters";
import { sortIssuesByMostRecentActivity } from "./activity";
import type {
  InboxExecutionWorkspaceLookup,
  InboxProjectWorkspaceLookup,
  InboxWorkItem,
  InboxWorkItemGroupBy,
  InboxWorkspaceGroupingOptions,
} from "./types";

export function shouldResetInboxWorkspaceGrouping(
  groupBy: InboxWorkItemGroupBy,
  isolatedWorkspacesEnabled: boolean,
  experimentalSettingsLoaded: boolean,
): boolean {
  return experimentalSettingsLoaded && groupBy === "workspace" && !isolatedWorkspacesEnabled;
}

export function shouldIncludeRoutineExecutionIssue(
  issue: Pick<Issue, "originKind">,
  hideRoutineExecutions: boolean,
): boolean {
  return !hideRoutineExecutions || issue.originKind !== "routine_execution";
}

export function filterInboxIssues(issues: Issue[], hideRoutineExecutions: boolean): Issue[] {
  if (!hideRoutineExecutions) return issues;
  return issues.filter((issue) => shouldIncludeRoutineExecutionIssue(issue, hideRoutineExecutions));
}

export function matchesInboxIssueSearch(
  issue: Pick<Issue, "title" | "identifier" | "description" | "executionWorkspaceId" | "projectId" | "projectWorkspaceId">,
  query: string,
  {
    isolatedWorkspacesEnabled = false,
    executionWorkspaceById,
    projectWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  }: InboxWorkspaceGroupingOptions & {
    isolatedWorkspacesEnabled?: boolean;
  } = {},
): boolean {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  if (issue.title.toLowerCase().includes(normalizedQuery)) return true;
  if (issue.identifier?.toLowerCase().includes(normalizedQuery)) return true;
  if (issue.description?.toLowerCase().includes(normalizedQuery)) return true;
  if (!isolatedWorkspacesEnabled) return false;

  const workspaceName = resolveIssueWorkspaceName(issue, {
    executionWorkspaceById,
    projectWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  });
  return workspaceName?.toLowerCase().includes(normalizedQuery) ?? false;
}

export function getArchivedInboxSearchIssues({
  visibleIssues,
  searchableIssues,
  query,
  isolatedWorkspacesEnabled = false,
  executionWorkspaceById,
  projectWorkspaceById,
  defaultProjectWorkspaceIdByProjectId,
}: {
  visibleIssues: Issue[];
  searchableIssues: Issue[];
  query: string;
  isolatedWorkspacesEnabled?: boolean;
  executionWorkspaceById?: ReadonlyMap<string, InboxExecutionWorkspaceLookup>;
  projectWorkspaceById?: ReadonlyMap<string, InboxProjectWorkspaceLookup>;
  defaultProjectWorkspaceIdByProjectId?: ReadonlyMap<string, string>;
}): Issue[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];

  const visibleIssueIds = new Set(visibleIssues.map((issue) => issue.id));
  return searchableIssues
    .filter((issue) => !visibleIssueIds.has(issue.id))
    .filter((issue) =>
      matchesInboxIssueSearch(issue, normalizedQuery, {
        isolatedWorkspacesEnabled,
        executionWorkspaceById,
        projectWorkspaceById,
        defaultProjectWorkspaceIdByProjectId,
      }),
    )
    .sort(sortIssuesByMostRecentActivity);
}

export function getInboxSearchSupplementIssues({
  query,
  filteredWorkItems,
  archivedSearchIssues,
  remoteIssues,
  issueFilters,
  currentUserId,
  enableRoutineVisibilityFilter = false,
  liveIssueIds,
}: {
  query: string;
  filteredWorkItems: InboxWorkItem[];
  archivedSearchIssues: Issue[];
  remoteIssues: Issue[];
  issueFilters: IssueFilterState;
  currentUserId?: string | null;
  enableRoutineVisibilityFilter?: boolean;
  liveIssueIds?: ReadonlySet<string>;
}): Issue[] {
  const normalizedQuery = query.trim();
  if (!normalizedQuery) return [];
  const visibleIssueIds = new Set([
    ...filteredWorkItems
      .filter((item): item is Extract<InboxWorkItem, { kind: "issue" }> => item.kind === "issue")
      .map((item) => item.issue.id),
    ...archivedSearchIssues.map((issue) => issue.id),
  ]);
  return applyIssueFilters(remoteIssues, issueFilters, currentUserId, enableRoutineVisibilityFilter, liveIssueIds)
    .filter((issue) => !visibleIssueIds.has(issue.id));
}

function formatDefaultWorkspaceGroupLabel(name: string | null | undefined): string {
  const normalizedName = name?.trim();
  return normalizedName ? `${normalizedName} (default)` : "Default workspace";
}

function resolveDefaultProjectWorkspaceInfo(
  issue: Pick<Issue, "projectId">,
  {
    projectWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  }: Pick<InboxWorkspaceGroupingOptions, "projectWorkspaceById" | "defaultProjectWorkspaceIdByProjectId">,
): { id: string; label: string } | null {
  if (!issue.projectId) return null;
  const defaultProjectWorkspaceId = defaultProjectWorkspaceIdByProjectId?.get(issue.projectId) ?? null;
  if (!defaultProjectWorkspaceId) return null;
  return {
    id: defaultProjectWorkspaceId,
    label: formatDefaultWorkspaceGroupLabel(projectWorkspaceById?.get(defaultProjectWorkspaceId)?.name),
  };
}

export function resolveIssueWorkspaceName(
  issue: Pick<Issue, "executionWorkspaceId" | "projectId" | "projectWorkspaceId">,
  {
    executionWorkspaceById,
    projectWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  }: InboxWorkspaceGroupingOptions,
): string | null {
  const defaultProjectWorkspaceId = issue.projectId
    ? defaultProjectWorkspaceIdByProjectId?.get(issue.projectId) ?? null
    : null;

  if (issue.executionWorkspaceId) {
    const executionWorkspace = executionWorkspaceById?.get(issue.executionWorkspaceId) ?? null;
    const linkedProjectWorkspaceId =
      executionWorkspace?.projectWorkspaceId ?? issue.projectWorkspaceId ?? null;
    const isDefaultSharedExecutionWorkspace =
      executionWorkspace?.mode === "shared_workspace" && linkedProjectWorkspaceId === defaultProjectWorkspaceId;
    if (isDefaultSharedExecutionWorkspace) return null;

    const workspaceName = executionWorkspace?.name;
    if (workspaceName) return workspaceName;
  }

  if (issue.projectWorkspaceId) {
    if (issue.projectWorkspaceId === defaultProjectWorkspaceId) return null;
    const workspaceName = projectWorkspaceById?.get(issue.projectWorkspaceId)?.name;
    if (workspaceName) return workspaceName;
  }

  return null;
}

export function resolveIssueWorkspaceGroup(
  issue: Pick<Issue, "executionWorkspaceId" | "projectId" | "projectWorkspaceId">,
  {
    executionWorkspaceById,
    projectWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  }: InboxWorkspaceGroupingOptions = {},
): { key: string; label: string } {
  const defaultProjectWorkspace = resolveDefaultProjectWorkspaceInfo(issue, {
    projectWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  });

  if (issue.executionWorkspaceId) {
    const executionWorkspace = executionWorkspaceById?.get(issue.executionWorkspaceId) ?? null;
    const linkedProjectWorkspaceId =
      executionWorkspace?.projectWorkspaceId ?? issue.projectWorkspaceId ?? null;
    const isDefaultSharedExecutionWorkspace =
      executionWorkspace?.mode === "shared_workspace"
      && linkedProjectWorkspaceId != null
      && linkedProjectWorkspaceId === defaultProjectWorkspace?.id;

    if (isDefaultSharedExecutionWorkspace && defaultProjectWorkspace) {
      return {
        key: `workspace:project:${defaultProjectWorkspace.id}`,
        label: defaultProjectWorkspace.label,
      };
    }

    const workspaceName = executionWorkspace?.name?.trim();
    if (workspaceName) {
      return {
        key: `workspace:execution:${issue.executionWorkspaceId}`,
        label: workspaceName,
      };
    }
  }

  if (issue.projectWorkspaceId) {
    if (issue.projectWorkspaceId === defaultProjectWorkspace?.id) {
      return {
        key: `workspace:project:${defaultProjectWorkspace.id}`,
        label: defaultProjectWorkspace.label,
      };
    }

    const workspaceName = projectWorkspaceById?.get(issue.projectWorkspaceId)?.name?.trim();
    if (workspaceName) {
      return {
        key: `workspace:project:${issue.projectWorkspaceId}`,
        label: workspaceName,
      };
    }
  }

  if (defaultProjectWorkspace) {
    return {
      key: `workspace:project:${defaultProjectWorkspace.id}`,
      label: defaultProjectWorkspace.label,
    };
  }

  return {
    key: "workspace:none",
    label: "No workspace",
  };
}
