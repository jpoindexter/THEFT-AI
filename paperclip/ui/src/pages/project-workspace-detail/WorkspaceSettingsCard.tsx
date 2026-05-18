import type { Dispatch, SetStateAction } from "react";
import type { ProjectWorkspace } from "@paperclipai/shared";
import { Check, Loader2, Sparkles } from "lucide-react";
import { ChoosePathButton } from "@/components/PathInstructionsModal";
import { TheftLabel } from "@/components/theft/atoms/TheftLabel";
import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type {
  ProjectWorkspaceSourceType,
  ProjectWorkspaceVisibility,
  WorkspaceFormState,
} from "./workspaceModel";
import { SOURCE_TYPE_OPTIONS, VISIBILITY_OPTIONS } from "./workspaceModel";
import { WorkspaceField } from "./WorkspaceDetailPrimitives";
import { WorkspaceSettingsActions } from "./WorkspaceSettingsActions";
import {
  WorkspaceCommandFields,
  WorkspaceRemoteFields,
  WorkspaceRepositoryFields,
  WorkspaceRuntimeJson,
} from "./WorkspaceSettingsFields";

type WorkspaceSettingsCardProps = {
  workspace: ProjectWorkspace;
  form: WorkspaceFormState;
  initialState: WorkspaceFormState;
  isDirty: boolean;
  isSaving: boolean;
  isSettingPrimary: boolean;
  errorMessage: string | null;
  runtimeActionMessage: string | null;
  onChange: Dispatch<SetStateAction<WorkspaceFormState | null>>;
  onSave: () => void;
  onResetError: () => void;
  onMakePrimary: () => void;
};

export function WorkspaceSettingsCard(props: WorkspaceSettingsCardProps) {
  const { workspace, form, initialState, isDirty, isSaving, errorMessage, runtimeActionMessage, onChange } = props;
  const sourceTypeDescription = SOURCE_TYPE_OPTIONS.find((option) => option.value === form.sourceType)?.description;
  const updateField = (patch: Partial<WorkspaceFormState>) => {
    onChange((current) => (current ? { ...current, ...patch } : current));
  };

  return (
    <TheftSurface padding="lg" className="space-y-5">
      <WorkspaceSettingsHeader
        workspace={workspace}
        isSettingPrimary={props.isSettingPrimary}
        onMakePrimary={props.onMakePrimary}
      />
      <Separator />
      <div className="grid gap-4 md:grid-cols-2">
        <WorkspaceField label="Workspace name">
          <Input value={form.name} onChange={(event) => updateField({ name: event.target.value })} placeholder="Workspace name" />
        </WorkspaceField>
        <WorkspaceField label="Visibility">
          <Select value={form.visibility} onValueChange={(value) => updateField({ visibility: value as ProjectWorkspaceVisibility })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {VISIBILITY_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </WorkspaceField>
      </div>
      <div className="grid gap-4">
        <WorkspaceField label="Source type" hint={sourceTypeDescription}>
          <Select value={form.sourceType} onValueChange={(value) => updateField({ sourceType: value as ProjectWorkspaceSourceType })}>
            <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
            <SelectContent>
              {SOURCE_TYPE_OPTIONS.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </WorkspaceField>
        <div className="grid gap-4 md:grid-cols-2">
          <WorkspaceField label="Local path">
            <Input className="font-mono" value={form.cwd} onChange={(event) => updateField({ cwd: event.target.value })} placeholder="/absolute/path/to/workspace" />
          </WorkspaceField>
          <div className="flex items-end"><ChoosePathButton /></div>
        </div>
        <WorkspaceRepositoryFields form={form} onChange={updateField} />
        <WorkspaceRemoteFields form={form} onChange={updateField} />
        <WorkspaceCommandFields form={form} onChange={updateField} />
        <WorkspaceRuntimeJson form={form} onChange={updateField} />
      </div>
      <WorkspaceSettingsActions
        isDirty={isDirty}
        isSaving={isSaving}
        initialState={initialState}
        errorMessage={errorMessage}
        runtimeActionMessage={runtimeActionMessage}
        onChange={onChange}
        onSave={props.onSave}
        onResetError={props.onResetError}
      />
    </TheftSurface>
  );
}

function WorkspaceSettingsHeader({
  workspace,
  isSettingPrimary,
  onMakePrimary,
}: {
  workspace: ProjectWorkspace;
  isSettingPrimary: boolean;
  onMakePrimary: () => void;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
      <div className="space-y-2">
        <TheftLabel density="compact">Project workspace</TheftLabel>
        <h1 className="text-2xl font-semibold">{workspace.name}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Configure the workspace Paperclip attaches to this project, including checkout behavior, runtime services,
          setup commands, and cleanup commands.
        </p>
      </div>
      {!workspace.isPrimary ? (
        <Button variant="outline" className="w-full sm:w-auto" disabled={isSettingPrimary} onClick={onMakePrimary}>
          {isSettingPrimary ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          Make primary
        </Button>
      ) : (
        <div className="inline-flex items-center gap-2 rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground sm:max-w-sm">
          <Sparkles className="h-4 w-4" />
          This is the project's primary codebase workspace.
        </div>
      )}
    </div>
  );
}
