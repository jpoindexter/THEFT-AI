import { useEffect, useState, type ComponentProps } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";
import type { useNavigate } from "../../lib/router";
import type { CompanyUserProfile } from "../../lib/company-members";
import type { InboxTab } from "../../lib/inbox";
import { InboxPageContent } from "./InboxPageContent";
import { InboxHeaderControls } from "./InboxHeaderControls";
import {
  reviewItemCategory,
  reviewItemDetail,
  reviewItemHref,
  reviewItemTitle,
} from "./InboxReviewItems";
import { useInboxDataQueries } from "./useInboxDataQueries";
import { useInboxIssueActions } from "./useInboxIssueActions";
import { useInboxKeyboardShortcuts } from "./useInboxKeyboardShortcuts";
import { useInboxPageSections } from "./useInboxPageSections";
import { useInboxPreferences } from "./useInboxPreferences";
import { useInboxRuntimeActions } from "./useInboxRuntimeActions";
import { useInboxWorkItemsModel } from "./useInboxWorkItemsModel";
import { useInboxWorkspaceGrouping } from "./useInboxWorkspaceGrouping";
import type { InboxIssueColumn } from "../../lib/inbox";

type HeaderCreators = ComponentProps<typeof InboxHeaderControls>["creators"];

export function InboxLoadedContent({
  canArchiveFromTab,
  companyUserLabelMap,
  companyUserProfileMap,
  creatorOptions,
  currentUserId,
  dismissAlert,
  dismissInboxItem,
  dismissedAlerts,
  inboxData,
  issueLinkState,
  keyboardShortcutsEnabled,
  liveIssueIds,
  markItemRead,
  markItemUnread,
  navigate,
  preferences,
  readItems,
  selectedCompanyId,
  tab,
  unreadTouchedIssues,
  visibleMineIssues,
  visibleTrailingIssueColumns,
  workItemsModel,
  workspaceModel,
}: {
  canArchiveFromTab: boolean;
  companyUserLabelMap: ReadonlyMap<string, string>;
  companyUserProfileMap: ReadonlyMap<string, CompanyUserProfile>;
  creatorOptions: HeaderCreators;
  currentUserId: string | null;
  dismissAlert: (key: string) => void;
  dismissInboxItem: (key: string) => void;
  dismissedAlerts: ReadonlySet<string>;
  inboxData: ReturnType<typeof useInboxDataQueries>;
  issueLinkState: unknown;
  keyboardShortcutsEnabled: boolean;
  liveIssueIds: Set<string>;
  markItemRead: (key: string) => void;
  markItemUnread: (key: string) => void;
  navigate: ReturnType<typeof useNavigate>;
  preferences: ReturnType<typeof useInboxPreferences>;
  readItems: Set<string>;
  selectedCompanyId: string;
  tab: InboxTab;
  unreadTouchedIssues: Issue[];
  visibleMineIssues: Issue[];
  visibleTrailingIssueColumns: InboxIssueColumn[];
  workItemsModel: ReturnType<typeof useInboxWorkItemsModel>;
  workspaceModel: ReturnType<typeof useInboxWorkspaceGrouping>;
}) {
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const runtimeActions = useInboxRuntimeActions({ navigate, queryClient, selectedCompanyId, setActionError });
  const issueActions = useInboxIssueActions({
    canArchiveFromTab,
    dismissAlert,
    dismissInboxItem,
    flatNavItems: workItemsModel.flatNavItems,
    markItemRead,
    queryClient,
    readItems,
    selectedCompanyId,
    setActionError,
  });
  useEffect(() => {
    issueActions.setSelectedIndex(-1);
  }, [issueActions.setSelectedIndex, tab]);

  useInboxKeyboardShortcuts({
    archivingIssueIds: issueActions.archivingIssueIds,
    archivingNonIssueIds: issueActions.archivingNonIssueIds,
    canArchive: canArchiveFromTab,
    enabled: keyboardShortcutsEnabled,
    fadingOutIssues: issueActions.fadingOutIssues,
    flatNavItems: workItemsModel.flatNavItems,
    issueLinkState,
    navigate,
    nonInboxSearchIssueIds: workItemsModel.nonInboxSearchIssueIds,
    queryClient,
    readItems,
    selectedIndex: issueActions.selectedIndex,
    setGroupCollapsed: workItemsModel.setGroupCollapsed,
    setSelectedIndex: issueActions.setSelectedIndex,
    undoableArchiveIssueIds: issueActions.undoableArchiveIssueIds,
    unarchivingIssueIds: issueActions.unarchivingIssueIds,
    archiveIssue: (id) => issueActions.archiveIssueMutation.mutate(id),
    archiveNonIssue: issueActions.handleArchiveNonIssue,
    markNonIssueRead: issueActions.handleMarkNonIssueRead,
    markNonIssueUnread: markItemUnread,
    markRead: (id) => issueActions.markReadMutation.mutate(id),
    markUnreadIssue: (id) => issueActions.markUnreadMutation.mutate(id),
    undoArchiveIssue: (id) => issueActions.unarchiveIssueMutation.mutate(id),
  });

  const sections = useInboxPageSections({
    archivingIssueIds: issueActions.archivingIssueIds,
    dashboard: inboxData.dashboard,
    dismissedAlerts,
    fadingOutIssues: issueActions.fadingOutIssues,
    failedRunsCount: workItemsModel.failedRuns.length,
    isApprovalsLoading: inboxData.isApprovalsLoading,
    isDashboardLoading: inboxData.isDashboardLoading,
    isIssuesLoading: inboxData.isIssuesLoading,
    isJoinRequestsLoading: inboxData.isJoinRequestsLoading,
    isMineIssuesLoading: inboxData.isMineIssuesLoading,
    isRunsLoading: inboxData.isRunsLoading,
    isTouchedIssuesLoading: inboxData.isTouchedIssuesLoading,
    showAlertsCategory: workItemsModel.showAlertsCategory,
    tab,
    totalVisibleWorkItems: workItemsModel.totalVisibleWorkItems,
    unreadTouchedIssues,
    visibleMineIssues,
  });

  const agentName = (id: string | null) => (id ? workspaceModel.agentById.get(id) ?? null : null);

  return (
    <InboxPageContent
      actionError={actionError}
      alerts={{
        dashboard: inboxData.dashboard,
        onDismissAlert: dismissAlert,
        showAggregateAgentError: sections.showAggregateAgentError,
        showBudgetAlert: sections.showBudgetAlert,
        visible: sections.showAlertsSection,
      }}
      allLoaded={sections.allLoaded}
      approvalsError={inboxData.approvalsError}
      headerProps={{
        activeIssueFilterCount: preferences.activeIssueFilterCount,
        agents: inboxData.agents,
        allApprovalFilter: preferences.allApprovalFilter,
        allCategoryFilter: preferences.allCategoryFilter,
        availableIssueColumns: preferences.availableIssueColumns,
        canMarkAllRead: sections.canMarkAllRead,
        creators: creatorOptions,
        currentUserId,
        enableWorkspaceGrouping: inboxData.isolatedWorkspacesEnabled,
        groupBy: preferences.groupBy,
        issueFilters: preferences.issueFilters,
        labels: inboxData.labels?.map((label) => ({ id: label.id, name: label.name, color: label.color })),
        markAllReadPending: issueActions.markAllReadMutation.isPending,
        nestingEnabled: workItemsModel.nestingEnabled,
        onApprovalFilterChange: preferences.updateAllApprovalFilter,
        onCategoryFilterChange: preferences.updateAllCategoryFilter,
        onGroupByChange: preferences.updateGroupBy,
        onIssueFiltersChange: preferences.updateIssueFilters,
        onMarkAllRead: () => {
          issueActions.setShowMarkAllReadConfirm(false);
          issueActions.markAllReadMutation.mutate(sections.unreadIssueIds);
        },
        onNavigateTab: (value) => navigate(`/inbox/${value}`),
        onResetColumns: preferences.resetIssueColumns,
        onToggleColumn: preferences.toggleIssueColumn,
        onToggleNesting: workItemsModel.toggleNesting,
        projects: inboxData.projects?.map((project) => ({ id: project.id, name: project.name })),
        searchQuery: preferences.searchQuery,
        setSearchQuery: preferences.setSearchQuery,
        setShowMarkAllReadConfirm: issueActions.setShowMarkAllReadConfirm,
        showApprovalsCategory: workItemsModel.showApprovalsCategory,
        showMarkAllReadConfirm: issueActions.showMarkAllReadConfirm,
        tab,
        unreadIssueIds: sections.unreadIssueIds,
        visibleIssueColumnSet: preferences.visibleIssueColumnSet,
        workspaces: inboxData.isolatedWorkspacesEnabled ? inboxData.executionWorkspaces.filter((w) => w.mode === "isolated_workspace").map((w) => ({ id: w.id, name: w.name })) : undefined,
      }}
      reviewProps={{
        agentById: workspaceModel.agentById,
        getCategory: reviewItemCategory,
        getDetail: reviewItemDetail,
        getHref: reviewItemHref,
        getTitle: reviewItemTitle,
        issueById: workspaceModel.issueById,
        items: workItemsModel.filteredWorkItems,
      }}
      searchQuery={preferences.searchQuery}
      tab={tab}
      visibleSections={sections.visibleSections}
      workItemsProps={sections.showWorkItemsSection ? {
        agentName,
        archiveIssue: (id) => issueActions.archiveIssueMutation.mutate(id),
        archiveIssuePending: issueActions.archiveIssueMutation.isPending,
        archiveNonIssue: issueActions.handleArchiveNonIssue,
        archivingIssueIds: issueActions.archivingIssueIds,
        archivingNonIssueIds: issueActions.archivingNonIssueIds,
        availableIssueColumnSet: preferences.availableIssueColumnSet,
        canArchiveFromTab,
        childFlatIndex: workItemsModel.childFlatIndex,
        collapsedGroupKeys: workItemsModel.collapsedGroupKeys,
        collapsedInboxParents: workItemsModel.collapsedInboxParents,
        companyUserLabelMap,
        companyUserProfileMap,
        currentUserId,
        decisionPending: runtimeActions.approveMutation.isPending || runtimeActions.rejectMutation.isPending,
        fadingOutIssues: issueActions.fadingOutIssues,
        groupBy: preferences.groupBy,
        groupFlatIndex: workItemsModel.groupFlatIndex,
        groupedSections: workItemsModel.groupedSections,
        issueById: workspaceModel.issueById,
        issueLinkState,
        joinDecisionPending: runtimeActions.approveJoinMutation.isPending || runtimeActions.rejectJoinMutation.isPending,
        listRef: issueActions.listRef,
        liveIssueIds,
        markIssueRead: (id) => issueActions.markReadMutation.mutate(id),
        markNonIssueRead: issueActions.handleMarkNonIssueRead,
        nestingEnabled: workItemsModel.nestingEnabled,
        nonIssueUnreadState: issueActions.nonIssueUnreadState,
        onApprove: (id) => runtimeActions.approveMutation.mutate(id),
        onApproveJoinRequest: (joinRequest) => runtimeActions.approveJoinMutation.mutate(joinRequest),
        onDismissRun: dismissInboxItem,
        onReject: (id) => runtimeActions.rejectMutation.mutate(id),
        onRejectJoinRequest: (joinRequest) => runtimeActions.rejectJoinMutation.mutate(joinRequest),
        onRetryRun: (run) => runtimeActions.retryRunMutation.mutate(run),
        projectById: workspaceModel.projectById,
        retryingRunIds: runtimeActions.retryingRunIds,
        selectedIndex: issueActions.selectedIndex,
        setSelectedIndex: issueActions.setSelectedIndex,
        showSeparator: false,
        toggleGroupCollapse: workItemsModel.toggleGroupCollapse,
        toggleInboxParentCollapse: workItemsModel.toggleInboxParentCollapse,
        topFlatIndex: workItemsModel.topFlatIndex,
        visibleIssueColumnSet: preferences.visibleIssueColumnSet,
        visibleTrailingIssueColumns,
        workspaceGrouping: workspaceModel.inboxWorkspaceGrouping,
      } : null}
    />
  );
}
