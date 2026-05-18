import { useCallback, useEffect, useMemo, useState } from "react";
import type { Approval, HeartbeatRun, Issue, JoinRequest } from "@paperclipai/shared";
import { useQuery } from "@tanstack/react-query";
import { issuesApi } from "../../api/issues";
import { approvalLabel } from "../../components/ApprovalPayload";
import { queryKeys } from "../../lib/queryKeys";
import {
  buildGroupedInboxSections,
  buildInboxKeyboardNavEntries,
  getApprovalsForTab,
  getArchivedInboxSearchIssues,
  getInboxSearchSupplementIssues,
  getInboxWorkItems,
  getLatestFailedRunsByAgent,
  isInboxEntityDismissed,
  loadCollapsedInboxGroupKeys,
  loadInboxNesting,
  matchesInboxIssueSearch,
  resolveInboxNestingEnabled,
  saveCollapsedInboxGroupKeys,
  saveInboxNesting,
  saveInboxWorkItemGroupBy,
  shouldResetInboxWorkspaceGrouping,
  type InboxApprovalFilter,
  type InboxGroupedSection,
  type InboxTab,
  type InboxWorkItemGroupBy,
  type InboxWorkspaceGroupingOptions,
} from "../../lib/inbox";
import type { IssueFilterState } from "../../lib/issue-filters";
import { readIssueIdFromRun, runFailureMessage } from "./InboxReviewItems";

export function useInboxWorkItemsModel({
  agentById,
  allApprovalFilter,
  allCategoryFilter,
  approvals,
  currentUserId,
  defaultProjectWorkspaceIdByProjectId,
  dismissedAtByKey,
  executionWorkspaceById,
  experimentalSettingsLoaded,
  groupBy,
  inboxWorkspaceGrouping,
  isMobile,
  isolatedWorkspacesEnabled,
  issueById,
  issueFilters,
  issuesToRender,
  heartbeatRuns,
  joinRequests,
  liveIssueIds,
  normalizedSearchQuery,
  projectWorkspaceById,
  selectedCompanyId,
  setGroupBy,
  tab,
  visibleMineIssues,
  visibleTouchedIssues,
}: {
  agentById: Map<string, string>;
  allApprovalFilter: InboxApprovalFilter;
  allCategoryFilter: string;
  approvals: Approval[] | undefined;
  currentUserId: string | null;
  defaultProjectWorkspaceIdByProjectId: Map<string, string>;
  dismissedAtByKey: Map<string, number>;
  executionWorkspaceById: InboxWorkspaceGroupingOptions["executionWorkspaceById"];
  experimentalSettingsLoaded: boolean;
  groupBy: InboxWorkItemGroupBy;
  inboxWorkspaceGrouping: InboxWorkspaceGroupingOptions;
  isMobile: boolean;
  isolatedWorkspacesEnabled: boolean;
  issueById: Map<string, Issue>;
  issueFilters: IssueFilterState;
  issuesToRender: Issue[];
  heartbeatRuns: HeartbeatRun[] | undefined;
  joinRequests: JoinRequest[];
  liveIssueIds: Set<string>;
  normalizedSearchQuery: string;
  projectWorkspaceById: Map<string, { name: string }>;
  selectedCompanyId: string | null;
  setGroupBy: (value: InboxWorkItemGroupBy) => void;
  tab: InboxTab;
  visibleMineIssues: Issue[];
  visibleTouchedIssues: Issue[];
}) {
  const showJoinRequestsCategory = allCategoryFilter === "everything" || allCategoryFilter === "join_requests";
  const showTouchedCategory = allCategoryFilter === "everything" || allCategoryFilter === "issues_i_touched";
  const showApprovalsCategory = allCategoryFilter === "everything" || allCategoryFilter === "approvals";
  const showFailedRunsCategory = allCategoryFilter === "everything" || allCategoryFilter === "failed_runs";
  const showAlertsCategory = allCategoryFilter === "everything" || allCategoryFilter === "alerts";

  const failedRuns = useMemo(
    () => getLatestFailedRunsByAgent(heartbeatRuns ?? []).filter((run) => !isInboxEntityDismissed(dismissedAtByKey, `run:${run.id}`, run.createdAt)),
    [heartbeatRuns, dismissedAtByKey],
  );
  const approvalsToRender = useMemo(() => {
    let filtered = getApprovalsForTab(approvals ?? [], tab, allApprovalFilter, currentUserId);
    if (tab === "mine") filtered = filtered.filter((approval) => !isInboxEntityDismissed(dismissedAtByKey, `approval:${approval.id}`, approval.updatedAt));
    return filtered;
  }, [approvals, tab, allApprovalFilter, currentUserId, dismissedAtByKey]);
  const failedRunsForTab = useMemo(() => (tab === "all" && !showFailedRunsCategory ? [] : failedRuns), [failedRuns, tab, showFailedRunsCategory]);
  const joinRequestsForTab = useMemo(() => {
    if (tab === "all" && !showJoinRequestsCategory) return [];
    if (tab === "mine") return joinRequests.filter((jr) => !isInboxEntityDismissed(dismissedAtByKey, `join:${jr.id}`, jr.updatedAt ?? jr.createdAt));
    return joinRequests;
  }, [joinRequests, tab, showJoinRequestsCategory, dismissedAtByKey]);
  const workItemsToRender = useMemo(
    () => getInboxWorkItems({
      issues: tab === "all" && !showTouchedCategory ? [] : issuesToRender,
      approvals: tab === "all" && !showApprovalsCategory ? [] : approvalsToRender,
      failedRuns: failedRunsForTab,
      joinRequests: joinRequestsForTab,
    }),
    [approvalsToRender, failedRunsForTab, issuesToRender, joinRequestsForTab, showApprovalsCategory, showTouchedCategory, tab],
  );
  const filteredWorkItems = useMemo(() => {
    const query = normalizedSearchQuery.toLowerCase();
    if (!query) return workItemsToRender;
    return workItemsToRender.filter((item) => matchesWorkItem(item, query, {
      agentById,
      defaultProjectWorkspaceIdByProjectId,
      executionWorkspaceById,
      issueById,
      isolatedWorkspacesEnabled,
      projectWorkspaceById,
    }));
  }, [agentById, defaultProjectWorkspaceIdByProjectId, executionWorkspaceById, issueById, isolatedWorkspacesEnabled, normalizedSearchQuery, projectWorkspaceById, workItemsToRender]);

  const archivedSearchIssues = useMemo(
    () => tab === "mine"
      ? getArchivedInboxSearchIssues({
        visibleIssues: visibleMineIssues,
        searchableIssues: visibleTouchedIssues,
        query: normalizedSearchQuery,
        isolatedWorkspacesEnabled,
        executionWorkspaceById,
        projectWorkspaceById,
        defaultProjectWorkspaceIdByProjectId,
      })
      : [],
    [defaultProjectWorkspaceIdByProjectId, executionWorkspaceById, isolatedWorkspacesEnabled, normalizedSearchQuery, projectWorkspaceById, tab, visibleMineIssues, visibleTouchedIssues],
  );
  const { data: remoteIssueSearchResults = [] } = useQuery({
    queryKey: [...queryKeys.issues.search(selectedCompanyId!, normalizedSearchQuery, undefined, 25), "inbox-supplement"],
    queryFn: () => issuesApi.list(selectedCompanyId!, { q: normalizedSearchQuery, limit: 25, includeRoutineExecutions: true }),
    enabled: !!selectedCompanyId && normalizedSearchQuery.length > 0,
    placeholderData: (previousData) => previousData,
  });
  const issueSearchSupplementResults = useMemo(
    () => getInboxSearchSupplementIssues({
      query: normalizedSearchQuery,
      filteredWorkItems,
      archivedSearchIssues,
      remoteIssues: remoteIssueSearchResults,
      issueFilters,
      currentUserId,
      enableRoutineVisibilityFilter: true,
      liveIssueIds,
    }),
    [archivedSearchIssues, currentUserId, filteredWorkItems, issueFilters, liveIssueIds, normalizedSearchQuery, remoteIssueSearchResults],
  );
  const nonInboxSearchIssueIds = useMemo(
    () => new Set([...archivedSearchIssues.map((issue) => issue.id), ...issueSearchSupplementResults.map((issue) => issue.id)]),
    [archivedSearchIssues, issueSearchSupplementResults],
  );

  const [nestingPreferenceEnabled, setNestingPreferenceEnabled] = useState(() => loadInboxNesting());
  const nestingEnabled = resolveInboxNestingEnabled(nestingPreferenceEnabled, isMobile);
  useEffect(() => {
    if (!shouldResetInboxWorkspaceGrouping(groupBy, isolatedWorkspacesEnabled, experimentalSettingsLoaded)) return;
    setGroupBy("none");
    saveInboxWorkItemGroupBy("none");
  }, [experimentalSettingsLoaded, groupBy, isolatedWorkspacesEnabled, setGroupBy]);
  const toggleNesting = useCallback(() => {
    setNestingPreferenceEnabled((prev) => {
      const next = !prev;
      saveInboxNesting(next);
      return next;
    });
  }, []);
  const [collapsedInboxParents, setCollapsedInboxParents] = useState<Set<string>>(new Set());
  const [collapsedGroupKeys, setCollapsedGroupKeys] = useState<Set<string>>(() => loadCollapsedInboxGroupKeys(selectedCompanyId));
  useEffect(() => {
    setCollapsedGroupKeys(loadCollapsedInboxGroupKeys(selectedCompanyId));
  }, [selectedCompanyId]);
  const toggleGroupCollapse = useCallback((groupKey: string) => {
    setCollapsedGroupKeys((prev) => updateCollapsedGroup(prev, groupKey, selectedCompanyId));
  }, [selectedCompanyId]);
  const setGroupCollapsed = useCallback((groupKey: string, collapsed: boolean) => {
    setCollapsedGroupKeys((prev) => {
      if (collapsed ? prev.has(groupKey) : !prev.has(groupKey)) return prev;
      return updateCollapsedGroup(prev, groupKey, selectedCompanyId, collapsed);
    });
  }, [selectedCompanyId]);

  const groupedSections = useMemo<InboxGroupedSection[]>(() => [
    ...buildGroupedInboxSections(filteredWorkItems, groupBy, inboxWorkspaceGrouping, { nestingEnabled }),
    ...buildGroupedInboxSections(getInboxWorkItems({ issues: archivedSearchIssues, approvals: [] }), groupBy, inboxWorkspaceGrouping, { keyPrefix: "archived-search:", searchSection: "archived", nestingEnabled }),
    ...buildGroupedInboxSections(getInboxWorkItems({ issues: issueSearchSupplementResults, approvals: [] }), groupBy, inboxWorkspaceGrouping, { keyPrefix: "other-search:", searchSection: "other", nestingEnabled }),
  ], [archivedSearchIssues, filteredWorkItems, groupBy, inboxWorkspaceGrouping, issueSearchSupplementResults, nestingEnabled]);
  const totalVisibleWorkItems = useMemo(() => groupedSections.reduce((count, group) => count + group.displayItems.length, 0), [groupedSections]);
  const toggleInboxParentCollapse = useCallback((parentId: string) => {
    setCollapsedInboxParents((prev) => updateSetMembership(prev, parentId));
  }, []);
  const flatNavItems = useMemo(() => buildInboxKeyboardNavEntries(groupedSections, collapsedGroupKeys, collapsedInboxParents), [collapsedGroupKeys, collapsedInboxParents, groupedSections]);
  const topFlatIndex = useMemo(() => indexNavItems(flatNavItems, "top"), [flatNavItems]);
  const childFlatIndex = useMemo(() => indexNavItems(flatNavItems, "child"), [flatNavItems]);
  const groupFlatIndex = useMemo(() => indexNavItems(flatNavItems, "group"), [flatNavItems]);

  return {
    archivedSearchIssues,
    childFlatIndex,
    collapsedGroupKeys,
    collapsedInboxParents,
    failedRuns,
    filteredWorkItems,
    flatNavItems,
    groupFlatIndex,
    groupedSections,
    issueSearchSupplementResults,
    nestingEnabled,
    nonInboxSearchIssueIds,
    showAlertsCategory,
    showApprovalsCategory,
    setGroupCollapsed,
    toggleGroupCollapse,
    toggleInboxParentCollapse,
    toggleNesting,
    topFlatIndex,
    totalVisibleWorkItems,
  };
}

type SearchLookups = Pick<InboxWorkspaceGroupingOptions, "executionWorkspaceById" | "defaultProjectWorkspaceIdByProjectId"> & {
  agentById: Map<string, string>;
  issueById: Map<string, Issue>;
  isolatedWorkspacesEnabled: boolean;
  projectWorkspaceById: Map<string, { name: string }>;
};

function matchesWorkItem(item: ReturnType<typeof getInboxWorkItems>[number], query: string, lookups: SearchLookups) {
  if (item.kind === "issue") {
    return matchesInboxIssueSearch(item.issue, query, lookups);
  }
  if (item.kind === "approval") {
    const label = approvalLabel(item.approval.type, item.approval.payload as Record<string, unknown> | null);
    return label.toLowerCase().includes(query) || item.approval.type.toLowerCase().includes(query);
  }
  if (item.kind === "failed_run") {
    const name = lookups.agentById.get(item.run.agentId);
    if (name?.toLowerCase().includes(query) || runFailureMessage(item.run).toLowerCase().includes(query)) return true;
    const issueId = readIssueIdFromRun(item.run);
    const issue = issueId ? lookups.issueById.get(issueId) : null;
    return !!issue && (issue.title.toLowerCase().includes(query) || !!issue.identifier?.toLowerCase().includes(query));
  }
  return !!item.joinRequest.agentName?.toLowerCase().includes(query) || !!item.joinRequest.capabilities?.toLowerCase().includes(query);
}

function updateSetMembership(values: Set<string>, value: string) {
  const next = new Set(values);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

function updateCollapsedGroup(values: Set<string>, key: string, companyId: string | null, force?: boolean) {
  const next = new Set(values);
  if (force ?? !next.has(key)) next.add(key);
  else next.delete(key);
  saveCollapsedInboxGroupKeys(companyId, next);
  return next;
}

function indexNavItems(items: ReturnType<typeof buildInboxKeyboardNavEntries>, type: "top" | "child" | "group") {
  const map = new Map<string, number>();
  items.forEach((entry, index) => {
    if (type === "top" && entry.type === "top") map.set(entry.itemKey, index);
    if (type === "child" && entry.type === "child") map.set(entry.issueId, index);
    if (type === "group" && entry.type === "group") map.set(entry.groupKey, index);
  });
  return map;
}
