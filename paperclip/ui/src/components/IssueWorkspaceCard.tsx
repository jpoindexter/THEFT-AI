import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "@/lib/router";
import type { Issue, ExecutionWorkspace } from "@paperclipai/shared";
import { useQuery } from "@tanstack/react-query";
import { executionWorkspacesApi } from "../api/execution-workspaces";
import { environmentsApi } from "../api/environments";
import { instanceSettingsApi } from "../api/instanceSettings";
import { useCompany } from "../context/CompanyContext";
import { queryKeys } from "../lib/queryKeys";
import { orderReusableExecutionWorkspaces } from "../lib/reusable-execution-workspaces";
import { cn, projectWorkspaceUrl } from "../lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Check, Copy, GitBranch, FolderOpen, Pencil, X } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  Utility helpers (mirrored from IssueProperties for self-containment)      */
/* -------------------------------------------------------------------------- */

const EXECUTION_WORKSPACE_OPTIONS = [
  { value: "shared_workspace", label: "Project default" },
  { value: "isolated_workspace", label: "New isolated workspace" },
  { value: "reuse_existing", label: "Reuse existing workspace" },
] as const;
const NO_REUSABLE_WORKSPACE_SELECT_VALUE = "__paperclip_no_reusable_workspace__";
const NO_ENVIRONMENT_SELECT_VALUE = "__paperclip_no_environment__";

function issueModeForExistingWorkspace(mode: string | null | undefined) {
  if (mode === "isolated_workspace" || mode === "operator_branch" || mode === "shared_workspace") return mode;
  if (mode === "adapter_managed" || mode === "cloud_sandbox") return "agent_default";
  return "shared_workspace";
}

function shouldPresentExistingWorkspaceSelection(
  issue: Pick<
    Issue,
    "executionWorkspaceId" | "executionWorkspacePreference" | "executionWorkspaceSettings" | "currentExecutionWorkspace"
  >,
) {
  const persistedMode =
    issue.currentExecutionWorkspace?.mode
    ?? issue.executionWorkspaceSettings?.mode
    ?? issue.executionWorkspacePreference;
  return Boolean(
    issue.executionWorkspaceId &&
    (persistedMode === "isolated_workspace" || persistedMode === "operator_branch"),
  );
}

function defaultExecutionWorkspaceModeForProject(project: { executionWorkspacePolicy?: { enabled?: boolean; defaultMode?: string | null } | null } | null | undefined) {
  const defaultMode = project?.executionWorkspacePolicy?.enabled ? project.executionWorkspacePolicy.defaultMode : null;
  if (defaultMode === "isolated_workspace" || defaultMode === "operator_branch") return defaultMode;
  if (defaultMode === "adapter_default") return "agent_default";
  return "shared_workspace";
}

/* -------------------------------------------------------------------------- */
/*  Sub-components                                                             */
/* -------------------------------------------------------------------------- */

function BreakablePath({ text }: { text: string }) {
  const parts: React.ReactNode[] = [];
  const segments = text.split(/(?<=[\/-])/);
  for (let i = 0; i < segments.length; i++) {
    if (i > 0) parts.push(<wbr key={i} />);
    parts.push(segments[i]);
  }
  return <>{parts}</>;
}

function CopyableInline({ value, label, mono }: { value: string; label?: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setCopied(false), 1500);
    } catch { /* noop */ }
  }, [value]);

  return (
    <span className="inline-flex items-center gap-1 group/copy">
      {label && <span className="text-muted-foreground">{label}</span>}
      <span className={cn("min-w-0 break-words", mono && "font-mono")}>
        <BreakablePath text={value} />
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon-xs"
        className="text-muted-foreground opacity-0 transition-opacity hover:bg-accent/50 hover:text-foreground group-hover/copy:opacity-100 focus:opacity-100"
        onClick={handleCopy}
        title={copied ? "Copied!" : "Copy"}
        aria-label={copied ? "Copied" : "Copy"}
      >
        {copied ? <Check className="h-3 w-3 text-green-500" /> : <Copy className="h-3 w-3" />}
      </Button>
    </span>
  );
}

function workspaceModeLabel(mode: string | null | undefined) {
  switch (mode) {
    case "isolated_workspace": return "Isolated workspace";
    case "operator_branch": return "Operator branch";
    case "cloud_sandbox": return "Cloud sandbox";
    case "adapter_managed": return "Adapter managed";
    default: return "Workspace";
  }
}

function configuredWorkspaceLabel(
  selection: string | null | undefined,
  reusableWorkspace: ExecutionWorkspace | null,
) {
  switch (selection) {
    case "isolated_workspace":
      return "New isolated workspace";
    case "reuse_existing":
      return reusableWorkspace?.mode === "isolated_workspace"
        ? "Existing isolated workspace"
        : "Reuse existing workspace";
    default:
      return "Project default";
  }
}

function projectWorkspaceDetailLink(input: {
  projectId: string | null | undefined;
  projectWorkspaceId: string | null | undefined;
}) {
  if (!input.projectId || !input.projectWorkspaceId) return null;
  return projectWorkspaceUrl({ id: input.projectId, urlKey: input.projectId }, input.projectWorkspaceId);
}

function workspaceDetailLink(input: {
  projectId: string | null | undefined;
  issueProjectWorkspaceId: string | null | undefined;
  workspace: ExecutionWorkspace | null | undefined;
}) {
  const linkedProjectWorkspaceId = input.workspace?.projectWorkspaceId ?? input.issueProjectWorkspaceId ?? null;
  if (input.workspace?.mode === "shared_workspace") {
    return projectWorkspaceDetailLink({
      projectId: input.projectId,
      projectWorkspaceId: linkedProjectWorkspaceId,
    });
  }
  return input.workspace ? `/execution-workspaces/${input.workspace.id}` : null;
}

function statusBadge(status: string) {
  const colors: Record<string, string> = {
    active: "border-chart-2/30 bg-chart-2/10 text-chart-2",
    idle: "bg-muted text-muted-foreground",
    in_review: "border-chart-1/30 bg-chart-1/10 text-chart-1",
    archived: "bg-muted text-muted-foreground",
  };
  return (
    <Badge variant="outline" className={cn("border-transparent text-nano", colors[status] ?? colors.idle)}>
      {status.replace(/_/g, " ")}
    </Badge>
  );
}

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
        (currentSelection === "reuse_existing" && currentReusableEnvironmentId)
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
    <Card className="gap-2 bg-transparent p-3 py-3 shadow-none">
      {/* Header row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
          {activeNonDefaultWorkspace && workspace
            ? workspaceModeLabel(workspace.mode)
            : configuredWorkspaceLabel(currentSelection, selectedReusableExecutionWorkspace)}
          {workspace ? statusBadge(workspace.status) : statusBadge("idle")}
        </div>
        <div className="flex items-center gap-1">
          {showEditingControls ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-muted-foreground"
                onClick={handleCancel}
              >
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
              <Button
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={handleSave}
                disabled={!canSaveWorkspaceConfig}
              >
                Save
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground"
              onClick={() => setEditing(true)}
            >
              <Pencil className="h-3 w-3 mr-1" />Edit
            </Button>
          )}
        </div>
      </div>

      {/* Read-only info */}
      {!showEditingControls && (
        <div className="space-y-1.5 text-xs">
          {workspace?.branchName && (
            <div className="flex items-center gap-1.5">
              <GitBranch className="h-3 w-3 text-muted-foreground shrink-0" />
              <CopyableInline value={workspace.branchName} mono />
            </div>
          )}
          {workspace?.cwd && (
            <div className="flex items-center gap-1.5">
              <FolderOpen className="h-3 w-3 text-muted-foreground shrink-0" />
              <CopyableInline value={workspace.cwd} mono />
            </div>
          )}
          {workspace?.repoUrl && (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <span className="text-micro">Repo:</span>
              <CopyableInline value={workspace.repoUrl} mono />
            </div>
          )}
          {environmentsEnabled && currentEnvironmentId && (
            <div className="break-words text-muted-foreground">
              Environment: <span className="text-foreground">{currentEnvironment?.name ?? currentEnvironmentId}</span>
              {currentSelection === "reuse_existing" && currentReusableEnvironmentId === currentEnvironmentId
                ? " · reused workspace"
                : !issue.executionWorkspaceSettings?.environmentId && projectEnvironmentId === currentEnvironmentId
                ? " · project default"
                : null}
            </div>
          )}
          {!workspace && (
            <div className="text-muted-foreground">
              {currentSelection === "isolated_workspace"
                ? "A fresh isolated workspace will be created when this issue runs."
                : currentSelection === "reuse_existing"
                  ? "This issue will reuse an existing workspace when it runs."
                  : "This issue will use the project default workspace configuration when it runs."}
            </div>
          )}
          {currentSelection === "reuse_existing" && selectedReusableExecutionWorkspace && (
            <div className="break-words text-muted-foreground">
              Reusing:{" "}
              {selectedReusableWorkspaceLink ? (
                <Link
                  to={selectedReusableWorkspaceLink}
                  className="hover:text-foreground hover:underline"
                >
                  <BreakablePath text={selectedReusableExecutionWorkspace.name} />
                </Link>
              ) : (
                <BreakablePath text={selectedReusableExecutionWorkspace.name} />
              )}
            </div>
          )}
          {workspace && currentWorkspaceLink && (
            <div className="pt-0.5">
              <Link
                to={currentWorkspaceLink}
                className="text-micro text-muted-foreground hover:text-foreground hover:underline"
              >
                View workspace details →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Editing controls */}
      {editing && (
        <div className="space-y-2 pt-1">
          <Select
            value={draftSelection}
            onValueChange={(nextMode) => {
              setDraftSelection(nextMode);
              if (nextMode !== "reuse_existing") {
                setDraftExecutionWorkspaceId("");
              } else if (!draftExecutionWorkspaceId && issue.executionWorkspaceId) {
                setDraftExecutionWorkspaceId(issue.executionWorkspaceId);
              }
            }}
          >
            <SelectTrigger size="sm" className="w-full text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EXECUTION_WORKSPACE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value} className="text-xs">
                  {option.value === "reuse_existing" && configuredReusableWorkspace?.mode === "isolated_workspace"
                    ? "Existing isolated workspace"
                    : option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {draftSelection === "reuse_existing" && (
            <Select
              value={draftExecutionWorkspaceId || NO_REUSABLE_WORKSPACE_SELECT_VALUE}
              onValueChange={(value) => {
                setDraftExecutionWorkspaceId(
                  value === NO_REUSABLE_WORKSPACE_SELECT_VALUE ? "" : value,
                );
              }}
            >
              <SelectTrigger size="sm" className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_REUSABLE_WORKSPACE_SELECT_VALUE} className="text-xs">
                  Choose an existing workspace
                </SelectItem>
                {deduplicatedReusableWorkspaces.map((w) => (
                  <SelectItem key={w.id} value={w.id} className="text-xs">
                    {w.name} · {w.status} · {w.branchName ?? w.cwd ?? w.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {environmentsEnabled ? (
            <>
              <Select
                value={(reuseExistingSelection ? selectedReusableEnvironmentId : draftEnvironmentId) || NO_ENVIRONMENT_SELECT_VALUE}
                onValueChange={(value) => {
                  setDraftEnvironmentId(value === NO_ENVIRONMENT_SELECT_VALUE ? "" : value);
                }}
                disabled={reuseExistingSelection}
              >
                <SelectTrigger
                  size="sm"
                  className={cn(
                    "w-full text-xs",
                    reuseExistingSelection && "cursor-not-allowed opacity-70",
                  )}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_ENVIRONMENT_SELECT_VALUE} className="text-xs">
                    {reuseExistingSelection
                      ? configuredReusableWorkspace
                        ? "No environment on reused workspace"
                        : "Select an existing workspace to inspect its environment"
                      : projectEnvironmentId
                        ? "Project default environment"
                        : "No environment"}
                  </SelectItem>
                  {runSelectableEnvironments.map((environment) => (
                    <SelectItem key={environment.id} value={environment.id} className="text-xs">
                      {environment.name} · {environment.driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {reuseExistingSelection && (
                <div className="text-micro text-muted-foreground">
                  {configuredReusableWorkspace
                    ? "Environment selection is locked while reusing an existing workspace. The next run will use that workspace's persisted environment config."
                    : "Choose an existing workspace first. Its persisted environment config will determine the next run."}
                </div>
              )}
            </>
          ) : null}

          {/* Current workspace summary when editing */}
          {workspace && (
            <div className="space-y-0.5 border-t border-border/50 pt-1 text-micro text-muted-foreground">
              <div className="break-words">
                Current:{" "}
                {currentWorkspaceLink ? (
                  <Link
                    to={currentWorkspaceLink}
                    className="hover:text-foreground hover:underline"
                  >
                    <BreakablePath text={workspace.name} />
                  </Link>
                ) : (
                  <BreakablePath text={workspace.name} />
                )}
                {" · "}
                {workspace.status}
              </div>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
