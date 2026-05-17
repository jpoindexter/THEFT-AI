import { ArrowUpDown, Check, Columns3, Layers, List, ListTree, Plus } from "lucide-react";
import { TheftSectionHeader, TheftSurface } from "@/components/theft";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { InboxIssueColumn } from "../../lib/inbox";
import { cn } from "../../lib/utils";
import { IssueColumnPicker } from "../IssueColumns";
import { IssueFiltersPopover } from "../IssueFiltersPopover";
import { IssueSearchInput } from "./IssueSearchInput";
import type { Agent, CreatorOption, IssueSortField, IssueViewState, ProjectOption } from "./types";

const sortOptions: Array<[IssueSortField, string]> = [
  ["workflow", "Workflow"],
  ["status", "Status"],
  ["priority", "Priority"],
  ["title", "Title"],
  ["created", "Created"],
  ["updated", "Updated"],
];

const groupOptions: Array<[IssueViewState["groupBy"], string]> = [
  ["status", "Status"],
  ["priority", "Priority"],
  ["assignee", "Assignee"],
  ["project", "Project"],
  ["workspace", "Workspace"],
  ["parent", "Parent Issue"],
  ["none", "None"],
];

export function IssuesListToolbar({
  filteredCount,
  loadedCount,
  createButtonLabel,
  issueSearch,
  onIssueSearchChange,
  onCreateIssue,
  viewState,
  updateView,
  availableIssueColumns,
  visibleIssueColumnSet,
  toggleIssueColumn,
  resetIssueColumns,
  activeFilterCount,
  agents,
  creators,
  projects,
  labels,
  currentUserId,
  enableRoutineVisibilityFilter,
  workspaces,
}: {
  filteredCount: number;
  loadedCount: number;
  createButtonLabel: string;
  issueSearch: string;
  onIssueSearchChange: (search: string) => void;
  onCreateIssue: () => void;
  viewState: IssueViewState;
  updateView: (patch: Partial<IssueViewState>) => void;
  availableIssueColumns: InboxIssueColumn[];
  visibleIssueColumnSet: ReadonlySet<InboxIssueColumn>;
  toggleIssueColumn: (column: InboxIssueColumn, enabled: boolean) => void;
  resetIssueColumns: () => void;
  activeFilterCount: number;
  agents?: Agent[];
  creators: CreatorOption[];
  projects?: ProjectOption[];
  labels?: Array<{ id: string; name: string; color: string }>;
  currentUserId: string | null;
  enableRoutineVisibilityFilter: boolean;
  workspaces?: Array<{ id: string; name: string }>;
}) {
  return (
    <TheftSurface tone="panel" padding="sm" className="space-y-3">
      <TheftSectionHeader
        eyebrow="Task controls"
        title="Queue filters"
        description={`${filteredCount.toLocaleString()} visible of ${loadedCount.toLocaleString()} loaded tasks`}
        actions={(
          <Button size="sm" variant="outline" onClick={onCreateIssue}>
            <Plus className="h-4 w-4 sm:mr-1" />
            <span className="hidden sm:inline">{createButtonLabel}</span>
          </Button>
        )}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <IssueSearchInput value={issueSearch} onDebouncedChange={onIssueSearchChange} />
        </div>

        <div className="flex max-w-full shrink-0 items-center gap-0.5 overflow-x-auto pb-1 sm:gap-1">
          <div className="mr-1 flex items-center overflow-hidden rounded-md border border-border">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={cn(
                "h-7 w-7 rounded-sm p-0",
                viewState.viewMode === "list" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => updateView({ viewMode: "list" })}
              title="List view"
            >
              <List className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className={cn(
                "h-7 w-7 rounded-sm p-0",
                viewState.viewMode === "board" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
              onClick={() => updateView({ viewMode: "board" })}
              title="Board view"
            >
              <Columns3 className="h-3.5 w-3.5" />
            </Button>
          </div>

          {viewState.viewMode === "list" && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              className={cn("hidden h-8 w-8 shrink-0 sm:inline-flex", viewState.nestingEnabled && "bg-accent")}
              onClick={() => updateView({ nestingEnabled: !viewState.nestingEnabled })}
              title={viewState.nestingEnabled ? "Disable parent-child nesting" : "Enable parent-child nesting"}
            >
              <ListTree className="h-3.5 w-3.5" />
            </Button>
          )}

          <IssueColumnPicker
            availableColumns={availableIssueColumns}
            visibleColumnSet={visibleIssueColumnSet}
            onToggleColumn={toggleIssueColumn}
            onResetColumns={resetIssueColumns}
            title="Choose which issue columns stay visible"
            iconOnly
          />

          <IssueFiltersPopover
            state={viewState}
            onChange={updateView}
            activeFilterCount={activeFilterCount}
            agents={agents}
            creators={creators}
            projects={projects?.map((project) => ({ id: project.id, name: project.name }))}
            labels={labels}
            currentUserId={currentUserId}
            enableRoutineVisibilityFilter={enableRoutineVisibilityFilter}
            iconOnly
            workspaces={workspaces}
          />

          {viewState.viewMode === "list" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" title="Sort">
                  <ArrowUpDown className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-48 p-0">
                <div className="p-2 space-y-0.5">
                  {sortOptions.map(([field, label]) => (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      key={field}
                      className={`h-auto w-full justify-between rounded-sm px-2 py-1.5 text-sm ${
                        viewState.sortField === field ? "bg-accent/50 text-foreground" : "hover:bg-accent/50 text-muted-foreground"
                      }`}
                      onClick={() => {
                        if (viewState.sortField === field) {
                          updateView({ sortDir: viewState.sortDir === "asc" ? "desc" : "asc" });
                        } else {
                          updateView({ sortField: field, sortDir: "asc" });
                        }
                      }}
                    >
                      <span>{label}</span>
                      {viewState.sortField === field && (
                        <span className="text-xs text-muted-foreground">
                          {viewState.sortDir === "asc" ? "\u2191" : "\u2193"}
                        </span>
                      )}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}

          {viewState.viewMode === "list" && (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" title="Group">
                  <Layers className="h-3.5 w-3.5" />
                </Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-44 p-0">
                <div className="p-2 space-y-0.5">
                  {groupOptions.map(([value, label]) => (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      key={value}
                      className={`h-auto w-full justify-between rounded-sm px-2 py-1.5 text-sm ${
                        viewState.groupBy === value ? "bg-accent/50 text-foreground" : "hover:bg-accent/50 text-muted-foreground"
                      }`}
                      onClick={() => updateView({ groupBy: value })}
                    >
                      <span>{label}</span>
                      {viewState.groupBy === value && <Check className="h-3.5 w-3.5" />}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </TheftSurface>
  );
}
