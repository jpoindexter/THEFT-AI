import type { ThreadMessage } from "@assistant-ui/react";
import type { IssueComment } from "@paperclipai/shared";

export type JsonValue = null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue };
export type JsonObject = { [key: string]: JsonValue };

export interface IssueChatComment extends IssueComment {
  runId?: string | null;
  runAgentId?: string | null;
  interruptedRunId?: string | null;
  clientId?: string;
  clientStatus?: "pending" | "queued";
  queueState?: "queued";
  queueTargetRunId?: string | null;
  queueReason?: "hold" | "active_run" | "other";
  followUpRequested?: boolean;
}

export interface IssueChatLinkedRun {
  runId: string;
  status: string;
  agentId: string;
  adapterType?: string;
  agentName?: string;
  createdAt: Date | string;
  startedAt: Date | string | null;
  finishedAt?: Date | string | null;
  hasStoredOutput?: boolean;
  logBytes?: number | null;
  resultJson?: Record<string, unknown> | null;
}

export interface IssueChatTranscriptEntry {
  kind:
    | "assistant"
    | "thinking"
    | "user"
    | "tool_call"
    | "tool_result"
    | "init"
    | "result"
    | "stderr"
    | "system"
    | "stdout"
    | "diff";
  ts: string;
  text?: string;
  delta?: boolean;
  name?: string;
  input?: unknown;
  toolUseId?: string;
  toolName?: string;
  content?: string;
  isError?: boolean;
  subtype?: string;
  errors?: string[];
  model?: string;
  sessionId?: string;
  inputTokens?: number;
  outputTokens?: number;
  cachedTokens?: number;
  costUsd?: number;
  changeType?: "add" | "remove" | "context" | "hunk" | "file_header" | "truncation";
}

export const ISSUE_CHAT_TRANSCRIPT_MAX_VISIBLE_ENTRIES = 30;

export type MessageWithOrder = {
  createdAtMs: number;
  order: number;
  message: ThreadMessage;
};

export type SortBoundaryItem = {
  createdAtMs: number;
  runId?: string | null;
};

export interface StableThreadMessageCacheEntry {
  fingerprint: string;
  message: ThreadMessage;
}

export interface SegmentTiming {
  startMs: number;
  endMs: number;
}
