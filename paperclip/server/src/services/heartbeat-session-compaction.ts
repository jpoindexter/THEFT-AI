import { and, asc, desc, eq, sql } from "drizzle-orm";
import type { Db } from "@paperclipai/db";
import { agents, heartbeatRuns } from "@paperclipai/db";
import {
  deriveNormalizedUsageDelta,
  formatCount,
  readRawUsageTotals,
  type UsageTotals,
} from "./heartbeat-usage.js";
import {
  hasSessionCompactionThresholds,
  parseSessionCompactionPolicy,
  type SessionCompactionDecision,
} from "./heartbeat-session.js";
import { heartbeatRunListResultColumns } from "./heartbeat-run-projections.js";
import { summarizeHeartbeatRunListResultJson } from "./heartbeat-context-summary.js";

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

async function getLatestRunForSession(input: {
  db: Db;
  agentId: string;
  sessionId: string;
  excludeRunId?: string | null;
}) {
  const conditions = [
    eq(heartbeatRuns.agentId, input.agentId),
    eq(heartbeatRuns.sessionIdAfter, input.sessionId),
  ];
  if (input.excludeRunId) {
    conditions.push(sql`${heartbeatRuns.id} <> ${input.excludeRunId}`);
  }
  return input.db
    .select({
      id: heartbeatRuns.id,
      usageJson: heartbeatRuns.usageJson,
    })
    .from(heartbeatRuns)
    .where(and(...conditions))
    .orderBy(desc(heartbeatRuns.createdAt))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

async function getOldestRunForSession(input: {
  db: Db;
  agentId: string;
  sessionId: string;
}) {
  return input.db
    .select({
      id: heartbeatRuns.id,
      createdAt: heartbeatRuns.createdAt,
    })
    .from(heartbeatRuns)
    .where(and(eq(heartbeatRuns.agentId, input.agentId), eq(heartbeatRuns.sessionIdAfter, input.sessionId)))
    .orderBy(asc(heartbeatRuns.createdAt), asc(heartbeatRuns.id))
    .limit(1)
    .then((rows) => rows[0] ?? null);
}

export async function resolveNormalizedUsageForSession(input: {
  db: Db;
  agentId: string;
  runId: string;
  sessionId: string | null;
  rawUsage: UsageTotals | null;
}) {
  const { db, agentId, runId, sessionId, rawUsage } = input;
  if (!sessionId || !rawUsage) {
    return {
      normalizedUsage: rawUsage,
      previousRawUsage: null as UsageTotals | null,
      derivedFromSessionTotals: false,
    };
  }

  const previousRun = await getLatestRunForSession({ db, agentId, sessionId, excludeRunId: runId });
  const previousRawUsage = readRawUsageTotals(previousRun?.usageJson);
  return {
    normalizedUsage: deriveNormalizedUsageDelta(rawUsage, previousRawUsage),
    previousRawUsage,
    derivedFromSessionTotals: previousRawUsage !== null,
  };
}

export async function evaluateSessionCompaction(input: {
  db: Db;
  agent: typeof agents.$inferSelect;
  sessionId: string | null;
  issueId: string | null;
  continuationSummaryBody?: string | null;
}): Promise<SessionCompactionDecision> {
  const { db, agent, sessionId, issueId } = input;
  if (!sessionId) {
    return {
      rotate: false,
      reason: null,
      handoffMarkdown: null,
      previousRunId: null,
    };
  }

  const policy = parseSessionCompactionPolicy(agent);
  if (!policy.enabled || !hasSessionCompactionThresholds(policy)) {
    return {
      rotate: false,
      reason: null,
      handoffMarkdown: null,
      previousRunId: null,
    };
  }

  const fetchLimit = Math.max(policy.maxSessionRuns > 0 ? policy.maxSessionRuns + 1 : 0, 4);
  const runs = await db
    .select({
      id: heartbeatRuns.id,
      createdAt: heartbeatRuns.createdAt,
      usageJson: heartbeatRuns.usageJson,
      error: heartbeatRuns.error,
      ...heartbeatRunListResultColumns,
    })
    .from(heartbeatRuns)
    .where(and(eq(heartbeatRuns.agentId, agent.id), eq(heartbeatRuns.sessionIdAfter, sessionId)))
    .orderBy(desc(heartbeatRuns.createdAt))
    .limit(fetchLimit);

  if (runs.length === 0) {
    return {
      rotate: false,
      reason: null,
      handoffMarkdown: null,
      previousRunId: null,
    };
  }

  const latestRun = runs[0] ?? null;
  const oldestRun =
    policy.maxSessionAgeHours > 0
      ? await getOldestRunForSession({ db, agentId: agent.id, sessionId })
      : runs[runs.length - 1] ?? latestRun;
  const latestRawUsage = readRawUsageTotals(latestRun?.usageJson);
  const sessionAgeHours =
    latestRun && oldestRun
      ? Math.max(
          0,
          (new Date(latestRun.createdAt).getTime() - new Date(oldestRun.createdAt).getTime()) / (1000 * 60 * 60),
        )
      : 0;

  let reason: string | null = null;
  if (policy.maxSessionRuns > 0 && runs.length > policy.maxSessionRuns) {
    reason = `session exceeded ${policy.maxSessionRuns} runs`;
  } else if (
    policy.maxRawInputTokens > 0 &&
    latestRawUsage &&
    latestRawUsage.inputTokens >= policy.maxRawInputTokens
  ) {
    reason =
      `session raw input reached ${formatCount(latestRawUsage.inputTokens)} tokens ` +
      `(threshold ${formatCount(policy.maxRawInputTokens)})`;
  } else if (policy.maxSessionAgeHours > 0 && sessionAgeHours >= policy.maxSessionAgeHours) {
    reason = `session age reached ${Math.floor(sessionAgeHours)} hours`;
  }

  if (!reason || !latestRun) {
    return {
      rotate: false,
      reason: null,
      handoffMarkdown: null,
      previousRunId: latestRun?.id ?? null,
    };
  }

  const latestSummary = summarizeHeartbeatRunListResultJson({
    summary: latestRun?.resultSummary,
    result: latestRun?.resultResult,
    message: latestRun?.resultMessage,
    error: latestRun?.resultError,
    totalCostUsd: latestRun?.resultTotalCostUsd,
    costUsd: latestRun?.resultCostUsd,
    costUsdCamel: latestRun?.resultCostUsdCamel,
  });
  const latestTextSummary =
    readNonEmptyString(latestSummary?.summary) ??
    readNonEmptyString(latestSummary?.result) ??
    readNonEmptyString(latestSummary?.message) ??
    readNonEmptyString(latestRun.error);

  const handoffMarkdown = [
    "Paperclip session handoff:",
    `- Previous session: ${sessionId}`,
    issueId ? `- Issue: ${issueId}` : "",
    `- Rotation reason: ${reason}`,
    latestTextSummary ? `- Last run summary: ${latestTextSummary}` : "",
    input.continuationSummaryBody
      ? `- Issue continuation summary: ${input.continuationSummaryBody.slice(0, 1_500)}`
      : "",
    "Continue from the current task state. Rebuild only the minimum context you need.",
  ]
    .filter(Boolean)
    .join("\n");

  return {
    rotate: true,
    reason,
    handoffMarkdown,
    previousRunId: latestRun.id,
  };
}
