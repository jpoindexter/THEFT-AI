import type { ReactNode } from "react";
import { ArrowUpDown, Check, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { RoutineGroupBy, RoutineSortField, RoutineViewState } from "./routinesModel";

export function RoutinesListControls({
  routineCount,
  viewState,
  onChangeView,
}: {
  routineCount: number;
  viewState: RoutineViewState;
  onChangeView: (patch: Partial<RoutineViewState>) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <p className="text-sm text-muted-foreground">
        {routineCount} routine{routineCount === 1 ? "" : "s"}
      </p>
      <div className="flex items-center gap-1">
        <RoutineSortMenu viewState={viewState} onChangeView={onChangeView} />
        <RoutineGroupMenu viewState={viewState} onChangeView={onChangeView} />
      </div>
    </div>
  );
}

function RoutineSortMenu({
  viewState,
  onChangeView,
}: {
  viewState: RoutineViewState;
  onChangeView: (patch: Partial<RoutineViewState>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs" title="Sort">
          <ArrowUpDown className="h-3.5 w-3.5 sm:mr-1 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">Sort</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <div className="space-y-0.5 p-2">
          {([
            ["updated", "Updated"],
            ["created", "Created"],
            ["lastRun", "Last run"],
            ["title", "Title"],
          ] as const).map(([field, label]) => (
            <ViewMenuButton
              key={field}
              active={viewState.sortField === field}
              label={label}
              value={viewState.sortField === field ? (viewState.sortDir === "asc" ? "Asc" : "Desc") : null}
              onClick={() => {
                onChangeView(
                  viewState.sortField === field
                    ? { sortDir: viewState.sortDir === "asc" ? "desc" : "asc" }
                    : { sortField: field as RoutineSortField, sortDir: field === "title" ? "asc" : "desc" },
                );
              }}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function RoutineGroupMenu({
  viewState,
  onChangeView,
}: {
  viewState: RoutineViewState;
  onChangeView: (patch: Partial<RoutineViewState>) => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="text-xs" title="Group">
          <Layers className="h-3.5 w-3.5 sm:mr-1 sm:h-3 sm:w-3" />
          <span className="hidden sm:inline">Group</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-44 p-0">
        <div className="space-y-0.5 p-2">
          {([
            ["project", "Project"],
            ["assignee", "Agent"],
            ["none", "None"],
          ] as const).map(([value, label]) => (
            <ViewMenuButton
              key={value}
              active={viewState.groupBy === value}
              label={label}
              value={viewState.groupBy === value ? <Check className="h-3.5 w-3.5" /> : null}
              onClick={() => onChangeView({ groupBy: value as RoutineGroupBy, collapsedGroups: [] })}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

function ViewMenuButton({
  active,
  label,
  value,
  onClick,
}: {
  active: boolean;
  label: string;
  value: ReactNode;
  onClick: () => void;
}) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={`h-auto w-full justify-between rounded-sm px-2 py-1.5 text-sm ${
        active ? "bg-accent/50 text-foreground" : "text-muted-foreground hover:bg-accent/50"
      }`}
      onClick={onClick}
    >
      <span>{label}</span>
      {value ? <span className="text-xs text-muted-foreground">{value}</span> : null}
    </Button>
  );
}
