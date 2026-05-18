import type { QueryClient } from "@tanstack/react-query";
import { queryKeys } from "../../lib/queryKeys";
import { readRecord, readString } from "./liveUpdateModel";
import {
  resolveIssueQueryRefs,
  shouldDeferIssueRefetchForVisibleAgentActivity,
  shouldDeferVisibleIssueCommentActivity,
} from "./visibleIssueRoute";

export function invalidateHeartbeatQueries(
  queryClient: QueryClient,
  companyId: string,
  payload: Record<string, unknown>,
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.liveRuns(companyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.heartbeats(companyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(companyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(companyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.costs(companyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(companyId) });

  const agentId = readString(payload.agentId);
  if (agentId) {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(agentId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.heartbeats(companyId, agentId) });
  }
}

export function invalidateActivityQueries(
  queryClient: QueryClient,
  companyId: string,
  payload: Record<string, unknown>,
  currentActor: { userId: string | null; agentId: string | null },
  options?: { pathname?: string; isForegrounded?: boolean },
) {
  queryClient.invalidateQueries({ queryKey: queryKeys.activity(companyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(companyId) });
  queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(companyId) });

  const entityType = readString(payload.entityType);
  const entityId = readString(payload.entityId);
  const action = readString(payload.action);
  const actorType = readString(payload.actorType);
  const actorId = readString(payload.actorId);

  if (entityType === "issue") {
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(companyId) });
    if (entityId) {
      const details = readRecord(payload.details);
      const selfCommentActivity =
        ((action === "issue.comment_added") ||
          (action === "issue.updated" && readString(details?.source) === "comment")) &&
        ((actorType === "user" && !!currentActor.userId && actorId === currentActor.userId) ||
          (actorType === "agent" && !!currentActor.agentId && actorId === currentActor.agentId));
      const visibleIssueAgentActivity =
        !!options?.pathname &&
        shouldDeferIssueRefetchForVisibleAgentActivity(
          queryClient,
          options.pathname,
          payload,
          { isForegrounded: options.isForegrounded },
        );
      const visibleIssueCommentActivity =
        !!options?.pathname &&
        shouldDeferVisibleIssueCommentActivity(
          queryClient,
          options.pathname,
          payload,
          { isForegrounded: options.isForegrounded },
        );
      const issueRefs = resolveIssueQueryRefs(queryClient, companyId, entityId, details);
      for (const ref of issueRefs) {
        const invalidationOptions =
          (selfCommentActivity || visibleIssueAgentActivity || visibleIssueCommentActivity)
            ? { refetchType: "inactive" as const }
            : undefined;
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(ref), ...invalidationOptions });
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(ref), ...invalidationOptions });
        if (action === "issue.comment_added") {
          queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(ref), ...invalidationOptions });
        }
        if (action?.startsWith("issue.thread_interaction_")) {
          queryClient.invalidateQueries({ queryKey: queryKeys.issues.interactions(ref), ...invalidationOptions });
        }
      }
    }
    return;
  }

  if (entityType === "agent") {
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.org(companyId) });
    if (entityId) {
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.detail(entityId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.heartbeats(companyId, entityId) });
    }
    return;
  }

  if (entityType === "project") {
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(companyId) });
    if (entityId) queryClient.invalidateQueries({ queryKey: queryKeys.projects.detail(entityId) });
    return;
  }

  if (entityType === "goal") {
    queryClient.invalidateQueries({ queryKey: queryKeys.goals.list(companyId) });
    if (entityId) queryClient.invalidateQueries({ queryKey: queryKeys.goals.detail(entityId) });
    return;
  }

  if (entityType === "approval") {
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(companyId) });
    return;
  }

  if (entityType === "join_request") {
    queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(companyId) });
    return;
  }

  if (entityType === "cost_event") {
    queryClient.invalidateQueries({ queryKey: queryKeys.costs(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.usageByProvider(companyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.usageWindowSpend(companyId) });
    return;
  }

  if (entityType === "routine" || entityType === "routine_trigger" || entityType === "routine_run") {
    queryClient.invalidateQueries({ queryKey: ["routines"] });
    return;
  }

  if (entityType === "company") {
    queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
  }
}
