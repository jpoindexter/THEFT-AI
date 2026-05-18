import { useCallback, useEffect, useMemo, useState } from "react";
import {
  WORKSPACE_BRANCH_ROUTINE_VARIABLE,
  type Agent,
  type ExecutionWorkspace,
  type Project,
  type RoutineVariable,
} from "@paperclipai/shared";
import { useQuery } from "@tanstack/react-query";
import { instanceSettingsApi } from "../api/instanceSettings";
import { queryKeys } from "../lib/queryKeys";
import { IssueWorkspaceCard } from "./IssueWorkspaceCard";
import { type InlineEntityOption } from "./InlineEntitySelector";
import { getRecentAssigneeIds, sortAgentsByRecency } from "../lib/recent-assignees";
import { getRecentProjectIds } from "../lib/recent-projects";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  applyWorkspaceDraft,
  buildInitialRunSelection,
  buildInitialValues,
  buildInitialWorkspaceConfig,
  isMissingRequiredValue,
  supportsRoutineRunWorkspaceSelection,
  type RoutineRunDialogSubmitData,
} from "./routine-run-variables-dialog/routineRunDialogModel";
import { RoutineRunAssignmentFields } from "./routine-run-variables-dialog/RoutineRunAssignmentFields";
import { RoutineRunDialogFooter } from "./routine-run-variables-dialog/RoutineRunDialogFooter";
import { RoutineRunVariableFields } from "./routine-run-variables-dialog/RoutineRunVariableFields";
export type { RoutineRunDialogSubmitData } from "./routine-run-variables-dialog/routineRunDialogModel";

export function routineRunNeedsConfiguration(input: {
  variables: RoutineVariable[];
  project: Project | null | undefined;
  isolatedWorkspacesEnabled: boolean;
}) {
  return input.variables.length > 0
    || supportsRoutineRunWorkspaceSelection(input.project, input.isolatedWorkspacesEnabled);
}

export function RoutineRunVariablesDialog({
  open,
  onOpenChange,
  companyId,
  routineName,
  projects,
  agents,
  defaultProjectId,
  defaultAssigneeAgentId,
  defaultExecutionWorkspace,
  variables,
  isPending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null | undefined;
  routineName?: string | null;
  projects: Project[];
  agents: Agent[];
  defaultProjectId?: string | null;
  defaultAssigneeAgentId?: string | null;
  defaultExecutionWorkspace?: ExecutionWorkspace | null;
  variables: RoutineVariable[];
  isPending: boolean;
  onSubmit: (data: RoutineRunDialogSubmitData) => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>({});
  const [selection, setSelection] = useState(() => buildInitialRunSelection({
    defaultAssigneeAgentId,
    defaultProjectId,
  }));
  const selectedProject = useMemo(
    () => projects.find((project) => project.id === selection.projectId) ?? null,
    [projects, selection.projectId],
  );
  const recentAssigneeIds = useMemo(() => getRecentAssigneeIds(), [open]);
  const recentProjectIds = useMemo(() => getRecentProjectIds(), [open]);
  const assigneeOptions = useMemo<InlineEntityOption[]>(
    () =>
      sortAgentsByRecency(
        agents.filter((agent) => agent.status !== "terminated"),
        recentAssigneeIds,
      ).map((agent) => ({
        id: agent.id,
        label: agent.name,
        searchText: `${agent.name} ${agent.role} ${agent.title ?? ""}`,
      })),
    [agents, recentAssigneeIds],
  );
  const projectOptions = useMemo<InlineEntityOption[]>(
    () => projects.map((project) => ({
      id: project.id,
      label: project.name,
      searchText: project.description ?? "",
    })),
    [projects],
  );
  const currentAssignee = selection.assigneeAgentId
    ? agents.find((agent) => agent.id === selection.assigneeAgentId) ?? null
    : null;
  const [workspaceConfig, setWorkspaceConfig] = useState(() =>
    buildInitialWorkspaceConfig(selectedProject, defaultExecutionWorkspace));
  const [workspaceConfigValid, setWorkspaceConfigValid] = useState(true);
  const [workspaceBranchName, setWorkspaceBranchName] = useState<string | null>(null);

  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });

  const workspaceSelectionEnabled = supportsRoutineRunWorkspaceSelection(
    selectedProject,
    experimentalSettings?.enableIsolatedWorkspaces === true,
  );

  useEffect(() => {
    if (!open) return;
    setValues(buildInitialValues(variables));
    const nextSelection = buildInitialRunSelection({ defaultAssigneeAgentId, defaultProjectId });
    setSelection(nextSelection);
    setWorkspaceConfig(buildInitialWorkspaceConfig(
      projects.find((project) => project.id === nextSelection.projectId) ?? null,
      defaultExecutionWorkspace,
    ));
    setWorkspaceConfigValid(true);
    setWorkspaceBranchName(defaultExecutionWorkspace?.branchName ?? null);
  }, [defaultAssigneeAgentId, defaultExecutionWorkspace, defaultProjectId, open, projects, variables]);

  const workspaceBranchAutoValue = workspaceSelectionEnabled && workspaceBranchName
    ? workspaceBranchName
    : null;

  const isAutoWorkspaceBranchVariable = useCallback(
    (variable: RoutineVariable) =>
      variable.name === WORKSPACE_BRANCH_ROUTINE_VARIABLE && Boolean(workspaceBranchAutoValue),
    [workspaceBranchAutoValue],
  );

  const missingRequired = useMemo(
    () =>
      variables
        .filter((variable) => variable.required)
        .filter((variable) => !isAutoWorkspaceBranchVariable(variable))
        .filter((variable) => isMissingRequiredValue(values[variable.name]))
        .map((variable) => variable.label || variable.name),
    [isAutoWorkspaceBranchVariable, values, variables],
  );

  const workspaceIssue = useMemo(() => ({
    companyId: companyId ?? null,
    projectId: selectedProject?.id ?? null,
    projectWorkspaceId: workspaceConfig.projectWorkspaceId,
    executionWorkspaceId: workspaceConfig.executionWorkspaceId,
    executionWorkspacePreference: workspaceConfig.executionWorkspacePreference,
    executionWorkspaceSettings: workspaceConfig.executionWorkspaceSettings,
    currentExecutionWorkspace:
      workspaceConfig.executionWorkspaceId && workspaceConfig.executionWorkspaceId === defaultExecutionWorkspace?.id
        ? defaultExecutionWorkspace
        : null,
  }), [
    companyId,
    defaultExecutionWorkspace,
    selectedProject?.id,
    workspaceConfig.executionWorkspaceId,
    workspaceConfig.executionWorkspacePreference,
    workspaceConfig.executionWorkspaceSettings,
    workspaceConfig.projectWorkspaceId,
  ]);

  const canSubmit =
    selection.assigneeAgentId.trim().length > 0 &&
    missingRequired.length === 0 &&
    (!workspaceSelectionEnabled || workspaceConfigValid);

  const handleWorkspaceUpdate = useCallback((data: Record<string, unknown>) => {
    setWorkspaceConfig((current) => applyWorkspaceDraft(current, data));
  }, []);

  const handleWorkspaceDraftChange = useCallback((
    data: Record<string, unknown>,
    meta: { canSave: boolean; workspaceBranchName?: string | null },
  ) => {
    setWorkspaceConfig((current) => applyWorkspaceDraft(current, data));
    setWorkspaceConfigValid((current) => (current === meta.canSave ? current : meta.canSave));
    setWorkspaceBranchName((current) => {
      const defaultWorkspaceBranchName = defaultExecutionWorkspace?.branchName ?? null;
      const next = meta.workspaceBranchName
        ?? (data.executionWorkspaceId === defaultExecutionWorkspace?.id ? defaultWorkspaceBranchName : null)
        ?? null;
      return current === next ? current : next;
    });
  }, [defaultExecutionWorkspace]);

  return (
    <Dialog open={open} onOpenChange={(next) => !isPending && onOpenChange(next)}>
      <DialogContent className="flex max-h-screen max-w-xl flex-col gap-0 overflow-hidden p-0">
        <DialogHeader className="shrink-0 border-b border-border/60 px-6 pb-4 pr-12 pt-6">
          {routineName && (
            <p className="text-muted-foreground text-sm">{routineName}</p>
          )}
          <DialogTitle>Run routine</DialogTitle>
          <DialogDescription>
            Choose the agent and optional project for this one run. Routine defaults are prefilled and won&apos;t be changed.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
          <RoutineRunAssignmentFields
            agents={agents}
            projects={projects}
            assigneeOptions={assigneeOptions}
            projectOptions={projectOptions}
            recentAssigneeIds={recentAssigneeIds}
            recentProjectIds={recentProjectIds}
            assigneeAgentId={selection.assigneeAgentId}
            projectId={selection.projectId}
            currentAssignee={currentAssignee}
            selectedProject={selectedProject}
            onAssigneeChange={(assigneeAgentId) => setSelection((current) => ({ ...current, assigneeAgentId }))}
            onProjectChange={(project, projectId) => {
              setSelection((current) => ({ ...current, projectId }));
              setWorkspaceConfig(buildInitialWorkspaceConfig(project, defaultExecutionWorkspace));
              setWorkspaceConfigValid(true);
              setWorkspaceBranchName(
                defaultExecutionWorkspace && defaultExecutionWorkspace.projectId === project?.id
                  ? defaultExecutionWorkspace.branchName
                  : null,
              );
            }}
          />

          <RoutineRunVariableFields
            variables={variables}
            values={values}
            workspaceBranchAutoValue={workspaceBranchAutoValue}
            isAutoWorkspaceBranchVariable={isAutoWorkspaceBranchVariable}
            onValueChange={(variableName, value) => setValues((current) => ({ ...current, [variableName]: value }))}
          />

          {workspaceSelectionEnabled && selectedProject && companyId ? (
            <IssueWorkspaceCard
              key={`${open ? "open" : "closed"}:${selectedProject.id}`}
              issue={workspaceIssue}
              project={selectedProject}
              initialEditing
              livePreview
              onUpdate={handleWorkspaceUpdate}
              onDraftChange={handleWorkspaceDraftChange}
            />
          ) : null}
        </div>

        <RoutineRunDialogFooter
          assigneeAgentId={selection.assigneeAgentId}
          canSubmit={canSubmit}
          isPending={isPending}
          missingRequired={missingRequired}
          projectId={selection.projectId}
          values={values}
          variables={variables}
          workspaceBranchAutoValue={workspaceBranchAutoValue}
          workspaceConfig={workspaceConfig}
          workspaceSelectionEnabled={workspaceSelectionEnabled}
          workspaceConfigValid={workspaceConfigValid}
          isAutoWorkspaceBranchVariable={isAutoWorkspaceBranchVariable}
          onClose={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
