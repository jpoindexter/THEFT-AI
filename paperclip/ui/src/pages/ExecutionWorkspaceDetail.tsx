import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "@/lib/router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ExecutionWorkspaceCloseDialog } from "../components/ExecutionWorkspaceCloseDialog";
import { executionWorkspacesApi } from "../api/execution-workspaces";
import {
  buildWorkspaceRuntimeControlSections,
  WorkspaceRuntimeControls,
  type WorkspaceRuntimeControlRequest,
} from "../components/WorkspaceRuntimeControls";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import { projectRouteRef } from "../lib/utils";
import { WorkspaceContextCards } from "./execution-workspace-detail/WorkspaceContextCards";
import { ExecutionWorkspaceHeader } from "./execution-workspace-detail/ExecutionWorkspaceHeader";
import { ExecutionWorkspaceIssuesList } from "./execution-workspace-detail/ExecutionWorkspaceIssuesList";
import { ExecutionWorkspaceRoutinesList } from "./execution-workspace-detail/ExecutionWorkspaceRoutinesList";
import { WorkspaceSettingsCard } from "./execution-workspace-detail/WorkspaceSettingsCard";
import { WorkspaceRuntimeLogsCard } from "./execution-workspace-detail/WorkspaceRuntimeLogsCard";
import { useExecutionWorkspaceData } from "./execution-workspace-detail/useExecutionWorkspaceData";
import {
  buildWorkspacePatch,
  formStateFromWorkspace,
  validateForm,
  type WorkspaceFormState,
} from "./execution-workspace-detail/workspaceForm";
import {
  executionWorkspaceTabPath,
  LegacyWorkspaceTabRedirect,
  resolveExecutionWorkspaceTab,
  type ExecutionWorkspaceTab,
} from "./execution-workspace-detail/workspaceTabs";

export function ExecutionWorkspaceDetail() {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { selectedCompanyId, setSelectedCompanyId } = useCompany();
  const [form, setForm] = useState<WorkspaceFormState | null>(null);
  const [closeDialogOpen, setCloseDialogOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [runtimeActionErrorMessage, setRuntimeActionErrorMessage] = useState<string | null>(null);
  const [runtimeActionMessage, setRuntimeActionMessage] = useState<string | null>(null);
  const activeTab = workspaceId ? resolveExecutionWorkspaceTab(location.pathname, workspaceId) : null;
  const {
    workspaceQuery,
    workspace,
    project,
    sourceIssue,
    derivedWorkspace,
    linkedIssuesQuery,
    linkedIssues,
    linkedProjectWorkspace,
  } = useExecutionWorkspaceData(workspaceId);
  const inheritedRuntimeConfig = linkedProjectWorkspace?.runtimeConfig?.workspaceRuntime ?? null;
  const effectiveRuntimeConfig = workspace?.config?.workspaceRuntime ?? inheritedRuntimeConfig;
  const runtimeConfigSource =
    workspace?.config?.workspaceRuntime
      ? "execution_workspace"
      : inheritedRuntimeConfig
        ? "project_workspace"
        : "none";

  const initialState = useMemo(() => (workspace ? formStateFromWorkspace(workspace) : null), [workspace]);
  const isDirty = Boolean(form && initialState && JSON.stringify(form) !== JSON.stringify(initialState));
  const projectRef = project ? projectRouteRef(project) : workspace?.projectId ?? "";

  useEffect(() => {
    if (!workspace?.companyId || workspace.companyId === selectedCompanyId) return;
    setSelectedCompanyId(workspace.companyId, { source: "route_sync" });
  }, [workspace?.companyId, selectedCompanyId, setSelectedCompanyId]);

  useEffect(() => {
    if (!workspace) return;
    setForm(formStateFromWorkspace(workspace));
    setErrorMessage(null);
    setRuntimeActionErrorMessage(null);
  }, [workspace]);

  useEffect(() => {
    if (!workspace) return;
    const crumbs = [
      { label: "Projects", href: "/projects" },
      ...(project ? [{ label: project.name, href: `/projects/${projectRef}` }] : []),
      ...(project ? [{ label: "Workspaces", href: `/projects/${projectRef}/workspaces` }] : []),
      { label: workspace.name },
    ];
    setBreadcrumbs(crumbs);
  }, [setBreadcrumbs, workspace, project, projectRef]);

  const updateWorkspace = useMutation({
    mutationFn: (patch: Record<string, unknown>) => executionWorkspacesApi.update(workspace!.id, patch),
    onSuccess: (nextWorkspace) => {
      queryClient.setQueryData(queryKeys.executionWorkspaces.detail(nextWorkspace.id), nextWorkspace);
      queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.closeReadiness(nextWorkspace.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.workspaceOperations(nextWorkspace.id) });
      if (project) {
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.urlKey) });
      }
      if (sourceIssue) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(sourceIssue.id) });
      }
      setErrorMessage(null);
    },
    onError: (error) => {
      setErrorMessage(error instanceof Error ? error.message : "Failed to save execution workspace.");
    },
  });
  const workspaceOperationsQuery = useQuery({
    queryKey: queryKeys.executionWorkspaces.workspaceOperations(workspaceId!),
    queryFn: () => executionWorkspacesApi.listWorkspaceOperations(workspaceId!),
    enabled: Boolean(workspaceId),
  });
  const controlRuntimeServices = useMutation({
    mutationFn: (request: WorkspaceRuntimeControlRequest) =>
      executionWorkspacesApi.controlRuntimeCommands(workspace!.id, request.action, request),
    onSuccess: (result, request) => {
      queryClient.setQueryData(queryKeys.executionWorkspaces.detail(result.workspace.id), result.workspace);
      queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.workspaceOperations(result.workspace.id) });
      queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(result.workspace.projectId) });
      setRuntimeActionErrorMessage(null);
      setRuntimeActionMessage(
        request.action === "run"
          ? "Workspace job completed."
          : request.action === "stop"
            ? "Workspace service stopped."
            : request.action === "restart"
              ? "Workspace service restarted."
              : "Workspace service started.",
      );
    },
    onError: (error) => {
      setRuntimeActionMessage(null);
      setRuntimeActionErrorMessage(error instanceof Error ? error.message : "Failed to control workspace commands.");
    },
  });

  if (workspaceQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading workspace…</p>;
  if (workspaceQuery.error) {
    return (
      <p className="text-sm text-destructive">
        {workspaceQuery.error instanceof Error ? workspaceQuery.error.message : "Failed to load workspace"}
      </p>
    );
  }
  if (!workspace || !form || !initialState) return null;

  const canRunWorkspaceCommands = Boolean(workspace.cwd);
  const canStartRuntimeServices = Boolean(effectiveRuntimeConfig) && canRunWorkspaceCommands;
  const runtimeControlSections = buildWorkspaceRuntimeControlSections({
    runtimeConfig: effectiveRuntimeConfig,
    runtimeServices: workspace.runtimeServices ?? [],
    canStartServices: canStartRuntimeServices,
    canRunJobs: canRunWorkspaceCommands,
  });
  const pendingRuntimeAction = controlRuntimeServices.isPending ? controlRuntimeServices.variables ?? null : null;

  if (workspaceId && activeTab === null) {
    return <LegacyWorkspaceTabRedirect workspaceId={workspaceId} />;
  }

  const handleTabChange = (tab: ExecutionWorkspaceTab) => {
    navigate(executionWorkspaceTabPath(workspace.id, tab));
  };

  const saveChanges = () => {
    const validationError = validateForm(form);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    let patch: Record<string, unknown>;
    try {
      patch = buildWorkspacePatch(initialState, form);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Failed to build workspace update.");
      return;
    }

    if (Object.keys(patch).length === 0) return;
    updateWorkspace.mutate(patch);
  };

  return (
    <>
      <div className="space-y-4 overflow-hidden sm:space-y-6">
        <ExecutionWorkspaceHeader
          workspaceName={workspace.name}
          activeTab={activeTab}
          runtimeControlSections={runtimeControlSections}
          isRuntimePending={controlRuntimeServices.isPending}
          pendingRuntimeAction={pendingRuntimeAction}
          runtimeActionErrorMessage={runtimeActionErrorMessage}
          runtimeActionMessage={runtimeActionMessage}
          onRuntimeAction={(request) => controlRuntimeServices.mutate(request)}
          onTabChange={handleTabChange}
        />

        {activeTab === "services" ? (
          <WorkspaceRuntimeControls
            sections={runtimeControlSections}
            isPending={controlRuntimeServices.isPending}
            pendingRequest={pendingRuntimeAction}
            serviceEmptyMessage={
              effectiveRuntimeConfig
                ? "No services have been started for this execution workspace yet."
                : "No workspace command config is defined for this execution workspace yet."
            }
            jobEmptyMessage="No one-shot jobs are configured for this execution workspace yet."
            disabledHint={
              canStartRuntimeServices
                ? null
                : "Execution workspaces need a working directory before local commands can run, and services also need runtime config."
            }
            onAction={(request) => controlRuntimeServices.mutate(request)}
          />
        ) : activeTab === "configuration" ? (
          <div className="space-y-4 sm:space-y-6">
            <WorkspaceSettingsCard
              workspace={workspace}
              form={form}
              initialState={initialState}
              isDirty={isDirty}
              isSaving={updateWorkspace.isPending}
              errorMessage={errorMessage}
              inheritedRuntimeConfig={inheritedRuntimeConfig}
              linkedProjectWorkspace={linkedProjectWorkspace}
              runtimeConfigSource={runtimeConfigSource}
              setForm={setForm}
              onCloseWorkspace={() => setCloseDialogOpen(true)}
              onSave={saveChanges}
              onResetMessages={() => {
                setErrorMessage(null);
                setRuntimeActionErrorMessage(null);
                setRuntimeActionMessage(null);
              }}
            />
            <WorkspaceContextCards
              workspace={workspace}
              project={project}
              projectRef={projectRef}
              linkedProjectWorkspace={linkedProjectWorkspace}
              sourceIssue={sourceIssue}
              derivedWorkspace={derivedWorkspace}
              derivedWorkspaceHref={derivedWorkspace ? executionWorkspaceTabPath(derivedWorkspace.id, "configuration") : null}
            />
          </div>
        ) : activeTab === "runtime_logs" ? (
          <WorkspaceRuntimeLogsCard
            operations={workspaceOperationsQuery.data}
            isLoading={workspaceOperationsQuery.isLoading}
            error={workspaceOperationsQuery.error as Error | null}
          />
        ) : activeTab === "issues" ? (
          <ExecutionWorkspaceIssuesList
            companyId={workspace.companyId}
            workspace={workspace}
            issues={linkedIssues}
            isLoading={linkedIssuesQuery.isLoading}
            error={linkedIssuesQuery.error as Error | null}
            project={project}
          />
        ) : (
          <ExecutionWorkspaceRoutinesList
            workspace={workspace}
            project={project}
          />
        )}
      </div>
      <ExecutionWorkspaceCloseDialog
        workspaceId={workspace.id}
        workspaceName={workspace.name}
        currentStatus={workspace.status}
        open={closeDialogOpen}
        onOpenChange={setCloseDialogOpen}
        onClosed={(nextWorkspace) => {
          queryClient.setQueryData(queryKeys.executionWorkspaces.detail(nextWorkspace.id), nextWorkspace);
          queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.closeReadiness(nextWorkspace.id) });
          queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.workspaceOperations(nextWorkspace.id) });
          if (project) {
            queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(project.id) });
            queryClient.invalidateQueries({ queryKey: queryKeys.executionWorkspaces.list(project.companyId, { projectId: project.id }) });
          }
          if (sourceIssue) {
            queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(sourceIssue.id) });
          }
        }}
      />
    </>
  );
}
