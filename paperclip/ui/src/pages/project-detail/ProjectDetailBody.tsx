import { PageTabBar } from "@/components/PageTabBar";
import { Tabs } from "@/components/ui/tabs";
import { PluginSlotMount } from "@/plugins/slots";

import { ProjectActiveTab } from "./ProjectActiveTab";
import { ProjectDetailHeader } from "./ProjectDetailHeader";
import type { ProjectTab } from "./project-detail-tabs";
import type { useProjectDetailModel } from "./useProjectDetailModel";

type ProjectDetailModel = ReturnType<typeof useProjectDetailModel>;
type LoadedProject = NonNullable<ProjectDetailModel["project"]>;

export type ProjectDetailBodyProps = Omit<ProjectDetailModel, "project" | "isLoading" | "error"> & {
  project: LoadedProject;
};

export function ProjectDetailBody(props: ProjectDetailBodyProps) {
  const {
    activePluginTab,
    activeTab,
    archiveProject,
    budgetMutation,
    canonicalProjectRef,
    companyPrefix,
    fieldSaveStates,
    handleTabChange,
    pluginTabItems,
    project,
    projectBudgetSummary,
    resolvedCompanyId,
    showWorkspacesTab,
    updateProject,
    updateProjectField,
    uploadImage,
    workspaceSummaries,
    workspaceTabDecisionLoaded,
    workspaceTabError,
  } = props;

  return (
    <div className="space-y-6">
      <ProjectDetailHeader
        project={project}
        companyPrefix={companyPrefix ?? null}
        projectRef={canonicalProjectRef}
        companyId={resolvedCompanyId}
        onUpdate={(data) => updateProject.mutate(data)}
      />

      <Tabs value={activeTab ?? "list"} onValueChange={(value) => handleTabChange(value as ProjectTab)}>
        <PageTabBar
          items={[
            { value: "list", label: "Issues" },
            { value: "overview", label: "Overview" },
            ...(project.managedByPlugin ? [{ value: "plugin-operations", label: "Plugin operations" }] : []),
            ...(showWorkspacesTab ? [{ value: "workspaces", label: "Workspaces" }] : []),
            { value: "configuration", label: "Configuration" },
            { value: "budget", label: "Budget" },
            ...pluginTabItems.map((item) => ({ value: item.value, label: item.label })),
          ]}
          align="start"
          value={activeTab ?? "list"}
          onValueChange={(value) => handleTabChange(value as ProjectTab)}
        />
      </Tabs>

      <ProjectActiveTab
        activeTab={activeTab}
        archiveProject={archiveProject}
        budgetMutation={budgetMutation}
        canonicalProjectRef={canonicalProjectRef}
        fieldSaveStates={fieldSaveStates}
        project={project}
        projectBudgetSummary={projectBudgetSummary}
        resolvedCompanyId={resolvedCompanyId}
        updateProject={updateProject}
        updateProjectField={updateProjectField}
        uploadImage={uploadImage}
        workspaceSummaries={workspaceSummaries}
        workspaceTabDecisionLoaded={workspaceTabDecisionLoaded}
        workspaceTabError={workspaceTabError}
      />

      {activePluginTab ? (
        <PluginSlotMount
          slot={activePluginTab.slot}
          context={{
            companyId: resolvedCompanyId,
            companyPrefix: companyPrefix ?? null,
            projectId: project.id,
            projectRef: canonicalProjectRef,
            entityId: project.id,
            entityType: "project",
          }}
          missingBehavior="placeholder"
        />
      ) : null}
    </div>
  );
}
