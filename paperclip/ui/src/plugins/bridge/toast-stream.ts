import { useCallback, useEffect, useRef, useState } from "react";
import { useToastActions } from "@/context/ToastContext";
import { usePluginBridgeContext } from "./context";
import type { PluginStreamResult, PluginToastFn, PluginToastInput } from "./types";

export function usePluginToast(): PluginToastFn {
  const { pushToast } = useToastActions();
  return useCallback(
    (input: PluginToastInput) => pushToast(input),
    [pushToast],
  );
}

export function usePluginStream<T = unknown>(
  channel: string,
  options?: { companyId?: string },
): PluginStreamResult<T> {
  const { pluginId, hostContext } = usePluginBridgeContext();
  const effectiveCompanyId = options?.companyId ?? hostContext.companyId ?? undefined;
  const [events, setEvents] = useState<T[]>([]);
  const [lastEvent, setLastEvent] = useState<T | null>(null);
  const [connecting, setConnecting] = useState<boolean>(Boolean(effectiveCompanyId));
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const sourceRef = useRef<EventSource | null>(null);

  const close = useCallback(() => {
    sourceRef.current?.close();
    sourceRef.current = null;
    setConnecting(false);
    setConnected(false);
  }, []);

  useEffect(() => {
    setEvents([]);
    setLastEvent(null);
    setError(null);

    if (!effectiveCompanyId) {
      close();
      return;
    }

    const params = new URLSearchParams({ companyId: effectiveCompanyId });
    const source = new EventSource(
      `/api/plugins/${encodeURIComponent(pluginId)}/bridge/stream/${encodeURIComponent(channel)}?${params.toString()}`,
      { withCredentials: true },
    );
    sourceRef.current = source;
    setConnecting(true);
    setConnected(false);

    source.onopen = () => {
      setConnecting(false);
      setConnected(true);
      setError(null);
    };

    source.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as T;
        setEvents((current) => [...current, parsed]);
        setLastEvent(parsed);
      } catch (nextError) {
        setError(nextError instanceof Error ? nextError : new Error(String(nextError)));
      }
    };

    source.addEventListener("close", () => {
      source.close();
      if (sourceRef.current === source) sourceRef.current = null;
      setConnecting(false);
      setConnected(false);
    });

    source.onerror = () => {
      setConnecting(false);
      setConnected(false);
      setError(new Error(`Failed to connect to plugin stream "${channel}"`));
      source.close();
      if (sourceRef.current === source) sourceRef.current = null;
    };

    return () => {
      source.close();
      if (sourceRef.current === source) sourceRef.current = null;
    };
  }, [channel, close, effectiveCompanyId, pluginId]);

  return { events, lastEvent, connecting, connected, error, close };
}
