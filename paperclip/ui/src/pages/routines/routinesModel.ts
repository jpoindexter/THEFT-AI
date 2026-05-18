import type { RoutineListItem, RoutineVariable } from "@paperclipai/shared";
import { groupBy } from "@/lib/groupBy";

export const concurrencyPolicies = ["coalesce_if_active", "always_enqueue", "skip_if_active"];
export const catchUpPolicies = ["skip_missed", "enqueue_missed_with_cap"];

export const concurrencyPolicyDescriptions: Record<string, string> = {
  coalesce_if_active: "If a run is already active, keep just one follow-up run queued.",
  always_enqueue: "Queue every trigger occurrence, even if the routine is already running.",
  skip_if_active: "Drop new trigger occurrences while a run is still active.",
};

export const catchUpPolicyDescriptions: Record<string, string> = {
  skip_missed: "Ignore windows that were missed while the scheduler or routine was paused.",
  enqueue_missed_with_cap: "Catch up missed schedule windows in capped batches after recovery.",
};

export type RoutinesTab = "routines" | "runs";
export type RoutineGroupBy = "none" | "project" | "assignee";
export type RoutineSortField = "updated" | "created" | "title" | "lastRun";
export type RoutineSortDir = "asc" | "desc";

export type RoutineViewState = {
  sortField: RoutineSortField;
  sortDir: RoutineSortDir;
  groupBy: RoutineGroupBy;
  collapsedGroups: string[];
};

export type RoutineDraft = {
  title: string;
  description: string;
  projectId: string;
  assigneeAgentId: string;
  priority: string;
  concurrencyPolicy: string;
  catchUpPolicy: string;
  variables: RoutineVariable[];
};

export type RoutineGroup = {
  key: string;
  label: string | null;
  items: RoutineListItem[];
};

export const defaultRoutineDraft: RoutineDraft = {
  title: "",
  description: "",
  projectId: "",
  assigneeAgentId: "",
  priority: "medium",
  concurrencyPolicy: "coalesce_if_active",
  catchUpPolicy: "skip_missed",
  variables: [],
};

const defaultRoutineViewState: RoutineViewState = {
  sortField: "updated",
  sortDir: "desc",
  groupBy: "none",
  collapsedGroups: [],
};

export function autoResizeTextarea(element: HTMLTextAreaElement | null) {
  if (!element) return;
  element.style.height = "auto";
  element.style.height = `${element.scrollHeight}px`;
}

export function getRoutineViewState(key: string): RoutineViewState {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return { ...defaultRoutineViewState, ...JSON.parse(raw) };
  } catch {
    // Ignore malformed local state and fall back to defaults.
  }
  return { ...defaultRoutineViewState };
}

export function saveRoutineViewState(key: string, state: RoutineViewState) {
  localStorage.setItem(key, JSON.stringify(state));
}

export function buildRoutineMutationPayload(input: RoutineDraft) {
  return {
    ...input,
    description: input.description.trim() || null,
    projectId: input.projectId || null,
    assigneeAgentId: input.assigneeAgentId || null,
  };
}

export function buildRoutinesTabHref(tab: RoutinesTab) {
  return tab === "runs" ? "/routines?tab=runs" : "/routines";
}

export function buildRoutineGroups(
  routines: RoutineListItem[],
  groupByValue: RoutineGroupBy,
  projectById: Map<string, { name: string }>,
  agentById: Map<string, { name: string }>,
): RoutineGroup[] {
  if (groupByValue === "none") return [{ key: "__all", label: null, items: routines }];

  if (groupByValue === "project") {
    const groups = groupBy(routines, (routine) => routine.projectId ?? "__no_project");
    return Object.keys(groups)
      .sort((left, right) => getProjectLabel(left, projectById).localeCompare(getProjectLabel(right, projectById)))
      .map((key) => ({ key, label: getProjectLabel(key, projectById), items: groups[key]! }));
  }

  const groups = groupBy(routines, (routine) => routine.assigneeAgentId ?? "__unassigned");
  return Object.keys(groups)
    .sort((left, right) => getAgentLabel(left, agentById).localeCompare(getAgentLabel(right, agentById)))
    .map((key) => ({ key, label: getAgentLabel(key, agentById), items: groups[key]! }));
}

export function sortRoutines(
  routines: RoutineListItem[],
  sortField: RoutineSortField,
  sortDir: RoutineSortDir,
): RoutineListItem[] {
  const direction = sortDir === "asc" ? 1 : -1;
  return [...routines].sort((left, right) => {
    let result = 0;
    if (sortField === "title") result = compareNullableText(left.title, right.title);
    else if (sortField === "created") result = timestampValue(left.createdAt) - timestampValue(right.createdAt);
    else if (sortField === "lastRun") {
      result = timestampValue(left.lastRun?.triggeredAt ?? left.lastTriggeredAt) -
        timestampValue(right.lastRun?.triggeredAt ?? right.lastTriggeredAt);
    } else result = timestampValue(left.updatedAt) - timestampValue(right.updatedAt);

    if (result !== 0) return result * direction;
    return compareNullableText(left.title, right.title);
  });
}

function getProjectLabel(key: string, projectById: Map<string, { name: string }>) {
  return key === "__no_project" ? "No project" : (projectById.get(key)?.name ?? "Unknown project");
}

function getAgentLabel(key: string, agentById: Map<string, { name: string }>) {
  return key === "__unassigned" ? "Unassigned" : (agentById.get(key)?.name ?? "Unknown agent");
}

function timestampValue(value: Date | string | null | undefined) {
  if (!value) return Number.NEGATIVE_INFINITY;
  const timestamp = new Date(value).getTime();
  return Number.isFinite(timestamp) ? timestamp : Number.NEGATIVE_INFINITY;
}

function compareNullableText(left: string | null | undefined, right: string | null | undefined) {
  return (left ?? "").localeCompare(right ?? "", undefined, { sensitivity: "base" });
}
