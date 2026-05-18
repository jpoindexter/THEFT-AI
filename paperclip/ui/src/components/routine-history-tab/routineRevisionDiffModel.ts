import type {
  RoutineRevision,
  RoutineRevisionSnapshotTriggerV1,
  RoutineVariable,
} from "@paperclipai/shared";

export type AgentLookup = Map<string, { id: string; name: string }>;
export type ProjectLookup = Map<string, { id: string; name: string }>;

function resolveAgentName(agentId: string | null, lookup: AgentLookup) {
  if (!agentId) return "Unassigned";
  return lookup.get(agentId)?.name ?? agentId;
}

function resolveProjectName(projectId: string | null, lookup: ProjectLookup) {
  if (!projectId) return "No project";
  return lookup.get(projectId)?.name ?? projectId;
}

function summarizeTriggerSnapshot(trigger: RoutineRevisionSnapshotTriggerV1): string {
  if (trigger.kind === "schedule") {
    return [trigger.cronExpression, trigger.timezone].filter(Boolean).join(" · ");
  }
  if (trigger.kind === "webhook") {
    const replay = trigger.replayWindowSec != null ? `replay ${trigger.replayWindowSec}s` : "";
    return [trigger.signingMode, replay].filter(Boolean).join(" · ");
  }
  return "API";
}

function formatVariableDefault(variable: RoutineVariable): string {
  if (variable.defaultValue == null) return "-";
  return String(variable.defaultValue);
}

function describeSnapshotField(value: unknown): string {
  if (value == null) return "-";
  if (typeof value === "string") return value;
  return JSON.stringify(value);
}

export function computeFieldChanges(
  left: RoutineRevision,
  right: RoutineRevision,
  agents: AgentLookup,
  projects: ProjectLookup,
): Array<{ field: string; oldValue: string | null; newValue: string | null }> {
  const oldRoutine = left.snapshot.routine;
  const newRoutine = right.snapshot.routine;
  const changes: Array<{ field: string; oldValue: string | null; newValue: string | null }> = [];
  const compareScalar = (
    label: string,
    oldVal: unknown,
    newVal: unknown,
    transform: (value: unknown) => string = describeSnapshotField,
  ) => {
    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changes.push({ field: label, oldValue: transform(oldVal), newValue: transform(newVal) });
    }
  };
  compareScalar("Title", oldRoutine.title, newRoutine.title);
  compareScalar("Priority", oldRoutine.priority, newRoutine.priority);
  compareScalar(
    "Default agent",
    resolveAgentName(oldRoutine.assigneeAgentId, agents),
    resolveAgentName(newRoutine.assigneeAgentId, agents),
  );
  compareScalar(
    "Project",
    resolveProjectName(oldRoutine.projectId, projects),
    resolveProjectName(newRoutine.projectId, projects),
  );
  compareScalar("Concurrency", oldRoutine.concurrencyPolicy, newRoutine.concurrencyPolicy);
  compareScalar("Catch-up", oldRoutine.catchUpPolicy, newRoutine.catchUpPolicy);
  compareScalar("Status", oldRoutine.status, newRoutine.status);
  if (JSON.stringify(oldRoutine.variables) !== JSON.stringify(newRoutine.variables)) {
    changes.push({
      field: "Variables",
      oldValue: summarizeVariables(oldRoutine.variables),
      newValue: summarizeVariables(newRoutine.variables),
    });
  }
  compareTriggers(left.snapshot.triggers, right.snapshot.triggers, changes);
  return changes;
}

function summarizeVariables(variables: RoutineVariable[]): string {
  if (variables.length === 0) return "(none)";
  return variables
    .map((variable) => `${variable.name}=${formatVariableDefault(variable)}`)
    .join(", ");
}

function compareTriggers(
  oldTriggers: RoutineRevisionSnapshotTriggerV1[],
  newTriggers: RoutineRevisionSnapshotTriggerV1[],
  changes: Array<{ field: string; oldValue: string | null; newValue: string | null }>,
) {
  const byId = new Map<string, { old?: RoutineRevisionSnapshotTriggerV1; next?: RoutineRevisionSnapshotTriggerV1 }>();
  for (const trigger of oldTriggers) byId.set(trigger.id, { old: trigger });
  for (const trigger of newTriggers) {
    const existing = byId.get(trigger.id) ?? {};
    byId.set(trigger.id, { ...existing, next: trigger });
  }
  for (const [, pair] of byId) {
    if (pair.old && !pair.next) {
      changes.push({
        field: `Trigger removed (${pair.old.label ?? pair.old.kind})`,
        oldValue: summarizeTriggerSnapshot(pair.old),
        newValue: null,
      });
    } else if (!pair.old && pair.next) {
      changes.push({
        field: `Trigger added (${pair.next.label ?? pair.next.kind})`,
        oldValue: null,
        newValue: summarizeTriggerSnapshot(pair.next),
      });
    } else if (pair.old && pair.next) {
      const oldSummary = summarizeTriggerSnapshot(pair.old);
      const newSummary = summarizeTriggerSnapshot(pair.next);
      if (oldSummary !== newSummary || pair.old.enabled !== pair.next.enabled) {
        changes.push({
          field: `Trigger ${pair.next.label ?? pair.next.kind}`,
          oldValue: `${oldSummary} (${pair.old.enabled ? "enabled" : "disabled"})`,
          newValue: `${newSummary} (${pair.next.enabled ? "enabled" : "disabled"})`,
        });
      }
    }
  }
}
