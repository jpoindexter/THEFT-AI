import { useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "@/lib/router";
import { useCompany } from "../context/CompanyContext";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { useGeneralSettings } from "../context/GeneralSettingsContext";
import { useSidebar } from "../context/SidebarContext";
import { collectLiveIssueIds } from "../lib/liveIssueIds";
import { buildCompanyUserLabelMap, buildCompanyUserProfileMap } from "../lib/company-members";
import { createIssueDetailLocationState } from "../lib/issueDetailBreadcrumb";
import { EmptyState } from "../components/EmptyState";
import { issueTrailingColumns } from "../components/IssueColumns";
import { InboxLoadedContent } from "./inbox/InboxLoadedContent";
import { useInboxDataQueries } from "./inbox/useInboxDataQueries";
import { useInboxCreatorOptions } from "./inbox/useInboxCreatorOptions";
import { useInboxWorkItemsModel } from "./inbox/useInboxWorkItemsModel";
import { useInboxWorkspaceGrouping } from "./inbox/useInboxWorkspaceGrouping";
import { useInboxPreferences } from "./inbox/useInboxPreferences";
import { useInboxVisibleIssues } from "./inbox/useInboxVisibleIssues";

import {
  Inbox as InboxIcon,
} from "lucide-react";

import {
  isMineInboxTab,
  saveLastInboxTab,
  type InboxTab,
} from "../lib/inbox";
import { useDismissedInboxAlerts, useInboxDismissals, useReadInboxItems } from "../hooks/useInboxBadge";

export { InboxIssueMetaLeading, InboxIssueTrailingColumns } from "../components/IssueColumns";
export { IssueGroupHeader as InboxGroupHeader } from "../components/IssueGroupHeader";
export { FailedRunInboxRow } from "./inbox/FailedRunInboxRow";
export { formatJoinRequestInboxLabel } from "./inbox/InboxDecisionRows";
export function Inbox() {
  const { selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { isMobile } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { keyboardShortcutsEnabled } = useGeneralSettings();
  const { dismissed: dismissedAlerts, dismiss: dismissAlert } = useDismissedInboxAlerts();
  const { dismissedAtByKey, dismiss: dismissInboxItem } = useInboxDismissals(selectedCompanyId);
  const { readItems, markRead: markItemRead, markUnread: markItemUnread } = useReadInboxItems();

  const pathSegment = location.pathname.split("/").pop() ?? "mine";
  const tab: InboxTab =
    pathSegment === "mine" || pathSegment === "recent" || pathSegment === "all" || pathSegment === "unread"
      ? pathSegment
      : "mine";
  const canArchiveFromTab = isMineInboxTab(tab);
  const issueLinkState = useMemo(
    () =>
      createIssueDetailLocationState(
        "Inbox",
        `${location.pathname}${location.search}${location.hash}`,
        "inbox",
      ),
    [location.pathname, location.search, location.hash],
  );
  const inboxData = useInboxDataQueries(selectedCompanyId);
  const {
    agents,
    approvals,
    companyMembers,
    executionWorkspaces,
    experimentalSettingsLoaded,
    heartbeatRuns,
    isolatedWorkspacesEnabled,
    issues,
    joinRequests,
    liveRuns,
    mineIssuesRaw,
    projects,
    session,
    touchedIssuesRaw,
  } = inboxData;
  const preferences = useInboxPreferences(selectedCompanyId, isolatedWorkspacesEnabled);
  const {
    allApprovalFilter,
    allCategoryFilter,
    availableIssueColumnSet,
    groupBy,
    issueFilters,
    normalizedSearchQuery,
    setGroupBy,
    setSearchQuery,
    visibleIssueColumnSet,
  } = preferences;

  useEffect(() => {
    setBreadcrumbs([{ label: "Inbox" }]);
  }, [setBreadcrumbs]);

  useEffect(() => {
    saveLastInboxTab(tab);
    setSearchQuery("");
  }, [setSearchQuery, tab]);

  const liveIssueIds = useMemo(() => collectLiveIssueIds(liveRuns), [liveRuns]);
  const currentUserId = session?.user.id ?? session?.session.userId ?? null;

  const companyUserLabelMap = useMemo(
    () => buildCompanyUserLabelMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const companyUserProfileMap = useMemo(
    () => buildCompanyUserProfileMap(companyMembers?.users),
    [companyMembers?.users],
  );
  const {
    issuesToRender,
    mineIssues,
    touchedIssues,
    unreadTouchedIssues,
    visibleMineIssues,
    visibleTouchedIssues,
  } = useInboxVisibleIssues({
    currentUserId,
    issueFilters,
    liveIssueIds,
    mineIssuesRaw,
    tab,
    touchedIssuesRaw,
  });
  const creatorOptions = useInboxCreatorOptions({ agents, currentUserId, mineIssues, touchedIssues });

  const workspaceModel = useInboxWorkspaceGrouping({
    agents,
    companyUserLabelMap,
    currentUserId,
    executionWorkspaces,
    issues,
    projects,
  });
  const visibleTrailingIssueColumns = useMemo(
    () => issueTrailingColumns.filter((column) => visibleIssueColumnSet.has(column) && availableIssueColumnSet.has(column)),
    [availableIssueColumnSet, visibleIssueColumnSet],
  );

  const workItemsModel = useInboxWorkItemsModel({
    agentById: workspaceModel.agentById,
    allApprovalFilter,
    allCategoryFilter,
    approvals,
    currentUserId,
    defaultProjectWorkspaceIdByProjectId: workspaceModel.defaultProjectWorkspaceIdByProjectId,
    dismissedAtByKey,
    executionWorkspaceById: workspaceModel.executionWorkspaceById,
    experimentalSettingsLoaded,
    groupBy,
    inboxWorkspaceGrouping: workspaceModel.inboxWorkspaceGrouping,
    isMobile,
    isolatedWorkspacesEnabled,
    issueById: workspaceModel.issueById,
    issueFilters,
    issuesToRender,
    heartbeatRuns,
    joinRequests,
    liveIssueIds,
    normalizedSearchQuery,
    projectWorkspaceById: workspaceModel.projectWorkspaceById,
    selectedCompanyId,
    setGroupBy,
    tab,
    visibleMineIssues,
    visibleTouchedIssues,
  });
  if (!selectedCompanyId) {
    return <EmptyState icon={InboxIcon} message="Select a company to view inbox." />;
  }

  return (
    <InboxLoadedContent
      canArchiveFromTab={canArchiveFromTab}
      companyUserLabelMap={companyUserLabelMap}
      companyUserProfileMap={companyUserProfileMap}
      creatorOptions={creatorOptions}
      currentUserId={currentUserId}
      dismissAlert={dismissAlert}
      dismissInboxItem={dismissInboxItem}
      dismissedAlerts={dismissedAlerts}
      inboxData={inboxData}
      issueLinkState={issueLinkState}
      keyboardShortcutsEnabled={keyboardShortcutsEnabled}
      liveIssueIds={liveIssueIds}
      markItemRead={markItemRead}
      markItemUnread={markItemUnread}
      navigate={navigate}
      preferences={preferences}
      readItems={readItems}
      selectedCompanyId={selectedCompanyId}
      tab={tab}
      unreadTouchedIssues={unreadTouchedIssues}
      visibleMineIssues={visibleMineIssues}
      visibleTrailingIssueColumns={visibleTrailingIssueColumns}
      workItemsModel={workItemsModel}
      workspaceModel={workspaceModel}
    />
  );
}
