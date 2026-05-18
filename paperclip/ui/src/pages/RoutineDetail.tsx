import { Repeat } from "lucide-react";
import { EmptyState } from "../components/EmptyState";
import { MarkdownEditor } from "../components/MarkdownEditor";
import { PageSkeleton } from "../components/PageSkeleton";
import {
  RoutineRunVariablesDialog,
} from "../components/RoutineRunVariablesDialog";
import { RoutineVariablesEditor, RoutineVariablesHint } from "../components/RoutineVariablesEditor";
import { Separator } from "@/components/ui/separator";
import { AdvancedDeliverySettings } from "./routine-detail/AdvancedDeliverySettings";
import {
  MissingDefaultAgentBanner,
  SaveConflictBanner,
  SecretMaterialBanner,
} from "./routine-detail/RoutineBanners";
import { RoutineAssignmentRow } from "./routine-detail/RoutineAssignmentRow";
import { RoutineHeader, SaveBar } from "./routine-detail/RoutineHeader";
import { RoutineTabs } from "./routine-detail/RoutineTabs";
import { useRoutineDetailController } from "./routine-detail/useRoutineDetailController";

export function RoutineDetail() {
  const controller = useRoutineDetailController();
  const { routine, selectedCompanyId, isLoading, error } = controller;
  const { editDraft } = controller.editor;

  if (!selectedCompanyId) {
    return <EmptyState icon={Repeat} message="Select a company to view routines." />;
  }

  if (isLoading) {
    return <PageSkeleton variant="issues-list" />;
  }

  if (error || !routine) {
    return (
      <p className="pt-6 text-sm text-destructive">
        {error instanceof Error ? error.message : "Routine not found"}
      </p>
    );
  }

  return (
    <div className="max-w-2xl space-y-6">
      <RoutineHeader
        routine={routine}
        editDraft={editDraft}
        titleInputRef={controller.refs.titleInputRef}
        descriptionEditorRef={controller.refs.descriptionEditorRef}
        assigneeSelectorRef={controller.refs.assigneeSelectorRef}
        projectSelectorRef={controller.refs.projectSelectorRef}
        runPending={controller.mutations.runRoutine.isPending}
        updateStatusPending={controller.mutations.updateRoutineStatus.isPending}
        onDraftChange={controller.editor.updateDraft}
        onRunClick={() => controller.runVariables.setOpen(true)}
        onToggleAutomation={controller.actions.onToggleAutomation}
      />

      {controller.secretMessage && (
        <SecretMaterialBanner
          secretMessage={controller.secretMessage}
          onCopy={controller.copySecretValue}
        />
      )}

      {controller.editor.saveConflict && (
        <SaveConflictBanner
          routineDefaults={controller.editor.routineDefaults}
          onReload={controller.editor.reloadLatest}
        />
      )}

      {!routine.assigneeAgentId ? <MissingDefaultAgentBanner /> : null}

      <RoutineAssignmentRow
        editDraft={editDraft}
        assigneeSelectorRef={controller.refs.assigneeSelectorRef}
        projectSelectorRef={controller.refs.projectSelectorRef}
        descriptionEditorRef={controller.refs.descriptionEditorRef}
        assigneeOptions={controller.selectors.assigneeOptions}
        projectOptions={controller.selectors.projectOptions}
        recentAssigneeIds={controller.selectors.recentAssigneeIds}
        recentProjectIds={controller.selectors.recentProjectIds}
        agentById={controller.selectors.agentById}
        projectById={controller.selectors.projectById}
        onDraftChange={controller.editor.updateDraft}
      />

      <MarkdownEditor
        ref={controller.refs.descriptionEditorRef}
        value={editDraft.description}
        onChange={(description) => controller.editor.updateDraft({ description })}
        placeholder="Add instructions..."
        bordered={false}
        contentClassName="min-h-32 text-sm leading-7"
        mentions={controller.selectors.mentionOptions}
        onSubmit={() => {
          if (!controller.mutations.saveRoutine.isPending && editDraft.title.trim()) {
            controller.mutations.saveRoutine.mutate();
          }
        }}
      />
      <RoutineVariablesHint />
      <RoutineVariablesEditor
        title={editDraft.title}
        description={editDraft.description}
        value={editDraft.variables}
        onChange={(variables) => controller.editor.updateDraft({ variables })}
      />

      <AdvancedDeliverySettings
        open={controller.editor.advancedOpen}
        editDraft={editDraft}
        onOpenChange={controller.editor.setAdvancedOpen}
        onDraftChange={controller.editor.updateDraft}
      />

      <SaveBar
        isEditDirty={controller.editor.isEditDirty}
        isSaving={controller.mutations.saveRoutine.isPending}
        title={editDraft.title}
        onSave={() => controller.mutations.saveRoutine.mutate()}
      />

      <Separator />

      <RoutineTabs
        activeTab={controller.tabs.activeTab}
        routine={routine}
        routineRuns={controller.tabs.routineRuns}
        activity={controller.tabs.activity}
        hasLiveRun={controller.tabs.hasLiveRun}
        activeIssueId={controller.tabs.activeIssueId}
        newTrigger={controller.tabs.newTrigger}
        createTriggerPending={controller.mutations.createTrigger.isPending}
        dirtyFields={controller.editor.dirtyFields}
        isEditDirty={controller.editor.isEditDirty}
        routineDefaults={controller.editor.routineDefaults}
        saveRoutinePending={controller.mutations.saveRoutine.isPending}
        editTitle={editDraft.title}
        agentById={controller.selectors.agentById}
        projectById={controller.selectors.projectById}
        onTabChange={controller.tabs.setActiveTab}
        onNewTriggerChange={controller.tabs.setNewTrigger}
        onCreateTrigger={() => controller.mutations.createTrigger.mutate()}
        onUpdateTrigger={(id, patch) => controller.mutations.updateTrigger.mutate({ id, patch })}
        onRotateTrigger={(id) => controller.mutations.rotateTrigger.mutate(id)}
        onDeleteTrigger={(id) => controller.mutations.deleteTrigger.mutate(id)}
        onDiscardEdits={controller.actions.discardEdits}
        onSaveEdits={() => controller.mutations.saveRoutine.mutate()}
        onRestoreSecretMaterials={controller.actions.restoreSecretMaterials}
        onRestored={controller.actions.onRestored}
      />

      <RoutineRunVariablesDialog
        open={controller.runVariables.open}
        onOpenChange={controller.runVariables.setOpen}
        companyId={routine.companyId}
        routineName={routine.title}
        agents={controller.data.agents}
        projects={controller.data.projects}
        defaultProjectId={routine.projectId}
        defaultAssigneeAgentId={routine.assigneeAgentId}
        variables={routine.variables ?? []}
        isPending={controller.mutations.runRoutine.isPending}
        onSubmit={(data) => controller.mutations.runRoutine.mutate(data)}
      />
    </div>
  );
}
