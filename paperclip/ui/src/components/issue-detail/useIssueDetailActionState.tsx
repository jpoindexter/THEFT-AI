import { useCallback, useEffect } from "react";
import { IssueProperties } from "../IssueProperties";
import type { IssueDetailPrimaryState } from "./useIssueDetailPrimaryState";
import { useIssueDetailApprovals } from "./useIssueDetailApprovals";
import { useIssueDetailAttachments } from "./useIssueDetailAttachments";
import { useIssueDetailCacheActions } from "./useIssueDetailCacheActions";
import { useIssueDetailCommentPagination } from "./useIssueDetailCommentPagination";
import { useIssueDetailCommentPosting } from "./useIssueDetailCommentPosting";
import { useIssueDetailInboxToolbar } from "./useIssueDetailInboxToolbar";
import { useIssueDetailInteractions } from "./useIssueDetailInteractions";
import { useIssueDetailIssueActions } from "./useIssueDetailIssueActions";
import { useIssueDetailKeyboardShortcuts } from "./useIssueDetailKeyboardShortcuts";
import { useIssueDetailQueuedCommentActions } from "./useIssueDetailQueuedCommentActions";

export function useIssueDetailActionState(primary: IssueDetailPrimaryState) {
  const {
    cancelledQueuedOptimisticCommentIdsRef,
    closePanel,
    currentUserId,
    fetchOlderComments,
    focusCommentComposerFromShortcut,
    isFromInbox,
    isMobile,
    issue,
    issueId,
    issuePanelKey,
    keyboardShortcutsEnabled,
    locallyQueuedCommentRunIds,
    navigate,
    openNewSubIssue,
    openPanel,
    panelChildIssues,
    panelIssue,
    refetchComments,
    resolvedCompanyId,
    restoreQueuedCommentDraft,
    selectedCompanyId,
    setLocallyQueuedCommentRunIds,
    setMobilePropsOpen,
    setOptimisticComments,
    shouldPrefetchOlderComments,
    sourceBreadcrumb,
  } = primary;

  const cacheActions = useIssueDetailCacheActions({
    issue,
    issueId,
    selectedCompanyId,
  });
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
  } = cacheActions;

  const attachments = useIssueDetailAttachments({
    issueId,
    issue,
    selectedCompanyId,
    invalidateIssueDetail,
  });
  const approvals = useIssueDetailApprovals({
    invalidateIssueCollections,
    invalidateIssueDetail,
    issueId,
    resolvedCompanyId,
  });
  const issueActions = useIssueDetailIssueActions({
    applyOptimisticIssueCacheUpdate,
    invalidateIssueCollections,
    invalidateIssueDetail,
    invalidateIssueRunState,
    issue,
    issueId,
    mergeIssueResponseIntoCaches,
    navigate,
    resolvedCompanyId,
    selectedCompanyId,
    sourceBreadcrumbHref: sourceBreadcrumb.href,
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
  const interactions = useIssueDetailInteractions({
    invalidateIssueCollections,
    invalidateIssueDetail,
    issue,
    issueId,
    resolvedCompanyId,
    upsertInteractionInCache,
  });
  const queuedComments = useIssueDetailQueuedCommentActions({
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

  const navigateToInbox = useCallback(() => {
    navigate(sourceBreadcrumb.href.startsWith("/inbox") ? sourceBreadcrumb.href : "/inbox");
  }, [navigate, sourceBreadcrumb.href]);
  useIssueDetailKeyboardShortcuts({
    archiveIssueFromInbox: issueActions.archiveIssueFromInbox,
    archivePending: issueActions.archivePending,
    focusCommentComposer: focusCommentComposerFromShortcut,
    issueHidden: issueActions.issueHidden,
    issueId: issue?.id,
    keyboardShortcutsEnabled,
    navigateToInbox,
  });
  const inboxToolbar = useIssueDetailInboxToolbar({
    archivePending: issueActions.archivePending,
    issue,
    isFromInbox,
    isMobile,
    onArchive: issueActions.archiveIssueFromInbox,
    onHide: issueActions.hideIssue,
    onOpenProperties: () => setMobilePropsOpen(true),
    sourceBreadcrumbHref: sourceBreadcrumb.href,
  });

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
        onUpdate={issueActions.handleIssuePropertiesUpdate}
      />,
    );
    return () => closePanel();
  }, [
    closePanel,
    issueActions.handleIssuePropertiesUpdate,
    issuePanelKey,
    openNewSubIssue,
    openPanel,
    panelChildIssues,
    panelIssue,
  ]);

  const pagination = useIssueDetailCommentPagination({
    fetchOlderComments,
    issueId,
    refetchComments,
    shouldPrefetchOlderComments,
  });

  return {
    ...attachments,
    ...approvals,
    ...issueActions,
    ...interactions,
    ...queuedComments,
    ...inboxToolbar,
    ...pagination,
    handleChatAdd,
  };
}

export type IssueDetailActionState = ReturnType<typeof useIssueDetailActionState>;
