import type { Approval, DashboardSummary, HeartbeatRun, Issue, JoinRequest } from "@paperclipai/shared";
import { getLatestFailedRunsByAgent, isApprovalVisibleInMine } from "./activity";
import { isInboxEntityDismissed } from "./storage";
import {
  ACTIONABLE_APPROVAL_STATUSES,
  type InboxBadgeData,
} from "./types";

export function computeInboxBadgeData({
  approvals,
  joinRequests,
  dashboard,
  heartbeatRuns,
  mineIssues,
  dismissedAlerts,
  dismissedAtByKey,
  currentUserId,
}: {
  approvals: Approval[];
  joinRequests: JoinRequest[];
  dashboard: DashboardSummary | undefined;
  heartbeatRuns: HeartbeatRun[];
  mineIssues: Issue[];
  dismissedAlerts: Set<string>;
  dismissedAtByKey: ReadonlyMap<string, number>;
  currentUserId?: string | null;
}): InboxBadgeData {
  const actionableApprovals = approvals.filter(
    (approval) =>
      isApprovalVisibleInMine(approval, currentUserId) &&
      ACTIONABLE_APPROVAL_STATUSES.has(approval.status) &&
      !isInboxEntityDismissed(dismissedAtByKey, `approval:${approval.id}`, approval.updatedAt),
  ).length;
  const failedRuns = getLatestFailedRunsByAgent(heartbeatRuns).filter(
    (run) => !isInboxEntityDismissed(dismissedAtByKey, `run:${run.id}`, run.createdAt),
  ).length;
  const visibleJoinRequests = joinRequests.filter(
    (jr) => !isInboxEntityDismissed(dismissedAtByKey, `join:${jr.id}`, jr.updatedAt ?? jr.createdAt),
  ).length;
  const visibleMineIssues = mineIssues.filter((issue) => issue.isUnreadForMe).length;
  const agentErrorCount = dashboard?.agents.error ?? 0;
  const monthBudgetCents = dashboard?.costs.monthBudgetCents ?? 0;
  const monthUtilizationPercent = dashboard?.costs.monthUtilizationPercent ?? 0;
  const showAggregateAgentError =
    agentErrorCount > 0 &&
    failedRuns === 0 &&
    !dismissedAlerts.has("alert:agent-errors");
  const showBudgetAlert =
    monthBudgetCents > 0 &&
    monthUtilizationPercent >= 80 &&
    !dismissedAlerts.has("alert:budget");
  const alerts = Number(showAggregateAgentError) + Number(showBudgetAlert);

  return {
    // The inbox badge reflects personal/actionable work, not company-wide health alerts.
    inbox: actionableApprovals + visibleJoinRequests + failedRuns + visibleMineIssues,
    approvals: actionableApprovals,
    failedRuns,
    joinRequests: visibleJoinRequests,
    mineIssues: visibleMineIssues,
    alerts,
  };
}
