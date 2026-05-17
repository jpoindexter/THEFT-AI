import { useCallback, useEffect, useMemo, useState } from "react";
import type { Issue, ExecutionWorkspace } from "@paperclipai/shared";
import { useQuery } from "@tanstack/react-query";
import { executionWorkspacesApi } from "../api/execution-workspaces";
import { environmentsApi } from "../api/environments";
import { instanceSettingsApi } from "../api/instanceSettings";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import { orderReusableExecutionWorkspaces } from "../lib/reusable-execution-workspaces";
import { IssueWorkspaceCardView } from "./issue-workspace-card/IssueWorkspaceCardView";
import {
  defaultExecutionWorkspaceModeForProject,
  issueModeForExistingWorkspace,
  shouldPresentExistingWorkspaceSelection,
  workspaceDetailLink,
} from "./issue-workspace-card/workspace-card-utils";

/* -------------------------------------------------------------------------- */
/*  Main component                                                             */
/* -------------------------------------------------------------------------- */

interface IssueWorkspaceCardProps {
  issue: Omit<
    Pick<
      Issue,
      | "companyId"
      | "projectId"
      | "projectWorkspaceId"
      | "executionWorkspaceId"
      | "executionWorkspacePreference"
      | "executionWorkspaceSettings"
    >,
    "companyId"
  > & {
    companyId: string | null;
    currentExecutionWorkspace?: ExecutionWorkspace | null;
  };
  project: {
    id: string;
    executionWorkspacePolicy?: {
      enabled?: boolean;
      defaultMode?: string | null;
      defaultProjectWorkspaceId?: string | null;
      environmentId?: string | null;
    } | null;
    workspaces?: Array<{ id: string; isPrimary: boolean }>;
  } | null;
  onUpdate: (data: Record<string, unknown>) => void;
  initialEditing?: boolean;
  livePreview?: boolean;
  onDraftChange?: (data: Record<string, unknown>, meta: { canSave: boolean; workspaceBranchName?: string | null }) => void;
}

export function IssueWorkspaceCard({
  issue,
  project,
  onUpdate,
  initialEditing = false,
  livePreview = false,
  onDraftChange,
}: IssueWorkspaceCardProps) {
  const { selectedCompanyId } = useCompany();
  const companyId = issue.companyId ?? selectedCompanyId;
  const [editing, setEditing] = useState(initialEditing);

  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const environmentsEnabled = experimentalSettings?.enableEnvironments === true;
  const policyEnabled = experimentalSettings?.enableIsolatedWorkspaces === true
    && Boolean(project?.executionWorkspacePolicy?.enabled);

  const workspace = issue.currentExecutionWorkspace as ExecutionWorkspace | null | undefined;
  const { data: environments } = useQuery({
    queryKey: queryKeys.environments.list(companyId!),
    queryFn: () => environmentsApi.list(companyId!),
    enabled: Boolean(companyId) && environmentsEnabled,
  });

  const { data: reusableExecutionWorkspaces } = useQuery({
    queryKey: queryKeys.executionWorkspaces.list(companyId!, {
      projectId: issue.projectId ?? undefined,
      projectWorkspaceId: issue.projectWorkspaceId ?? undefined,
      reuseEligible: true,
    }),
    queryFn: () =>
      executionWorkspacesApi.list(companyId!, {
        projectId: issue.projectId ?? undefined,
        projectWorkspaceId: issue.projectWorkspaceId ?? undefined,
        reuseEligible: true,
      }),
    enabled: Boolean(companyId) && Boolean(issue.projectId) && editing,
  });

  const deduplicatedReusableWorkspaces = useMemo(() => {
    return orderReusableExecutionWorkspaces(reusableExecutionWorkspaces ?? []);
  }, [reusableExecutionWorkspaces]);

  const selectedReusableExecutionWorkspace =
    deduplicatedReusableWorkspaces.find((w) => w.id === issue.executionWorkspaceId)
    ?? workspace
    ?? null;

  const currentSelection = shouldPresentExistingWorkspaceSelection(issue)
    ? "reuse_existing"
    : (
        issue.executionWorkspacePreference
        ?? issue.executionWorkspaceSettings?.mode
        ?? defaultExecutionWorkspaceModeForProject(project)
      );

  const [draftSelection, setDraftSelection] = useState(currentSelection);
  const [draftExecutionWorkspaceId, setDraftExecutionWorkspaceId] = useState(issue.executionWorkspaceId ?? "");
  const [draftEnvironmentId, setDraftEnvironmentId] = useState(issue.executionWorkspaceSettings?.environmentId ?? "");
  const projectEnvironmentId = environmentsEnabled
    ? project?.executionWorkspacePolicy?.environmentId ?? null
    : null;
  const currentReusableEnvironmentId = selectedReusableExecutionWorkspace?.config?.environmentId ?? null;
  const currentEnvironmentId = environmentsEnabled
    ? (
        (currentSelection === "reuse_existing" ? currentReusableEnvironmentId : null)
        ?? workspace?.config?.environmentId
        ?? issue.executionWorkspaceSettings?.environmentId
        ?? projectEnvironmentId
      )
    : null;
  const currentEnvironment =
    environments?.find((environment) => environment.id === currentEnvironmentId)
    ?? null;

  useEffect(() => {
    if (editing) return;
    setDraftSelection(currentSelection);
    setDraftExecutionWorkspaceId(issue.executionWorkspaceId ?? "");
    setDraftEnvironmentId(issue.executionWorkspaceSettings?.environmentId ?? "");
  }, [currentSelection, editing, issue.executionWorkspaceId, issue.executionWorkspaceSettings?.environmentId]);

  const activeNonDefaultWorkspace = Boolean(workspace && workspace.mode !== "shared_workspace");

  const configuredReusableWorkspace =
    deduplicatedReusableWorkspaces.find((w) => w.id === draftExecutionWorkspaceId)
    ?? (draftExecutionWorkspaceId === issue.executionWorkspaceId ? selectedReusableExecutionWorkspace : null);

  const selectedReusableWorkspaceLink = workspaceDetailLink({
    projectId: project?.id,
    issueProjectWorkspaceId: issue.projectWorkspaceId,
    workspace: selectedReusableExecutionWorkspace,
  });
  const currentWorkspaceLink = workspaceDetailLink({
    projectId: project?.id,
    issueProjectWorkspaceId: issue.projectWorkspaceId,
    workspace,
  });

  const canSaveWorkspaceConfig = draftSelection !== "reuse_existing" || draftExecutionWorkspaceId.length > 0;
  const reuseExistingSelection = draftSelection === "reuse_existing";
  const selectedReusableEnvironmentId = configuredReusableWorkspace?.config?.environmentId ?? "";
  const runSelectableEnvironments = useMemo(
    () => environmentsEnabled ? (environments ?? []).filter((environment) => {
      if (environment.driver === "local" || environment.driver === "ssh") return true;
      if (environment.driver !== "sandbox") return false;
      const provider = typeof environment.config?.provider === "string" ? environment.config.provider : null;
      return provider !== null && provider !== "fake";
    }) : [],
    [environments, environmentsEnabled],
  );
  const draftWorkspaceBranchName =
    draftSelection === "reuse_existing" && configuredReusableWorkspace?.mode !== "shared_workspace"
      ? configuredReusableWorkspace?.branchName ?? null
      : null;

  const buildWorkspaceDraftUpdate = useCallback(() => ({
    executionWorkspacePreference: draftSelection,
    executionWorkspaceId: draftSelection === "reuse_existing" ? draftExecutionWorkspaceId || null : null,
    executionWorkspaceSettings: {
      mode:
        draftSelection === "reuse_existing"
          ? issueModeForExistingWorkspace(configuredReusableWorkspace?.mode)
          : draftSelection,
      environmentId: draftSelection === "reuse_existing" ? null : draftEnvironmentId || null,
    },
  }), [
    configuredReusableWorkspace?.mode,
    draftEnvironmentId,
    draftExecutionWorkspaceId,
    draftSelection,
  ]);

  useEffect(() => {
    if (!onDraftChange) return;
    onDraftChange(buildWorkspaceDraftUpdate(), {
      canSave: canSaveWorkspaceConfig,
      workspaceBranchName: draftWorkspaceBranchName,
    });
  }, [buildWorkspaceDraftUpdate, canSaveWorkspaceConfig, draftWorkspaceBranchName, onDraftChange]);

  const handleSave = useCallback(() => {
    if (!canSaveWorkspaceConfig) return;
    onUpdate(buildWorkspaceDraftUpdate());
    setEditing(false);
  }, [
    buildWorkspaceDraftUpdate,
    canSaveWorkspaceConfig,
    onUpdate,
  ]);

  const handleCancel = useCallback(() => {
    setDraftSelection(currentSelection);
    setDraftExecutionWorkspaceId(issue.executionWorkspaceId ?? "");
    setDraftEnvironmentId(issue.executionWorkspaceSettings?.environmentId ?? "");
    setEditing(false);
  }, [currentSelection, issue.executionWorkspaceId, issue.executionWorkspaceSettings?.environmentId]);

  if (!policyEnabled || !project) return null;

  const showEditingControls = livePreview || editing;

  return (
    <IssueWorkspaceCardView
      activeNonDefaultWorkspace={activeNonDefaultWorkspace}
      canSaveWorkspaceConfig={canSaveWorkspaceConfig}
      configuredReusableWorkspace={configuredReusableWorkspace}
      currentEnvironment={currentEnvironment}
      currentEnvironmentId={currentEnvironmentId}
      currentReusableEnvironmentId={currentReusableEnvironmentId}
      currentSelection={currentSelection}
      currentWorkspaceLink={currentWorkspaceLink}
      deduplicatedReusableWorkspaces={deduplicatedReusableWorkspaces}
      draftEnvironmentId={draftEnvironmentId}
      draftExecutionWorkspaceId={draftExecutionWorkspaceId}
      draftSelection={draftSelection}
      editing={editing}
      environmentsEnabled={environmentsEnabled}
      issueEnvironmentId={issue.executionWorkspaceSettings?.environmentId}
      projectEnvironmentId={projectEnvironmentId}
      reuseExistingSelection={reuseExistingSelection}
      runSelectableEnvironments={runSelectableEnvironments}
      selectedReusableEnvironmentId={selectedReusableEnvironmentId}
      selectedReusableExecutionWorkspace={selectedReusableExecutionWorkspace}
      selectedReusableWorkspaceLink={selectedReusableWorkspaceLink}
      showEditingControls={showEditingControls}
      workspace={workspace}
      onCancel={handleCancel}
      onDraftEnvironmentIdChange={setDraftEnvironmentId}
      onDraftExecutionWorkspaceIdChange={setDraftExecutionWorkspaceId}
      onDraftSelectionChange={(nextMode) => {
        setDraftSelection(nextMode);
        if (nextMode !== "reuse_existing") {
          setDraftExecutionWorkspaceId("");
        } else if (!draftExecutionWorkspaceId && issue.executionWorkspaceId) {
          setDraftExecutionWorkspaceId(issue.executionWorkspaceId);
        }
      }}
      onEdit={() => setEditing(true)}
      onSave={handleSave}
    />
  );
}
