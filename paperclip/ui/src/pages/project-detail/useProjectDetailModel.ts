import { useCallback, useEffect, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isUuidLike } from "@paperclipai/shared";

import { assetsApi } from "@/api/assets";
import { budgetsApi } from "@/api/budgets";
import { executionWorkspacesApi } from "@/api/execution-workspaces";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { issuesApi } from "@/api/issues";
import { projectsApi } from "@/api/projects";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { usePanel } from "@/context/PanelContext";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";
import { buildProjectWorkspaceSummaries } from "@/lib/project-workspaces-tab";
import { projectRouteRef } from "@/lib/utils";
import { useLocation, useNavigate, useParams } from "@/lib/router";
import { usePluginSlots } from "@/plugins/slots";

import { isProjectPluginTab, resolveProjectTab, type ProjectPluginTab, type ProjectTab } from "./project-detail-tabs";
import { buildBudgetSummary } from "./project-budget";
import { useProjectFieldSaveState } from "./useProjectFieldSaveState";

export function useProjectDetailModel() {
  const { companyPrefix, projectId, filter } = useParams<{
    companyPrefix?: string;
    projectId: string;
    filter?: string;
  }>();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { closePanel } = usePanel();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToastActions();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const routeProjectRef = projectId ?? "";
  const routeCompanyId = useMemo(() => {
    if (!companyPrefix) return null;
    const requestedPrefix = companyPrefix.toUpperCase();
    return companies.find((company) => company.issuePrefix.toUpperCase() === requestedPrefix)?.id ?? null;
  }, [companies, companyPrefix]);
  const lookupCompanyId = routeCompanyId ?? selectedCompanyId ?? undefined;
  const canFetchProject = routeProjectRef.length > 0 && (isUuidLike(routeProjectRef) || Boolean(lookupCompanyId));
  const activeRouteTab = routeProjectRef ? resolveProjectTab(location.pathname, routeProjectRef) : null;
  const pluginTabFromSearch = useMemo(() => {
    const tab = new URLSearchParams(location.search).get("tab");
    return isProjectPluginTab(tab) ? tab : null;
  }, [location.search]);
  const activeTab = activeRouteTab ?? pluginTabFromSearch;

  const projectQuery = useQuery({
    queryKey: [...queryKeys.projects.detail(routeProjectRef), lookupCompanyId ?? null],
    queryFn: () => projectsApi.get(routeProjectRef, lookupCompanyId),
    enabled: canFetchProject,
  });
  const project = projectQuery.data;
  const canonicalProjectRef = project ? projectRouteRef(project) : routeProjectRef;
  const projectLookupRef = project?.id ?? routeProjectRef;
  const resolvedCompanyId = project?.companyId ?? selectedCompanyId;
  const experimentalSettingsQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });
  const { slots: pluginDetailSlots, isLoading: pluginDetailSlotsLoading } = usePluginSlots({
    slotTypes: ["detailTab"],
    entityType: "project",
    companyId: resolvedCompanyId,
    enabled: !!resolvedCompanyId,
  });
  const pluginTabItems = useMemo(
    () => pluginDetailSlots.map((slot) => ({
      value: `plugin:${slot.pluginKey}:${slot.id}` as ProjectPluginTab,
      label: slot.displayName,
      slot,
    })),
    [pluginDetailSlots],
  );
  const activePluginTab = pluginTabItems.find((item) => item.value === activeTab) ?? null;
  const isolatedWorkspacesEnabled = experimentalSettingsQuery.data?.enableIsolatedWorkspaces === true;
  const workspaceTabProjectId = project?.id ?? null;
  const workspaceIssuesQuery = useQuery({
    queryKey: workspaceTabProjectId && resolvedCompanyId
      ? queryKeys.issues.listByProject(resolvedCompanyId, workspaceTabProjectId)
      : ["issues", "__workspace-tab__", "disabled"],
    queryFn: () => issuesApi.list(resolvedCompanyId!, { projectId: workspaceTabProjectId! }),
    enabled: Boolean(resolvedCompanyId && workspaceTabProjectId && isolatedWorkspacesEnabled),
  });
  const workspaceExecutionQuery = useQuery({
    queryKey: workspaceTabProjectId && resolvedCompanyId
      ? queryKeys.executionWorkspaces.list(resolvedCompanyId, { projectId: workspaceTabProjectId })
      : ["execution-workspaces", "__workspace-tab__", "disabled"],
    queryFn: () => executionWorkspacesApi.list(resolvedCompanyId!, { projectId: workspaceTabProjectId! }),
    enabled: Boolean(resolvedCompanyId && workspaceTabProjectId && isolatedWorkspacesEnabled),
  });
  const workspaceSummaries = useMemo(() => {
    if (!project || !isolatedWorkspacesEnabled) return [];
    return buildProjectWorkspaceSummaries({
      project,
      issues: workspaceIssuesQuery.data ?? [],
      executionWorkspaces: workspaceExecutionQuery.data ?? [],
    });
  }, [project, isolatedWorkspacesEnabled, workspaceIssuesQuery.data, workspaceExecutionQuery.data]);
  const showWorkspacesTab = isolatedWorkspacesEnabled && workspaceSummaries.length > 0;
  const workspaceTabDecisionLoaded =
    experimentalSettingsQuery.isFetched &&
    (!isolatedWorkspacesEnabled || (!workspaceIssuesQuery.isLoading && !workspaceExecutionQuery.isLoading));
  const workspaceTabError = (workspaceIssuesQuery.error ?? workspaceExecutionQuery.error) as Error | null;

  useEffect(() => {
    if (!project?.companyId || project.companyId === selectedCompanyId) return;
    setSelectedCompanyId(project.companyId, { source: "route_sync" });
  }, [project?.companyId, selectedCompanyId, setSelectedCompanyId]);

  const invalidateProject = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(routeProjectRef) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(projectLookupRef) });
    if (resolvedCompanyId) queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(resolvedCompanyId) });
  }, [projectLookupRef, queryClient, resolvedCompanyId, routeProjectRef]);

  const updateProject = useMutation({
    mutationFn: (data: Record<string, unknown>) => projectsApi.update(projectLookupRef, data, resolvedCompanyId ?? lookupCompanyId),
    onSuccess: invalidateProject,
  });
  const archiveProject = useMutation({
    mutationFn: (archived: boolean) => projectsApi.update(
      projectLookupRef,
      { archivedAt: archived ? new Date().toISOString() : null },
      resolvedCompanyId ?? lookupCompanyId,
    ),
    onSuccess: (updatedProject, archived) => {
      invalidateProject();
      const name = updatedProject?.name ?? project?.name ?? "Project";
      pushToast({ title: `"${name}" has been ${archived ? "archived" : "unarchived"}`, tone: "success" });
      if (archived) navigate("/dashboard");
    },
    onError: (_, archived) => pushToast({
      title: archived ? "Failed to archive project" : "Failed to unarchive project",
      tone: "error",
    }),
  });
  const uploadImage = useMutation({
    mutationFn: async (file: File) => {
      if (!resolvedCompanyId) throw new Error("No company selected");
      return assetsApi.uploadImage(resolvedCompanyId, file, `projects/${projectLookupRef || "draft"}`);
    },
  });
  const { data: budgetOverview } = useQuery({
    queryKey: queryKeys.budgets.overview(resolvedCompanyId ?? "__none__"),
    queryFn: () => budgetsApi.overview(resolvedCompanyId!),
    enabled: !!resolvedCompanyId,
    refetchInterval: 30_000,
    staleTime: 5_000,
  });

  useEffect(() => {
    setBreadcrumbs([{ label: "Projects", href: "/projects" }, { label: project?.name ?? routeProjectRef ?? "Project" }]);
  }, [setBreadcrumbs, project, routeProjectRef]);

  useEffect(() => {
    if (!project || routeProjectRef === canonicalProjectRef) return;
    const nextPath = activeTab === "overview" ? "overview"
      : activeTab === "configuration" ? "configuration"
        : activeTab === "budget" ? "budget"
          : activeTab === "plugin-operations" ? "plugin-operations"
            : activeTab === "workspaces" ? "workspaces"
              : activeTab === "list" ? `issues${filter ? `/${filter}` : ""}`
                : null;
    if (isProjectPluginTab(activeTab)) navigate(`/projects/${canonicalProjectRef}?tab=${encodeURIComponent(activeTab)}`, { replace: true });
    else navigate(nextPath ? `/projects/${canonicalProjectRef}/${nextPath}` : `/projects/${canonicalProjectRef}`, { replace: true });
  }, [project, routeProjectRef, canonicalProjectRef, activeTab, filter, navigate]);

  useEffect(() => {
    closePanel();
    return () => closePanel();
  }, [closePanel]);

  const { fieldSaveStates, updateProjectField } = useProjectFieldSaveState({
    projectLookupRef,
    resolvedCompanyId,
    lookupCompanyId,
    invalidateProject,
  });

  const projectBudgetSummary = useMemo(() => buildBudgetSummary({
    matched: budgetOverview?.policies.find(
      (policy) => policy.scopeType === "project" && policy.scopeId === (project?.id ?? routeProjectRef),
    ),
    project,
    resolvedCompanyId,
    routeProjectRef,
  }), [budgetOverview?.policies, project, resolvedCompanyId, routeProjectRef]);
  const budgetMutation = useMutation({
    mutationFn: (amount: number) => budgetsApi.upsertPolicy(resolvedCompanyId!, {
      scopeType: "project",
      scopeId: project?.id ?? routeProjectRef,
      amount,
      windowKind: "lifetime",
    }),
    onSuccess: () => {
      if (!resolvedCompanyId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.budgets.overview(resolvedCompanyId) });
      invalidateProject();
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(resolvedCompanyId) });
    },
  });

  const handleTabChange = useCallback((tab: ProjectTab) => {
    if (project?.id) {
      try { localStorage.setItem(`paperclip:project-tab:${project.id}`, tab); } catch {}
    }
    if (isProjectPluginTab(tab)) navigate(`/projects/${canonicalProjectRef}?tab=${encodeURIComponent(tab)}`);
    else navigate(`/projects/${canonicalProjectRef}/${tab === "list" ? "issues" : tab}`);
  }, [canonicalProjectRef, navigate, project?.id]);

  return {
    activePluginTab,
    activeTab,
    archiveProject,
    budgetMutation,
    canonicalProjectRef,
    companyPrefix,
    error: projectQuery.error as Error | null,
    fieldSaveStates,
    handleTabChange,
    isLoading: projectQuery.isLoading,
    pluginDetailSlotsLoading,
    pluginTabFromSearch,
    pluginTabItems,
    project,
    projectBudgetSummary,
    resolvedCompanyId,
    routeProjectRef,
    showWorkspacesTab,
    updateProject,
    updateProjectField,
    uploadImage,
    workspaceSummaries,
    workspaceTabDecisionLoaded,
    workspaceTabError,
  };
}
