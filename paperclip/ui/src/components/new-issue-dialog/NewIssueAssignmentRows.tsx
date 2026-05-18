import type { RefObject } from "react";
import { Eye, MoreHorizontal, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "../../lib/utils";
import { parseAssigneeValue } from "../../lib/assignees";
import { AgentIcon } from "../AgentIconPicker";
import { InlineEntitySelector, type InlineEntityOption } from "../InlineEntitySelector";
import { ProjectSwatch } from "../issue-properties/PropertyControls";

interface AssignmentAgent {
  id: string;
  icon?: string | null;
}

interface AssignmentProject {
  id: string;
  color?: string | null;
}

interface NewIssueAssignmentRowsProps {
  agents: AssignmentAgent[];
  assigneeOptions: InlineEntityOption[];
  assigneeSelectorRef: RefObject<HTMLButtonElement | null>;
  assigneeValue: string;
  approverValue: string;
  currentAssignee: AssignmentAgent | null;
  currentProject: AssignmentProject | undefined;
  participantMenuOpen: boolean;
  projectId: string;
  projectOptions: InlineEntityOption[];
  projectSelectorRef: RefObject<HTMLButtonElement | null>;
  projects: AssignmentProject[];
  recentAssigneeOptionIds: string[];
  recentProjectIds: string[];
  reviewerValue: string;
  showApproverRow: boolean;
  showReviewerRow: boolean;
  onApproverChange: (value: string) => void;
  onApproverRowToggle: () => void;
  onAssigneeChange: (value: string) => void;
  onAssigneeConfirm: () => void;
  onParticipantMenuOpenChange: (open: boolean) => void;
  onProjectChange: (value: string) => void;
  onProjectConfirm: () => void;
  onReviewerChange: (value: string) => void;
  onReviewerRowToggle: () => void;
}

function agentForAssigneeOption(optionId: string, agents: AssignmentAgent[]) {
  const agentId = parseAssigneeValue(optionId).assigneeAgentId;
  return agentId ? agents.find((agent) => agent.id === agentId) ?? null : null;
}

function renderAgentOption(option: InlineEntityOption, agents: AssignmentAgent[]) {
  if (!option.id) return <span className="truncate">{option.label}</span>;
  const agent = agentForAssigneeOption(option.id, agents);
  return (
    <>
      {agent ? <AgentIcon icon={agent.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
      <span className="truncate">{option.label}</span>
    </>
  );
}

function renderParticipantTrigger(option: InlineEntityOption | null, agents: AssignmentAgent[], fallback: string) {
  if (!option) return <span className="text-muted-foreground">{fallback}</span>;
  const agent = agentForAssigneeOption(option.id, agents);
  return (
    <>
      {agent ? <AgentIcon icon={agent.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" /> : null}
      <span className="truncate">{option.label}</span>
    </>
  );
}

export function NewIssueAssignmentRows({
  agents,
  assigneeOptions,
  assigneeSelectorRef,
  assigneeValue,
  approverValue,
  currentAssignee,
  currentProject,
  participantMenuOpen,
  projectId,
  projectOptions,
  projectSelectorRef,
  projects,
  recentAssigneeOptionIds,
  recentProjectIds,
  reviewerValue,
  showApproverRow,
  showReviewerRow,
  onApproverChange,
  onApproverRowToggle,
  onAssigneeChange,
  onAssigneeConfirm,
  onParticipantMenuOpenChange,
  onProjectChange,
  onProjectConfirm,
  onReviewerChange,
  onReviewerRowToggle,
}: NewIssueAssignmentRowsProps) {
  return (
    <div className="px-4 pb-2">
      <div className="overflow-x-auto overscroll-x-contain">
        <div className="inline-flex flex-wrap items-center gap-2 text-sm text-muted-foreground sm:min-w-max sm:flex-nowrap">
          <span className="w-6 shrink-0 text-center">For</span>
          <InlineEntitySelector
            ref={assigneeSelectorRef}
            value={assigneeValue}
            options={assigneeOptions}
            recentOptionIds={recentAssigneeOptionIds}
            placeholder="Assignee"
            disablePortal
            noneLabel="No assignee"
            searchPlaceholder="Search assignees..."
            emptyMessage="No assignees found."
            onChange={onAssigneeChange}
            onConfirm={onAssigneeConfirm}
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
            renderOption={(option) => renderAgentOption(option, agents)}
          />
          <span>in</span>
          <InlineEntitySelector
            ref={projectSelectorRef}
            value={projectId}
            options={projectOptions}
            recentOptionIds={recentProjectIds}
            placeholder="Project"
            disablePortal
            noneLabel="No project"
            searchPlaceholder="Search projects..."
            emptyMessage="No projects found."
            onChange={onProjectChange}
            onConfirm={onProjectConfirm}
            renderTriggerValue={(option) =>
              option && currentProject ? (
                <>
                  <ProjectSwatch color={currentProject.color} />
                  <span className="truncate">{option.label}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Project</span>
              )
            }
            renderOption={(option) => {
              if (!option.id) return <span className="truncate">{option.label}</span>;
              const project = projects.find((item) => item.id === option.id);
              return (
                <>
                  <ProjectSwatch color={project?.color} />
                  <span className="truncate">{option.label}</span>
                </>
              );
            }}
          />
          <Popover open={participantMenuOpen} onOpenChange={onParticipantMenuOpenChange}>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="text-muted-foreground hover:bg-accent/50"
                title="Add reviewer or approver"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-44 p-1" align="start">
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn(
                  "w-full justify-start font-normal hover:bg-accent/50",
                  showReviewerRow && "bg-accent",
                )}
                onClick={onReviewerRowToggle}
              >
                <Eye className="h-3 w-3" />
                Reviewer
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className={cn(
                  "w-full justify-start font-normal hover:bg-accent/50",
                  showApproverRow && "bg-accent",
                )}
                onClick={onApproverRowToggle}
              >
                <ShieldCheck className="h-3 w-3" />
                Approver
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {showReviewerRow ? (
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex w-6 shrink-0 items-center justify-center"><Eye className="h-3.5 w-3.5" /></span>
          <InlineEntitySelector
            value={reviewerValue}
            options={assigneeOptions}
            recentOptionIds={recentAssigneeOptionIds}
            placeholder="Reviewer"
            disablePortal
            noneLabel="No reviewer"
            searchPlaceholder="Search reviewers..."
            emptyMessage="No reviewers found."
            onChange={onReviewerChange}
            renderTriggerValue={(option) => renderParticipantTrigger(option, agents, "Reviewer")}
            renderOption={(option) => renderAgentOption(option, agents)}
          />
        </div>
      ) : null}

      {showApproverRow ? (
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          <span className="flex w-6 shrink-0 items-center justify-center"><ShieldCheck className="h-3.5 w-3.5" /></span>
          <InlineEntitySelector
            value={approverValue}
            options={assigneeOptions}
            recentOptionIds={recentAssigneeOptionIds}
            placeholder="Approver"
            disablePortal
            noneLabel="No approver"
            searchPlaceholder="Search approvers..."
            emptyMessage="No approvers found."
            onChange={onApproverChange}
            renderTriggerValue={(option) => renderParticipantTrigger(option, agents, "Approver")}
            renderOption={(option) => renderAgentOption(option, agents)}
          />
        </div>
      ) : null}
    </div>
  );
}
