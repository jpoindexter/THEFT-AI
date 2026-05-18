import { Navigate } from "@/lib/router";
import { BudgetPolicyCard } from "@/components/BudgetPolicyCard";
import { ProjectProperties } from "@/components/ProjectProperties";
import { ProjectWorkspacesContent } from "@/components/ProjectWorkspacesContent";

import { ProjectIssuesList, ProjectPluginOperationsList } from "./ProjectIssuesLists";
import { ProjectOverviewContent } from "./ProjectOverviewContent";
import { isProjectPluginTab } from "./project-detail-tabs";
import type { ProjectDetailBodyProps } from "./ProjectDetailBody";

type ProjectActiveTabProps = Pick<ProjectDetailBodyProps,
  | "activeTab"
  | "archiveProject"
  | "budgetMutation"
  | "canonicalProjectRef"
  | "fieldSaveStates"
  | "project"
  | "projectBudgetSummary"
  | "resolvedCompanyId"
  | "updateProject"
  | "updateProjectField"
  | "uploadImage"
  | "workspaceSummaries"
  | "workspaceTabDecisionLoaded"
  | "workspaceTabError"
>;

export function ProjectActiveTab({
  activeTab,
  archiveProject,
  budgetMutation,
  canonicalProjectRef,
  fieldSaveStates,
  project,
  projectBudgetSummary,
  resolvedCompanyId,
  updateProject,
  updateProjectField,
  uploadImage,
  workspaceSummaries,
  workspaceTabDecisionLoaded,
  workspaceTabError,
}: ProjectActiveTabProps) {
  if (activeTab === "overview") {
    return <ProjectOverviewContent project={project} onUpdate={(data) => updateProject.mutate(data)} imageUploadHandler={async (file) => (await uploadImage.mutateAsync(file)).contentPath} />;
  }
  if (activeTab === "list" && resolvedCompanyId) return <ProjectIssuesList projectId={project.id} companyId={resolvedCompanyId} />;
  if (activeTab === "plugin-operations" && resolvedCompanyId && project.managedByPlugin) {
    return <ProjectPluginOperationsList projectId={project.id} companyId={resolvedCompanyId} pluginKey={project.managedByPlugin.pluginKey} />;
  }
  if (activeTab === "workspaces") {
    if (!workspaceTabDecisionLoaded) return <p className="text-sm text-muted-foreground">Loading workspaces...</p>;
    if (workspaceTabError) return <p className="text-sm text-destructive">{workspaceTabError.message}</p>;
    return <ProjectWorkspacesContent companyId={resolvedCompanyId!} projectId={project.id} projectRef={canonicalProjectRef} summaries={workspaceSummaries} />;
  }
  if (activeTab === "configuration") {
    return (
      <div className="max-w-4xl">
        <ProjectProperties
          project={project}
          onUpdate={(data) => updateProject.mutate(data)}
          onFieldUpdate={updateProjectField}
          getFieldSaveState={(field) => fieldSaveStates[field] ?? "idle"}
          onArchive={(archived) => archiveProject.mutate(archived)}
          archivePending={archiveProject.isPending}
        />
      </div>
    );
  }
  if (activeTab === "budget" && resolvedCompanyId) {
    return (
      <div className="max-w-3xl">
        <BudgetPolicyCard
          summary={projectBudgetSummary}
          variant="plain"
          isSaving={budgetMutation.isPending}
          onSave={(amount) => budgetMutation.mutate(amount)}
        />
      </div>
    );
  }
  if (isProjectPluginTab(activeTab)) return null;
  return <Navigate to={`/projects/${canonicalProjectRef}/issues`} replace />;
}
