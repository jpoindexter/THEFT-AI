import { agents } from "@paperclipai/db";
import { AGENT_DEFAULT_MAX_CONCURRENT_RUNS } from "@paperclipai/shared";
import { asBoolean, asNumber, parseObject } from "../adapters/utils.js";
import {
  MAX_TURN_CONTINUATION_DEFAULT_DELAY_MS,
  MAX_TURN_CONTINUATION_DEFAULT_MAX_ATTEMPTS,
  MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP,
  MAX_TURN_CONTINUATION_MAX_DELAY_MS,
  type MaxTurnContinuationPolicy,
} from "./heartbeat-retry.js";

const HEARTBEAT_MAX_CONCURRENT_RUNS_DEFAULT = AGENT_DEFAULT_MAX_CONCURRENT_RUNS;
const HEARTBEAT_MAX_CONCURRENT_RUNS_MIN = 1;
const HEARTBEAT_MAX_CONCURRENT_RUNS_MAX = 50;

function normalizeMaxConcurrentRuns(value: unknown) {
  const parsed = Math.floor(asNumber(value, HEARTBEAT_MAX_CONCURRENT_RUNS_DEFAULT));
  if (!Number.isFinite(parsed)) return HEARTBEAT_MAX_CONCURRENT_RUNS_DEFAULT;
  return Math.max(HEARTBEAT_MAX_CONCURRENT_RUNS_MIN, Math.min(HEARTBEAT_MAX_CONCURRENT_RUNS_MAX, parsed));
}

export function parseHeartbeatPolicy(agent: typeof agents.$inferSelect) {
  const runtimeConfig = parseObject(agent.runtimeConfig);
  const heartbeat = parseObject(runtimeConfig.heartbeat);

  return {
    enabled: asBoolean(heartbeat.enabled, false),
    intervalSec: Math.max(0, asNumber(heartbeat.intervalSec, 0)),
    wakeOnDemand: asBoolean(heartbeat.wakeOnDemand ?? heartbeat.wakeOnAssignment ?? heartbeat.wakeOnOnDemand ?? heartbeat.wakeOnAutomation, true),
    maxConcurrentRuns: normalizeMaxConcurrentRuns(heartbeat.maxConcurrentRuns),
  };
}

export function parseMaxTurnContinuationPolicy(agent: typeof agents.$inferSelect): MaxTurnContinuationPolicy {
  const runtimeConfig = parseObject(agent.runtimeConfig);
  const heartbeat = parseObject(runtimeConfig.heartbeat);
  const configured = parseObject(heartbeat.maxTurnContinuation);
  const rawMaxAttempts = Math.floor(asNumber(configured.maxAttempts, MAX_TURN_CONTINUATION_DEFAULT_MAX_ATTEMPTS));
  const rawDelayMs = Math.floor(asNumber(configured.delayMs, MAX_TURN_CONTINUATION_DEFAULT_DELAY_MS));

  return {
    enabled: asBoolean(configured.enabled, true),
    maxAttempts: Math.max(0, Math.min(MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP, rawMaxAttempts)),
    delayMs: Math.max(0, Math.min(MAX_TURN_CONTINUATION_MAX_DELAY_MS, rawDelayMs)),
  };
}

export function issueRunPriorityRank(priority: string | null | undefined) {
  switch (priority) {
    case "critical":
      return 0;
    case "high":
      return 1;
    case "medium":
      return 2;
    case "low":
      return 3;
    default:
      return 4;
  }
}
