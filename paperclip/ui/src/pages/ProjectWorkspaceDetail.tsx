import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isUuidLike } from "@paperclipai/shared";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  buildWorkspaceRuntimeControlSections,
  type WorkspaceRuntimeControlRequest,
} from "@/components/WorkspaceRuntimeControls";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { queryKeys } from "@/lib/queryKeys";
import { projectRouteRef, projectWorkspaceUrl } from "@/lib/utils";
import { WorkspaceCommandsCard } from "./project-workspace-detail/WorkspaceCommandsCard";
import { WorkspaceFactsCard } from "./project-workspace-detail/WorkspaceFactsCard";
import { WorkspaceSettingsCard } from "./project-workspace-detail/WorkspaceSettingsCard";
import {
  buildWorkspacePatch,
  formStateFromWorkspace,
  validateWorkspaceForm,
  type WorkspaceFormState,
} from "./project-workspace-detail/workspaceModel";
import { projectsApi } from "../api/projects";

export function ProjectWorkspaceDetail() {
  const { companyPrefix, projectId, workspaceId } = useParams<{
    companyPrefix?: string;
    projectId: string;
    workspaceId: string;
  }>();
  const { companies, selectedCompanyId, setSelectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<WorkspaceFormState | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runtimeActionMessage, setRuntimeActionMessage] = useState<string | null>(null);
  const routeProjectRef = projectId ?? "";
  const routeWorkspaceId = workspaceId ?? "";

  const routeCompanyId = useMemo(() => {
    if (!companyPrefix) return null;
    const requestedPrefix = companyPrefix.toUpperCase();
    return companies.find((company) => company.issuePrefix.toUpperCase() === requestedPrefix)?.id ?? null;
  }, [companies, companyPrefix]);

  const lookupCompanyId = routeCompanyId ?? selectedCompanyId ?? undefined;
  const canFetchProject = routeProjectRef.length > 0 && (isUuidLike(routeProjectRef) || Boolean(lookupCompanyId));
  const projectQuery = useQuery({
    queryKey: [...queryKeys.projects.detail(routeProjectRef), lookupCompanyId ?? null],
    queryFn: () => projectsApi.get(routeProjectRef, lookupCompanyId),
    enabled: canFetchProject,
  });

  const project = projectQuery.data ?? null;
  const workspace = useMemo(
    () => project?.workspaces.find((item) => item.id === routeWorkspaceId) ?? null,
    [project, routeWorkspaceId],
  );
  const canonicalProjectRef = project ? projectRouteRef(project) : routeProjectRef;
  const initialState = useMemo(() => (workspace ? formStateFromWorkspace(workspace) : null), [workspace]);
  const isDirty = Boolean(form && initialState && JSON.stringify(form) !== JSON.stringify(initialState));

  useEffect(() => {
    if (!project?.companyId || project.companyId === selectedCompanyId) return;
    setSelectedCompanyId(project.companyId, { source: "route_sync" });
  }, [project?.companyId, selectedCompanyId, setSelectedCompanyId]);

  useEffect(() => {
    if (!workspace) return;
    setForm(formStateFromWorkspace(workspace));
    setErrorMessage(null);
  }, [workspace]);

  useEffect(() => {
    if (!project) return;
    setBreadcrumbs([
      { label: "Projects", href: "/projects" },
      { label: project.name, href: `/projects/${canonicalProjectRef}` },
      { label: "Workspaces", href: `/projects/${canonicalProjectRef}/workspaces` },
      { label: workspace?.name ?? routeWorkspaceId },
    ]);
  }, [setBreadcrumbs, project, canonicalProjectRef, workspace?.name, routeWorkspaceId]);

  useEffect(() => {
    if (!project || routeProjectRef === canonicalProjectRef) return;
    navigate(projectWorkspaceUrl(project, routeWorkspaceId), { replace: true });
  }, [project, routeProjectRef, canonicalProjectRef, routeWorkspaceId, navigate]);

  const invalidateProject = () => {
    if (!project) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.urlKey) });
    if (lookupCompanyId) queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(lookupCompanyId) });
  };

  const updateWorkspace = useMutation({
    mutationFn: (patch: Record<string, unknown>) =>
      projectsApi.updateWorkspace(project!.id, routeWorkspaceId, patch, lookupCompanyId),
    onSuccess: () => {
      invalidateProject();
      setErrorMessage(null);
    },
    onError: (error) => setErrorMessage(error instanceof Error ? error.message : "Failed to save workspace."),
  });

  const setPrimaryWorkspace = useMutation({
    mutationFn: () => projectsApi.updateWorkspace(project!.id, routeWorkspaceId, { isPrimary: true }, lookupCompanyId),
    onSuccess: () => {
      invalidateProject();
      setErrorMessage(null);
    },
    onError: (error) => setErrorMessage(error instanceof Error ? error.message : "Failed to update workspace."),
  });

  const controlRuntimeServices = useMutation({
    mutationFn: (request: WorkspaceRuntimeControlRequest) =>
      projectsApi.controlWorkspaceCommands(project!.id, routeWorkspaceId, request.action, lookupCompanyId, request),
    onSuccess: (_result, request) => {
      invalidateProject();
      setErrorMessage(null);
      setRuntimeActionMessage(runtimeActionSuccessMessage(request.action));
    },
    onError: (error) => {
      setRuntimeActionMessage(null);
      setErrorMessage(error instanceof Error ? error.message : "Failed to control workspace commands.");
    },
  });

  if (projectQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading workspace...</p>;
  if (projectQuery.error) {
    return <p className="text-sm text-destructive">{projectQueryErrorMessage(projectQuery.error)}</p>;
  }
  if (!project || !workspace || !form || !initialState) {
    return <p className="text-sm text-muted-foreground">Workspace not found for this project.</p>;
  }

  const canRunWorkspaceCommands = Boolean(workspace.cwd);
  const canStartRuntimeServices = Boolean(workspace.runtimeConfig?.workspaceRuntime) && canRunWorkspaceCommands;
  const runtimeControlSections = buildWorkspaceRuntimeControlSections({
    runtimeConfig: workspace.runtimeConfig?.workspaceRuntime ?? null,
    runtimeServices: workspace.runtimeServices ?? [],
    canStartServices: canStartRuntimeServices,
    canRunJobs: canRunWorkspaceCommands,
  });
  const pendingRuntimeAction = controlRuntimeServices.isPending ? controlRuntimeServices.variables ?? null : null;

  const saveChanges = () => {
    const validationError = validateWorkspaceForm(form);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }
    const patch = buildWorkspacePatch(initialState, form);
    if (Object.keys(patch).length > 0) updateWorkspace.mutate(patch);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/projects/${canonicalProjectRef}/workspaces`}>
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to workspaces
          </Link>
        </Button>
        <div className="inline-flex items-center rounded-full border border-border bg-background px-2.5 py-1 text-xs text-muted-foreground">
          {workspace.isPrimary ? "Primary workspace" : "Secondary workspace"}
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <WorkspaceSettingsCard
            workspace={workspace}
            form={form}
            initialState={initialState}
            isDirty={isDirty}
            isSaving={updateWorkspace.isPending}
            isSettingPrimary={setPrimaryWorkspace.isPending}
            errorMessage={errorMessage}
            runtimeActionMessage={runtimeActionMessage}
            onChange={setForm}
            onSave={saveChanges}
            onResetError={() => setErrorMessage(null)}
            onMakePrimary={() => setPrimaryWorkspace.mutate()}
          />
        </div>
        <div className="space-y-6">
          <WorkspaceFactsCard project={project} workspace={workspace} canonicalProjectRef={canonicalProjectRef} />
          <WorkspaceCommandsCard
            workspace={workspace}
            sections={runtimeControlSections}
            isPending={controlRuntimeServices.isPending}
            pendingRequest={pendingRuntimeAction}
            onAction={(request) => controlRuntimeServices.mutate(request)}
          />
        </div>
      </div>
    </div>
  );
}

function runtimeActionSuccessMessage(action: WorkspaceRuntimeControlRequest["action"]) {
  if (action === "run") return "Workspace job completed.";
  if (action === "stop") return "Workspace service stopped. Issue execution is not paused.";
  if (action === "restart") return "Workspace service restarted. Issue execution is not paused.";
  return "Workspace service started.";
}

function projectQueryErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Failed to load workspace";
}
