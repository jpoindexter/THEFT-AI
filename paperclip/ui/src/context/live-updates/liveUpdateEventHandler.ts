import type { QueryClient } from "@tanstack/react-query";
import type { LiveEvent } from "@paperclipai/shared";
import type { ToastInput } from "../ToastContext";
import { queryKeys } from "../../lib/queryKeys";
import type { ToastGate } from "./liveUpdateModel";
import { readString, resolveAgentName } from "./liveUpdateModel";
import { gatedPushToast } from "./liveUpdateToastGate";
import { invalidateActivityQueries, invalidateHeartbeatQueries } from "./liveUpdateInvalidation";
import { buildActivityToast, buildAgentStatusToast, buildJoinRequestToast, buildRunStatusToast } from "./liveUpdateToasts";
import { hydrateVisibleIssueComment } from "./visibleIssueCommentHydration";
import {
  invalidateVisibleIssueRunQueries,
  shouldDeferVisibleIssueCommentActivity,
  shouldSuppressActivityToastForVisibleIssue,
  shouldSuppressAgentStatusToastForVisibleIssue,
  shouldSuppressRunStatusToastForVisibleIssue,
} from "./visibleIssueRoute";

export function handleLiveEvent(
  queryClient: QueryClient,
  expectedCompanyId: string,
  pathname: string,
  event: LiveEvent,
  pushToast: (toast: ToastInput) => string | null,
  gate: ToastGate,
  currentActor: { userId: string | null; agentId: string | null },
) {
  if (event.companyId !== expectedCompanyId) return;

  const nameOf = (id: string) => resolveAgentName(queryClient, expectedCompanyId, id);
  const payload = event.payload ?? {};
  if (event.type === "heartbeat.run.log") {
    return;
  }

  if (event.type === "heartbeat.run.queued" || event.type === "heartbeat.run.status") {
    invalidateHeartbeatQueries(queryClient, expectedCompanyId, payload);
    invalidateVisibleIssueRunQueries(queryClient, pathname, payload);
    if (event.type === "heartbeat.run.status") {
      const toast = buildRunStatusToast(payload, nameOf);
      if (
        toast &&
        !shouldSuppressRunStatusToastForVisibleIssue(queryClient, pathname, payload)
      ) {
        gatedPushToast(gate, pushToast, "run-status", toast);
      }
    }
    return;
  }

  if (event.type === "heartbeat.run.event") {
    return;
  }

  if (event.type === "agent.status") {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(expectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(expectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.org(expectedCompanyId) });
    const agentId = readString(payload.agentId);
    if (agentId) queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
    const toast = buildAgentStatusToast(payload, nameOf, queryClient, expectedCompanyId);
    if (
      toast &&
      !shouldSuppressAgentStatusToastForVisibleIssue(queryClient, pathname, payload)
    ) {
      gatedPushToast(gate, pushToast, "agent-status", toast);
    }
    return;
  }

  if (event.type === "activity.logged") {
    invalidateActivityQueries(queryClient, expectedCompanyId, payload, currentActor, { pathname });
    if (shouldDeferVisibleIssueCommentActivity(queryClient, pathname, payload)) {
      void hydrateVisibleIssueComment(queryClient, pathname, payload);
    }
    const action = readString(payload.action);
    const toast =
      buildActivityToast(queryClient, expectedCompanyId, payload, currentActor) ??
      buildJoinRequestToast(payload);
    if (
      toast &&
      !shouldSuppressActivityToastForVisibleIssue(queryClient, pathname, payload)
    ) {
      gatedPushToast(gate, pushToast, `activity:${action ?? "unknown"}`, toast);
    }
  }
}
