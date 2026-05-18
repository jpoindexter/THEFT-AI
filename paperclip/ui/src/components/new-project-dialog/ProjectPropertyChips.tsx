import type { Goal } from "@paperclipai/shared";
import { Calendar, Plus, Target, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "../../lib/utils";
import { StatusBadge } from "../StatusBadge";

const projectStatuses = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

interface ProjectPropertyChipsProps {
  status: string;
  setStatus: (status: string) => void;
  statusOpen: boolean;
  setStatusOpen: (open: boolean) => void;
  goalOpen: boolean;
  setGoalOpen: (open: boolean) => void;
  selectedGoals: Goal[];
  availableGoals: Goal[];
  setGoalIds: (updater: (prev: string[]) => string[]) => void;
  targetDate: string;
  setTargetDate: (targetDate: string) => void;
}

export function ProjectPropertyChips({
  status,
  setStatus,
  statusOpen,
  setStatusOpen,
  goalOpen,
  setGoalOpen,
  selectedGoals,
  availableGoals,
  setGoalIds,
  targetDate,
  setTargetDate,
}: ProjectPropertyChipsProps) {
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-2">
      <Popover open={statusOpen} onOpenChange={setStatusOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" size="xs" className="font-normal hover:bg-accent/50">
            <StatusBadge status={status} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          {projectStatuses.map((option) => (
            <Button
              key={option.value}
              variant="ghost"
              size="xs"
              className={cn(
                "w-full justify-start font-normal hover:bg-accent/50",
                option.value === status && "bg-accent",
              )}
              onClick={() => {
                setStatus(option.value);
                setStatusOpen(false);
              }}
            >
              {option.label}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      {selectedGoals.map((goal) => (
        <span
          key={goal.id}
          className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
        >
          <Target className="h-3 w-3 text-muted-foreground" />
          <span className="max-w-40 truncate">{goal.title}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            className="h-5 w-5 text-muted-foreground hover:text-foreground"
            onClick={() => setGoalIds((prev) => prev.filter((id) => id !== goal.id))}
            aria-label={`Remove goal ${goal.title}`}
          >
            <X className="h-3 w-3" />
          </Button>
        </span>
      ))}

      <Popover open={goalOpen} onOpenChange={setGoalOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            size="xs"
            className="font-normal hover:bg-accent/50"
            disabled={selectedGoals.length > 0 && availableGoals.length === 0}
          >
            {selectedGoals.length > 0 ? <Plus className="h-3 w-3 text-muted-foreground" /> : <Target className="h-3 w-3 text-muted-foreground" />}
            {selectedGoals.length > 0 ? "+ Goal" : "Goal"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-1" align="start">
          {selectedGoals.length === 0 && (
            <Button
              variant="ghost"
              size="xs"
              className="w-full justify-start font-normal text-muted-foreground hover:bg-accent/50"
              onClick={() => setGoalOpen(false)}
            >
              No goal
            </Button>
          )}
          {availableGoals.map((goal) => (
            <Button
              key={goal.id}
              variant="ghost"
              size="xs"
              className="w-full justify-start truncate font-normal hover:bg-accent/50"
              onClick={() => {
                setGoalIds((prev) => [...prev, goal.id]);
                setGoalOpen(false);
              }}
            >
              {goal.title}
            </Button>
          ))}
          {selectedGoals.length > 0 && availableGoals.length === 0 && (
            <div className="px-2 py-1.5 text-xs text-muted-foreground">
              All goals already selected.
            </div>
          )}
        </PopoverContent>
      </Popover>

      <div className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-xs">
        <Calendar className="h-3 w-3 text-muted-foreground" />
        <Input
          type="date"
          className="h-5 w-24 border-0 bg-transparent px-0 py-0 text-xs shadow-none focus-visible:ring-0"
          value={targetDate}
          onChange={(event) => setTargetDate(event.target.value)}
          placeholder="Target date"
        />
      </div>
    </div>
  );
}
