import type { Dispatch, SetStateAction } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { WorkspaceFormState } from "./workspaceModel";

type WorkspaceSettingsActionsProps = {
  isDirty: boolean;
  isSaving: boolean;
  initialState: WorkspaceFormState;
  errorMessage: string | null;
  runtimeActionMessage: string | null;
  onChange: Dispatch<SetStateAction<WorkspaceFormState | null>>;
  onSave: () => void;
  onResetError: () => void;
};

export function WorkspaceSettingsActions({
  isDirty,
  isSaving,
  initialState,
  errorMessage,
  runtimeActionMessage,
  onChange,
  onSave,
  onResetError,
}: WorkspaceSettingsActionsProps) {
  return (
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:flex-wrap sm:items-center">
      <Button className="w-full sm:w-auto" disabled={!isDirty || isSaving} onClick={onSave}>
        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Save changes
      </Button>
      <Button
        variant="outline"
        className="w-full sm:w-auto"
        disabled={!isDirty || isSaving}
        onClick={() => {
          onChange(initialState);
          onResetError();
        }}
      >
        Reset
      </Button>
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
      {!errorMessage && runtimeActionMessage ? <p className="text-sm text-muted-foreground">{runtimeActionMessage}</p> : null}
      {!errorMessage && !isDirty ? <p className="text-sm text-muted-foreground">No unsaved changes.</p> : null}
    </div>
  );
}
