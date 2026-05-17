import { useMemo } from "react";
import type { Issue, Project } from "@paperclipai/shared";
import { useQuery } from "@tanstack/react-query";
import { accessApi } from "../api/access";
import { agentsApi } from "../api/agents";
import { authApi } from "../api/auth";
import { instanceSettingsApi } from "../api/instanceSettings";
import { projectsApi } from "../api/projects";
import { useCompany } from "../context/CompanyContext";
import { useProjectOrder } from "../hooks/useProjectOrder";
import { formatAssigneeUserLabel } from "../lib/assignees";
import { buildCompanyUserLabelMap } from "../lib/company-members";
import { queryKeys } from "../lib/queryKeys";
import { PriorityIcon } from "./PriorityIcon";
import { StatusIcon } from "./StatusIcon";
import { AssigneeProperty } from "./issue-properties/AssigneeProperty";
import { ExecutionPolicyProperties } from "./issue-properties/ExecutionPolicyProperties";
import { IssueRelationshipsProperties } from "./issue-properties/IssueRelationshipsProperties";
import { LabelsProperty } from "./issue-properties/LabelsProperty";
import { MetadataProperties } from "./issue-properties/MetadataProperties";
import { MonitorProperty } from "./issue-properties/MonitorProperty";
import { ProjectProperty } from "./issue-properties/ProjectProperty";
import { PropertyRow } from "./issue-properties/PropertyLayout";
import { WorkspaceProperties } from "./issue-properties/WorkspaceProperties";
import type { IssuePropertiesProps } from "./issue-properties/types";

export function IssueProperties({
  issue,
  childIssues = [],
  onAddSubIssue,
  onUpdate,
  inline,
}: IssuePropertiesProps) {
  const { selectedCompanyId } = useCompany();
  const companyId = issue.companyId ?? selectedCompanyId;

  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId;

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(companyId!),
    queryFn: () => agentsApi.list(companyId!),
    enabled: !!companyId,
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(companyId!),
    queryFn: () => accessApi.listUserDirectory(companyId!),
    enabled: !!companyId,
  });
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const { data: projects } = useQuery({
    queryKey: queryKeys.projects.list(companyId!),
    queryFn: () => projectsApi.list(companyId!),
    enabled: !!companyId,
  });

  const activeProjects = useMemo(
    () => (projects ?? []).filter((p) => !p.archivedAt || p.id === issue.projectId),
    [projects, issue.projectId],
  );
  const { orderedProjects } = useProjectOrder({
    projects: activeProjects,
    companyId,
    userId: currentUserId,
  });
  const userLabelMap = useMemo(
    () => buildCompanyUserLabelMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const userLabel = (userId: string | null | undefined) => formatAssigneeUserLabel(userId, currentUserId, userLabelMap);
  const creatorUserLabel = userLabel(issue.createdByUserId);
  const agentName = (id: string | null) => {
    if (!id || !agents) return null;
    const agent = agents.find((a) => a.id === id);
    return agent?.name ?? id.slice(0, 8);
  };
  const currentProject = issue.projectId
    ? orderedProjects.find((project) => project.id === issue.projectId) ?? null
    : null;
  const issueProject = (issue.project ?? currentProject) as Project | null;
  const isolatedWorkspacesEnabled = experimentalSettings?.enableIsolatedWorkspaces === true;

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <PropertyRow label="Status">
          <StatusIcon
            status={issue.status}
            blockerAttention={issue.blockerAttention}
            onChange={(status) => onUpdate({ status })}
            showLabel
          />
        </PropertyRow>

        <PropertyRow label="Priority">
          <PriorityIcon
            priority={issue.priority}
            onChange={(priority) => onUpdate({ priority })}
            showLabel
          />
        </PropertyRow>

        <LabelsProperty
          issue={issue}
          companyId={companyId}
          inline={inline}
          onUpdate={onUpdate}
        />

        <AssigneeProperty
          issue={issue}
          agents={agents}
          companyMembers={companyMembers}
          currentUserId={currentUserId}
          inline={inline}
          onUpdate={onUpdate}
        />

        <ProjectProperty
          issue={issue}
          projects={projects}
          orderedProjects={orderedProjects}
          inline={inline}
          onUpdate={onUpdate}
        />

        <IssueRelationshipsProperties
          issue={issue}
          childIssues={childIssues}
          companyId={companyId}
          inline={inline}
          onAddSubIssue={onAddSubIssue}
          onUpdate={onUpdate}
        />

        <ExecutionPolicyProperties
          issue={issue}
          agents={agents}
          companyMembers={companyMembers}
          currentUserId={currentUserId}
          creatorUserLabel={creatorUserLabel}
          inline={inline}
          agentName={agentName}
          userLabel={userLabel}
          onUpdate={onUpdate}
        />

        <MonitorProperty
          issue={issue}
          inline={inline}
          onUpdate={onUpdate}
        />

        {issue.requestDepth > 0 && (
          <PropertyRow label="Depth">
            <span className="text-sm font-mono">{issue.requestDepth}</span>
          </PropertyRow>
        )}
      </div>

      <WorkspaceProperties
        issue={issue}
        issueProject={issueProject}
        isolatedWorkspacesEnabled={isolatedWorkspacesEnabled}
      />

      <MetadataProperties
        issue={issue}
        creatorUserLabel={creatorUserLabel}
        agentName={agentName}
      />
    </div>
  );
}
