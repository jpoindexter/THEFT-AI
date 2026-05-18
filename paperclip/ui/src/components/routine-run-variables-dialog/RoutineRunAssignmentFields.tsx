import type { Agent, Project } from "@paperclipai/shared";
import { AgentIcon } from "@/components/AgentIconPicker";
import { InlineEntitySelector, type InlineEntityOption } from "@/components/InlineEntitySelector";
import { Label } from "@/components/ui/label";
import { trackRecentAssignee } from "@/lib/recent-assignees";
import { trackRecentProject } from "@/lib/recent-projects";

function ProjectSwatch() {
  return <span className="h-3.5 w-3.5 shrink-0 rounded-sm bg-muted" />;
}

export function RoutineRunAssignmentFields({
  agents,
  projects,
  assigneeOptions,
  projectOptions,
  recentAssigneeIds,
  recentProjectIds,
  assigneeAgentId,
  projectId,
  currentAssignee,
  selectedProject,
  onAssigneeChange,
  onProjectChange,
}: {
  agents: Agent[];
  projects: Project[];
  assigneeOptions: InlineEntityOption[];
  projectOptions: InlineEntityOption[];
  recentAssigneeIds: string[];
  recentProjectIds: string[];
  assigneeAgentId: string;
  projectId: string;
  currentAssignee: Agent | null;
  selectedProject: Project | null;
  onAssigneeChange: (assigneeAgentId: string) => void;
  onProjectChange: (project: Project | null, projectId: string) => void;
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="space-y-1.5">
        <Label className="text-xs">Agent *</Label>
        <InlineEntitySelector
          value={assigneeAgentId}
          options={assigneeOptions}
          recentOptionIds={recentAssigneeIds}
          placeholder="Agent"
          noneLabel="Select an agent"
          searchPlaceholder="Search agents..."
          emptyMessage="No agents found."
          disablePortal
          openOnFocus={false}
          onChange={(nextAssigneeId) => {
            if (nextAssigneeId) trackRecentAssignee(nextAssigneeId);
            onAssigneeChange(nextAssigneeId);
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
              <span className="text-muted-foreground">Select an agent</span>
            )
          }
          renderOption={(option) => {
            if (!option.id) return <span className="truncate">{option.label}</span>;
            const assignee = agents.find((agent) => agent.id === option.id);
            return (
              <>
                {assignee ? <AgentIcon icon={assignee.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
                <span className="truncate">{option.label}</span>
              </>
            );
          }}
        />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Project</Label>
        <InlineEntitySelector
          value={projectId}
          options={projectOptions}
          recentOptionIds={recentProjectIds}
          placeholder="Project"
          noneLabel="No project"
          searchPlaceholder="Search projects..."
          emptyMessage="No projects found."
          disablePortal
          openOnFocus={false}
          onChange={(nextProjectId) => {
            const project = projects.find((entry) => entry.id === nextProjectId) ?? null;
            if (nextProjectId) trackRecentProject(nextProjectId);
            onProjectChange(project, nextProjectId);
          }}
          renderTriggerValue={(option) =>
            option && selectedProject ? (
              <>
                <ProjectSwatch />
                <span className="truncate">{option.label}</span>
              </>
            ) : (
              <span className="text-muted-foreground">No project</span>
            )
          }
          renderOption={(option) => {
            if (!option.id) return <span className="truncate">{option.label}</span>;
            return (
              <>
                <ProjectSwatch />
                <span className="truncate">{option.label}</span>
              </>
            );
          }}
        />
      </div>
    </div>
  );
}
