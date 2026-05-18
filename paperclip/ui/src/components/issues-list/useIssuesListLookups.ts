import { useCallback, useMemo } from "react";
import type { Issue } from "@paperclipai/shared";
import { buildCompanyUserLabelMap, buildCompanyUserProfileMap } from "../../lib/company-members";
import {
  getAvailableInboxIssueColumns,
  type InboxIssueColumn,
} from "../../lib/inbox";
import { issueTrailingColumns } from "../IssueColumns";
import { buildCreatorOptions } from "./options";
import type { Agent, ProjectOption } from "./types";
import {
  buildDefaultProjectWorkspaceIdByProjectId,
  buildExecutionWorkspaceById,
  buildProjectById,
  buildProjectWorkspaceById,
  buildWorkspaceNameMap,
  buildWorkspaceOptions,
} from "./workspace-lookups";

export function useIssuesListLookups({
  issues,
  agents,
  projects,
  currentUserId,
  companyMembers,
  executionWorkspaces,
  isolatedWorkspacesEnabled,
  visibleIssueColumnSet,
}: {
  issues: Issue[];
  agents?: Agent[];
  projects?: ProjectOption[];
  currentUserId: string | null;
  companyMembers?: { users?: Parameters<typeof buildCompanyUserLabelMap>[0] };
  executionWorkspaces: Parameters<typeof buildExecutionWorkspaceById>[0];
  isolatedWorkspacesEnabled: boolean;
  visibleIssueColumnSet: ReadonlySet<InboxIssueColumn>;
}) {
  const agentName = useCallback((id: string | null) => {
    if (!id || !agents) return null;
    return agents.find((agent) => agent.id === id)?.name ?? null;
  }, [agents]);

  const companyUserLabelMap = useMemo(
    () => buildCompanyUserLabelMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const companyUserProfileMap = useMemo(
    () => buildCompanyUserProfileMap(companyMembers?.users),
    [companyMembers?.users],
  );

  const projectById = useMemo(() => buildProjectById(projects), [projects]);
  const projectWorkspaceById = useMemo(() => buildProjectWorkspaceById(projects), [projects]);
  const defaultProjectWorkspaceIdByProjectId = useMemo(
    () => buildDefaultProjectWorkspaceIdByProjectId(projects),
    [projects],
  );
  const defaultProjectWorkspaceIds = useMemo(
    () => new Set(defaultProjectWorkspaceIdByProjectId.values()),
    [defaultProjectWorkspaceIdByProjectId],
  );

  const executionWorkspaceById = useMemo(
    () => buildExecutionWorkspaceById(executionWorkspaces),
    [executionWorkspaces],
  );
  const issueFilterWorkspaceContext = useMemo(() => ({
    executionWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
  }), [defaultProjectWorkspaceIdByProjectId, executionWorkspaceById]);

  const workspaceNameMap = useMemo(() => buildWorkspaceNameMap({
    projectWorkspaceById,
    executionWorkspaceById,
    defaultProjectWorkspaceIds,
  }), [defaultProjectWorkspaceIds, executionWorkspaceById, projectWorkspaceById]);
  const workspaceOptions = useMemo(() => buildWorkspaceOptions(workspaceNameMap), [workspaceNameMap]);
  const creatorOptions = useMemo(
    () => buildCreatorOptions({ issues, agents, currentUserId }),
    [agents, currentUserId, issues],
  );

  const availableIssueColumns = useMemo(
    () => getAvailableInboxIssueColumns(isolatedWorkspacesEnabled),
    [isolatedWorkspacesEnabled],
  );
  const availableIssueColumnSet = useMemo(() => new Set(availableIssueColumns), [availableIssueColumns]);
  const visibleTrailingIssueColumns = useMemo(
    () => issueTrailingColumns.filter((column) => visibleIssueColumnSet.has(column) && availableIssueColumnSet.has(column)),
    [availableIssueColumnSet, visibleIssueColumnSet],
  );

  return {
    agentName,
    companyUserLabelMap,
    companyUserProfileMap,
    projectById,
    projectWorkspaceById,
    defaultProjectWorkspaceIdByProjectId,
    executionWorkspaceById,
    issueFilterWorkspaceContext,
    workspaceNameMap,
    workspaceOptions,
    creatorOptions,
    availableIssueColumns,
    availableIssueColumnSet,
    visibleTrailingIssueColumns,
  };
}
