import type {
  RoutineRevision,
  RoutineRevisionSnapshotTriggerV1,
  RoutineVariable,
} from "@paperclipai/shared";
import type {
  RoutineHistoryAgentLookup,
  RoutineHistoryProjectLookup,
} from "./routineHistoryTypes";

export function getActorLabel(revision: RoutineRevision): string {
  if (revision.createdByUserId) return "board";
  if (revision.createdByAgentId) return "agent";
  return "system";
}

export function resolveAgentName(agentId: string | null, lookup: RoutineHistoryAgentLookup) {
  if (!agentId) return "Unassigned";
  return lookup.get(agentId)?.name ?? agentId;
}

export function resolveProjectName(projectId: string | null, lookup: RoutineHistoryProjectLookup) {
  if (!projectId) return "No project";
  return lookup.get(projectId)?.name ?? projectId;
}

export function summarizeTriggerSnapshot(trigger: RoutineRevisionSnapshotTriggerV1): string {
  if (trigger.kind === "schedule") {
    return [trigger.cronExpression, trigger.timezone].filter(Boolean).join(" · ");
  }
  if (trigger.kind === "webhook") {
    const replay = trigger.replayWindowSec != null ? `replay ${trigger.replayWindowSec}s` : "";
    return [trigger.signingMode, replay].filter(Boolean).join(" · ");
  }
  return "API";
}

export function formatVariableDefault(variable: RoutineVariable): string {
  if (variable.defaultValue == null) return "—";
  return String(variable.defaultValue);
}

export function collectWebhookTriggerDifferences(
  target: RoutineRevision,
  current: RoutineRevision,
): string[] {
  const currentIds = new Set(current.snapshot.triggers.map((trigger) => trigger.id));
  return target.snapshot.triggers
    .filter((trigger) => trigger.kind === "webhook" && !currentIds.has(trigger.id))
    .map((trigger) => trigger.label ?? "webhook");
}
