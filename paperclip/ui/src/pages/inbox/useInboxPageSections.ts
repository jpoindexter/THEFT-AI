import { useMemo } from "react";
import type { DashboardSummary, Issue } from "@paperclipai/shared";
import {
  shouldShowCompanyAlerts,
  shouldShowInboxSection,
  type InboxTab,
} from "../../lib/inbox";

export type InboxSectionKey = "work_items" | "alerts";

export function useInboxPageSections({
  archivingIssueIds,
  dashboard,
  dismissedAlerts,
  fadingOutIssues,
  failedRunsCount,
  isApprovalsLoading,
  isDashboardLoading,
  isIssuesLoading,
  isJoinRequestsLoading,
  isMineIssuesLoading,
  isRunsLoading,
  isTouchedIssuesLoading,
  showAlertsCategory,
  tab,
  totalVisibleWorkItems,
  unreadTouchedIssues,
  visibleMineIssues,
}: {
  archivingIssueIds: ReadonlySet<string>;
  dashboard: DashboardSummary | undefined;
  dismissedAlerts: ReadonlySet<string>;
  fadingOutIssues: ReadonlySet<string>;
  failedRunsCount: number;
  isApprovalsLoading: boolean;
  isDashboardLoading: boolean;
  isIssuesLoading: boolean;
  isJoinRequestsLoading: boolean;
  isMineIssuesLoading: boolean;
  isRunsLoading: boolean;
  isTouchedIssuesLoading: boolean;
  showAlertsCategory: boolean;
  tab: InboxTab;
  totalVisibleWorkItems: number;
  unreadTouchedIssues: Issue[];
  visibleMineIssues: Issue[];
}) {
  const showCompanyAlerts = shouldShowCompanyAlerts(tab) && showAlertsCategory;
  const showAggregateAgentError =
    showCompanyAlerts &&
    !!dashboard &&
    dashboard.agents.error > 0 &&
    failedRunsCount === 0 &&
    !dismissedAlerts.has("alert:agent-errors");
  const showBudgetAlert =
    showCompanyAlerts &&
    !!dashboard &&
    dashboard.costs.monthBudgetCents > 0 &&
    dashboard.costs.monthUtilizationPercent >= 80 &&
    !dismissedAlerts.has("alert:budget");
  const hasAlerts = showAggregateAgentError || showBudgetAlert;
  const showWorkItemsSection = totalVisibleWorkItems > 0;
  const showAlertsSection = shouldShowInboxSection({
    tab,
    hasItems: hasAlerts,
    showOnMine: false,
    showOnRecent: false,
    showOnUnread: false,
    showOnAll: hasAlerts,
  });
  const visibleSections = useMemo<InboxSectionKey[]>(
    () => [
      showAlertsSection ? "alerts" : null,
      showWorkItemsSection ? "work_items" : null,
    ].filter((key): key is InboxSectionKey => key !== null),
    [showAlertsSection, showWorkItemsSection],
  );

  const allLoaded =
    !isJoinRequestsLoading &&
    !isApprovalsLoading &&
    !isDashboardLoading &&
    !isIssuesLoading &&
    !isMineIssuesLoading &&
    !isTouchedIssuesLoading &&
    !isRunsLoading;

  const markAllReadIssues = (tab === "mine" ? visibleMineIssues : unreadTouchedIssues)
    .filter((issue) => issue.isUnreadForMe && !fadingOutIssues.has(issue.id) && !archivingIssueIds.has(issue.id));
  const unreadIssueIds = markAllReadIssues.map((issue) => issue.id);

  return {
    allLoaded,
    canMarkAllRead: unreadIssueIds.length > 0,
    showAggregateAgentError,
    showAlertsSection,
    showBudgetAlert,
    showWorkItemsSection,
    unreadIssueIds,
    visibleSections,
  };
}
