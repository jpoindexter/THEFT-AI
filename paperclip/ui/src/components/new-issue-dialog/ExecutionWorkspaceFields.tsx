import type { ExecutionWorkspace } from "@paperclipai/shared";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const NO_WORKSPACE_VALUE = "__none__";

const EXECUTION_WORKSPACE_MODES = [
  { value: "shared_workspace", label: "Project default" },
  { value: "isolated_workspace", label: "New isolated workspace" },
  { value: "reuse_existing", label: "Reuse existing workspace" },
] as const;

type ExecutionWorkspaceFieldsProps = {
  executionWorkspaceMode: string;
  parentExecutionWorkspaceLabel: string;
  reusableWorkspaces: ExecutionWorkspace[];
  selectedExecutionWorkspaceId: string;
  selectedReusableExecutionWorkspace: ExecutionWorkspace | undefined;
  showParentWorkspaceWarning: boolean;
  onExecutionWorkspaceModeChange: (mode: string) => void;
  onSelectedExecutionWorkspaceIdChange: (workspaceId: string) => void;
};

export function ExecutionWorkspaceFields({
  executionWorkspaceMode,
  parentExecutionWorkspaceLabel,
  reusableWorkspaces,
  selectedExecutionWorkspaceId,
  selectedReusableExecutionWorkspace,
  showParentWorkspaceWarning,
  onExecutionWorkspaceModeChange,
  onSelectedExecutionWorkspaceIdChange,
}: ExecutionWorkspaceFieldsProps) {
  return (
    <div className="px-4 py-3 space-y-2">
      <div className="space-y-1.5">
        <div className="text-xs font-medium">Execution workspace</div>
        <div className="text-micro text-muted-foreground">
          Control whether this issue runs in the shared workspace, a new isolated workspace, or an existing one.
        </div>
        <Select
          value={executionWorkspaceMode}
          onValueChange={(mode) => {
            onExecutionWorkspaceModeChange(mode);
            if (mode !== "reuse_existing") {
              onSelectedExecutionWorkspaceIdChange("");
            }
          }}
        >
          <SelectTrigger size="sm" className="w-full text-xs md:text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent align="start">
            {EXECUTION_WORKSPACE_MODES.map((option) => (
              <SelectItem key={option.value} value={option.value} className="text-xs">
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {executionWorkspaceMode === "reuse_existing" ? (
          <Select
            value={selectedExecutionWorkspaceId || NO_WORKSPACE_VALUE}
            onValueChange={(workspaceId) =>
              onSelectedExecutionWorkspaceIdChange(workspaceId === NO_WORKSPACE_VALUE ? "" : workspaceId)}
          >
            <SelectTrigger size="sm" className="w-full text-xs md:text-xs">
              <SelectValue placeholder="Choose an existing workspace" />
            </SelectTrigger>
            <SelectContent align="start">
              <SelectItem value={NO_WORKSPACE_VALUE} className="text-xs">
                Choose an existing workspace
              </SelectItem>
              {reusableWorkspaces.map((workspace) => (
                <SelectItem key={workspace.id} value={workspace.id} className="text-xs">
                  {workspace.name} · {workspace.status} · {workspace.branchName ?? workspace.cwd ?? workspace.id.slice(0, 8)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
        {executionWorkspaceMode === "reuse_existing" && selectedReusableExecutionWorkspace ? (
          <div className="text-micro text-muted-foreground">
            Reusing {selectedReusableExecutionWorkspace.name} from {selectedReusableExecutionWorkspace.branchName ?? selectedReusableExecutionWorkspace.cwd ?? "existing execution workspace"}.
          </div>
        ) : null}
        {showParentWorkspaceWarning ? (
          <div className="rounded-md border border-amber-300/60 bg-amber-50 px-2 py-1.5 text-micro text-amber-900 dark:border-amber-800/70 dark:bg-amber-950/30 dark:text-amber-100">
            Warning: this sub-issue will no longer use the parent issue workspace{parentExecutionWorkspaceLabel ? ` (${parentExecutionWorkspaceLabel})` : ""}.
          </div>
        ) : null}
      </div>
    </div>
  );
}
