import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { LiveEvent } from "@paperclipai/shared";
import { instanceSettingsApi } from "../../api/instanceSettings";
import { buildTranscript, getUIAdapter, onAdapterChange, type RunLogChunk, type TranscriptEntry } from "../../adapters";
import { queryKeys } from "../../lib/queryKeys";
import { isTerminalStatus, readString } from "./liveRunTranscriptUtils";
import { usePersistedRunLogs } from "./usePersistedRunLogs";

const LOG_POLL_INTERVAL_MS = 2000;
const LOG_READ_LIMIT_BYTES = 256_000;
const EMPTY_RUN_LOG_CHUNKS: RunLogChunk[] = [];

export interface RunTranscriptSource {
  id: string;
  status: string;
  adapterType: string;
  hasStoredOutput?: boolean;
  logBytes?: number | null;
  lastOutputBytes?: number | null;
}

interface UseLiveRunTranscriptsOptions {
  runs: RunTranscriptSource[];
  companyId?: string | null;
  maxChunksPerRun?: number;
  logPollIntervalMs?: number;
  logReadLimitBytes?: number;
  enableRealtimeUpdates?: boolean;
}

export { resolveInitialLogOffset } from "./usePersistedRunLogs";

export function useLiveRunTranscripts({
  runs,
  companyId,
  maxChunksPerRun = 200,
  logPollIntervalMs = LOG_POLL_INTERVAL_MS,
  logReadLimitBytes = LOG_READ_LIMIT_BYTES,
  enableRealtimeUpdates = true,
}: UseLiveRunTranscriptsOptions) {
  const runsKey = useMemo(
    () =>
      runs
        .map((run) => {
          const logBytes = typeof run.logBytes === "number" ? run.logBytes : "";
          const lastOutputBytes = typeof run.lastOutputBytes === "number" ? run.lastOutputBytes : "";
          return `${run.id}:${run.status}:${run.adapterType}:${run.hasStoredOutput === true ? "1" : "0"}:${logBytes}:${lastOutputBytes}`;
        })
        .sort((a, b) => a.localeCompare(b))
        .join(","),
    [runs],
  );
  const normalizedRuns = useMemo(() => runs.map((run) => ({ ...run })), [runsKey]);
  const [chunksByRun, setChunksByRun] = useState<Map<string, RunLogChunk[]>>(new Map());
  const [hydratedRunIds, setHydratedRunIds] = useState<Set<string>>(new Set());
  const seenChunkKeysRef = useRef(new Set<string>());
  const transcriptCacheRef = useRef(new Map<string, {
    adapterType: string;
    chunks: RunLogChunk[];
    censorUsernameInLogs: boolean;
    parserTick: number;
    transcript: TranscriptEntry[];
  }>());
  // Tick counter to force transcript recomputation when dynamic parser loads
  const [parserTick, setParserTick] = useState(0);
  useEffect(() => {
    return onAdapterChange(() => setParserTick((t) => t + 1));
  }, []);
  const { data: generalSettings } = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });

  const runById = useMemo(() => new Map(normalizedRuns.map((run) => [run.id, run])), [normalizedRuns]);
  const activeRunIds = useMemo(
    () => new Set(normalizedRuns.filter((run) => !isTerminalStatus(run.status)).map((run) => run.id)),
    [normalizedRuns],
  );
  const appendChunks = useCallback((runId: string, chunks: Array<RunLogChunk & { dedupeKey: string }>) => {
    if (chunks.length === 0) return;
    setChunksByRun((prev) => {
      const next = new Map(prev);
      const existing = [...(next.get(runId) ?? [])];
      let changed = false;

      for (const chunk of chunks) {
        if (seenChunkKeysRef.current.has(chunk.dedupeKey)) continue;
        seenChunkKeysRef.current.add(chunk.dedupeKey);
        existing.push({ ts: chunk.ts, stream: chunk.stream, chunk: chunk.chunk });
        changed = true;
      }

      if (!changed) return prev;
      if (seenChunkKeysRef.current.size > 12000) {
        seenChunkKeysRef.current.clear();
      }
      next.set(runId, existing.slice(-maxChunksPerRun));
      return next;
    });
  }, [maxChunksPerRun]);

  useEffect(() => {
    const knownRunIds = new Set(normalizedRuns.map((run) => run.id));
    setChunksByRun((prev) => {
      const next = new Map<string, RunLogChunk[]>();
      for (const [runId, chunks] of prev) {
        if (knownRunIds.has(runId)) {
          next.set(runId, chunks);
        }
      }
      return next.size === prev.size ? prev : next;
    });
    setHydratedRunIds((prev) => {
      const next = new Set<string>();
      for (const runId of prev) {
        if (knownRunIds.has(runId)) {
          next.add(runId);
        }
      }
      return next.size === prev.size ? prev : next;
    });

    for (const runId of transcriptCacheRef.current.keys()) {
      if (!knownRunIds.has(runId)) {
        transcriptCacheRef.current.delete(runId);
      }
    }
  }, [normalizedRuns]);

  usePersistedRunLogs({
    normalizedRuns,
    logPollIntervalMs,
    logReadLimitBytes,
    appendChunks,
    setHydratedRunIds,
  });

  useEffect(() => {
    if (!enableRealtimeUpdates) return;
    if (!companyId || activeRunIds.size === 0) return;

    let closed = false;
    let reconnectTimer: number | null = null;
    let socket: WebSocket | null = null;

    const scheduleReconnect = () => {
      if (closed) return;
      reconnectTimer = window.setTimeout(connect, 1500);
    };

    const connect = () => {
      if (closed) return;
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const url = `${protocol}://${window.location.host}/api/companies/${encodeURIComponent(companyId)}/events/ws`;
      socket = new WebSocket(url);

      socket.onmessage = (message) => {
        const raw = typeof message.data === "string" ? message.data : "";
        if (!raw) return;

        let event: LiveEvent;
        try {
          event = JSON.parse(raw) as LiveEvent;
        } catch {
          return;
        }

        if (event.companyId !== companyId) return;
        const payload = event.payload ?? {};
        const runId = readString(payload["runId"]);
        if (!runId || !activeRunIds.has(runId)) return;
        if (!runById.has(runId)) return;

        if (event.type === "heartbeat.run.log") {
          const chunk = readString(payload["chunk"]);
          if (!chunk) return;
          const ts = readString(payload["ts"]) ?? event.createdAt;
          const stream =
            readString(payload["stream"]) === "stderr"
              ? "stderr"
              : readString(payload["stream"]) === "system"
                ? "system"
                : "stdout";
          appendChunks(runId, [{
            ts,
            stream,
            chunk,
            dedupeKey: `log:${runId}:${ts}:${stream}:${chunk}`,
          }]);
          return;
        }

        if (event.type === "heartbeat.run.event") {
          const seq = typeof payload["seq"] === "number" ? payload["seq"] : null;
          const eventType = readString(payload["eventType"]) ?? "event";
          const messageText = readString(payload["message"]) ?? eventType;
          appendChunks(runId, [{
            ts: event.createdAt,
            stream: eventType === "error" ? "stderr" : "system",
            chunk: messageText,
            dedupeKey: `socket:event:${runId}:${seq ?? `${eventType}:${messageText}:${event.createdAt}`}`,
          }]);
          return;
        }

        if (event.type === "heartbeat.run.status") {
          const status = readString(payload["status"]) ?? "updated";
          appendChunks(runId, [{
            ts: event.createdAt,
            stream: isTerminalStatus(status) && status !== "succeeded" ? "stderr" : "system",
            chunk: `run ${status}`,
            dedupeKey: `socket:status:${runId}:${status}:${readString(payload["finishedAt"]) ?? ""}`,
          }]);
        }
      };

      socket.onerror = () => {
        socket?.close();
      };

      socket.onclose = () => {
        scheduleReconnect();
      };
    };

    connect();

    return () => {
      closed = true;
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (socket) {
        socket.onmessage = null;
        socket.onerror = null;
        socket.onclose = null;
        if (socket.readyState === WebSocket.CONNECTING) {
          // Defer the close until the handshake completes so the browser
          // does not emit a noisy "closed before the connection is established"
          // warning during rapid run teardown.
          socket.onopen = () => {
            socket?.close(1000, "live_run_transcripts_unmount");
          };
        } else if (socket.readyState === WebSocket.OPEN) {
          socket.close(1000, "live_run_transcripts_unmount");
        }
      }
    };
  }, [activeRunIds, companyId, enableRealtimeUpdates, runById]);

  const transcriptByRun = useMemo(() => {
    const next = new Map<string, TranscriptEntry[]>();
    const censorUsernameInLogs = generalSettings?.censorUsernameInLogs === true;
    const cache = transcriptCacheRef.current;
    const currentRunIds = new Set<string>();
    for (const run of normalizedRuns) {
      currentRunIds.add(run.id);
      const chunks = chunksByRun.get(run.id) ?? EMPTY_RUN_LOG_CHUNKS;
      const cached = cache.get(run.id);
      if (
        cached &&
        cached.adapterType === run.adapterType &&
        cached.chunks === chunks &&
        cached.censorUsernameInLogs === censorUsernameInLogs &&
        cached.parserTick === parserTick
      ) {
        next.set(run.id, cached.transcript);
        continue;
      }

      const adapter = getUIAdapter(run.adapterType);
      const transcript = buildTranscript(chunks, adapter, {
        censorUsernameInLogs,
      });
      cache.set(run.id, {
        adapterType: run.adapterType,
        chunks,
        censorUsernameInLogs,
        parserTick,
        transcript,
      });
      next.set(run.id, transcript);
    }
    for (const runId of cache.keys()) {
      if (!currentRunIds.has(runId)) {
        cache.delete(runId);
      }
    }
    return next;
  }, [chunksByRun, generalSettings?.censorUsernameInLogs, normalizedRuns, parserTick]);

  return {
    transcriptByRun,
    isInitialHydrating: normalizedRuns.some((run) => !hydratedRunIds.has(run.id)),
    hasOutputForRun(runId: string) {
      return (chunksByRun.get(runId)?.length ?? 0) > 0 || runById.get(runId)?.hasStoredOutput === true;
    },
  };
}
