import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { HeartbeatRun, HeartbeatRunEvent, LiveEvent } from "@paperclipai/shared";
import { heartbeatsApi } from "../../api/heartbeats";
import { asNonEmptyString, asRecord } from "./valueUtils";
import {
  isRunLogUnavailable,
  parseRunLogContent,
  RUN_LOG_PAGE_BYTES,
  type RunLogLine,
} from "./runLogParsing";

export function useRunLogData({ isLive, run }: { isLive: boolean; run: HeartbeatRun }) {
  const [events, setEvents] = useState<HeartbeatRunEvent[]>([]);
  const [logLines, setLogLines] = useState<RunLogLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [logLoading, setLogLoading] = useState(!!run.logRef);
  const [logError, setLogError] = useState<string | null>(null);
  const [logOffset, setLogOffset] = useState(0);
  const [hasMoreLog, setHasMoreLog] = useState(false);
  const [loadingMoreLog, setLoadingMoreLog] = useState(false);
  const [isStreamingConnected, setIsStreamingConnected] = useState(false);
  const pendingLogLineRef = useRef("");

  const appendLogContent = (content: string, finalize = false) => {
    const parsed = parseRunLogContent(content, pendingLogLineRef.current, finalize);
    pendingLogLineRef.current = parsed.pendingLine;
    if (parsed.lines.length > 0) setLogLines((prev) => [...prev, ...parsed.lines]);
  };

  const { data: initialEvents } = useQuery({
    queryKey: ["run-events", run.id],
    queryFn: () => heartbeatsApi.events(run.id, 0, 200),
  });

  useEffect(() => {
    if (!initialEvents) return;
    setEvents(initialEvents);
    setLoading(false);
  }, [initialEvents]);

  useEffect(() => {
    let cancelled = false;
    pendingLogLineRef.current = "";
    setLogLines([]);
    setLogOffset(0);
    setHasMoreLog(false);
    setLoadingMoreLog(false);
    setLogError(null);

    if (!run.logRef && !isLive) {
      setLogLoading(false);
      return () => {
        cancelled = true;
      };
    }

    setLogLoading(true);
    const load = async () => {
      try {
        const result = await heartbeatsApi.log(run.id, 0, RUN_LOG_PAGE_BYTES);
        if (cancelled) return;
        appendLogContent(result.content, result.nextOffset === undefined);
        setLogOffset(result.nextOffset ?? result.content.length);
        setHasMoreLog(!isLive && result.nextOffset !== undefined);
      } catch (err) {
        if (cancelled) return;
        if (isLive && isRunLogUnavailable(err)) {
          setLogLoading(false);
          return;
        }
        setLogError(err instanceof Error ? err.message : "Failed to load run log");
      } finally {
        if (!cancelled) setLogLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [run.id, run.logRef, run.logBytes, isLive]);

  async function loadMorePersistedLog() {
    if (loadingMoreLog || !hasMoreLog) return;
    setLoadingMoreLog(true);
    setLogError(null);
    try {
      const result = await heartbeatsApi.log(run.id, logOffset, RUN_LOG_PAGE_BYTES);
      appendLogContent(result.content, result.nextOffset === undefined);
      setLogOffset(result.nextOffset ?? logOffset + result.content.length);
      setHasMoreLog(result.nextOffset !== undefined);
    } catch (err) {
      setLogError(err instanceof Error ? err.message : "Failed to load more run log");
    } finally {
      setLoadingMoreLog(false);
    }
  }

  useEffect(() => {
    if (!isLive || isStreamingConnected) return;
    const interval = setInterval(async () => {
      const maxSeq = events.length > 0 ? Math.max(...events.map((event) => event.seq)) : 0;
      try {
        const newEvents = await heartbeatsApi.events(run.id, maxSeq, 100);
        if (newEvents.length > 0) setEvents((prev) => [...prev, ...newEvents]);
      } catch {
        // Ignore polling errors; websocket or the next poll can recover.
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [run.id, isLive, isStreamingConnected, events]);

  useEffect(() => {
    if (!isLive || isStreamingConnected) return;
    const interval = setInterval(async () => {
      try {
        const result = await heartbeatsApi.log(run.id, logOffset, RUN_LOG_PAGE_BYTES);
        if (result.content) appendLogContent(result.content, result.nextOffset === undefined);
        setLogOffset(result.nextOffset ?? ((prev) => prev + result.content.length));
      } catch (err) {
        if (!isRunLogUnavailable(err)) return;
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [run.id, isLive, isStreamingConnected, logOffset]);

  const appendLiveLogLine = useCallback((line: RunLogLine) => {
    setLogLines((prev) => [...prev, line]);
  }, []);

  useRunLogSocket({
    appendLogLine: appendLiveLogLine,
    isLive,
    run,
    setEvents,
    setIsStreamingConnected,
  });

  return {
    events,
    hasMoreLog,
    isStreamingConnected,
    loadMorePersistedLog,
    loading,
    loadingMoreLog,
    logError,
    logLines,
    logLoading,
    logOffset,
  };
}

function useRunLogSocket({
  appendLogLine,
  isLive,
  run,
  setEvents,
  setIsStreamingConnected,
}: {
  appendLogLine: (line: RunLogLine) => void;
  isLive: boolean;
  run: HeartbeatRun;
  setEvents: React.Dispatch<React.SetStateAction<HeartbeatRunEvent[]>>;
  setIsStreamingConnected: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  useEffect(() => {
    if (!isLive) return;

    let closed = false;
    let reconnectTimer: number | null = null;
    let socket: WebSocket | null = null;

    const connect = () => {
      if (closed) return;
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      socket = new WebSocket(`${protocol}://${window.location.host}/api/companies/${encodeURIComponent(run.companyId)}/events/ws`);
      socket.onopen = () => setIsStreamingConnected(true);
      socket.onmessage = (message) => {
        const rawMessage = typeof message.data === "string" ? message.data : "";
        if (!rawMessage) return;
        handleRunSocketMessage(rawMessage, run, appendLogLine, setEvents);
      };
      socket.onerror = () => socket?.close();
      socket.onclose = () => {
        setIsStreamingConnected(false);
        if (!closed) reconnectTimer = window.setTimeout(connect, 1500);
      };
    };

    connect();
    return () => {
      closed = true;
      setIsStreamingConnected(false);
      if (reconnectTimer !== null) window.clearTimeout(reconnectTimer);
      if (!socket) return;
      socket.onopen = null;
      socket.onmessage = null;
      socket.onerror = null;
      socket.onclose = null;
      socket.close(1000, "run_detail_unmount");
    };
  }, [appendLogLine, isLive, run, setEvents, setIsStreamingConnected]);
}

function handleRunSocketMessage(
  rawMessage: string,
  run: HeartbeatRun,
  appendLogLine: (line: RunLogLine) => void,
  setEvents: React.Dispatch<React.SetStateAction<HeartbeatRunEvent[]>>,
) {
  let event: LiveEvent;
  try {
    event = JSON.parse(rawMessage) as LiveEvent;
  } catch {
    return;
  }

  if (event.companyId !== run.companyId) return;
  const payload = asRecord(event.payload);
  const eventRunId = asNonEmptyString(payload?.runId);
  if (!payload || eventRunId !== run.id) return;

  if (event.type === "heartbeat.run.log") {
    const chunk = typeof payload.chunk === "string" ? payload.chunk : "";
    if (!chunk) return;
    const streamRaw = asNonEmptyString(payload.stream);
    appendLogLine({
      chunk,
      stream: streamRaw === "stderr" || streamRaw === "system" ? streamRaw : "stdout",
      ts: asNonEmptyString((payload as Record<string, unknown>).ts) ?? event.createdAt,
    });
    return;
  }

  if (event.type !== "heartbeat.run.event") return;
  const liveEvent = toHeartbeatRunEvent(event, run, payload);
  if (!liveEvent) return;
  setEvents((prev) => {
    if (prev.some((existing) => existing.seq === liveEvent.seq)) return prev;
    return [...prev, liveEvent];
  });
}

function toHeartbeatRunEvent(
  event: LiveEvent,
  run: HeartbeatRun,
  payload: Record<string, unknown>,
): HeartbeatRunEvent | null {
  const seq = typeof payload.seq === "number" ? payload.seq : null;
  if (seq === null || !Number.isFinite(seq)) return null;
  const streamRaw = asNonEmptyString(payload.stream);
  const levelRaw = asNonEmptyString(payload.level);

  return {
    id: seq,
    companyId: run.companyId,
    runId: run.id,
    agentId: run.agentId,
    seq,
    eventType: asNonEmptyString(payload.eventType) ?? "event",
    stream: streamRaw === "stdout" || streamRaw === "stderr" || streamRaw === "system" ? streamRaw : null,
    level: levelRaw === "info" || levelRaw === "warn" || levelRaw === "error" ? levelRaw : null,
    color: asNonEmptyString(payload.color),
    message: asNonEmptyString(payload.message),
    payload: asRecord(payload.payload),
    createdAt: new Date(event.createdAt),
  };
}
