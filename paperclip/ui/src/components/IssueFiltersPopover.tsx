import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Filter, HardDrive, User, X } from "lucide-react";
import { PriorityIcon } from "./PriorityIcon";
import { StatusIcon } from "./StatusIcon";
import {
  defaultIssueFilterState,
  issueFilterArraysEqual,
  issueFilterLabel,
  issuePriorityOrder,
  issueQuickFilterPresets,
  issueStatusOrder,
  toggleIssueFilterValue,
} from "../lib/issue-filters";
import { IssueFilterCreatorSection } from "./issue-filters-popover/IssueFilterCreatorSection";
import type { IssueFiltersPopoverProps } from "./issue-filters-popover/types";

export function IssueFiltersPopover({
  state,
  onChange,
  activeFilterCount,
  agents,
  projects,
  labels,
  currentUserId,
  enableRoutineVisibilityFilter = false,
  buttonVariant = "ghost",
  iconOnly = false,
  workspaces,
  creators,
}: IssueFiltersPopoverProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant={buttonVariant}
          size={iconOnly ? "icon" : "sm"}
          className={cn(
            "text-xs",
            iconOnly && "relative h-8 w-8 shrink-0",
            activeFilterCount > 0 && "text-primary",
          )}
          title={iconOnly ? (activeFilterCount > 0 ? `Filters: ${activeFilterCount}` : "Filter") : undefined}
        >
          <Filter className={iconOnly ? "h-3.5 w-3.5" : "h-3.5 w-3.5 sm:h-3 sm:w-3 sm:mr-1"} />
          {!iconOnly && <span className="hidden sm:inline">{activeFilterCount > 0 ? `Filters: ${activeFilterCount}` : "Filter"}</span>}
          {!iconOnly && activeFilterCount > 0 ? <span className="ml-0.5 text-nano font-medium sm:hidden">{activeFilterCount}</span> : null}
          {iconOnly && activeFilterCount > 0 ? <span className="absolute -right-1 -top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-badge font-bold text-primary-foreground">{activeFilterCount}</span> : null}
          {!iconOnly && activeFilterCount > 0 ? (
            <X
              className="ml-1 hidden h-3 w-3 sm:block"
              onClick={(event) => {
                event.stopPropagation();
                onChange(defaultIssueFilterState);
              }}
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        collisionPadding={16}
        className="w-(--radix-popover-content-available-width) max-w-3xl max-h-(--radix-popover-content-available-height) overflow-y-auto overscroll-contain p-0"
      >
        <div className="space-y-3 p-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Filters</span>
            {activeFilterCount > 0 ? (
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-auto px-0 py-0 text-xs text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={() => onChange(defaultIssueFilterState)}
              >
                Clear
              </Button>
            ) : null}
          </div>

          <div className="space-y-1.5">
            <span className="text-xs text-muted-foreground">Quick filters</span>
            <div className="flex flex-wrap gap-1.5">
              {issueQuickFilterPresets.map((preset) => {
                const isActive = issueFilterArraysEqual(state.statuses, preset.statuses);
                return (
                  <Button
                    key={preset.label}
                    type="button"
                    variant={isActive ? "default" : "outline"}
                    size="xs"
                    className={cn(
                      "rounded-full text-xs",
                      !isActive && "text-muted-foreground hover:text-foreground",
                    )}
                    onClick={() => onChange({ statuses: isActive ? [] : [...preset.statuses] })}
                  >
                    {preset.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="border-t border-border" />

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="min-w-0 space-y-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Status</span>
                <div className="space-y-0.5">
                  {issueStatusOrder.map((status) => (
                    <label key={status} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                      <Checkbox
                        checked={state.statuses.includes(status)}
                        onCheckedChange={() => onChange({ statuses: toggleIssueFilterValue(state.statuses, status) })}
                      />
                      <StatusIcon status={status} />
                      <span className="text-sm">{issueFilterLabel(status)}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Priority</span>
                <div className="space-y-0.5">
                  {issuePriorityOrder.map((priority) => (
                    <label key={priority} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                      <Checkbox
                        checked={state.priorities.includes(priority)}
                        onCheckedChange={() => onChange({ priorities: toggleIssueFilterValue(state.priorities, priority) })}
                      />
                      <PriorityIcon priority={priority} />
                      <span className="text-sm">{issueFilterLabel(priority)}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="min-w-0 space-y-3">
              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Assignee</span>
                <div className="max-h-32 space-y-0.5 overflow-y-auto">
                  <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                    <Checkbox
                      checked={state.assignees.includes("__unassigned")}
                      onCheckedChange={() => onChange({ assignees: toggleIssueFilterValue(state.assignees, "__unassigned") })}
                    />
                    <span className="text-sm">No assignee</span>
                  </label>
                  {currentUserId ? (
                    <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                      <Checkbox
                        checked={state.assignees.includes("__me")}
                        onCheckedChange={() => onChange({ assignees: toggleIssueFilterValue(state.assignees, "__me") })}
                      />
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-sm">Me</span>
                    </label>
                  ) : null}
                  {(agents ?? []).map((agent) => (
                    <label key={agent.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                      <Checkbox
                        checked={state.assignees.includes(agent.id)}
                        onCheckedChange={() => onChange({ assignees: toggleIssueFilterValue(state.assignees, agent.id) })}
                      />
                      <span className="text-sm">{agent.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <IssueFilterCreatorSection
                creators={creators}
                currentUserId={currentUserId}
                selectedCreatorIds={state.creators}
                onChange={(nextCreators) => onChange({ creators: nextCreators })}
              />

              {projects && projects.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Project</span>
                  <div className="max-h-32 space-y-0.5 overflow-y-auto">
                    {projects.map((project) => (
                      <label key={project.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                        <Checkbox
                          checked={state.projects.includes(project.id)}
                          onCheckedChange={() => onChange({ projects: toggleIssueFilterValue(state.projects, project.id) })}
                        />
                        <span className="text-sm">{project.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="min-w-0 space-y-3">
              {labels && labels.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Labels</span>
                  <div className="max-h-32 space-y-0.5 overflow-y-auto">
                    {labels.map((label) => (
                      <label key={label.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                        <Checkbox
                          checked={state.labels.includes(label.id)}
                          onCheckedChange={() => onChange({ labels: toggleIssueFilterValue(state.labels, label.id) })}
                        />
                        {/* Runtime label colors are user/workspace data, so the swatch keeps a dynamic style. */}
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: label.color }} />
                        <span className="text-sm">{label.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              {workspaces && workspaces.length > 0 ? (
                <div className="space-y-1">
                  <span className="text-xs text-muted-foreground">Workspace</span>
                  <div className="max-h-32 space-y-0.5 overflow-y-auto">
                    {workspaces.map((workspace) => (
                      <label key={workspace.id} className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                        <Checkbox
                          checked={state.workspaces.includes(workspace.id)}
                          onCheckedChange={() => onChange({ workspaces: toggleIssueFilterValue(state.workspaces, workspace.id) })}
                        />
                        <HardDrive className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-sm">{workspace.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="space-y-1">
                <span className="text-xs text-muted-foreground">Visibility</span>
                <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                  <Checkbox
                    checked={state.liveOnly}
                    onCheckedChange={(checked) => onChange({ liveOnly: checked === true })}
                  />
                  <span className="text-sm">Live runs only</span>
                </label>
                {enableRoutineVisibilityFilter ? (
                  <label className="flex cursor-pointer items-center gap-2 rounded-sm px-2 py-1 hover:bg-accent/50">
                    <Checkbox
                      checked={state.hideRoutineExecutions}
                      onCheckedChange={(checked) => onChange({ hideRoutineExecutions: checked === true })}
                    />
                    <span className="text-sm">Hide routine runs</span>
                  </label>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
