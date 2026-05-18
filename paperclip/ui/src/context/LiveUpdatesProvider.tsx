import { useEffect, useRef, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";
import { useCompany } from "./CompanyContext";
import { useToastActions } from "./ToastContext";
import { queryKeys } from "../lib/queryKeys";
import { useLocation } from "../lib/router";
import { handleLiveEvent } from "./live-updates/liveUpdateEventHandler";
import { invalidateActivityQueries, invalidateHeartbeatQueries } from "./live-updates/liveUpdateInvalidation";
import { RECONNECT_SUPPRESS_MS, type ToastGate } from "./live-updates/liveUpdateModel";
import {
  closeSocketQuietly,
  resolveLiveCompanyId,
} from "./live-updates/liveUpdateSocket";
import {
  buildAgentStatusToast,
  buildRunStatusToast,
} from "./live-updates/liveUpdateToasts";
import { hydrateVisibleIssueComment } from "./live-updates/visibleIssueCommentHydration";
import {
  invalidateVisibleIssueRunQueries,
  shouldDeferIssueRefetchForVisibleAgentActivity,
  shouldDeferVisibleIssueCommentActivity,
  shouldSuppressActivityToastForVisibleIssue,
  shouldSuppressAgentStatusToastForVisibleIssue,
  shouldSuppressRunStatusToastForVisibleIssue,
} from "./live-updates/visibleIssueRoute";

export const __liveUpdatesTestUtils = {
  buildAgentStatusToast,
  buildRunStatusToast,
  closeSocketQuietly,
  hydrateVisibleIssueComment,
  invalidateActivityQueries,
  invalidateHeartbeatQueries,
  invalidateVisibleIssueRunQueries,
  resolveLiveCompanyId,
  shouldDeferIssueRefetchForVisibleAgentActivity,
  shouldDeferVisibleIssueCommentActivity,
  shouldSuppressActivityToastForVisibleIssue,
  shouldSuppressRunStatusToastForVisibleIssue,
  shouldSuppressAgentStatusToastForVisibleIssue,
};

export function LiveUpdatesProvider({ children }: { children: ReactNode }) {
  const { selectedCompanyId, selectedCompany } = useCompany();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const location = useLocation();
  const gateRef = useRef<ToastGate>({ cooldownHits: new Map(), suppressUntil: 0 });
  const pathnameRef = useRef(location.pathname);
  const { data: session, status: sessionStatus } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
    retry: false,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const socketAuthKey = session?.session?.id ?? currentUserId ?? "signed_out";
  const liveCompanyId = resolveLiveCompanyId(selectedCompanyId, selectedCompany?.id ?? null);
  const canConnectSocket = sessionStatus === "success" && session !== null && liveCompanyId !== null;
  const currentActorRef = useRef<{ userId: string | null; agentId: string | null }>({
    userId: currentUserId,
    agentId: null,
  });

  useEffect(() => {
    pathnameRef.current = location.pathname;
  }, [location.pathname]);

  useEffect(() => {
    currentActorRef.current = {
      userId: currentUserId,
      agentId: null,
    };
  }, [currentUserId]);

  useEffect(() => {
    if (!canConnectSocket || !liveCompanyId) return;

    let closed = false;
    let reconnectAttempt = 0;
    let reconnectTimer: number | null = null;
    let socket: WebSocket | null = null;

    const clearReconnect = () => {
      if (reconnectTimer !== null) {
        window.clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    };

    const scheduleReconnect = () => {
      if (closed) return;
      reconnectAttempt += 1;
      const delayMs = Math.min(15000, 1000 * 2 ** Math.min(reconnectAttempt - 1, 4));
      reconnectTimer = window.setTimeout(() => {
        reconnectTimer = null;
        connect();
      }, delayMs);
    };

    const connect = () => {
      if (closed) return;
      const protocol = window.location.protocol === "https:" ? "wss" : "ws";
      const url = `${protocol}://${window.location.host}/api/companies/${encodeURIComponent(liveCompanyId)}/events/ws`;
      const nextSocket = new WebSocket(url);
      socket = nextSocket;

      nextSocket.onopen = () => {
        if (closed || socket !== nextSocket) {
          closeSocketQuietly(nextSocket, "stale_connection");
          return;
        }
        if (reconnectAttempt > 0) {
          gateRef.current.suppressUntil = Date.now() + RECONNECT_SUPPRESS_MS;
        }
        reconnectAttempt = 0;
      };

      nextSocket.onmessage = (message) => {
        const raw = typeof message.data === "string" ? message.data : "";
        if (!raw) return;

        try {
          handleLiveEvent(queryClient, liveCompanyId, pathnameRef.current, JSON.parse(raw), pushToast, gateRef.current, {
            userId: currentActorRef.current.userId,
            agentId: currentActorRef.current.agentId,
          });
        } catch {
          // Ignore non-JSON payloads.
        }
      };

      nextSocket.onerror = () => {
        // Wait for onclose to drive reconnects.
      };

      nextSocket.onclose = () => {
        if (socket !== nextSocket) return;
        socket = null;
        if (closed) return;
        scheduleReconnect();
      };
    };

    const connectTimer = window.setTimeout(connect, 0);

    return () => {
      closed = true;
      window.clearTimeout(connectTimer);
      clearReconnect();
      const activeSocket = socket;
      socket = null;
      closeSocketQuietly(activeSocket, "provider_unmount");
    };
  }, [queryClient, liveCompanyId, pushToast, canConnectSocket, socketAuthKey]);

  return <>{children}</>;
}
