import { ChevronRight, Repeat } from "lucide-react";
import type { Agent, Project, RoutineListItem } from "@paperclipai/shared";
import { EmptyState } from "@/components/EmptyState";
import { RoutineListRow } from "@/components/RoutineList";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { RoutineGroup, RoutineViewState } from "./routinesModel";

export function RoutinesGroupedList({
  routineCount,
  routineGroups,
  routineViewState,
  projectById,
  agentById,
  runningRoutineId,
  statusMutationRoutineId,
  onChangeView,
  onRunNow,
  onToggleEnabled,
  onToggleArchived,
}: {
  routineCount: number;
  routineGroups: RoutineGroup[];
  routineViewState: RoutineViewState;
  projectById: Map<string, Project>;
  agentById: Map<string, Agent>;
  runningRoutineId: string | null;
  statusMutationRoutineId: string | null;
  onChangeView: (patch: Partial<RoutineViewState>) => void;
  onRunNow: (routine: RoutineListItem) => void;
  onToggleEnabled: (routine: RoutineListItem, enabled: boolean) => void;
  onToggleArchived: (routine: RoutineListItem) => void;
}) {
  if (routineCount === 0) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Repeat}
          message="No routines yet. Use Create routine to define the first recurring workflow."
        />
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border">
      {routineGroups.map((group) => (
        <Collapsible
          key={group.key}
          open={!routineViewState.collapsedGroups.includes(group.key)}
          onOpenChange={(open) => {
            onChangeView({
              collapsedGroups: open
                ? routineViewState.collapsedGroups.filter((item) => item !== group.key)
                : [...routineViewState.collapsedGroups, group.key],
            });
          }}
        >
          {group.label ? <RoutineGroupHeader group={group} /> : null}
          <CollapsibleContent>
            {group.items.map((routine) => (
              <RoutineListRow
                key={routine.id}
                routine={routine}
                projectById={projectById}
                agentById={agentById}
                runningRoutineId={runningRoutineId}
                statusMutationRoutineId={statusMutationRoutineId}
                href={`/routines/${routine.id}`}
                onRunNow={onRunNow}
                onToggleEnabled={onToggleEnabled}
                onToggleArchived={onToggleArchived}
              />
            ))}
          </CollapsibleContent>
        </Collapsible>
      ))}
    </div>
  );
}

function RoutineGroupHeader({ group }: { group: RoutineGroup }) {
  return (
    <div className="flex items-center gap-2 border-b border-border px-3 py-2">
      <CollapsibleTrigger className="flex items-center gap-1.5">
        <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90" />
        <span className="text-sm font-semibold uppercase tracking-wide">{group.label}</span>
      </CollapsibleTrigger>
      <span className="text-xs text-muted-foreground">{group.items.length}</span>
    </div>
  );
}
