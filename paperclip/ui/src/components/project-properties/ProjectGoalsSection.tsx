import { useState } from "react";
import type { Goal, Project } from "@paperclipai/shared";
import { Plus, X } from "lucide-react";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "../../lib/utils";
import type { ProjectConfigFieldKey, ProjectFieldSaveState } from "./ProjectPropertiesTypes";
import { FieldLabel, PropertyRow } from "./ProjectPropertyPrimitives";

interface ProjectGoalsSectionProps {
  project: Project;
  allGoals?: Goal[];
  canEdit: boolean;
  commitField: (field: ProjectConfigFieldKey, data: Record<string, unknown>) => void;
  fieldState: (field: ProjectConfigFieldKey) => ProjectFieldSaveState;
}

export function ProjectGoalsSection({
  project,
  allGoals,
  canEdit,
  commitField,
  fieldState,
}: ProjectGoalsSectionProps) {
  const [goalOpen, setGoalOpen] = useState(false);

  const linkedGoalIds = project.goalIds.length > 0
    ? project.goalIds
    : project.goalId
      ? [project.goalId]
      : [];

  const linkedGoals = project.goals.length > 0
    ? project.goals
    : linkedGoalIds.map((id) => ({
        id,
        title: allGoals?.find((goal) => goal.id === id)?.title ?? id.slice(0, 8),
      }));

  const availableGoals = (allGoals ?? []).filter((goal) => !linkedGoalIds.includes(goal.id));

  const removeGoal = (goalId: string) => {
    if (!canEdit) return;
    commitField("goals", { goalIds: linkedGoalIds.filter((id) => id !== goalId) });
  };

  const addGoal = (goalId: string) => {
    if (!canEdit || linkedGoalIds.includes(goalId)) return;
    commitField("goals", { goalIds: [...linkedGoalIds, goalId] });
    setGoalOpen(false);
  };

  return (
    <PropertyRow
      label={<FieldLabel label="Goals" state={fieldState("goals")} />}
      alignStart
      valueClassName="space-y-2"
    >
      {linkedGoals.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {linkedGoals.map((goal) => (
            <span
              key={goal.id}
              className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs"
            >
              <Link to={`/goals/${goal.id}`} className="hover:underline break-words min-w-0">
                {goal.title}
              </Link>
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="h-5 w-5 text-muted-foreground hover:text-foreground"
                  type="button"
                  onClick={() => removeGoal(goal.id)}
                  aria-label={`Remove goal ${goal.title}`}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </span>
          ))}
        </div>
      )}
      {canEdit && (
        <Popover open={goalOpen} onOpenChange={setGoalOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="xs"
              className={cn("h-6 w-fit px-2", linkedGoals.length > 0 && "ml-1")}
              disabled={availableGoals.length === 0}
            >
              <Plus className="h-3 w-3 mr-1" />
              Goal
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-1" align="start">
            {availableGoals.length === 0 ? (
              <div className="px-2 py-1.5 text-xs text-muted-foreground">
                All goals linked.
              </div>
            ) : (
              availableGoals.map((goal) => (
                <Button
                  key={goal.id}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start rounded px-2 py-1.5 text-xs"
                  onClick={() => addGoal(goal.id)}
                >
                  {goal.title}
                </Button>
              ))
            )}
          </PopoverContent>
        </Popover>
      )}
    </PropertyRow>
  );
}
