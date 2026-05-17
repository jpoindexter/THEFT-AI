import type { Environment, ExecutionWorkspace } from "@paperclipai/shared";
import { FolderOpen, GitBranch, Pencil, X } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { IssueWorkspaceEnvironmentSelect } from "./IssueWorkspaceEnvironmentSelect";
import { BreakablePath, CopyableInline, WorkspaceStatusBadge } from "./IssueWorkspaceCardPrimitives";
import {
  configuredWorkspaceLabel,
  EXECUTION_WORKSPACE_OPTIONS,
  NO_REUSABLE_WORKSPACE_SELECT_VALUE,
  workspaceModeLabel,
} from "./workspace-card-utils";

interface IssueWorkspaceCardViewProps {
  activeNonDefaultWorkspace: boolean;
  canSaveWorkspaceConfig: boolean;
  configuredReusableWorkspace: ExecutionWorkspace | null;
  currentEnvironment: Environment | null;
  currentEnvironmentId: string | null;
  currentReusableEnvironmentId: string | null;
  currentSelection: string;
  currentWorkspaceLink: string | null;
  deduplicatedReusableWorkspaces: ExecutionWorkspace[];
  draftEnvironmentId: string;
  draftExecutionWorkspaceId: string;
  draftSelection: string;
  editing: boolean;
  environmentsEnabled: boolean;
  issueEnvironmentId: string | null | undefined;
  projectEnvironmentId: string | null;
  reuseExistingSelection: boolean;
  runSelectableEnvironments: Environment[];
  selectedReusableEnvironmentId: string;
  selectedReusableExecutionWorkspace: ExecutionWorkspace | null;
  selectedReusableWorkspaceLink: string | null;
  showEditingControls: boolean;
  workspace: ExecutionWorkspace | null | undefined;
  onCancel: () => void;
  onDraftEnvironmentIdChange: (value: string) => void;
  onDraftExecutionWorkspaceIdChange: (value: string) => void;
  onDraftSelectionChange: (value: string) => void;
  onEdit: () => void;
  onSave: () => void;
}

export function IssueWorkspaceCardView(props: IssueWorkspaceCardViewProps) {
  const {
    activeNonDefaultWorkspace,
    canSaveWorkspaceConfig,
    configuredReusableWorkspace,
    currentEnvironment,
    currentEnvironmentId,
    currentReusableEnvironmentId,
    currentSelection,
    currentWorkspaceLink,
    deduplicatedReusableWorkspaces,
    draftEnvironmentId,
    draftExecutionWorkspaceId,
    draftSelection,
    editing,
    environmentsEnabled,
    issueEnvironmentId,
    projectEnvironmentId,
    reuseExistingSelection,
    runSelectableEnvironments,
    selectedReusableEnvironmentId,
    selectedReusableExecutionWorkspace,
    selectedReusableWorkspaceLink,
    showEditingControls,
    workspace,
    onCancel,
    onDraftEnvironmentIdChange,
    onDraftExecutionWorkspaceIdChange,
    onDraftSelectionChange,
    onEdit,
    onSave,
  } = props;

  return (
    <Card className="gap-2 bg-transparent p-3 py-3 shadow-none">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          <GitBranch className="h-3.5 w-3.5 text-muted-foreground" />
          {activeNonDefaultWorkspace && workspace
            ? workspaceModeLabel(workspace.mode)
            : configuredWorkspaceLabel(currentSelection, selectedReusableExecutionWorkspace)}
          <WorkspaceStatusBadge status={workspace?.status ?? "idle"} />
        </div>
        <div className="flex items-center gap-1">
          {showEditingControls ? (
            <>
              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={onCancel}>
                <X className="h-3 w-3 mr-1" />Cancel
              </Button>
              <Button size="sm" className="h-6 px-2 text-xs" onClick={onSave} disabled={!canSaveWorkspaceConfig}>
                Save
              </Button>
            </>
          ) : (
            <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-muted-foreground" onClick={onEdit}>
              <Pencil className="h-3 w-3 mr-1" />Edit
            </Button>
          )}
        </div>
      </div>

      {!showEditingControls && (
        <div className="space-y-1.5 text-xs">
          {workspace?.branchName && <WorkspaceDetail icon="branch" value={workspace.branchName} />}
          {workspace?.cwd && <WorkspaceDetail icon="folder" value={workspace.cwd} />}
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
                : !issueEnvironmentId && projectEnvironmentId === currentEnvironmentId
                  ? " · project default"
                  : null}
            </div>
          )}
          {!workspace && <NoWorkspaceSummary currentSelection={currentSelection} />}
          {currentSelection === "reuse_existing" && selectedReusableExecutionWorkspace && (
            <LinkedWorkspaceSummary workspace={selectedReusableExecutionWorkspace} link={selectedReusableWorkspaceLink} />
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

      {editing && (
        <div className="space-y-2 pt-1">
          <Select value={draftSelection} onValueChange={onDraftSelectionChange}>
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
                onDraftExecutionWorkspaceIdChange(value === NO_REUSABLE_WORKSPACE_SELECT_VALUE ? "" : value);
              }}
            >
              <SelectTrigger size="sm" className="w-full text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NO_REUSABLE_WORKSPACE_SELECT_VALUE} className="text-xs">
                  Choose an existing workspace
                </SelectItem>
                {deduplicatedReusableWorkspaces.map((reusableWorkspace) => (
                  <SelectItem key={reusableWorkspace.id} value={reusableWorkspace.id} className="text-xs">
                    {reusableWorkspace.name} · {reusableWorkspace.status} ·{" "}
                    {reusableWorkspace.branchName ?? reusableWorkspace.cwd ?? reusableWorkspace.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {environmentsEnabled && (
            <IssueWorkspaceEnvironmentSelect
              configuredReusableWorkspace={configuredReusableWorkspace}
              draftEnvironmentId={draftEnvironmentId}
              projectEnvironmentId={projectEnvironmentId}
              reuseExistingSelection={reuseExistingSelection}
              runSelectableEnvironments={runSelectableEnvironments}
              selectedReusableEnvironmentId={selectedReusableEnvironmentId}
              onDraftEnvironmentIdChange={onDraftEnvironmentIdChange}
            />
          )}

          {workspace && (
            <div className="space-y-0.5 border-t border-border/50 pt-1 text-micro text-muted-foreground">
              <div className="break-words">
                Current:{" "}
                {currentWorkspaceLink ? (
                  <Link to={currentWorkspaceLink} className="hover:text-foreground hover:underline">
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

function WorkspaceDetail({ icon, value }: { icon: "branch" | "folder"; value: string }) {
  const Icon = icon === "branch" ? GitBranch : FolderOpen;
  return (
    <div className="flex items-center gap-1.5">
      <Icon className="h-3 w-3 text-muted-foreground shrink-0" />
      <CopyableInline value={value} mono />
    </div>
  );
}

function NoWorkspaceSummary({ currentSelection }: { currentSelection: string }) {
  return (
    <div className="text-muted-foreground">
      {currentSelection === "isolated_workspace"
        ? "A fresh isolated workspace will be created when this issue runs."
        : currentSelection === "reuse_existing"
          ? "This issue will reuse an existing workspace when it runs."
          : "This issue will use the project default workspace configuration when it runs."}
    </div>
  );
}

function LinkedWorkspaceSummary({ workspace, link }: { workspace: ExecutionWorkspace; link: string | null }) {
  return (
    <div className="break-words text-muted-foreground">
      Reusing:{" "}
      {link ? (
        <Link to={link} className="hover:text-foreground hover:underline">
          <BreakablePath text={workspace.name} />
        </Link>
      ) : (
        <BreakablePath text={workspace.name} />
      )}
    </div>
  );
}
