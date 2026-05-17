import { useAui } from "@assistant-ui/react";
import type { IssueWorkMode } from "@paperclipai/shared";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

import { MarkdownEditor, type MarkdownEditorRef } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { useOptionalToastActions } from "@/context/ToastContext";
import { restoreSubmittedCommentDraft } from "@/lib/comment-submit-draft";
import {
  captureComposerViewportSnapshot,
  restoreComposerViewportSnapshot,
} from "@/lib/issue-chat-scroll";
import { cn } from "@/lib/utils";

import {
  COMPOSER_FOCUS_SCROLL_PADDING_PX,
  isUnassignedReassignValue,
  parseReassignment,
  shouldImplicitlyReopenComment,
} from "./ComposerHelpers";
import { IssueChatComposerAssigneeSelector } from "./IssueChatComposerAssigneeSelector";
import { IssueChatComposerAttachButton } from "./IssueChatComposerAttachButton";
import { IssueChatComposerAttachments } from "./IssueChatComposerAttachments";
import { IssueChatComposerDropOverlay } from "./IssueChatComposerDropOverlay";
import {
  IssueChatComposerDisabledNotice,
  IssueChatComposerHint,
} from "./IssueChatComposerNotices";
import { IssueChatComposerWorkModeControls } from "./IssueChatComposerWorkModeControls";
import { useIssueChatComposerAttachments } from "./useIssueChatComposerAttachments";
import { useIssueChatComposerDraft } from "./useIssueChatComposerDraft";
import type { IssueChatComposerHandle, IssueChatComposerProps } from "./IssueChatComposerTypes";
export type { CommentReassignment, IssueChatComposerHandle } from "./IssueChatComposerTypes";

export const IssueChatComposer = forwardRef<IssueChatComposerHandle, IssueChatComposerProps>(
  function IssueChatComposer({
    onImageUpload,
    onAttachImage,
    draftKey,
    enableReassign = false,
    reassignOptions = [],
    currentAssigneeValue = "",
    suggestedAssigneeValue,
    mentions = [],
    agentMap,
    composerDisabledReason = null,
    composerHint = null,
    issueStatus,
    issueWorkMode,
    onWorkModeChange,
  }, forwardedRef) {
    const api = useAui();
    const toastActions = useOptionalToastActions();
    const [body, setBody] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const effectiveSuggestedAssigneeValue = suggestedAssigneeValue ?? currentAssigneeValue;
    const [reassignTarget, setReassignTarget] = useState(effectiveSuggestedAssigneeValue);
    const [unassignedConfirmed, setUnassignedConfirmed] = useState(false);
    const resolvedIssueWorkMode: IssueWorkMode = issueWorkMode ?? "standard";
    const [pendingWorkMode, setPendingWorkMode] = useState<IssueWorkMode>(resolvedIssueWorkMode);
    const canToggleWorkMode = typeof onWorkModeChange === "function";
    const editorRef = useRef<MarkdownEditorRef>(null);
    const composerContainerRef = useRef<HTMLDivElement | null>(null);
    const {
      attachInputRef,
      attaching,
      attachments: composerAttachments,
      canAcceptFiles,
      clearAttachments,
      handleAttachFile,
      handleFileDragEnter,
      handleFileDragLeave,
      handleFileDragOver,
      handleFileDrop,
      isDragOver,
    } = useIssueChatComposerAttachments({
      onImageUpload,
      onAttachImage,
      setBody,
    });
    const { clearStoredDraft } = useIssueChatComposerDraft({
      body,
      draftKey,
      setBody,
    });

    function queueViewportRestore(snapshot: ReturnType<typeof captureComposerViewportSnapshot>) {
      if (!snapshot) return;
      requestAnimationFrame(() => {
        restoreComposerViewportSnapshot(snapshot, composerContainerRef.current);
      });
    }

    function focusComposer() {
      if (typeof composerContainerRef.current?.scrollIntoView === "function") {
        composerContainerRef.current.scrollIntoView({ behavior: "smooth", block: "end" });
      }
      requestAnimationFrame(() => {
        window.scrollBy({ top: COMPOSER_FOCUS_SCROLL_PADDING_PX, behavior: "smooth" });
        editorRef.current?.focus();
      });
    }

    useEffect(() => {
      setReassignTarget(effectiveSuggestedAssigneeValue);
    }, [effectiveSuggestedAssigneeValue]);

    useEffect(() => {
      setUnassignedConfirmed(false);
    }, [reassignTarget]);

    useEffect(() => {
      setPendingWorkMode(resolvedIssueWorkMode);
    }, [resolvedIssueWorkMode]);

    useImperativeHandle(forwardedRef, () => ({
      focus: focusComposer,
      restoreDraft: (submittedBody: string) => {
        setBody((current) =>
          restoreSubmittedCommentDraft({
            currentBody: current,
            submittedBody,
          }),
        );
        focusComposer();
      },
    }), []);

    async function handleSubmit() {
      const trimmed = body.trim();
      if (!trimmed || submitting) return;

      const composerHasAssigneePicker = enableReassign && reassignOptions.length > 0;
      if (
        composerHasAssigneePicker
        && isUnassignedReassignValue(reassignTarget)
        && !unassignedConfirmed
      ) {
        toastActions?.pushToast({
          title: "No assignee selected",
          body: "Pick an assignee or click Send again to post without one.",
          tone: "warn",
          dedupeKey: `issue-chat-no-assignee:${draftKey ?? ""}`,
        });
        setUnassignedConfirmed(true);
        return;
      }

      const hasReassignment = enableReassign && reassignTarget !== currentAssigneeValue;
      const reassignment = hasReassignment ? parseReassignment(reassignTarget) : undefined;
      const reopen = shouldImplicitlyReopenComment(
        issueStatus,
        hasReassignment ? reassignTarget : currentAssigneeValue,
      ) ? true : undefined;
      const submittedBody = trimmed;
      const viewportSnapshot = captureComposerViewportSnapshot(composerContainerRef.current);

      const workModeChanged = pendingWorkMode !== resolvedIssueWorkMode;
      setSubmitting(true);
      setBody("");
      setUnassignedConfirmed(false);
      try {
        if (workModeChanged && onWorkModeChange) {
          await onWorkModeChange(pendingWorkMode);
        }
        const appendPromise = api.thread().append({
          role: "user",
          content: [{ type: "text", text: submittedBody }],
          metadata: { custom: {} },
          attachments: [],
          runConfig: {
            custom: {
              ...(reopen ? { reopen: true } : {}),
              ...(reassignment ? { reassignment } : {}),
            },
          },
        });
        queueViewportRestore(viewportSnapshot);
        await appendPromise;
        clearStoredDraft();
        clearAttachments();
        setReassignTarget(effectiveSuggestedAssigneeValue);
      } catch {
        setBody((current) =>
          restoreSubmittedCommentDraft({
            currentBody: current,
            submittedBody,
          }),
        );
      } finally {
        setSubmitting(false);
        queueViewportRestore(viewportSnapshot);
      }
    }

    const canSubmit = !submitting && !!body.trim();

    if (composerDisabledReason) {
      return <IssueChatComposerDisabledNotice reason={composerDisabledReason} />;
    }

    const isPlanning = pendingWorkMode === "planning";

    return (
      <div
        ref={composerContainerRef}
        data-testid="issue-chat-composer"
        data-pending-work-mode={pendingWorkMode}
        className={cn(
          "relative rounded-md border border-border/70 bg-background/95 p-4 shadow-lg backdrop-blur transition-[border-color,background-color,box-shadow] duration-150 supports-[backdrop-filter]:bg-background/85 dark:shadow-lg",
          isPlanning && "border-amber-500/60 bg-amber-50/60 supports-[backdrop-filter]:bg-amber-50/40 dark:border-amber-500/50 dark:bg-amber-500/[0.07] dark:supports-[backdrop-filter]:bg-amber-500/[0.07]",
          isDragOver && "border-primary/45 bg-background ring-1 ring-primary/15",
        )}
        onDragEnterCapture={handleFileDragEnter}
        onDragOverCapture={handleFileDragOver}
        onDragLeaveCapture={handleFileDragLeave}
        onDropCapture={handleFileDrop}
      >
        {isDragOver && canAcceptFiles ? (
          <IssueChatComposerDropOverlay />
        ) : null}

        <MarkdownEditor
          ref={editorRef}
          value={body}
          onChange={setBody}
          placeholder="Reply"
          mentions={mentions}
          onSubmit={handleSubmit}
          imageUploadHandler={onImageUpload}
          fileDropTarget="parent"
          bordered={false}
          contentClassName="max-h-48 overflow-y-auto pr-1 pb-2 text-sm scrollbar-auto-hide sm:max-h-64"
        />

        {composerHint ? (
          <IssueChatComposerHint>{composerHint}</IssueChatComposerHint>
        ) : null}

        <IssueChatComposerAttachments attachments={composerAttachments} />

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="mr-auto flex items-center gap-2">
            {(onImageUpload || onAttachImage) ? (
              <IssueChatComposerAttachButton
                attaching={attaching}
                inputRef={attachInputRef}
                onChange={handleAttachFile}
              />
            ) : null}
            {canToggleWorkMode ? (
              <IssueChatComposerWorkModeControls
                pendingWorkMode={pendingWorkMode}
                setPendingWorkMode={setPendingWorkMode}
              />
            ) : null}
          </div>

          {enableReassign && reassignOptions.length > 0 ? (
            <IssueChatComposerAssigneeSelector
              value={reassignTarget}
              options={reassignOptions}
              agentMap={agentMap}
              onChange={setReassignTarget}
            />
          ) : null}

          <Button size="sm" disabled={!canSubmit} onClick={() => void handleSubmit()}>
            {submitting ? "Posting..." : "Send"}
          </Button>
        </div>
      </div>
    );
  },
);
