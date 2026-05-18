import { Navigate } from "@/lib/router";
import { PageSkeleton } from "@/components/PageSkeleton";

import { ProjectDetailBody } from "./project-detail/ProjectDetailBody";
import { isProjectPluginTab } from "./project-detail/project-detail-tabs";
import { useProjectDetailModel } from "./project-detail/useProjectDetailModel";

export function ProjectDetail() {
  const model = useProjectDetailModel();
  const {
    activePluginTab,
    activeTab,
    canonicalProjectRef,
    error,
    isLoading,
    pluginDetailSlotsLoading,
    pluginTabFromSearch,
    project,
    routeProjectRef,
    showWorkspacesTab,
    workspaceTabDecisionLoaded,
  } = model;

  if (pluginTabFromSearch && !pluginDetailSlotsLoading && !activePluginTab) {
    return <Navigate to={`/projects/${canonicalProjectRef}/issues`} replace />;
  }

  if (activeTab === "workspaces" && workspaceTabDecisionLoaded && !showWorkspacesTab) {
    return <Navigate to={`/projects/${canonicalProjectRef}/issues`} replace />;
  }

  if (routeProjectRef && activeTab === null) {
    if (!project?.id) return <Navigate to={`/projects/${canonicalProjectRef}/issues`} replace />;
    const cachedTab = readCachedProjectTab(project.id);
    if (cachedTab === "workspaces" && !workspaceTabDecisionLoaded) return <PageSkeleton variant="detail" />;
    if (cachedTab === "workspaces" && workspaceTabDecisionLoaded && showWorkspacesTab) {
      return <Navigate to={`/projects/${canonicalProjectRef}/workspaces`} replace />;
    }
    if (cachedTab === "plugin-operations" && project.managedByPlugin) {
      return <Navigate to={`/projects/${canonicalProjectRef}/plugin-operations`} replace />;
    }
    if (cachedTab === "overview" || cachedTab === "configuration" || cachedTab === "budget") {
      return <Navigate to={`/projects/${canonicalProjectRef}/${cachedTab}`} replace />;
    }
    if (isProjectPluginTab(cachedTab)) {
      return <Navigate to={`/projects/${canonicalProjectRef}?tab=${encodeURIComponent(cachedTab)}`} replace />;
    }
    return <Navigate to={`/projects/${canonicalProjectRef}/issues`} replace />;
  }

  if (isLoading) return <PageSkeleton variant="detail" />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!project) return null;

  return <ProjectDetailBody {...model} project={project} />;
}

function readCachedProjectTab(projectId: string) {
  try {
    return localStorage.getItem(`paperclip:project-tab:${projectId}`);
  } catch {
    return null;
  }
}
