import type { RefObject } from "react";
import type { Agent, Project } from "@paperclipai/shared";
import { AgentIcon } from "../../components/AgentIconPicker";
import { InlineEntitySelector, type InlineEntityOption } from "../../components/InlineEntitySelector";
import type { MarkdownEditorRef } from "../../components/MarkdownEditor";
import { trackRecentAssignee } from "../../lib/recent-assignees";
import { trackRecentProject } from "../../lib/recent-projects";
import type { RoutineEditDraft } from "./routineDetailModel";

export function RoutineAssignmentRow({
  editDraft,
  assigneeSelectorRef,
  projectSelectorRef,
  descriptionEditorRef,
  assigneeOptions,
  projectOptions,
  recentAssigneeIds,
  recentProjectIds,
  agentById,
  projectById,
  onDraftChange,
}: {
  editDraft: RoutineEditDraft;
  assigneeSelectorRef: RefObject<HTMLButtonElement | null>;
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  assigneeOptions: InlineEntityOption[];
  projectOptions: InlineEntityOption[];
  recentAssigneeIds: string[];
  recentProjectIds: string[];
  agentById: Map<string, Agent>;
  projectById: Map<string, Project>;
  onDraftChange: (patch: Partial<RoutineEditDraft>) => void;
}) {
  const currentAssignee = editDraft.assigneeAgentId ? agentById.get(editDraft.assigneeAgentId) ?? null : null;
  const currentProject = editDraft.projectId ? projectById.get(editDraft.projectId) ?? null : null;

  return (
    <div className="overflow-x-auto overscroll-x-contain">
      <div className="inline-flex min-w-full flex-wrap items-center gap-2 text-sm text-muted-foreground sm:min-w-max sm:flex-nowrap">
        <span>For</span>
        <InlineEntitySelector
          ref={assigneeSelectorRef}
          value={editDraft.assigneeAgentId}
          options={assigneeOptions}
          recentOptionIds={recentAssigneeIds}
          placeholder="Assignee"
          noneLabel="No assignee"
          searchPlaceholder="Search assignees..."
          emptyMessage="No assignees found."
          onChange={(assigneeAgentId) => {
            if (assigneeAgentId) trackRecentAssignee(assigneeAgentId);
            onDraftChange({ assigneeAgentId });
          }}
          onConfirm={() => {
            if (editDraft.projectId) {
              descriptionEditorRef.current?.focus();
            } else {
              projectSelectorRef.current?.focus();
            }
          }}
          renderTriggerValue={(option) =>
            option ? (
              currentAssignee ? (
                <>
                  <AgentIcon icon={currentAssignee.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate">{option.label}</span>
                </>
              ) : (
                <span className="truncate">{option.label}</span>
              )
            ) : (
              <span className="text-muted-foreground">Assignee</span>
            )
          }
          renderOption={(option) => {
            if (!option.id) return <span className="truncate">{option.label}</span>;
            const assignee = agentById.get(option.id);
            return (
              <>
                {assignee ? <AgentIcon icon={assignee.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
                <span className="truncate">{option.label}</span>
              </>
            );
          }}
        />
        <span>in</span>
        <InlineEntitySelector
          ref={projectSelectorRef}
          value={editDraft.projectId}
          options={projectOptions}
          recentOptionIds={recentProjectIds}
          placeholder="Project"
          noneLabel="No project"
          searchPlaceholder="Search projects..."
          emptyMessage="No projects found."
          onChange={(projectId) => {
            if (projectId) trackRecentProject(projectId);
            onDraftChange({ projectId });
          }}
          onConfirm={() => descriptionEditorRef.current?.focus()}
          renderTriggerValue={(option) =>
            option && currentProject ? (
              <>
                <span className="h-3.5 w-3.5 shrink-0 rounded-sm bg-muted-foreground" />
                <span className="truncate">{option.label}</span>
              </>
            ) : (
              <span className="text-muted-foreground">Project</span>
            )
          }
          renderOption={(option) => {
            if (!option.id) return <span className="truncate">{option.label}</span>;
            return (
              <>
                <span className="h-3.5 w-3.5 shrink-0 rounded-sm bg-muted-foreground" />
                <span className="truncate">{option.label}</span>
              </>
            );
          }}
        />
      </div>
    </div>
  );
}
