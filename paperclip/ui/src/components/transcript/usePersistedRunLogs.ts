import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import { ApiError } from "../../api/client";
import { heartbeatsApi } from "../../api/heartbeats";
import type { RunLogChunk } from "../../adapters";
import type { RunTranscriptSource } from "./useLiveRunTranscripts";

function isTerminalStatus(status: string): boolean {
  return status === "failed" || status === "timed_out" || status === "cancelled" || status === "succeeded";
}

function runKnownLogBytes(run: RunTranscriptSource): number | null {
  const bytes = run.status === "queued"
    ? run.logBytes
    : run.lastOutputBytes ?? run.logBytes;
  return typeof bytes === "number" && Number.isFinite(bytes) && bytes > 0 ? bytes : null;
}

export function resolveInitialLogOffset(run: RunTranscriptSource, limitBytes: number): number {
  const knownBytes = runKnownLogBytes(run);
  if (knownBytes === null) return 0;
  return Math.max(0, knownBytes - Math.max(0, limitBytes));
}

function parsePersistedLogContent(
  runId: string,
  content: string,
  pendingByRun: Map<string, string>,
): Array<RunLogChunk & { dedupeKey: string }> {
  if (!content) return [];

  const pendingKey = `${runId}:records`;
  const combined = `${pendingByRun.get(pendingKey) ?? ""}${content}`;
  const split = combined.split("\n");
  pendingByRun.set(pendingKey, split.pop() ?? "");

  const parsed: Array<RunLogChunk & { dedupeKey: string }> = [];
  for (const line of split) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const raw = JSON.parse(trimmed) as { ts?: unknown; stream?: unknown; chunk?: unknown };
      const stream = raw.stream === "stderr" || raw.stream === "system" ? raw.stream : "stdout";
      const chunk = typeof raw.chunk === "string" ? raw.chunk : "";
      const ts = typeof raw.ts === "string" ? raw.ts : new Date().toISOString();
      if (!chunk) continue;
      parsed.push({
        ts,
        stream,
        chunk,
        dedupeKey: `log:${runId}:${ts}:${stream}:${chunk}`,
      });
    } catch {
      // Ignore malformed log rows.
    }
  }

  return parsed;
}

export function usePersistedRunLogs({
  normalizedRuns,
  logPollIntervalMs,
  logReadLimitBytes,
  appendChunks,
  setHydratedRunIds,
}: {
  normalizedRuns: RunTranscriptSource[];
  logPollIntervalMs: number;
  logReadLimitBytes: number;
  appendChunks: (runId: string, chunks: Array<RunLogChunk & { dedupeKey: string }>) => void;
  setHydratedRunIds: Dispatch<SetStateAction<Set<string>>>;
}) {
  const pendingLogRowsByRunRef = useRef(new Map<string, string>());
  const logOffsetByRunRef = useRef(new Map<string, number>());
  const missingTerminalLogRunIdsRef = useRef(new Set<string>());

  useEffect(() => {
    const knownRunIds = new Set(normalizedRuns.map((run) => run.id));
    for (const key of pendingLogRowsByRunRef.current.keys()) {
      const runId = key.replace(/:records$/, "");
      if (!knownRunIds.has(runId)) {
        pendingLogRowsByRunRef.current.delete(key);
      }
    }
    for (const runId of logOffsetByRunRef.current.keys()) {
      if (!knownRunIds.has(runId)) {
        logOffsetByRunRef.current.delete(runId);
      }
    }
    for (const runId of missingTerminalLogRunIdsRef.current.keys()) {
      if (!knownRunIds.has(runId)) {
        missingTerminalLogRunIdsRef.current.delete(runId);
      }
    }
  }, [normalizedRuns]);

  useEffect(() => {
    if (normalizedRuns.length === 0) return;

    let cancelled = false;

    const readRunLog = async (run: RunTranscriptSource) => {
      if (missingTerminalLogRunIdsRef.current.has(run.id)) return;
      const offset = logOffsetByRunRef.current.get(run.id) ?? resolveInitialLogOffset(run, logReadLimitBytes);
      try {
        const result = await heartbeatsApi.log(run.id, offset, logReadLimitBytes);
        if (cancelled) return;

        appendChunks(run.id, parsePersistedLogContent(run.id, result.content, pendingLogRowsByRunRef.current));

        if (result.nextOffset !== undefined) {
          logOffsetByRunRef.current.set(run.id, result.nextOffset);
          return;
        }
        if (result.content.length > 0) {
          logOffsetByRunRef.current.set(run.id, offset + result.content.length);
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404 && isTerminalStatus(run.status)) {
          missingTerminalLogRunIdsRef.current.add(run.id);
        }
      } finally {
        if (!cancelled) {
          setHydratedRunIds((prev) => {
            if (prev.has(run.id)) return prev;
            const next = new Set(prev);
            next.add(run.id);
            return next;
          });
        }
      }
    };

    const readAll = async () => {
      await Promise.all(normalizedRuns.map((run) => readRunLog(run)));
    };

    void readAll();
    const activeRuns = normalizedRuns.filter((run) => !isTerminalStatus(run.status));
    const interval = activeRuns.length > 0 && logPollIntervalMs > 0
      ? window.setInterval(() => {
          void Promise.all(activeRuns.map((run) => readRunLog(run)));
        }, logPollIntervalMs)
      : null;

    return () => {
      cancelled = true;
      if (interval !== null) window.clearInterval(interval);
    };
  }, [appendChunks, logPollIntervalMs, logReadLimitBytes, normalizedRuns, setHydratedRunIds]);
}
