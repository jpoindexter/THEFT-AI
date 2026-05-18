import { useState } from "react";
import type { Project } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { DraftInput } from "../agent-config-primitives";
import { SaveIndicator } from "./ProjectPropertyPrimitives";
import type { ProjectConfigFieldKey, ProjectFieldSaveState } from "./ProjectPropertiesTypes";

type SelectableEnvironment = {
  id: string;
  name: string;
  driver: string;
};

export function ProjectExecutionWorkspaceSection({
  project,
  environmentsEnabled,
  runSelectableEnvironments,
  canEdit,
  commitField,
  fieldState,
}: {
  project: Project;
  environmentsEnabled: boolean;
  runSelectableEnvironments: SelectableEnvironment[];
  canEdit: boolean;
  commitField: (field: ProjectConfigFieldKey, data: Record<string, unknown>) => void;
  fieldState: (field: ProjectConfigFieldKey) => ProjectFieldSaveState;
}) {
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const executionWorkspacePolicy = project.executionWorkspacePolicy ?? null;
  const executionWorkspacesEnabled = executionWorkspacePolicy?.enabled === true;
  const defaultMode =
    executionWorkspacePolicy?.defaultMode === "isolated_workspace" ? "isolated_workspace" : "shared_workspace";
  const environmentId = executionWorkspacePolicy?.environmentId ?? "";
  const strategy = executionWorkspacePolicy?.workspaceStrategy ?? {
    type: "git_worktree",
    baseRef: "",
    branchTemplate: "",
    worktreeParentDir: "",
  };

  const updatePolicy = (patch: Record<string, unknown>) => ({
    executionWorkspacePolicy: {
      enabled: executionWorkspacesEnabled,
      defaultMode,
      allowIssueOverride: executionWorkspacePolicy?.allowIssueOverride ?? true,
      ...executionWorkspacePolicy,
      ...patch,
    },
  });

  const updateStrategy = (field: ProjectConfigFieldKey, patch: Record<string, unknown>) => {
    commitField(field, {
      ...updatePolicy({
        workspaceStrategy: {
          ...strategy,
          type: "git_worktree",
          ...patch,
        },
      }),
    });
  };

  return (
    <div className="space-y-2 py-1.5">
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <span>Execution Workspaces</span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-xs"
              className="h-4 w-4 rounded-full text-nano text-muted-foreground hover:text-foreground"
              aria-label="Execution workspaces help"
            >
              ?
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            Project-owned defaults for isolated issue checkouts and execution workspace behavior.
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-sm font-medium">
              <span>Enable isolated issue checkouts</span>
              <SaveIndicator state={fieldState("execution_workspace_enabled")} />
            </div>
            <div className="text-xs text-muted-foreground">
              Let issues choose between the project's primary checkout and an isolated execution workspace.
            </div>
          </div>
          {canEdit ? (
            <ToggleSwitch
              checked={executionWorkspacesEnabled}
              onCheckedChange={() =>
                commitField("execution_workspace_enabled", updatePolicy({ enabled: !executionWorkspacesEnabled }))}
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              {executionWorkspacesEnabled ? "Enabled" : "Disabled"}
            </span>
          )}
        </div>

        {executionWorkspacesEnabled ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm">
                  <span>New issues default to isolated checkout</span>
                  <SaveIndicator state={fieldState("execution_workspace_default_mode")} />
                </div>
                <div className="text-micro text-muted-foreground">
                  If disabled, new issues stay on the project's primary checkout unless someone opts in.
                </div>
              </div>
              <ToggleSwitch
                checked={defaultMode === "isolated_workspace"}
                onCheckedChange={() =>
                  commitField(
                    "execution_workspace_default_mode",
                    updatePolicy({
                      defaultMode:
                        defaultMode === "isolated_workspace" ? "shared_workspace" : "isolated_workspace",
                    }),
                  )}
              />
            </div>

            <div className="border-t border-border/60 pt-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-auto w-full justify-start gap-2 px-0 py-1 text-xs font-medium text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => setAdvancedOpen((open) => !open)}
              >
                {advancedOpen ? "Hide advanced checkout settings" : "Show advanced checkout settings"}
              </Button>
            </div>

            {advancedOpen ? (
              <div className="space-y-3">
                <div className="text-xs text-muted-foreground">
                  Host-managed implementation: <span className="text-foreground">Git worktree</span>
                </div>
                {environmentsEnabled ? (
                  <EnvironmentField
                    value={environmentId}
                    environments={runSelectableEnvironments}
                    saveState={fieldState("execution_workspace_environment")}
                    onChange={(value) =>
                      commitField("execution_workspace_environment", updatePolicy({ environmentId: value || null }))}
                  />
                ) : null}
                <StrategyInput
                  label="Base ref"
                  value={strategy.baseRef ?? ""}
                  state={fieldState("execution_workspace_base_ref")}
                  placeholder="origin/main"
                  onCommit={(value) => updateStrategy("execution_workspace_base_ref", { baseRef: value || null })}
                />
                <StrategyInput
                  label="Branch template"
                  value={strategy.branchTemplate ?? ""}
                  state={fieldState("execution_workspace_branch_template")}
                  placeholder="{{issue.identifier}}-{{slug}}"
                  onCommit={(value) => updateStrategy("execution_workspace_branch_template", { branchTemplate: value || null })}
                />
                <StrategyInput
                  label="Worktree parent dir"
                  value={strategy.worktreeParentDir ?? ""}
                  state={fieldState("execution_workspace_worktree_parent_dir")}
                  placeholder=".paperclip/worktrees"
                  onCommit={(value) => updateStrategy("execution_workspace_worktree_parent_dir", { worktreeParentDir: value || null })}
                />
                <StrategyInput
                  label="Provision command"
                  value={strategy.provisionCommand ?? ""}
                  state={fieldState("execution_workspace_provision_command")}
                  placeholder="bash ./scripts/provision-worktree.sh"
                  onCommit={(value) => updateStrategy("execution_workspace_provision_command", { provisionCommand: value || null })}
                />
                <StrategyInput
                  label="Teardown command"
                  value={strategy.teardownCommand ?? ""}
                  state={fieldState("execution_workspace_teardown_command")}
                  placeholder="bash ./scripts/teardown-worktree.sh"
                  onCommit={(value) => updateStrategy("execution_workspace_teardown_command", { teardownCommand: value || null })}
                />
                <p className="text-micro text-muted-foreground">
                  Provision runs inside the derived worktree before agent execution. Teardown is stored here for future cleanup flows.
                </p>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function EnvironmentField({
  value,
  environments,
  saveState,
  onChange,
}: {
  value: string;
  environments: SelectableEnvironment[];
  saveState: ProjectFieldSaveState;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <FieldHeader label="Environment" state={saveState} />
      <Select value={value || "__none__"} onValueChange={(next) => onChange(next === "__none__" ? "" : next)}>
        <SelectTrigger size="sm" className="w-full">
          <SelectValue placeholder="No environment" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">No environment</SelectItem>
          {environments.map((environment) => (
            <SelectItem key={environment.id} value={environment.id}>
              {environment.name} · {environment.driver}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function StrategyInput({
  label,
  value,
  state,
  placeholder,
  onCommit,
}: {
  label: string;
  value: string;
  state: ProjectFieldSaveState;
  placeholder: string;
  onCommit: (value: string) => void;
}) {
  return (
    <div>
      <FieldHeader label={label} state={state} />
      <DraftInput
        value={value}
        onCommit={onCommit}
        immediate
        className="w-full rounded border border-border bg-transparent px-2 py-1 font-mono text-xs outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}

function FieldHeader({ label, state }: { label: string; state: ProjectFieldSaveState }) {
  return (
    <div className="mb-1 flex items-center gap-1.5">
      <label className="flex items-center gap-2 text-xs text-muted-foreground">
        <span>{label}</span>
        <SaveIndicator state={state} />
      </label>
    </div>
  );
}
