import type { ThreadMessage } from "@assistant-ui/react";
import type { IssueChatLinkedRun, IssueChatTranscriptEntry, SegmentTiming } from "./types";

export function toDate(value: Date | string | null | undefined) {
  return value instanceof Date ? value : new Date(value ?? Date.now());
}

export function toTimestamp(value: Date | string | null | undefined) {
  return toDate(value).getTime();
}

export function sortByCreated<T extends { createdAt: Date | string; id: string }>(items: readonly T[]) {
  return [...items].sort((a, b) => {
    const diff = toTimestamp(a.createdAt) - toTimestamp(b.createdAt);
    if (diff !== 0) return diff;
    return a.id.localeCompare(b.id);
  });
}

export function runTimestamp(run: IssueChatLinkedRun) {
  return run.finishedAt ?? run.startedAt ?? run.createdAt;
}

export function computeSegmentTimings(entries: readonly IssueChatTranscriptEntry[]): SegmentTiming[] {
  const timings: SegmentTiming[] = [];
  let inSegment = false;
  let segStart = 0;
  let segEnd = 0;

  for (const entry of entries) {
    const ts = new Date(entry.ts).getTime();

    const isCoT =
      entry.kind === "thinking" ||
      entry.kind === "tool_call" ||
      entry.kind === "tool_result" ||
      entry.kind === "diff" ||
      (entry.kind === "result" && ((entry.isError && !!entry.errors?.length) || !!entry.text));
    const isText = entry.kind === "assistant" && !!entry.text;

    if (isCoT) {
      if (!inSegment) {
        inSegment = true;
        segStart = ts;
      }
      segEnd = ts;
    } else if (isText && inSegment) {
      timings.push({ startMs: segStart, endMs: segEnd });
      inSegment = false;
    }
  }

  if (inSegment) {
    timings.push({ startMs: segStart, endMs: segEnd });
  }

  return timings;
}

export function formatDurationWords(ms: number | null) {
  if (ms === null || !Number.isFinite(ms) || ms <= 0) return null;
  const totalSeconds = Math.max(1, Math.round(ms / 1000));
  if (totalSeconds < 60) {
    return `${totalSeconds} second${totalSeconds === 1 ? "" : "s"}`;
  }
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) {
    return `${totalMinutes} minute${totalMinutes === 1 ? "" : "s"}`;
  }
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (minutes === 0) {
    return `${hours} hour${hours === 1 ? "" : "s"}`;
  }
  return `${hours} hour${hours === 1 ? "" : "s"} ${minutes} minute${minutes === 1 ? "" : "s"}`;
}

export function runDurationLabel(run: {
  status: string;
  createdAt: Date | string;
  startedAt: Date | string | null;
  finishedAt?: Date | string | null;
  resultJson?: Record<string, unknown> | null;
}) {
  const start = run.startedAt ?? run.createdAt;
  const end = run.finishedAt ?? null;
  const durationMs = end ? Math.max(0, toTimestamp(end) - toTimestamp(start)) : null;
  const durationText = formatDurationWords(durationMs);
  const stopReason = typeof run.resultJson?.stopReason === "string" ? run.resultJson.stopReason : null;
  switch (run.status) {
    case "succeeded":
      return durationText ? `Worked for ${durationText}` : "Finished work";
    case "failed":
    case "error":
      return durationText ? `Failed after ${durationText}` : "Run failed";
    case "timed_out":
      return durationText ? `Timed out after ${durationText}` : "Run timed out";
    case "cancelled":
      if (stopReason === "paused") {
        return durationText ? `Paused by board after ${durationText}` : "Paused by board";
      }
      return durationText ? `Cancelled after ${durationText}` : "Run cancelled";
    case "queued":
      return "Queued";
    case "running":
      return "Working...";
    default:
      return formatStatusLabel(run.status);
  }
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function fingerprintThreadMessage(message: ThreadMessage) {
  return JSON.stringify(message);
}
