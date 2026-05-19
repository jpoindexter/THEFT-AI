import { heartbeatRuns } from "@paperclipai/db";
import { parseObject } from "../adapters/utils.js";
import { deriveTaskKey } from "./heartbeat-task-key.js";

const HEARTBEAT_RUN_TERMINAL_STATUSES = ["succeeded", "failed", "cancelled", "timed_out"] as const;
const UNSUCCESSFUL_HEARTBEAT_RUN_TERMINAL_STATUSES = ["failed", "cancelled", "timed_out"] as const;
const SESSIONED_LOCAL_ADAPTERS = new Set([
  "claude_local",
  "codex_local",
  "cursor",
  "gemini_local",
  "hermes_local",
  "opencode_local",
  "pi_local",
]);

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function summarizeRunFailureForIssueComment(
  run: Pick<typeof heartbeatRuns.$inferSelect, "error" | "errorCode"> | null | undefined,
) {
  if (!run) return null;

  const errorCode = readNonEmptyString(run.errorCode)?.trim() ?? null;
  const rawError = readNonEmptyString(run.error)?.trim() ?? null;
  const apiMessageMatch = rawError?.match(/"message"\s*:\s*"([^"]+)"/);
  const firstLine = rawError
    ?.split(/\r?\n/)
    .map((line) => line.trim())
    .find(Boolean) ?? null;
  const summarySource = apiMessageMatch?.[1] ?? firstLine;
  const summary =
    summarySource && summarySource.length > 240
      ? `${summarySource.slice(0, 237)}...`
      : summarySource;

  if (errorCode && summary) return ` Latest retry failure: \`${errorCode}\` - ${summary}.`;
  if (errorCode) return ` Latest retry failure: \`${errorCode}\`.`;
  if (summary) return ` Latest retry failure: ${summary}.`;
  return null;
}

export function didAutomaticRecoveryFail(
  latestRun: Pick<typeof heartbeatRuns.$inferSelect, "status" | "contextSnapshot"> | null,
  expectedRetryReason: "assignment_recovery" | "issue_continuation_needed",
) {
  if (!latestRun) return false;

  const latestContext = parseObject(latestRun.contextSnapshot);
  const latestRetryReason = readNonEmptyString(latestContext.retryReason);
  return (
    latestRetryReason === expectedRetryReason &&
    UNSUCCESSFUL_HEARTBEAT_RUN_TERMINAL_STATUSES.includes(
      latestRun.status as (typeof UNSUCCESSFUL_HEARTBEAT_RUN_TERMINAL_STATUSES)[number],
    )
  );
}

export function runTaskKey(run: typeof heartbeatRuns.$inferSelect) {
  return deriveTaskKey(run.contextSnapshot as Record<string, unknown> | null, null);
}

export function isSameTaskScope(left: string | null, right: string | null) {
  return (left ?? null) === (right ?? null);
}

export function isTrackedLocalChildProcessAdapter(adapterType: string) {
  return SESSIONED_LOCAL_ADAPTERS.has(adapterType);
}

export function isHeartbeatRunTerminalStatus(
  status: string | null | undefined,
): status is (typeof HEARTBEAT_RUN_TERMINAL_STATUSES)[number] {
  return HEARTBEAT_RUN_TERMINAL_STATUSES.includes(
    status as (typeof HEARTBEAT_RUN_TERMINAL_STATUSES)[number],
  );
}

export function normalizeAgentNameKey(value: string | null | undefined) {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}
