import type { RefObject } from "react";
import { Save } from "lucide-react";
import type { RoutineDetail as RoutineDetailType } from "@paperclipai/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import { RunButton } from "../../components/AgentActionButtons";
import type { MarkdownEditorRef } from "../../components/MarkdownEditor";
import { autoResizeTextarea, type RoutineEditDraft } from "./routineDetailModel";

export function RoutineHeader({
  routine,
  editDraft,
  titleInputRef,
  descriptionEditorRef,
  assigneeSelectorRef,
  projectSelectorRef,
  runPending,
  updateStatusPending,
  onDraftChange,
  onRunClick,
  onToggleAutomation,
}: {
  routine: RoutineDetailType;
  editDraft: RoutineEditDraft;
  titleInputRef: RefObject<HTMLTextAreaElement | null>;
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  assigneeSelectorRef: RefObject<HTMLButtonElement | null>;
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  runPending: boolean;
  updateStatusPending: boolean;
  onDraftChange: (patch: Partial<RoutineEditDraft>) => void;
  onRunClick: () => void;
  onToggleAutomation: () => void;
}) {
  const automationEnabled = routine.status === "active";
  const automationToggleDisabled = updateStatusPending || routine.status === "archived";
  const automationLabel = routine.status === "archived"
    ? "Archived"
    : !routine.assigneeAgentId
      ? "Draft"
      : automationEnabled
        ? "Active"
        : "Paused";
  const automationLabelClassName = routine.status === "archived"
    ? "text-muted-foreground"
    : automationEnabled
      ? "text-emerald-400"
      : "text-muted-foreground";

  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1 space-y-2">
        <Textarea
          ref={titleInputRef}
          className="min-h-0 resize-none overflow-hidden border-0 px-0 py-0 text-xl font-bold shadow-none focus-visible:ring-0"
          placeholder="Routine title"
          rows={1}
          value={editDraft.title}
          onChange={(event) => {
            onDraftChange({ title: event.target.value });
            autoResizeTextarea(event.target);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.metaKey && !event.ctrlKey && !event.nativeEvent.isComposing) {
              event.preventDefault();
              descriptionEditorRef.current?.focus();
              return;
            }
            if (event.key === "Tab" && !event.shiftKey) {
              event.preventDefault();
              if (editDraft.assigneeAgentId) {
                if (editDraft.projectId) {
                  descriptionEditorRef.current?.focus();
                } else {
                  projectSelectorRef.current?.focus();
                }
              } else {
                assigneeSelectorRef.current?.focus();
              }
            }
          }}
        />
        {routine.managedByPlugin ? (
          <Badge variant="outline" className="gap-1 text-xs text-muted-foreground">
            Managed by {routine.managedByPlugin.pluginDisplayName}
            <span className="font-mono text-micro">{routine.managedByPlugin.resourceKey}</span>
          </Badge>
        ) : null}
      </div>
      <div className="flex shrink-0 items-center gap-3 pt-1">
        <RunButton onClick={onRunClick} disabled={runPending} />
        <ToggleSwitch
          size="lg"
          checked={automationEnabled}
          onCheckedChange={onToggleAutomation}
          disabled={automationToggleDisabled}
          aria-label={automationEnabled ? "Pause automatic triggers" : "Enable automatic triggers"}
        />
        <span className={`min-w-16 text-sm font-medium ${automationLabelClassName}`}>
          {automationLabel}
        </span>
      </div>
    </div>
  );
}

export function SaveBar({
  isEditDirty,
  isSaving,
  title,
  onSave,
}: {
  isEditDirty: boolean;
  isSaving: boolean;
  title: string;
  onSave: () => void;
}) {
  return (
    <div className="flex items-center justify-between">
      {isEditDirty ? (
        <span className="text-xs text-amber-600">Unsaved changes</span>
      ) : (
        <span />
      )}
      <Button onClick={onSave} disabled={isSaving || !title.trim()}>
        <Save className="mr-2 h-4 w-4" />
        Save routine
      </Button>
    </div>
  );
}
