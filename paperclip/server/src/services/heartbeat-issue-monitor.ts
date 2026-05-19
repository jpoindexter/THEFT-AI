import type {
  IssueExecutionMonitorClearReason,
  IssueExecutionMonitorPolicy,
  IssueExecutionMonitorRecoveryPolicy,
} from "@paperclipai/shared";

type IssueMonitorDetailsRow = {
  id: string;
  identifier: string | null;
  title: string;
  monitorNotes: string | null;
};

export function parseMonitorDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function issueMonitorLimitClearReason(input: {
  monitor: IssueExecutionMonitorPolicy | null;
  nextAttemptCount: number;
  now: Date;
}): IssueExecutionMonitorClearReason | null {
  const timeoutAt = parseMonitorDate(input.monitor?.timeoutAt ?? null);
  if (timeoutAt && input.now.getTime() >= timeoutAt.getTime()) {
    return "timeout_exceeded";
  }
  const maxAttempts = input.monitor?.maxAttempts ?? null;
  if (maxAttempts !== null && input.nextAttemptCount > maxAttempts) {
    return "max_attempts_exhausted";
  }
  return null;
}

export function monitorRecoveryPolicy(
  monitor: IssueExecutionMonitorPolicy | null,
): IssueExecutionMonitorRecoveryPolicy {
  return monitor?.recoveryPolicy ?? "wake_owner";
}

export function monitorRecoveryDetails(input: {
  claimed: IssueMonitorDetailsRow;
  scheduledAtIso: string;
  nextAttemptCount: number;
  clearReason: IssueExecutionMonitorClearReason;
  recoveryPolicy: IssueExecutionMonitorRecoveryPolicy;
  monitor: IssueExecutionMonitorPolicy | null;
  source: "manual" | "scheduled";
}) {
  return {
    identifier: input.claimed.identifier,
    nextCheckAt: input.scheduledAtIso,
    attemptedAttemptCount: input.nextAttemptCount,
    notes: input.claimed.monitorNotes ?? null,
    serviceName: input.monitor?.serviceName ?? null,
    timeoutAt: input.monitor?.timeoutAt ?? null,
    maxAttempts: input.monitor?.maxAttempts ?? null,
    clearReason: input.clearReason,
    recoveryPolicy: input.recoveryPolicy,
    source: input.source,
  };
}

function formatIssueIdentifierLink(identifier: string | null, fallback: string) {
  if (!identifier) return fallback;
  const prefix = identifier.split("-")[0];
  if (!prefix || !/^[A-Z][A-Z0-9]*-\d+$/.test(identifier)) return identifier;
  return `[${identifier}](/${prefix}/issues/${identifier})`;
}

export function monitorRecoveryComment(input: {
  issue: IssueMonitorDetailsRow;
  clearReason: IssueExecutionMonitorClearReason;
  recoveryPolicy: IssueExecutionMonitorRecoveryPolicy;
  nextAttemptCount: number;
}) {
  const label = formatIssueIdentifierLink(input.issue.identifier, input.issue.id);
  const reason =
    input.clearReason === "timeout_exceeded"
      ? "its timeout was reached"
      : "its maximum attempt count was reached";
  return [
    `Paperclip cleared the scheduled external-service monitor for ${label} because ${reason}.`,
    "",
    `- Attempt count: ${input.nextAttemptCount}`,
    `- Recovery policy: ${input.recoveryPolicy}`,
    "",
    "Next action: inspect the external service state, record the result on this issue, and restore an explicit execution or waiting path if more work remains.",
  ].join("\n");
}
