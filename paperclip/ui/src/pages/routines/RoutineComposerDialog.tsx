import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Agent, Project } from "@paperclipai/shared";
import { ChevronDown, ChevronRight, Plus } from "lucide-react";
import type { InlineEntityOption } from "@/components/InlineEntitySelector";
import { MarkdownEditor, type MarkdownEditorRef, type MentionOption } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  autoResizeTextarea,
  catchUpPolicies,
  catchUpPolicyDescriptions,
  concurrencyPolicies,
  concurrencyPolicyDescriptions,
  type RoutineDraft,
} from "./routinesModel";
import { RoutineComposerAssignmentFields } from "./RoutineComposerAssignmentFields";

export function RoutineComposerDialog({
  open,
  advancedOpen,
  createError,
  draft,
  isPending,
  mentionOptions,
  currentAssignee,
  currentProject,
  assigneeOptions,
  projectOptions,
  recentAssigneeIds,
  recentProjectIds,
  agentById,
  projectById,
  titleInputRef,
  descriptionEditorRef,
  assigneeSelectorRef,
  projectSelectorRef,
  setAdvancedOpen,
  setDraft,
  onOpenChange,
  onCreate,
  onTrackAssignee,
  onTrackProject,
}: {
  open: boolean;
  advancedOpen: boolean;
  createError: unknown;
  draft: RoutineDraft;
  isPending: boolean;
  mentionOptions: MentionOption[];
  currentAssignee: Agent | null;
  currentProject: Project | null;
  assigneeOptions: InlineEntityOption[];
  projectOptions: InlineEntityOption[];
  recentAssigneeIds: string[];
  recentProjectIds: string[];
  agentById: Map<string, Agent>;
  projectById: Map<string, Project>;
  titleInputRef: RefObject<HTMLTextAreaElement | null>;
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  assigneeSelectorRef: RefObject<HTMLButtonElement | null>;
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  setAdvancedOpen: Dispatch<SetStateAction<boolean>>;
  setDraft: Dispatch<SetStateAction<RoutineDraft>>;
  onOpenChange: (open: boolean) => void;
  onCreate: () => void;
  onTrackAssignee: (assigneeAgentId: string) => void;
  onTrackProject: (projectId: string) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent showCloseButton={false} className="theft-routine-composer-dialog flex flex-col gap-0 overflow-hidden p-0">
        <DialogTitle className="sr-only">New routine</DialogTitle>
        <DialogDescription className="sr-only">
          Define recurring work, default assignment, and advanced delivery settings.
        </DialogDescription>
        <RoutineComposerHeader
          isPending={isPending}
          onCancel={() => {
            onOpenChange(false);
            setAdvancedOpen(false);
          }}
        />
        <div className="min-h-0 flex-1 overflow-y-auto">
          <RoutineTitleField
            draft={draft}
            titleInputRef={titleInputRef}
            descriptionEditorRef={descriptionEditorRef}
            assigneeSelectorRef={assigneeSelectorRef}
            projectSelectorRef={projectSelectorRef}
            setDraft={setDraft}
          />
          <RoutineComposerAssignmentFields
            draft={draft}
            currentAssignee={currentAssignee}
            currentProject={currentProject}
            assigneeOptions={assigneeOptions}
            projectOptions={projectOptions}
            recentAssigneeIds={recentAssigneeIds}
            recentProjectIds={recentProjectIds}
            agentById={agentById}
            projectById={projectById}
            assigneeSelectorRef={assigneeSelectorRef}
            projectSelectorRef={projectSelectorRef}
            descriptionEditorRef={descriptionEditorRef}
            setDraft={setDraft}
            onTrackAssignee={onTrackAssignee}
            onTrackProject={onTrackProject}
          />
          <div className="border-t border-border/60 px-5 py-4">
            <MarkdownEditor
              ref={descriptionEditorRef}
              value={draft.description}
              onChange={(description) => setDraft((current) => ({ ...current, description }))}
              placeholder="Add instructions..."
              bordered={false}
              contentClassName="theft-routine-description-editor text-sm text-muted-foreground"
              mentions={mentionOptions}
              onSubmit={() => {
                if (!isPending && draft.title.trim() && draft.projectId && draft.assigneeAgentId) onCreate();
              }}
            />
          </div>
          <RoutineAdvancedSettings
            advancedOpen={advancedOpen}
            draft={draft}
            setAdvancedOpen={setAdvancedOpen}
            setDraft={setDraft}
          />
        </div>
        <RoutineComposerFooter
          createError={createError}
          draft={draft}
          isPending={isPending}
          onCreate={onCreate}
        />
      </DialogContent>
    </Dialog>
  );
}

function RoutineComposerHeader({ isPending, onCancel }: { isPending: boolean; onCancel: () => void }) {
  return (
    <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-border/60 px-5 py-3">
      <div>
        <p className="theft-label text-muted-foreground">New routine</p>
        <p className="text-sm text-muted-foreground">
          Define the recurring work first. Default project and agent are optional for draft routines.
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onCancel} disabled={isPending}>
        Cancel
      </Button>
    </div>
  );
}

function RoutineTitleField({
  draft,
  titleInputRef,
  descriptionEditorRef,
  assigneeSelectorRef,
  projectSelectorRef,
  setDraft,
}: Pick<Parameters<typeof RoutineComposerDialog>[0], "draft" | "titleInputRef" | "descriptionEditorRef" | "assigneeSelectorRef" | "projectSelectorRef" | "setDraft">) {
  return (
    <div className="px-5 pb-3 pt-5">
      <Textarea
        ref={titleInputRef}
        className="w-full resize-none overflow-hidden border-0 bg-transparent p-0 text-xl font-semibold shadow-none outline-none placeholder:text-muted-foreground/50 focus-visible:ring-0"
        placeholder="Routine title"
        rows={1}
        value={draft.title}
        onChange={(event) => {
          setDraft((current) => ({ ...current, title: event.target.value }));
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
            if (draft.assigneeAgentId) {
              if (draft.projectId) descriptionEditorRef.current?.focus();
              else projectSelectorRef.current?.focus();
            } else assigneeSelectorRef.current?.focus();
          }
        }}
        autoFocus
      />
    </div>
  );
}

function RoutineAdvancedSettings({
  advancedOpen,
  draft,
  setAdvancedOpen,
  setDraft,
}: Pick<Parameters<typeof RoutineComposerDialog>[0], "advancedOpen" | "draft" | "setAdvancedOpen" | "setDraft">) {
  return (
    <div className="border-t border-border/60 px-5 py-3">
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
        <CollapsibleTrigger className="flex w-full items-center justify-between text-left">
          <div>
            <p className="text-sm font-medium">Advanced delivery settings</p>
            <p className="text-sm text-muted-foreground">Keep policy controls secondary to the work definition.</p>
          </div>
          {advancedOpen ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="pt-3">
          <div className="grid gap-4 md:grid-cols-2">
            <PolicySelect
              label="Concurrency"
              value={draft.concurrencyPolicy}
              values={concurrencyPolicies}
              description={concurrencyPolicyDescriptions[draft.concurrencyPolicy]}
              onChange={(concurrencyPolicy) => setDraft((current) => ({ ...current, concurrencyPolicy }))}
            />
            <PolicySelect
              label="Catch-up"
              value={draft.catchUpPolicy}
              values={catchUpPolicies}
              description={catchUpPolicyDescriptions[draft.catchUpPolicy]}
              onChange={(catchUpPolicy) => setDraft((current) => ({ ...current, catchUpPolicy }))}
            />
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function PolicySelect({ label, value, values, description, onChange }: { label: string; value: string; values: string[]; description?: string; onChange: (value: string) => void }) {
  return (
    <div className="space-y-2">
      <p className="theft-label-compact text-muted-foreground">{label}</p>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          {values.map((item) => <SelectItem key={item} value={item}>{item.replaceAll("_", " ")}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">{description}</p>
    </div>
  );
}

function RoutineComposerFooter({ createError, draft, isPending, onCreate }: { createError: unknown; draft: RoutineDraft; isPending: boolean; onCreate: () => void }) {
  return (
    <div className="flex shrink-0 flex-col gap-3 border-t border-border/60 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="text-sm text-muted-foreground">
        After creation, Paperclip takes you straight to trigger setup. Draft routines stay paused until you add a default agent.
      </div>
      <div className="flex flex-col gap-2 sm:items-end">
        <Button onClick={onCreate} disabled={isPending || !draft.title.trim()}>
          <Plus className="mr-2 h-4 w-4" />
          {isPending ? "Creating..." : "Create routine"}
        </Button>
        {createError ? (
          <p className="text-sm text-destructive">
            {createError instanceof Error ? createError.message : "Failed to create routine"}
          </p>
        ) : null}
      </div>
    </div>
  );
}
