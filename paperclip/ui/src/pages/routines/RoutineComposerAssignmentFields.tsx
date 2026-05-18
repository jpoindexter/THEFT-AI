import type { Dispatch, RefObject, SetStateAction } from "react";
import type { Agent, Project } from "@paperclipai/shared";
import { AgentIcon } from "@/components/AgentIconPicker";
import { InlineEntitySelector, type InlineEntityOption } from "@/components/InlineEntitySelector";
import type { MarkdownEditorRef } from "@/components/MarkdownEditor";
import { ProjectSwatch } from "@/components/issue-properties/PropertyControls";
import type { RoutineDraft } from "./routinesModel";

export function RoutineComposerAssignmentFields({
  draft,
  currentAssignee,
  currentProject,
  assigneeOptions,
  projectOptions,
  recentAssigneeIds,
  recentProjectIds,
  agentById,
  projectById,
  assigneeSelectorRef,
  projectSelectorRef,
  descriptionEditorRef,
  setDraft,
  onTrackAssignee,
  onTrackProject,
}: {
  draft: RoutineDraft;
  currentAssignee: Agent | null;
  currentProject: Project | null;
  assigneeOptions: InlineEntityOption[];
  projectOptions: InlineEntityOption[];
  recentAssigneeIds: string[];
  recentProjectIds: string[];
  agentById: Map<string, Agent>;
  projectById: Map<string, Project>;
  assigneeSelectorRef: RefObject<HTMLButtonElement | null>;
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  setDraft: Dispatch<SetStateAction<RoutineDraft>>;
  onTrackAssignee: (assigneeAgentId: string) => void;
  onTrackProject: (projectId: string) => void;
}) {
  return (
    <div className="px-5 pb-3">
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="inline-flex min-w-full flex-wrap items-center gap-2 text-sm text-muted-foreground sm:min-w-max sm:flex-nowrap">
          <span>For</span>
          <InlineEntitySelector
            ref={assigneeSelectorRef}
            value={draft.assigneeAgentId}
            options={assigneeOptions}
            recentOptionIds={recentAssigneeIds}
            placeholder="Assignee"
            noneLabel="No assignee"
            searchPlaceholder="Search assignees..."
            emptyMessage="No assignees found."
            onChange={(assigneeAgentId) => {
              if (assigneeAgentId) onTrackAssignee(assigneeAgentId);
              setDraft((current) => ({ ...current, assigneeAgentId }));
            }}
            onConfirm={() => {
              if (draft.projectId) descriptionEditorRef.current?.focus();
              else projectSelectorRef.current?.focus();
            }}
            renderTriggerValue={(option) => renderAssigneeValue(option, currentAssignee)}
            renderOption={(option) => renderAssigneeValue(option, option.id ? agentById.get(option.id) ?? null : null)}
          />
          <span>in</span>
          <InlineEntitySelector
            ref={projectSelectorRef}
            value={draft.projectId}
            options={projectOptions}
            recentOptionIds={recentProjectIds}
            placeholder="Project"
            noneLabel="No project"
            searchPlaceholder="Search projects..."
            emptyMessage="No projects found."
            onChange={(projectId) => {
              if (projectId) onTrackProject(projectId);
              setDraft((current) => ({ ...current, projectId }));
            }}
            onConfirm={() => descriptionEditorRef.current?.focus()}
            renderTriggerValue={(option) => renderProjectValue(option, currentProject)}
            renderOption={(option) => renderProjectValue(option, option.id ? projectById.get(option.id) ?? null : null)}
          />
        </div>
      </div>
    </div>
  );
}

function renderAssigneeValue(option: InlineEntityOption | null, agent: Agent | null) {
  if (!option) return <span className="text-muted-foreground">Assignee</span>;
  return (
    <>
      {agent ? <AgentIcon icon={agent.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
      <span className="truncate">{option.label}</span>
    </>
  );
}

function renderProjectValue(option: InlineEntityOption | null, project: Project | null) {
  if (!option) return <span className="text-muted-foreground">Project</span>;
  return (
    <>
      <ProjectSwatch color={project?.color} />
      <span className="truncate">{option.label}</span>
    </>
  );
}
