import { useMemo, useRef, useState } from "react";
import { useParams } from "@/lib/router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getClosedIsolatedExecutionWorkspaceMessage, isClosedIsolatedExecutionWorkspace, type IssueThreadInteraction } from "@paperclipai/shared";
import { issuesApi } from "../../api/issues";
import { useCompany } from "../../context/CompanyContext";
import { useDialogActions } from "../../context/DialogContext";
import { usePanel } from "../../context/PanelContext";
import { useSidebar } from "../../context/SidebarContext";
import { getIssueDetailQueryOptions } from "../../lib/issueDetailCache";
import type { OptimisticIssueComment } from "../../lib/optimistic-issue-comments";
import { keepPreviousDataForSameQueryTail } from "../../lib/query-placeholder-data";
import { queryKeys } from "../../lib/queryKeys";
import { useIssueDetailChildIssues } from "./useIssueDetailChildIssues";
import { useIssueDetailComments } from "./useIssueDetailComments";
import { useIssueDetailFeedback } from "./useIssueDetailFeedback";
import { useIssueDetailLiveRunState } from "./useIssueDetailLiveRunState";
import { useIssueDetailLookups } from "./useIssueDetailLookups";
import { useIssueDetailRouteEffects, useIssueDetailRouteState } from "./useIssueDetailRouteState";
import { useIssueDetailTabState } from "./useIssueDetailTabState";
import { useIssueDetailThreadState } from "./useIssueDetailThreadState";
import { useIssueDetailTreeControl } from "./useIssueDetailTreeControl";

export function useIssueDetailPrimaryState() {
  const { issueId } = useParams<{ issueId: string }>();
  const { selectedCompanyId } = useCompany();
  const { openNewIssue } = useDialogActions();
  const { openPanel, closePanel, panelVisible, setPanelVisible } = usePanel();
  const queryClient = useQueryClient();
  const { isMobile } = useSidebar();
  const routeState = useIssueDetailRouteState(issueId);
  const {
    isFromInbox,
    issueHeaderSeed,
    location,
    navigate,
    resolvedIssueDetailState,
    sourceBreadcrumb,
    navigationType,
  } = routeState;
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
  const [optimisticComments, setOptimisticComments] = useState<OptimisticIssueComment[]>([]);
  const [locallyQueuedCommentRunIds, setLocallyQueuedCommentRunIds] = useState<Map<string, string>>(() => new Map());
  const cancelledQueuedOptimisticCommentIdsRef = useRef(new Set<string>());
  const tabState = useIssueDetailTabState({ locationHash: location.hash });
  const {
    commentComposerRef,
    detailTab,
    focusCommentComposerFromShortcut,
    handoffFocusSignal,
    restoreQueuedCommentDraft,
    setDetailTab,
  } = tabState;
  const { data: issue, isLoading, error } = useQuery({
    ...getIssueDetailQueryOptions(queryClient, issueId!, {
      placeholderIssue: issueHeaderSeed ? {
        id: issueHeaderSeed.id,
        identifier: issueHeaderSeed.identifier,
      } : null,
    }),
    enabled: !!issueId,
  });
  const resolvedCompanyId = issue?.companyId ?? selectedCompanyId;
  const commentComposerDisabledReason = useMemo(() => {
    if (!issue?.currentExecutionWorkspace || !isClosedIsolatedExecutionWorkspace(issue.currentExecutionWorkspace)) {
      return null;
    }
    return getClosedIsolatedExecutionWorkspaceMessage(issue.currentExecutionWorkspace);
  }, [issue?.currentExecutionWorkspace]);

  const commentState = useIssueDetailComments({ issueId, activeDetailTab: detailTab });
  const {
    comments,
    commentsLoadingOlder,
    hasOlderComments,
    fetchOlderComments,
    refetchComments,
    shouldPrefetchOlderComments,
  } = commentState;
  const { data: interactions = [] } = useQuery({
    queryKey: queryKeys.issues.interactions(issueId!),
    queryFn: () => issuesApi.listInteractions(issueId!),
    enabled: !!issueId,
    placeholderData: keepPreviousDataForSameQueryTail<IssueThreadInteraction[]>(issueId ?? "pending"),
  });

  const { hasLiveRuns } = useIssueDetailLiveRunState({
    issue,
    issueId,
    locallyQueuedCommentRunIds,
    setLocallyQueuedCommentRunIds,
  });
  useIssueDetailRouteEffects({
    hasLiveRuns,
    issue,
    issueId,
    isFromInbox,
    issueHeaderSeed,
    location,
    navigate,
    navigationType,
    resolvedIssueDetailState,
    sourceBreadcrumb,
  });

  const lookups = useIssueDetailLookups({
    issueId,
    issue,
    selectedCompanyId,
    resolvedCompanyId,
    detailTab,
  });
  const childState = useIssueDetailChildIssues({
    issue,
    resolvedCompanyId,
    currentUserId: lookups.currentUserId,
    openNewIssue,
  });
  const treeControl = useIssueDetailTreeControl({
    issueId,
    issue,
    selectedCompanyId,
    childIssues: childState.childIssues,
    canManageTreeControl: lookups.canManageTreeControl,
    agentMap: lookups.agentMap,
  });
  const feedback = useIssueDetailFeedback({
    currentUserId: lookups.currentUserId,
    feedbackDataSharingPreference: lookups.feedbackDataSharingPreference,
    issueId,
  });
  const threadState = useIssueDetailThreadState({
    agents: lookups.agents,
    comments,
    companyUsers: lookups.companyMembers?.users,
    currentUserId: lookups.currentUserId,
    issue,
    optimisticComments,
  });

  return {
    issueId,
    selectedCompanyId,
    openPanel,
    closePanel,
    panelVisible,
    setPanelVisible,
    isMobile,
    routeState,
    isFromInbox,
    issueHeaderSeed,
    location,
    navigate,
    resolvedIssueDetailState,
    sourceBreadcrumb,
    moreOpen,
    setMoreOpen,
    mobilePropsOpen,
    setMobilePropsOpen,
    optimisticComments,
    setOptimisticComments,
    locallyQueuedCommentRunIds,
    setLocallyQueuedCommentRunIds,
    cancelledQueuedOptimisticCommentIdsRef,
    commentComposerRef,
    detailTab,
    focusCommentComposerFromShortcut,
    handoffFocusSignal,
    restoreQueuedCommentDraft,
    setDetailTab,
    issue,
    isLoading,
    error,
    resolvedCompanyId,
    commentComposerDisabledReason,
    commentsLoadingOlder,
    hasOlderComments,
    fetchOlderComments,
    refetchComments,
    shouldPrefetchOlderComments,
    interactions,
    hasLiveRuns,
    ...lookups,
    ...childState,
    ...treeControl,
    ...feedback,
    ...threadState,
  };
}

export type IssueDetailPrimaryState = ReturnType<typeof useIssueDetailPrimaryState>;
