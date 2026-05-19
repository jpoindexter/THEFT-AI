import { type IssueWorkMode } from "@paperclipai/shared";
import { ScrollToBottom } from "../ScrollToBottom";
import { Separator } from "@/components/ui/separator";
import { TheftDetailReviewTemplate } from "@/components/theft/templates/TheftDetailReviewTemplate";
import { IssueDetailArtifactsSection } from "./IssueDetailArtifactsSection";
import { IssueDetailMobilePropertiesSheet } from "./IssueDetailMobilePropertiesSheet";
import { IssueDetailPluginOutlets } from "./IssueDetailPluginOutlets";
import { IssueDetailReviewHeader } from "./IssueDetailReviewHeader";
import { IssueDetailSubIssuesSection } from "./IssueDetailSubIssuesSection";
import { IssueDetailTabs } from "./IssueDetailTabs";
import { IssueDetailTitleSection } from "./IssueDetailTitleSection";
import { IssueTreeControlDialog } from "./IssueTreeControlDialog";
import type { IssueDetailActionState } from "./useIssueDetailActionState";
import type { IssueDetailPrimaryState } from "./useIssueDetailPrimaryState";

const FEEDBACK_TERMS_URL = import.meta.env.VITE_FEEDBACK_TERMS_URL?.trim() || "https://paperclip.ing/tos";

function buildMissingOutputPrompt(issueTitle: string) {
  return `Where did the output for "${issueTitle}" land? If it is only in the task thread, publish a concrete artifact to the Library and tell me exactly what changed.`;
}

function buildRevisionPrompt(issueTitle: string) {
  return `Please revise "${issueTitle}". I need a concrete saved output in the Library, not just a completed status. Include the artifact link or explain what is blocking it.`;
}

function buildExecutionPrompt(issueTitle: string) {
  return [
    `Execute "${issueTitle}" now.`,
    "Use the current issue objective and dependencies.",
    "Before marking complete, publish a concrete Library artifact and summarize exactly what was delivered.",
  ].join("\n");
}

export function IssueDetailContent({
  primary,
  actions,
}: {
  primary: IssueDetailPrimaryState;
  actions: IssueDetailActionState;
}) {
  const { issue } = primary;
  if (!issue) return null;

  // Ancestors are returned oldest-first from the server (root at end, immediate parent at start).
  const ancestors = issue.ancestors ?? [];
  const taskReviewOutputTitles = [
    ...(issue.documentSummaries ?? []).map((document) => document.title ?? document.key),
    ...(issue.planDocument ? [issue.planDocument.title ?? "Plan document"] : []),
  ];
  const taskReviewOutputCount = taskReviewOutputTitles.length;
  const taskReviewDecisionCount = primary.interactions.filter((interaction) => interaction.status === "pending").length;
  const askWhereOutputLanded = () => {
    primary.focusCommentComposerFromShortcut(buildMissingOutputPrompt(issue.title));
  };
  const askForRevision = () => {
    primary.focusCommentComposerFromShortcut(buildRevisionPrompt(issue.title));
  };
  const startExecution = () => {
    primary.focusCommentComposerFromShortcut(buildExecutionPrompt(issue.title));
  };
  const focusPublishedOutputDraft = () => {
    primary.setDetailTab("related-work");
    primary.navigate(`${primary.location.pathname}${primary.location.search}#document-output`, { replace: true });
  };

  return (
    <TheftDetailReviewTemplate className="min-h-0">
      <div className="mx-auto w-full max-w-6xl space-y-5">
        <IssueDetailReviewHeader
          issue={issue}
          ancestors={ancestors}
          issueLinkState={primary.resolvedIssueDetailState ?? primary.location.state}
          locationSearch={primary.location.search}
          activePauseHold={primary.activePauseHold}
          childIssueCount={primary.childIssues.length}
          heldDescendantCount={primary.heldDescendantCount}
          activeRootPauseHoldCreatedAt={primary.activeRootPauseHold?.createdAt}
          activePauseHoldRootIdentifier={primary.activePauseHoldRoot?.identifier}
          canShowSubtreeControls={primary.canShowSubtreeControls}
          canResumeLeafWork={primary.canResumeLeafWork}
          owner={issue.assigneeAgentId ? primary.agentMap.get(issue.assigneeAgentId) ?? null : null}
          outputCount={taskReviewOutputCount}
          outputTitles={taskReviewOutputTitles}
          decisionCount={taskReviewDecisionCount}
          commentCount={primary.threadComments.length}
          hasLiveRuns={primary.hasLiveRuns}
          hasBlocker={issue.status === "blocked" || (issue.blockedBy?.length ?? 0) > 0}
          approving={actions.updateIssue.isPending}
          publishingOutput={actions.publishOutputDraft.isPending}
          onStartExecution={startExecution}
          onApprove={() => actions.updateIssue.mutate({ status: "done" })}
          onAskRevision={askForRevision}
          onAskOperator={askWhereOutputLanded}
          onOpenLibrary={() => primary.navigate("/library")}
          onPublishOutput={() =>
            actions.publishOutputDraft.mutate(undefined, {
              onSuccess: focusPublishedOutputDraft,
            })}
          onResume={primary.openResumeControl}
          onViewAffected={primary.openResumeControl}
          onCancelSubtree={primary.openCancelSubtreeControl}
        />

        <IssueDetailTitleSection
          issue={issue}
          projectName={primary.resolvedProject?.name ?? issue.project?.name ?? null}
          mentions={primary.mentionOptions}
          hasLiveRuns={primary.hasLiveRuns}
          isMobileInbox={primary.isMobile && primary.isFromInbox}
          copied={actions.copied}
          panelVisible={primary.panelVisible}
          canArchiveFromInbox={actions.canArchiveFromInbox}
          archivePending={actions.archivePending}
          moreOpen={primary.moreOpen}
          canPauseLeafWork={primary.canPauseLeafWork}
          canResumeLeafWork={primary.canResumeLeafWork}
          canShowSubtreeControls={primary.canShowSubtreeControls}
          canResumeSubtree={primary.canResumeSubtree}
          canRestoreSubtree={primary.canRestoreSubtree}
          onMoreOpenChange={primary.setMoreOpen}
          onStatusChange={(status) => actions.updateIssue.mutate({ status })}
          onPriorityChange={(priority) => actions.updateIssue.mutate({ priority })}
          onCopy={actions.copyIssueToClipboard}
          onOpenMobileProps={() => primary.setMobilePropsOpen(true)}
          onShowPanel={() => primary.setPanelVisible(true)}
          onArchiveFromInbox={() => {
            actions.archiveIssueFromInbox(issue.id);
          }}
          onPauseLeafWork={primary.openPauseLeafControl}
          onResumeLeafWork={primary.openResumeLeafControl}
          onPauseSubtree={primary.openPauseSubtreeControl}
          onResumeSubtree={primary.openResumeSubtreeControl}
          onCancelSubtree={primary.openCancelSubtreeControl}
          onRestoreSubtree={primary.openRestoreSubtreeControl}
          onHideIssue={actions.hideIssue}
          onSaveTitle={(title) => actions.updateIssue.mutateAsync({ title })}
          onSaveDescription={(description) => actions.updateIssue.mutateAsync({ description })}
          onUploadDescriptionImage={actions.handleUploadImageForMarkdown}
          onDropDescriptionFile={actions.handleDropDescriptionFile}
        />

        <IssueDetailPluginOutlets
          companyId={issue.companyId}
          projectId={issue.projectId ?? null}
          issueId={issue.id}
        />

        <IssueDetailSubIssuesSection
          issue={issue}
          childIssues={primary.childIssues}
          childIssuesLoading={primary.childIssuesLoading}
          agents={primary.agents}
          projects={primary.projects}
          liveIssueIds={primary.liveIssueIds}
          mutedChildIssueIds={primary.mutedChildIssueIds}
          childPauseBadgeById={primary.childPauseBadgeById}
          issueLinkState={primary.resolvedIssueDetailState ?? primary.location.state}
          currentUserId={primary.currentUserId}
          showRichSubIssuesSection={primary.showRichSubIssuesSection}
          onCreateSubIssue={primary.openNewSubIssue}
          onUpdateIssue={actions.handleChildIssueUpdate}
        />

        <IssueDetailArtifactsSection
          issue={issue}
          canDeleteDocuments={Boolean(primary.session?.user?.id)}
          feedbackVotes={primary.feedbackVotes}
          feedbackDataSharingPreference={primary.feedbackDataSharingPreference}
          feedbackTermsUrl={FEEDBACK_TERMS_URL}
          mentions={primary.mentionOptions}
          documentExtraActions={!actions.hasAttachments ? actions.attachmentUploadButton : null}
          onUploadDocumentImage={actions.handleUploadImageForMarkdown}
          onVoteDocument={primary.handleDocumentVote}
          attachmentsInitialLoading={actions.attachmentsInitialLoading}
          imageAttachments={actions.imageAttachments}
          nonImageAttachments={actions.nonImageAttachments}
          uploadAction={actions.attachmentUploadButton}
          attachmentError={actions.attachmentError}
          deleteAttachmentPending={actions.deleteAttachmentPending}
          onOpenImage={actions.handleOpenAttachmentImage}
          onDeleteAttachment={actions.handleDeleteAttachment}
          onDragActiveChange={actions.setAttachmentDragActive}
          onDropFiles={(files) => void actions.handleAttachmentFiles(files)}
          galleryIndex={actions.galleryIndex}
          galleryOpen={actions.galleryOpen}
          onGalleryOpenChange={actions.setGalleryOpen}
          project={primary.resolvedProject}
          onUpdateWorkspace={(data) => actions.updateIssue.mutate(data)}
        />

        <Separator />

        <IssueDetailTabs
          value={primary.detailTab}
          onValueChange={primary.setDetailTab}
          relatedWork={issue.relatedWork}
          pluginTabItems={primary.issuePluginTabItems}
          activePluginTab={primary.activePluginTab}
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
            comments: primary.threadComments,
            locallyQueuedCommentRunIds: primary.locallyQueuedCommentRunIds,
            interactions: primary.interactions,
            hasOlderComments: primary.hasOlderComments,
            commentsLoadingOlder: primary.commentsLoadingOlder,
            onLoadOlderComments: actions.loadOlderComments,
            onRefreshLatestComments: actions.refetchLatestComments,
            composerRef: primary.commentComposerRef,
            feedbackVotes: primary.feedbackVotes,
            feedbackDataSharingPreference: primary.feedbackDataSharingPreference,
            feedbackTermsUrl: FEEDBACK_TERMS_URL,
            agentMap: primary.agentMap,
            currentUserId: primary.currentUserId,
            userLabelMap: primary.userLabelMap,
            userProfileMap: primary.userProfileMap,
            draftKey: `paperclip:issue-comment-draft:${issue.id}`,
            reassignOptions: primary.commentReassignOptions,
            currentAssigneeValue: primary.actualAssigneeValue,
            suggestedAssigneeValue: primary.suggestedAssigneeValue,
            mentions: primary.mentionOptions,
            composerDisabledReason: primary.commentComposerDisabledReason,
            composerHint: primary.composerHint,
            queuedCommentReason: primary.queuedCommentReason,
            onVote: primary.handleCommentVote,
            onAdd: actions.handleChatAdd,
            onImageUpload: actions.handleCommentImageUpload,
            onAttachImage: actions.handleCommentAttachImage,
            onInterruptQueued: actions.handleInterruptQueuedRun,
            onPauseWorkRun: primary.canManageTreeControl
              ? (runId) => primary.pauseIssueWorkRun.mutateAsync(runId).then(() => undefined)
              : undefined,
            onWorkModeChange: (nextMode) => {
              const currentMode: IssueWorkMode = issue.workMode ?? "standard";
              if (currentMode === nextMode) return;
              return actions.updateIssue.mutateAsync({ workMode: nextMode }).then(() => undefined);
            },
            onCancelQueued: actions.handleCancelQueuedComment,
            interruptingQueuedRunId: actions.interruptingQueuedRunId,
            pausingWorkRunId: primary.pauseIssueWorkRun.isPending ? primary.pauseIssueWorkRun.variables ?? null : null,
            onImageClick: actions.handleChatImageClick,
            onAcceptInteraction: actions.handleAcceptInteraction,
            onRejectInteraction: actions.handleRejectInteraction,
            onSubmitInteractionAnswers: actions.handleSubmitInteractionAnswers,
            onCancelInteraction: actions.handleCancelInteraction,
          }}
          activityProps={{
            issue,
            issueId: issue.id,
            companyId: issue.companyId,
            issueStatus: issue.status,
            childIssues: primary.childIssues,
            agentMap: primary.agentMap,
            hasLiveRuns: primary.hasLiveRuns,
            currentUserId: primary.currentUserId,
            userProfileMap: primary.userProfileMap,
            pendingApprovalAction: actions.pendingApprovalAction,
            handoffFocusSignal: primary.handoffFocusSignal,
            onApprovalAction: actions.handleApprovalAction,
            onCheckMonitorNow: () => actions.checkIssueMonitorNow.mutate(),
            checkingMonitorNow: actions.checkIssueMonitorNow.isPending,
          }}
        />

        <IssueTreeControlDialog {...primary.treeControlDialogProps} />

        <IssueDetailMobilePropertiesSheet
          open={primary.mobilePropsOpen}
          onOpenChange={primary.setMobilePropsOpen}
          issue={issue}
          childIssues={primary.childIssues}
          onAddSubIssue={primary.openNewSubIssue}
          onUpdateIssue={(data) => actions.updateIssue.mutate(data)}
        />
        <ScrollToBottom />
      </div>
    </TheftDetailReviewTemplate>
  );
}
