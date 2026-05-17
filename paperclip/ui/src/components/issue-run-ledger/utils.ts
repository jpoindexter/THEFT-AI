import type { Issue, Agent } from "@paperclipai/shared";

import type { CurrentBoardAccess } from "@/api/access";
import type { RunForIssue } from "@/api/activity";
import { ApiError } from "@/api/client";
import type { ActiveRunForIssue, LiveRunForIssue } from "@/api/heartbeats";
import { relativeTime } from "@/lib/utils";
import {
  ACTIVE_RUN_STATUSES,
  LIVENESS_COPY,
  MISSING_LIVENESS_COPY,
  PENDING_LIVENESS_COPY,
  RETRY_PENDING_LIVENESS_COPY,
  TERMINAL_CHILD_STATUSES,
} from "./constants";
import type { ChildIssueSummary, LedgerRun, ModelProfileSummary } from "./types";

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : null;
}

export function modelProfileForRun(run: RunForIssue): ModelProfileSummary | null {
  const result = asRecord(run.resultJson);
  const profile = asRecord(result?.modelProfile);
  if (!profile) return null;
  const requested = readString(profile.requested);
  if (!requested) return null;
  return {
    requested,
    applied: readString(profile.applied),
    configSource: readString(profile.configSource),
    fallbackReason: readString(profile.fallbackReason),
  };
}

export function modelProfileBadgeTone(summary: ModelProfileSummary) {
  if (summary.applied === summary.requested) {
    return "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300";
  }
  if (summary.fallbackReason) {
    return "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300";
  }
  return "border-border bg-background text-muted-foreground";
}

export function modelProfileTitle(summary: ModelProfileSummary) {
  const lines = [`Requested: ${summary.requested}`];
  if (summary.applied) lines.push(`Applied: ${summary.applied}`);
  if (summary.configSource) lines.push(`Source: ${summary.configSource}`);
  if (summary.fallbackReason) lines.push(`Fallback: ${summary.fallbackReason}`);
  return lines.join("\n");
}

function readNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function formatDuration(start: string | Date | null | undefined, end: string | Date | null | undefined) {
  if (!start) return null;
  const startMs = new Date(start).getTime();
  const endMs = end ? new Date(end).getTime() : Date.now();
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return null;
  const totalSeconds = Math.max(0, Math.round((endMs - startMs) / 1000));
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes < 60) return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function toIsoString(value: string | Date | null | undefined) {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : value;
}

function liveRunToLedgerRun(run: LiveRunForIssue | ActiveRunForIssue): LedgerRun {
  return {
    runId: run.id,
    status: run.status,
    agentId: run.agentId,
    agentName: run.agentName,
    adapterType: run.adapterType,
    startedAt: toIsoString(run.startedAt),
    finishedAt: toIsoString(run.finishedAt),
    createdAt: toIsoString(run.createdAt) ?? new Date().toISOString(),
    invocationSource: run.invocationSource,
    usageJson: null,
    resultJson: null,
    isLive: run.status === "queued" || run.status === "running",
    outputSilence: run.outputSilence,
  };
}

export function mergeRuns(
  runs: RunForIssue[],
  liveRuns: LiveRunForIssue[] | undefined,
  activeRun: ActiveRunForIssue | null | undefined,
) {
  const byId = new Map<string, LedgerRun>();
  for (const run of runs) byId.set(run.runId, run);
  for (const run of liveRuns ?? []) {
    const existing = byId.get(run.id);
    byId.set(
      run.id,
      existing
        ? { ...existing, isLive: true, agentName: run.agentName, outputSilence: run.outputSilence }
        : liveRunToLedgerRun(run),
    );
  }
  if (activeRun) {
    const existing = byId.get(activeRun.id);
    if (existing) {
      byId.set(activeRun.id, {
        ...existing,
        isLive: isActiveRun(existing) || isActiveRun(activeRun),
        agentName: activeRun.agentName,
        outputSilence: activeRun.outputSilence,
      });
    } else {
      byId.set(activeRun.id, liveRunToLedgerRun(activeRun));
    }
  }

  return [...byId.values()].sort((a, b) => {
    const aTime = new Date(a.startedAt ?? a.createdAt).getTime();
    const bTime = new Date(b.startedAt ?? b.createdAt).getTime();
    if (aTime !== bTime) return bTime - aTime;
    return b.runId.localeCompare(a.runId);
  });
}

export function statusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function isActiveRun(run: Pick<LedgerRun, "status" | "isLive">) {
  return run.isLive || ACTIVE_RUN_STATUSES.has(run.status);
}

export function runSummary(run: LedgerRun, agentMap: ReadonlyMap<string, Pick<Agent, "name">>) {
  const agentName = compactAgentName(run, agentMap);
  if (run.status === "running") return `Running now by ${agentName}`;
  if (run.status === "queued") return `Queued for ${agentName}`;
  if (run.status === "scheduled_retry") return `Automatic retry scheduled for ${agentName}`;
  return `${statusLabel(run.status)} by ${agentName}`;
}

export function livenessCopyForRun(run: LedgerRun) {
  if (run.status === "scheduled_retry") return RETRY_PENDING_LIVENESS_COPY;
  if (run.livenessState) return LIVENESS_COPY[run.livenessState];
  return isActiveRun(run) ? PENDING_LIVENESS_COPY : MISSING_LIVENESS_COPY;
}

export function stopReasonLabel(run: RunForIssue) {
  const result = asRecord(run.resultJson);
  const stopReason = readString(result?.stopReason);
  const timeoutFired = result?.timeoutFired === true;
  const effectiveTimeoutSec = readNumber(result?.effectiveTimeoutSec);
  const timeoutText =
    effectiveTimeoutSec && effectiveTimeoutSec > 0 ? `${effectiveTimeoutSec}s timeout` : null;

  if (timeoutFired || stopReason === "timeout") {
    return timeoutText ? `timeout (${timeoutText})` : "timeout";
  }
  if (stopReason === "max_turns_exhausted" || stopReason === "turn_limit_exhausted") return "max turns exhausted";
  if (stopReason === "budget_paused") return "budget paused";
  if (stopReason === "cancelled") return "cancelled";
  if (stopReason === "paused") return "paused by board";
  if (stopReason === "process_lost") return "process lost";
  if (stopReason === "adapter_failed") return "adapter failed";
  if (stopReason === "completed") return timeoutText ? `completed (${timeoutText})` : "completed";
  return timeoutText;
}

export function stopStatusLabel(run: LedgerRun, stopReason: string | null) {
  if (stopReason) return stopReason;
  if (run.status === "scheduled_retry") return "Retry pending";
  if (run.status === "queued") return "Waiting to start";
  if (run.status === "running") return "Still running";
  if (!run.livenessState) return "Unavailable";
  return "No stop reason";
}

export function lastUsefulActionLabel(run: LedgerRun) {
  if (run.status === "scheduled_retry") return "Waiting for next attempt";
  if (run.lastUsefulActionAt) return relativeTime(run.lastUsefulActionAt);
  if (isActiveRun(run)) return "No action recorded yet";
  if (run.livenessState === "plan_only" || run.livenessState === "needs_followup") {
    return "No concrete action";
  }
  if (run.livenessState === "empty_response") return "No useful output";
  if (!run.livenessState) return "Unavailable";
  return "None recorded";
}

export function continuationLabel(run: LedgerRun) {
  if (!run.continuationAttempt || run.continuationAttempt <= 0) return null;
  return `Continuation attempt ${run.continuationAttempt}`;
}

export function hasExhaustedContinuation(run: RunForIssue) {
  return /continuation attempts exhausted/i.test(run.livenessReason ?? "");
}

export function childIssueSummary(childIssues: Issue[]): ChildIssueSummary {
  const active = childIssues.filter((issue) => !TERMINAL_CHILD_STATUSES.has(issue.status));
  const done = childIssues.filter((issue) => issue.status === "done").length;
  const cancelled = childIssues.filter((issue) => issue.status === "cancelled").length;
  return { active, done, cancelled, total: childIssues.length };
}

export function compactAgentName(run: LedgerRun, agentMap: ReadonlyMap<string, Pick<Agent, "name">>) {
  return run.agentName ?? agentMap.get(run.agentId)?.name ?? run.agentId.slice(0, 8);
}

export function formatSilenceAge(ms: number | null | undefined) {
  if (!ms || ms <= 0) return null;
  const totalMinutes = Math.floor(ms / 60_000);
  if (totalMinutes < 1) return "under 1 minute";
  if (totalMinutes < 60) return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) return `${hours} hour${hours === 1 ? "" : "s"}`;
  return `${hours}h ${minutes}m`;
}

export function canBoardRecordWatchdogDecision(
  companyId: string,
  boardAccess: CurrentBoardAccess | undefined,
) {
  if (!boardAccess) return false;
  if (boardAccess.source === "local_implicit" || boardAccess.isInstanceAdmin) return true;

  const membership = boardAccess.memberships?.find(
    (item) => item.companyId === companyId && item.status === "active",
  );
  if (!membership) return boardAccess.companyIds.includes(companyId) && !boardAccess.memberships;
  return membership.membershipRole !== "viewer" && membership.membershipRole !== null;
}

export function watchdogDecisionErrorMessage(error: unknown) {
  if (error instanceof ApiError && error.status === 403) {
    return "Only the board or the assigned recovery owner can record watchdog decisions";
  }
  return error instanceof Error && error.message.trim().length > 0
    ? error.message
    : "Paperclip could not record the watchdog decision.";
}
