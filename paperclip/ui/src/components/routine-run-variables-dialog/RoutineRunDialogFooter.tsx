import type { RoutineVariable } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { DialogFooter } from "@/components/ui/dialog";
import {
  isMissingRequiredValue,
  type RoutineRunDialogSubmitData,
  type RoutineRunWorkspaceConfig,
} from "./routineRunDialogModel";

export function RoutineRunDialogFooter({
  assigneeAgentId,
  canSubmit,
  isPending,
  missingRequired,
  projectId,
  values,
  variables,
  workspaceBranchAutoValue,
  workspaceConfig,
  workspaceSelectionEnabled,
  workspaceConfigValid,
  isAutoWorkspaceBranchVariable,
  onClose,
  onSubmit,
}: {
  assigneeAgentId: string;
  canSubmit: boolean;
  isPending: boolean;
  missingRequired: string[];
  projectId: string;
  values: Record<string, unknown>;
  variables: RoutineVariable[];
  workspaceBranchAutoValue: string | null;
  workspaceConfig: RoutineRunWorkspaceConfig;
  workspaceSelectionEnabled: boolean;
  workspaceConfigValid: boolean;
  isAutoWorkspaceBranchVariable: (variable: RoutineVariable) => boolean;
  onClose: () => void;
  onSubmit: (data: RoutineRunDialogSubmitData) => void;
}) {
  return (
    <DialogFooter
      showCloseButton={false}
      className="shrink-0 border-t border-border/60 bg-background px-6 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4"
    >
      {!assigneeAgentId ? (
        <p className="mr-auto text-xs text-amber-600">Default agent required for this run.</p>
      ) : missingRequired.length > 0 ? (
        <p className="mr-auto text-xs text-amber-600">
          Missing: {missingRequired.join(", ")}
        </p>
      ) : workspaceSelectionEnabled && !workspaceConfigValid ? (
        <p className="mr-auto text-xs text-amber-600">
          Choose an existing workspace before running.
        </p>
      ) : (
        <span className="mr-auto" />
      )}
      <Button variant="ghost" onClick={onClose} disabled={isPending}>
        Cancel
      </Button>
      <Button
        onClick={() => {
          const nextVariables: Record<string, string | number | boolean> = {};
          for (const variable of variables) {
            if (isAutoWorkspaceBranchVariable(variable)) {
              nextVariables[variable.name] = workspaceBranchAutoValue!;
              continue;
            }
            const rawValue = values[variable.name];
            if (isMissingRequiredValue(rawValue)) continue;
            if (variable.type === "number") {
              nextVariables[variable.name] = Number(rawValue);
            } else if (variable.type === "boolean") {
              nextVariables[variable.name] = rawValue === true;
            } else {
              nextVariables[variable.name] = String(rawValue);
            }
          }
          onSubmit({
            variables: nextVariables,
            assigneeAgentId,
            projectId: projectId || null,
            ...(workspaceSelectionEnabled
              ? {
                executionWorkspaceId: workspaceConfig.executionWorkspaceId,
                executionWorkspacePreference: workspaceConfig.executionWorkspacePreference,
                executionWorkspaceSettings: workspaceConfig.executionWorkspaceSettings,
              }
              : {}),
          });
        }}
        disabled={isPending || !canSubmit}
      >
        {isPending ? "Running..." : "Run routine"}
      </Button>
    </DialogFooter>
  );
}
