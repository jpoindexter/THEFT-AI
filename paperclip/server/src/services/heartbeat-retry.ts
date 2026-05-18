import { heartbeatRuns } from "@paperclipai/db";
import { parseObject } from "../adapters/utils.js";
import { normalizeMaxTurnStopReason } from "./heartbeat-stop-metadata.js";

export const BOUNDED_TRANSIENT_HEARTBEAT_RETRY_DELAYS_MS = [
  2 * 60 * 1000,
  10 * 60 * 1000,
  30 * 60 * 1000,
  2 * 60 * 60 * 1000,
] as const;
const BOUNDED_TRANSIENT_HEARTBEAT_RETRY_JITTER_RATIO = 0.25;
export const BOUNDED_TRANSIENT_HEARTBEAT_RETRY_REASON = "transient_failure";
export const BOUNDED_TRANSIENT_HEARTBEAT_RETRY_WAKE_REASON = "transient_failure_retry";
export const BOUNDED_TRANSIENT_HEARTBEAT_RETRY_MAX_ATTEMPTS =
  BOUNDED_TRANSIENT_HEARTBEAT_RETRY_DELAYS_MS.length;

export const MAX_TURN_CONTINUATION_RETRY_REASON = "max_turns_continuation";
export const MAX_TURN_CONTINUATION_WAKE_REASON = "max_turns_continuation_retry";
export const MAX_TURN_CONTINUATION_DEFAULT_MAX_ATTEMPTS = 2;
export const MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP = 10;
export const MAX_TURN_CONTINUATION_DEFAULT_DELAY_MS = 1_000;
export const MAX_TURN_CONTINUATION_MAX_DELAY_MS = 5 * 60 * 1000;
export const MAX_TURN_CONTINUATION_LIVE_RUN_STATUSES = ["scheduled_retry", "queued", "running"] as const;

export type CodexTransientFallbackMode =
  | "same_session"
  | "safer_invocation"
  | "fresh_session"
  | "fresh_session_safer_invocation";

export interface MaxTurnContinuationPolicy {
  enabled: boolean;
  maxAttempts: number;
  delayMs: number;
}

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function resolveCodexTransientFallbackMode(attempt: number): CodexTransientFallbackMode {
  if (attempt <= 1) return "same_session";
  if (attempt === 2) return "safer_invocation";
  if (attempt === 3) return "fresh_session";
  return "fresh_session_safer_invocation";
}

function readHeartbeatRunErrorFamily(
  run: Pick<typeof heartbeatRuns.$inferSelect, "errorCode" | "resultJson">,
) {
  const resultJson = parseObject(run.resultJson);
  const persistedFamily = readNonEmptyString(resultJson.errorFamily);
  if (persistedFamily) return persistedFamily;

  if (run.errorCode === "codex_transient_upstream" || run.errorCode === "claude_transient_upstream") {
    return "transient_upstream";
  }
  return null;
}

export function isMaxTurnExhaustionRun(
  run: Pick<typeof heartbeatRuns.$inferSelect, "errorCode" | "resultJson">,
) {
  const resultJson = parseObject(run.resultJson);
  return Boolean(
    normalizeMaxTurnStopReason(resultJson.stopReason) ??
      normalizeMaxTurnStopReason(run.errorCode),
  );
}

function readTransientRetryNotBeforeFromRun(run: Pick<typeof heartbeatRuns.$inferSelect, "resultJson">) {
  const resultJson = parseObject(run.resultJson);
  const value = resultJson.retryNotBefore ?? resultJson.transientRetryNotBefore;
  if (!(typeof value === "string" || typeof value === "number" || value instanceof Date)) {
    return null;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function readTransientRecoveryContractFromRun(
  run: Pick<typeof heartbeatRuns.$inferSelect, "errorCode" | "resultJson">,
) {
  return readHeartbeatRunErrorFamily(run) === "transient_upstream"
    ? {
        errorFamily: "transient_upstream" as const,
        retryNotBefore: readTransientRetryNotBeforeFromRun(run),
      }
    : null;
}

export function mergeAdapterRecoveryMetadata(input: {
  resultJson: Record<string, unknown> | null | undefined;
  errorFamily?: string | null;
  retryNotBefore?: string | null;
}) {
  const errorFamily = readNonEmptyString(input.errorFamily);
  const retryNotBefore = readNonEmptyString(input.retryNotBefore);
  if (!input.resultJson && !errorFamily && !retryNotBefore) return input.resultJson ?? null;

  return {
    ...(input.resultJson ?? {}),
    ...(errorFamily ? { errorFamily } : {}),
    ...(retryNotBefore
      ? {
          retryNotBefore,
          transientRetryNotBefore: retryNotBefore,
        }
      : {}),
  };
}

export function computeBoundedTransientHeartbeatRetrySchedule(
  attempt: number,
  now = new Date(),
  random: () => number = Math.random,
) {
  if (!Number.isInteger(attempt) || attempt <= 0) return null;
  const baseDelayMs = BOUNDED_TRANSIENT_HEARTBEAT_RETRY_DELAYS_MS[attempt - 1];
  if (typeof baseDelayMs !== "number") return null;
  const sample = Math.min(1, Math.max(0, random()));
  const jitterMultiplier = 1 + (((sample * 2) - 1) * BOUNDED_TRANSIENT_HEARTBEAT_RETRY_JITTER_RATIO);
  const delayMs = Math.max(1_000, Math.round(baseDelayMs * jitterMultiplier));
  return {
    attempt,
    baseDelayMs,
    delayMs,
    dueAt: new Date(now.getTime() + delayMs),
    maxAttempts: BOUNDED_TRANSIENT_HEARTBEAT_RETRY_MAX_ATTEMPTS,
  };
}
