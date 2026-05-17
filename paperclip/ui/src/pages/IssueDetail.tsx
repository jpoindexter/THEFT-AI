import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "@/lib/router";
import { useQuery, useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { issuesApi } from "../api/issues";
import { heartbeatsApi, type ActiveRunForIssue, type LiveRunForIssue } from "../api/heartbeats";
import { useCompany } from "../context/CompanyContext";
import { useDialogActions } from "../context/DialogContext";
import { usePanel } from "../context/PanelContext";
import { useSidebar } from "../context/SidebarContext";
import { useToastActions } from "../context/ToastContext";
import { assigneeValueFromSelection, suggestedCommentAssigneeValue } from "../lib/assignees";
import { buildCompanyUserInlineOptions } from "../lib/company-members";
import { queryKeys } from "../lib/queryKeys";
import { keepPreviousDataForSameQueryTail } from "../lib/query-placeholder-data";
import { shouldTrackIssueActiveRun } from "../lib/issueActiveRun";
import { getIssueDetailQueryOptions } from "../lib/issueDetailCache";
import {
  loadRemainingIssueCommentPages,
  matchesIssueRef,
  mergeIssueComments,
  type OptimisticIssueComment,
} from "../lib/optimistic-issue-comments";
import type { IssueChatComposerHandle } from "../components/IssueChatThread";
import { IssueProperties } from "../components/IssueProperties";
import { ScrollToBottom } from "../components/ScrollToBottom";
import { IssueDetailArtifactsSection } from "../components/issue-detail/IssueDetailArtifactsSection";
import { IssueDetailMobilePropertiesSheet } from "../components/issue-detail/IssueDetailMobilePropertiesSheet";
import { IssueDetailTabs } from "../components/issue-detail/IssueDetailTabs";
import type { IssueDetailComment } from "../components/issue-detail/IssueDetailChatTypes";
import { IssueDetailPluginOutlets } from "../components/issue-detail/IssueDetailPluginOutlets";
import { IssueDetailReviewHeader } from "../components/issue-detail/IssueDetailReviewHeader";
import { IssueDetailSubIssuesSection } from "../components/issue-detail/IssueDetailSubIssuesSection";
import { IssueDetailTitleSection } from "../components/issue-detail/IssueDetailTitleSection";
import { IssueDetailLoadingState } from "../components/issue-detail/IssueDetailLoadingState";
import {
  truncate,
} from "../components/issue-detail/IssueDetailUtils";
import { IssueTreeControlDialog } from "../components/issue-detail/IssueTreeControlDialog";
import {
  ISSUE_COMMENT_PAGE_SIZE,
  JUMP_TO_LATEST_MAX_COMMENT_PAGES,
  useIssueDetailComments,
} from "../components/issue-detail/useIssueDetailComments";
import { useIssueDetailApprovals } from "../components/issue-detail/useIssueDetailApprovals";
import { useIssueDetailAttachments } from "../components/issue-detail/useIssueDetailAttachments";
import { useIssueDetailCacheActions } from "../components/issue-detail/useIssueDetailCacheActions";
import { useIssueDetailChildIssues } from "../components/issue-detail/useIssueDetailChildIssues";
import { useIssueDetailCommentPosting } from "../components/issue-detail/useIssueDetailCommentPosting";
import { useIssueDetailFeedback } from "../components/issue-detail/useIssueDetailFeedback";
import { useIssueDetailInboxToolbar } from "../components/issue-detail/useIssueDetailInboxToolbar";
import { useIssueDetailInteractions } from "../components/issue-detail/useIssueDetailInteractions";
import { useIssueDetailKeyboardShortcuts } from "../components/issue-detail/useIssueDetailKeyboardShortcuts";
import { useIssueDetailLookups } from "../components/issue-detail/useIssueDetailLookups";
import { useIssueDetailQueuedCommentActions } from "../components/issue-detail/useIssueDetailQueuedCommentActions";
import { useIssueDetailRouteEffects, useIssueDetailRouteState } from "../components/issue-detail/useIssueDetailRouteState";
import { useIssueDetailTreeControl } from "../components/issue-detail/useIssueDetailTreeControl";
import { Separator } from "@/components/ui/separator";
import { TheftDetailReviewTemplate } from "@/components/theft/templates/TheftDetailReviewTemplate";
import {
  AlertTriangle,
  ArrowLeft,
  Library,
  MoreVertical,
} from "lucide-react";
import {
  getClosedIsolatedExecutionWorkspaceMessage,
  isClosedIsolatedExecutionWorkspace,
  ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY,
  type ActivityEvent,
  type Issue,
  type IssueComment,
  type IssueWorkMode,
  type IssueThreadInteraction,
} from "@paperclipai/shared";

const FEEDBACK_TERMS_URL = import.meta.env.VITE_FEEDBACK_TERMS_URL?.trim() || "https://paperclip.ing/tos";
export function IssueDetail() {
  const { issueId } = useParams<{ issueId: string }>();
  const { selectedCompanyId } = useCompany();
  const { openNewIssue } = useDialogActions();
  const { openPanel, closePanel, panelVisible, setPanelVisible } = usePanel();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const { isMobile } = useSidebar();
  const {
    isFromInbox,
    issueHeaderSeed,
    location,
    navigate,
    resolvedIssueDetailState,
    sourceBreadcrumb,
    navigationType,
  } = useIssueDetailRouteState(issueId);
  const [moreOpen, setMoreOpen] = useState(false);
  const [mobilePropsOpen, setMobilePropsOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("related-work");
  const [handoffFocusSignal, setHandoffFocusSignal] = useState(0);
  const [optimisticComments, setOptimisticComments] = useState<OptimisticIssueComment[]>([]);
  const [locallyQueuedCommentRunIds, setLocallyQueuedCommentRunIds] = useState<Map<string, string>>(() => new Map());
  const [pendingCommentComposerFocusKey, setPendingCommentComposerFocusKey] = useState(0);
  const lastMarkedReadIssueIdRef = useRef<string | null>(null);
  const commentComposerRef = useRef<IssueChatComposerHandle | null>(null);
  const cancelledQueuedOptimisticCommentIdsRef = useRef(new Set<string>());
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

  const {
    comments,
    commentsLoading,
    commentsLoadingOlder,
    hasOlderComments,
    fetchOlderComments,
    refetchComments,
    shouldPrefetchOlderComments,
  } = useIssueDetailComments({ issueId, activeDetailTab: detailTab });
  const { data: interactions = [] } = useQuery({
    queryKey: queryKeys.issues.interactions(issueId!),
    queryFn: () => issuesApi.listInteractions(issueId!),
    enabled: !!issueId,
    placeholderData: keepPreviousDataForSameQueryTail<IssueThreadInteraction[]>(issueId ?? "pending"),
  });

  const { data: liveRunCount = 0 } = useQuery<LiveRunForIssue[], Error, number>({
    queryKey: queryKeys.issues.liveRuns(issueId!),
    queryFn: () => heartbeatsApi.liveRunsForIssue(issueId!),
    enabled: !!issueId,
    refetchInterval: 3000,
    select: (runs) => runs.length,
    placeholderData: keepPreviousDataForSameQueryTail<LiveRunForIssue[]>(issueId ?? "pending"),
  });

  const { data: hasActiveRun = false } = useQuery<ActiveRunForIssue | null, Error, boolean>({
    queryKey: queryKeys.issues.activeRun(issueId!),
    queryFn: () => heartbeatsApi.activeRunForIssue(issueId!),
    enabled: !!issueId && (!!issue?.executionRunId || issue?.status === "in_progress"),
    refetchInterval: liveRunCount > 0 ? false : 3000,
    select: (run) => !!run,
    placeholderData: keepPreviousDataForSameQueryTail<ActiveRunForIssue | null>(issueId ?? "pending"),
  });
  const resolvedHasActiveRun = issue ? shouldTrackIssueActiveRun(issue) && hasActiveRun : hasActiveRun;
  const hasLiveRuns = liveRunCount > 0 || resolvedHasActiveRun;
  useEffect(() => {
    if (!hasLiveRuns && locallyQueuedCommentRunIds.size > 0) {
      setLocallyQueuedCommentRunIds(new Map());
    }
  }, [hasLiveRuns, locallyQueuedCommentRunIds.size]);
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

  const {
    agents,
    companyMembers,
    session,
    projects,
    currentUserId,
    canManageTreeControl,
    feedbackVotes,
    keyboardShortcutsEnabled,
    feedbackDataSharingPreference,
    issuePluginTabItems,
    activePluginTab,
    agentMap,
    userProfileMap,
    userLabelMap,
    mentionOptions,
    resolvedProject,
  } = useIssueDetailLookups({
    issueId,
    issue,
    selectedCompanyId,
    resolvedCompanyId,
    detailTab,
  });
  const {
    childIssues,
    childIssuesLoading,
    liveIssueIds,
    issuePanelKey,
    panelIssue,
    panelChildIssues,
    showRichSubIssuesSection,
    openNewSubIssue,
  } = useIssueDetailChildIssues({
    issue,
    resolvedCompanyId,
    currentUserId,
    openNewIssue,
  });
  const {
    activePauseHold,
    activePauseHoldRoot,
    activeRootPauseHold,
    childPauseBadgeById,
    composerHint,
    heldDescendantCount,
    mutedChildIssueIds,
    queuedCommentReason,
    canPauseLeafWork,
    canResumeLeafWork,
    canResumeSubtree,
    canRestoreSubtree,
    canShowSubtreeControls,
    pauseIssueWorkRun,
    treeControlDialogProps,
    openCancelSubtreeControl,
    openPauseLeafControl,
    openPauseSubtreeControl,
    openRestoreSubtreeControl,
    openResumeControl,
    openResumeLeafControl,
    openResumeSubtreeControl,
  } = useIssueDetailTreeControl({
    issueId,
    issue,
    selectedCompanyId,
    childIssues,
    canManageTreeControl,
    agentMap,
  });
  const {
    handleCommentVote,
    handleDocumentVote,
  } = useIssueDetailFeedback({
    currentUserId,
    feedbackDataSharingPreference,
    issueId,
  });

  const commentReassignOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; searchText?: string }> = [];
    options.push(...buildCompanyUserInlineOptions(companyMembers?.users, { excludeUserIds: [currentUserId] }));
    const activeAgents = [...(agents ?? [])]
      .filter((agent) => agent.status !== "terminated")
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const agent of activeAgents) {
      options.push({ id: `agent:${agent.id}`, label: agent.name });
    }
    if (currentUserId) {
      options.push({ id: `user:${currentUserId}`, label: "Me" });
    }
    return options;
  }, [agents, companyMembers?.users, currentUserId]);

  const actualAssigneeValue = useMemo(
    () => assigneeValueFromSelection(issue ?? {}),
    [issue],
  );

  const suggestedAssigneeValue = useMemo(
    () =>
      suggestedCommentAssigneeValue(
        issue ?? {},
        mergeIssueComments(comments ?? [], optimisticComments),
        currentUserId,
      ),
    [issue, comments, optimisticComments, currentUserId],
  );

  const threadComments = useMemo(
    () => mergeIssueComments(comments ?? [], optimisticComments),
    [comments, optimisticComments],
  );
  const {
    applyOptimisticIssueCacheUpdate,
    invalidateIssueCollections,
    invalidateIssueDetail,
    invalidateIssueRunState,
    invalidateIssueThreadLazily,
    issueCacheRefs,
    mergeIssueResponseIntoCaches,
    removeCommentFromCache,
    upsertInteractionInCache,
  } = useIssueDetailCacheActions({
    issue,
    issueId,
    selectedCompanyId,
  });
  const {
    attachmentError,
    attachmentUploadButton,
    attachmentsInitialLoading,
    deleteAttachmentPending,
    galleryIndex,
    galleryOpen,
    handleAttachmentFiles,
    handleChatImageClick,
    handleCommentAttachImage,
    handleCommentImageUpload,
    handleDeleteAttachment,
    handleDropDescriptionFile,
    handleOpenAttachmentImage,
    handleUploadImageForMarkdown,
    hasAttachments,
    imageAttachments,
    nonImageAttachments,
    setAttachmentDragActive,
    setGalleryOpen,
  } = useIssueDetailAttachments({
    issueId,
    issue,
    selectedCompanyId,
    invalidateIssueDetail,
  });

  const restoreQueuedCommentDraft = useCallback((body: string) => {
    commentComposerRef.current?.restoreDraft(body);
  }, []);

  const {
    handleApprovalAction,
    pendingApprovalAction,
  } = useIssueDetailApprovals({
    invalidateIssueCollections,
    invalidateIssueDetail,
    issueId,
    resolvedCompanyId,
  });
  const markIssueRead = useMutation({
    mutationFn: (id: string) => issuesApi.markRead(id),
    onSuccess: () => {
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId) });
      }
    },
  });

  const updateIssue = useMutation({
    mutationFn: (data: Record<string, unknown>) => issuesApi.update(issueId!, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId!) });
      if (selectedCompanyId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
      }

      const previousIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId!));
      const issueRefs = new Set<string>([issueId!]);
      if (previousIssue?.id) issueRefs.add(previousIssue.id);
      if (previousIssue?.identifier) issueRefs.add(previousIssue.identifier);

      const previousDetailQueries = queryClient
        .getQueriesData<Issue>({ queryKey: ["issues", "detail"] })
        .filter(([, cachedIssue]) => cachedIssue && matchesIssueRef(cachedIssue, issueRefs));
      const previousList = selectedCompanyId
        ? queryClient.getQueryData<Issue[]>(queryKeys.issues.list(selectedCompanyId))
        : undefined;

      applyOptimisticIssueCacheUpdate(issueRefs, data);

      return { previousDetailQueries, previousList, selectedCompanyId };
    },
    onSuccess: ({ comment: _comment, ...nextIssue }) => {
      const issueRefs = new Set<string>([issueId!, nextIssue.id]);
      if (nextIssue.identifier) issueRefs.add(nextIssue.identifier);
      mergeIssueResponseIntoCaches(issueRefs, nextIssue);
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(issueId!) });
      invalidateIssueCollections();
    },
    onError: (err, _variables, context) => {
      for (const [queryKey, previousIssue] of context?.previousDetailQueries ?? []) {
        queryClient.setQueryData(queryKey, previousIssue);
      }
      if (context?.selectedCompanyId) {
        queryClient.setQueryData(queryKeys.issues.list(context.selectedCompanyId), context.previousList);
      }
      pushToast({
        title: "Issue update failed",
        body: err instanceof Error ? err.message : "Unable to save issue changes",
        tone: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId!) });
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
      }
    },
  });
  const handleIssuePropertiesUpdate = useCallback((data: Record<string, unknown>) => {
    updateIssue.mutate(data);
  }, [updateIssue.mutate]);

  const updateChildIssue = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => issuesApi.update(id, data),
    onSuccess: () => {
      if (resolvedCompanyId) {
        queryClient.invalidateQueries({ queryKey: ["issues", resolvedCompanyId] });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(resolvedCompanyId) });
      }
    },
    onError: (err) => {
      pushToast({
        title: "Issue update failed",
        body: err instanceof Error ? err.message : "Unable to save sub-issue changes",
        tone: "error",
      });
    },
  });
  const handleChildIssueUpdate = useCallback((id: string, data: Record<string, unknown>) => {
    updateChildIssue.mutate({ id, data });
  }, [updateChildIssue]);

  const checkIssueMonitorNow = useMutation({
    mutationFn: () => issuesApi.checkMonitorNow(issueId!),
    onSuccess: () => {
      invalidateIssueDetail();
      invalidateIssueRunState();
      invalidateIssueCollections();
      pushToast({
        title: "Monitor check queued",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Monitor check failed",
        body: err instanceof Error ? err.message : "Unable to trigger the monitor right now",
        tone: "error",
      });
    },
  });

  const { handleChatAdd } = useIssueDetailCommentPosting({
    cancelledQueuedOptimisticCommentIdsRef,
    currentUserId,
    invalidateIssueCollections,
    invalidateIssueDetail,
    invalidateIssueRunState,
    invalidateIssueThreadLazily,
    issue,
    issueId,
    setLocallyQueuedCommentRunIds,
    setOptimisticComments,
  });
  const {
    handleAcceptInteraction,
    handleCancelInteraction,
    handleRejectInteraction,
    handleSubmitInteractionAnswers,
  } = useIssueDetailInteractions({
    invalidateIssueCollections,
    invalidateIssueDetail,
    issue,
    issueId,
    resolvedCompanyId,
    upsertInteractionInCache,
  });

  const {
    handleCancelQueuedComment,
    handleInterruptQueuedRun,
    interruptingQueuedRunId,
  } = useIssueDetailQueuedCommentActions({
    cancelledQueuedOptimisticCommentIdsRef,
    invalidateIssueCollections,
    invalidateIssueDetail,
    invalidateIssueRunState,
    invalidateIssueThreadLazily,
    issueCacheRefs,
    issueId,
    locallyQueuedCommentRunIds,
    removeCommentFromCache,
    restoreQueuedCommentDraft,
    setLocallyQueuedCommentRunIds,
    setOptimisticComments,
  });

  const archiveFromInbox = useMutation({
    mutationFn: (id: string) => issuesApi.archiveFromInbox(id),
    onSuccess: () => {
      invalidateIssueCollections();
      navigate(sourceBreadcrumb.href.startsWith("/inbox") ? sourceBreadcrumb.href : "/inbox", { replace: true });
      pushToast({ title: "Issue archived from inbox", tone: "success" });
    },
    onError: (err) => {
      pushToast({
        title: "Archive failed",
        body: err instanceof Error ? err.message : "Unable to archive this issue from the inbox",
        tone: "error",
      });
    },
  });
  const archivePending = archiveFromInbox.isPending;
  const issueHidden = !!issue?.hiddenAt;
  const archiveIssueFromInbox = useCallback((id: string) => {
    if (!archiveFromInbox.isPending) archiveFromInbox.mutate(id);
  }, [archiveFromInbox.isPending, archiveFromInbox.mutate]);
  const navigateToInbox = useCallback(() => {
    navigate(sourceBreadcrumb.href.startsWith("/inbox") ? sourceBreadcrumb.href : "/inbox");
  }, [navigate, sourceBreadcrumb.href]);
  const focusCommentComposerFromShortcut = useCallback(() => {
    setDetailTab("chat");
    setPendingCommentComposerFocusKey((current) => current + 1);
  }, []);
  const hideIssue = useCallback(() => {
    updateIssue.mutate(
      { hiddenAt: new Date().toISOString() },
      { onSuccess: () => navigate("/issues/all") },
    );
  }, [navigate, updateIssue]);
  useIssueDetailKeyboardShortcuts({
    archiveIssueFromInbox,
    archivePending,
    focusCommentComposer: focusCommentComposerFromShortcut,
    issueHidden,
    issueId: issue?.id,
    keyboardShortcutsEnabled,
    navigateToInbox,
  });
  const {
    canArchiveFromInbox,
    copied,
    copyIssueToClipboard,
  } = useIssueDetailInboxToolbar({
    archivePending,
    issue,
    isFromInbox,
    isMobile,
    onArchive: archiveIssueFromInbox,
    onHide: hideIssue,
    onOpenProperties: () => setMobilePropsOpen(true),
    sourceBreadcrumbHref: sourceBreadcrumb.href,
  });

  useEffect(() => {
    if (!issue?.id) return;
    if (lastMarkedReadIssueIdRef.current === issue.id) return;
    lastMarkedReadIssueIdRef.current = issue.id;
    markIssueRead.mutate(issue.id);
  }, [issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!panelIssue) {
      closePanel();
      return;
    }
    openPanel(
      <IssueProperties
        issue={panelIssue}
        childIssues={panelChildIssues}
        onAddSubIssue={openNewSubIssue}
        onUpdate={handleIssuePropertiesUpdate}
      />
    );
    return () => closePanel();
  }, [
    closePanel,
    handleIssuePropertiesUpdate,
    issuePanelKey,
    openNewSubIssue,
    openPanel,
    panelChildIssues,
    panelIssue,
  ]);

  useEffect(() => {
    const hash = location.hash;
    if (!hash.startsWith("#document-")) return;
    const documentKey = decodeURIComponent(hash.slice("#document-".length));
    if (documentKey !== ISSUE_CONTINUATION_SUMMARY_DOCUMENT_KEY) return;
    setDetailTab("activity");
    setHandoffFocusSignal((current) => current + 1);
  }, [location.hash]);

  useEffect(() => {
    if (pendingCommentComposerFocusKey === 0) return;
    if (detailTab !== "chat") return;
    commentComposerRef.current?.focus();
  }, [detailTab, pendingCommentComposerFocusKey]);

  const loadOlderComments = useCallback(() => {
    void fetchOlderComments();
  }, [fetchOlderComments]);
  const refetchLatestComments = useCallback(async () => {
    // Refetch page 0 first so comments that arrived after initial load are
    // visible, then load every remaining older page. The chat thread is
    // paginated and virtualized, so "latest" must be resolved against the
    // complete comment set rather than the current loaded window.
    const refreshed = await refetchComments();
    const loaded = await loadRemainingIssueCommentPages<IssueComment>({
      pages: refreshed.data?.pages,
      pageParams: refreshed.data?.pageParams as Array<string | null> | undefined,
      pageSize: ISSUE_COMMENT_PAGE_SIZE,
      maxPages: JUMP_TO_LATEST_MAX_COMMENT_PAGES,
      fetchPage: (afterCommentId) =>
        issuesApi.listComments(issueId!, {
          order: "desc",
          limit: ISSUE_COMMENT_PAGE_SIZE,
          after: afterCommentId,
        }),
    });
    queryClient.setQueryData<InfiniteData<IssueComment[], string | null>>(
      queryKeys.issues.comments(issueId!),
      loaded,
    );
    await new Promise<void>((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }
      window.requestAnimationFrame(() => resolve());
    });
  }, [issueId, queryClient, refetchComments]);
  useEffect(() => {
    if (!shouldPrefetchOlderComments) return;
    void fetchOlderComments();
  }, [fetchOlderComments, shouldPrefetchOlderComments]);
  if (isLoading) return <IssueDetailLoadingState headerSeed={issueHeaderSeed} />;
  if (error) return <p className="text-sm text-destructive">{error.message}</p>;
  if (!issue) return null;

  // Ancestors are returned oldest-first from the server (root at end, immediate parent at start)
  const ancestors = issue.ancestors ?? [];
  const taskReviewOutputTitles = [
    ...(issue.documentSummaries ?? []).map((document) => document.title ?? document.key),
    ...(issue.planDocument ? [issue.planDocument.title ?? "Plan document"] : []),
  ];
  const taskReviewOutputCount = taskReviewOutputTitles.length;
  const taskReviewDecisionCount = interactions.filter((interaction) => interaction.status === "pending").length;

  return (
    <TheftDetailReviewTemplate className="min-h-0">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <IssueDetailReviewHeader
          issue={issue}
          ancestors={ancestors}
          issueLinkState={resolvedIssueDetailState ?? location.state}
          locationSearch={location.search}
          activePauseHold={activePauseHold}
          childIssueCount={childIssues.length}
          heldDescendantCount={heldDescendantCount}
          activeRootPauseHoldCreatedAt={activeRootPauseHold?.createdAt}
          activePauseHoldRootIdentifier={activePauseHoldRoot?.identifier}
          canShowSubtreeControls={canShowSubtreeControls}
          canResumeLeafWork={canResumeLeafWork}
          owner={issue.assigneeAgentId ? agentMap.get(issue.assigneeAgentId) ?? null : null}
          outputCount={taskReviewOutputCount}
          outputTitles={taskReviewOutputTitles}
          decisionCount={taskReviewDecisionCount}
          commentCount={threadComments.length}
          hasLiveRuns={hasLiveRuns}
          hasBlocker={issue.status === "blocked" || (issue.blockedBy?.length ?? 0) > 0}
          onResume={openResumeControl}
          onViewAffected={openResumeControl}
          onCancelSubtree={openCancelSubtreeControl}
        />

        <IssueDetailTitleSection
          issue={issue}
          projectName={resolvedProject?.name ?? issue.project?.name ?? null}
          mentions={mentionOptions}
          hasLiveRuns={hasLiveRuns}
          isMobileInbox={isMobile && isFromInbox}
          copied={copied}
          panelVisible={panelVisible}
          canArchiveFromInbox={canArchiveFromInbox}
          archivePending={archivePending}
          moreOpen={moreOpen}
          canPauseLeafWork={canPauseLeafWork}
          canResumeLeafWork={canResumeLeafWork}
          canShowSubtreeControls={canShowSubtreeControls}
          canResumeSubtree={canResumeSubtree}
          canRestoreSubtree={canRestoreSubtree}
          onMoreOpenChange={setMoreOpen}
          onStatusChange={(status) => updateIssue.mutate({ status })}
          onPriorityChange={(priority) => updateIssue.mutate({ priority })}
          onCopy={copyIssueToClipboard}
          onOpenMobileProps={() => setMobilePropsOpen(true)}
          onShowPanel={() => setPanelVisible(true)}
          onArchiveFromInbox={() => {
            if (!archivePending) archiveFromInbox.mutate(issue.id);
          }}
          onPauseLeafWork={openPauseLeafControl}
          onResumeLeafWork={openResumeLeafControl}
          onPauseSubtree={openPauseSubtreeControl}
          onResumeSubtree={openResumeSubtreeControl}
          onCancelSubtree={openCancelSubtreeControl}
          onRestoreSubtree={openRestoreSubtreeControl}
          onHideIssue={hideIssue}
          onSaveTitle={(title) => updateIssue.mutateAsync({ title })}
          onSaveDescription={(description) => updateIssue.mutateAsync({ description })}
          onUploadDescriptionImage={handleUploadImageForMarkdown}
          onDropDescriptionFile={handleDropDescriptionFile}
        />

      <IssueDetailPluginOutlets
        companyId={issue.companyId}
        projectId={issue.projectId ?? null}
        issueId={issue.id}
      />

      <IssueDetailSubIssuesSection
        issue={issue}
        childIssues={childIssues}
        childIssuesLoading={childIssuesLoading}
        agents={agents}
        projects={projects}
        liveIssueIds={liveIssueIds}
        mutedChildIssueIds={mutedChildIssueIds}
        childPauseBadgeById={childPauseBadgeById}
        issueLinkState={resolvedIssueDetailState ?? location.state}
        currentUserId={currentUserId}
        showRichSubIssuesSection={showRichSubIssuesSection}
        onCreateSubIssue={openNewSubIssue}
        onUpdateIssue={handleChildIssueUpdate}
      />

      <IssueDetailArtifactsSection
        issue={issue}
        canDeleteDocuments={Boolean(session?.user?.id)}
        feedbackVotes={feedbackVotes}
        feedbackDataSharingPreference={feedbackDataSharingPreference}
        feedbackTermsUrl={FEEDBACK_TERMS_URL}
        mentions={mentionOptions}
        documentExtraActions={!hasAttachments ? attachmentUploadButton : null}
        onUploadDocumentImage={handleUploadImageForMarkdown}
        onVoteDocument={handleDocumentVote}
        attachmentsInitialLoading={attachmentsInitialLoading}
        imageAttachments={imageAttachments}
        nonImageAttachments={nonImageAttachments}
        uploadAction={attachmentUploadButton}
        attachmentError={attachmentError}
        deleteAttachmentPending={deleteAttachmentPending}
        onOpenImage={handleOpenAttachmentImage}
        onDeleteAttachment={handleDeleteAttachment}
        onDragActiveChange={setAttachmentDragActive}
        onDropFiles={(files) => void handleAttachmentFiles(files)}
        galleryIndex={galleryIndex}
        galleryOpen={galleryOpen}
        onGalleryOpenChange={setGalleryOpen}
        project={resolvedProject}
        onUpdateWorkspace={(data) => updateIssue.mutate(data)}
      />

      <Separator />

      <IssueDetailTabs
        value={detailTab}
        onValueChange={setDetailTab}
        relatedWork={issue.relatedWork}
        pluginTabItems={issuePluginTabItems}
        activePluginTab={activePluginTab}
        pluginContext={{
          companyId: issue.companyId,
          projectId: issue.projectId ?? null,
          entityId: issue.id,
          entityType: "issue",
        }}
        chatProps={{
          issueId: issue.id,
          companyId: issue.companyId,
          projectId: issue.projectId ?? null,
          issueStatus: issue.status,
          issueWorkMode: issue.workMode ?? "standard",
          executionRunId: issue.executionRunId ?? null,
          blockedBy: issue.blockedBy ?? [],
          blockerAttention: issue.blockerAttention ?? null,
          successfulRunHandoff: issue.successfulRunHandoff ?? null,
          comments: threadComments,
          locallyQueuedCommentRunIds,
          interactions,
          hasOlderComments,
          commentsLoadingOlder,
          onLoadOlderComments: loadOlderComments,
          onRefreshLatestComments: refetchLatestComments,
          composerRef: commentComposerRef,
          feedbackVotes,
          feedbackDataSharingPreference,
          feedbackTermsUrl: FEEDBACK_TERMS_URL,
          agentMap,
          currentUserId,
          userLabelMap,
          userProfileMap,
          draftKey: `paperclip:issue-comment-draft:${issue.id}`,
          reassignOptions: commentReassignOptions,
          currentAssigneeValue: actualAssigneeValue,
          suggestedAssigneeValue,
          mentions: mentionOptions,
          composerDisabledReason: commentComposerDisabledReason,
          composerHint,
          queuedCommentReason,
          onVote: handleCommentVote,
          onAdd: handleChatAdd,
          onImageUpload: handleCommentImageUpload,
          onAttachImage: handleCommentAttachImage,
          onInterruptQueued: handleInterruptQueuedRun,
          onPauseWorkRun: canManageTreeControl
              ? (runId) => pauseIssueWorkRun.mutateAsync(runId).then(() => undefined)
              : undefined,
          onWorkModeChange: (nextMode) => {
            const currentMode: IssueWorkMode = issue.workMode ?? "standard";
            if (currentMode === nextMode) return;
            return updateIssue.mutateAsync({ workMode: nextMode }).then(() => undefined);
          },
          onCancelQueued: handleCancelQueuedComment,
          interruptingQueuedRunId,
          pausingWorkRunId: pauseIssueWorkRun.isPending ? pauseIssueWorkRun.variables ?? null : null,
          onImageClick: handleChatImageClick,
          onAcceptInteraction: handleAcceptInteraction,
          onRejectInteraction: handleRejectInteraction,
          onSubmitInteractionAnswers: handleSubmitInteractionAnswers,
          onCancelInteraction: handleCancelInteraction,
        }}
        activityProps={{
          issue,
          issueId: issue.id,
          companyId: issue.companyId,
          issueStatus: issue.status,
          childIssues,
          agentMap,
          hasLiveRuns,
          currentUserId,
          userProfileMap,
          pendingApprovalAction,
          handoffFocusSignal,
          onApprovalAction: handleApprovalAction,
          onCheckMonitorNow: () => checkIssueMonitorNow.mutate(),
          checkingMonitorNow: checkIssueMonitorNow.isPending,
        }}
      />

      <IssueTreeControlDialog {...treeControlDialogProps} />

      <IssueDetailMobilePropertiesSheet
        open={mobilePropsOpen}
        onOpenChange={setMobilePropsOpen}
        issue={issue}
        childIssues={childIssues}
        onAddSubIssue={openNewSubIssue}
        onUpdateIssue={(data) => updateIssue.mutate(data)}
      />
      <ScrollToBottom />
      </div>
    </TheftDetailReviewTemplate>
  );
}
