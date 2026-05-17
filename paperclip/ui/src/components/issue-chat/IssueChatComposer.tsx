import { useAui } from "@assistant-ui/react";
import type { Agent, IssueAttachment, IssueWorkMode } from "@paperclipai/shared";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent as ReactDragEvent,
} from "react";
import {
  AlertTriangle,
  Check,
  ClipboardList,
  Hammer,
  Loader2,
  MoreHorizontal,
  Paperclip,
} from "lucide-react";

import { AgentIcon } from "@/components/AgentIconPicker";
import { InlineEntitySelector, type InlineEntityOption } from "@/components/InlineEntitySelector";
import { MarkdownEditor, type MentionOption, type MarkdownEditorRef } from "@/components/MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useOptionalToastActions } from "@/context/ToastContext";
import { restoreSubmittedCommentDraft } from "@/lib/comment-submit-draft";
import {
  captureComposerViewportSnapshot,
  restoreComposerViewportSnapshot,
} from "@/lib/issue-chat-scroll";
import { cn } from "@/lib/utils";

import {
  COMPOSER_FOCUS_SCROLL_PADDING_PX,
  DRAFT_DEBOUNCE_MS,
  clearDraft,
  formatAttachmentSize,
  hasFilePayload,
  isUnassignedReassignValue,
  loadDraft,
  parseReassignment,
  saveDraft,
  shouldImplicitlyReopenComment,
  type ComposerAttachmentItem,
} from "./ComposerHelpers";

export interface CommentReassignment {
  assigneeAgentId: string | null;
  assigneeUserId: string | null;
}

export interface IssueChatComposerHandle {
  focus: () => void;
  restoreDraft: (submittedBody: string) => void;
}

interface IssueChatComposerProps {
  onImageUpload?: (file: File) => Promise<string>;
  onAttachImage?: (file: File) => Promise<IssueAttachment | void>;
  draftKey?: string;
  enableReassign?: boolean;
  reassignOptions?: InlineEntityOption[];
  currentAssigneeValue?: string;
  suggestedAssigneeValue?: string;
  mentions?: MentionOption[];
  agentMap?: Map<string, Agent>;
  composerDisabledReason?: string | null;
  composerHint?: string | null;
  issueStatus?: string;
  issueWorkMode?: IssueWorkMode;
  onWorkModeChange?: (workMode: IssueWorkMode) => Promise<void> | void;
}

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
    const [attaching, setAttaching] = useState(false);
    const [isDragOver, setIsDragOver] = useState(false);
    const [composerAttachments, setComposerAttachments] = useState<ComposerAttachmentItem[]>([]);
    const dragDepthRef = useRef(0);
    const effectiveSuggestedAssigneeValue = suggestedAssigneeValue ?? currentAssigneeValue;
    const [reassignTarget, setReassignTarget] = useState(effectiveSuggestedAssigneeValue);
    const [unassignedConfirmed, setUnassignedConfirmed] = useState(false);
    const resolvedIssueWorkMode: IssueWorkMode = issueWorkMode ?? "standard";
    const [pendingWorkMode, setPendingWorkMode] = useState<IssueWorkMode>(resolvedIssueWorkMode);
    const [workModeMenuOpen, setWorkModeMenuOpen] = useState(false);
    const canToggleWorkMode = typeof onWorkModeChange === "function";
    const attachInputRef = useRef<HTMLInputElement | null>(null);
    const editorRef = useRef<MarkdownEditorRef>(null);
    const composerContainerRef = useRef<HTMLDivElement | null>(null);
    const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const canAcceptFiles = Boolean(onImageUpload || onAttachImage);

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
      if (!draftKey) return;
      setBody(loadDraft(draftKey));
    }, [draftKey]);

    useEffect(() => {
      if (!draftKey) return;
      if (draftTimer.current) clearTimeout(draftTimer.current);
      draftTimer.current = setTimeout(() => {
        saveDraft(draftKey, body);
      }, DRAFT_DEBOUNCE_MS);
    }, [body, draftKey]);

    useEffect(() => {
      return () => {
        if (draftTimer.current) clearTimeout(draftTimer.current);
      };
    }, []);

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
        if (draftKey) clearDraft(draftKey);
        setComposerAttachments([]);
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

    async function attachFile(file: File) {
      const attachmentId = `${file.name}:${file.size}:${file.lastModified}:${Math.random().toString(36).slice(2)}`;
      const inline = Boolean(onImageUpload && file.type.startsWith("image/"));
      setComposerAttachments((prev) => [
        ...prev,
        {
          id: attachmentId,
          name: file.name,
          size: file.size,
          status: "uploading",
          inline,
        },
      ]);

      try {
        if (onImageUpload && file.type.startsWith("image/")) {
          const url = await onImageUpload(file);
          const safeName = file.name.replace(/[[\]]/g, "\\$&");
          const markdown = `![${safeName}](${url})`;
          setBody((prev) => prev ? `${prev}\n\n${markdown}` : markdown);
          setComposerAttachments((prev) => prev.map((item) =>
            item.id === attachmentId
              ? { ...item, status: "attached", contentPath: url }
              : item,
          ));
        } else if (onAttachImage) {
          const attachment = await onAttachImage(file);
          setComposerAttachments((prev) => prev.map((item) =>
            item.id === attachmentId
              ? {
                  ...item,
                  status: "attached",
                  contentPath: attachment?.contentPath,
                  name: attachment?.originalFilename ?? item.name,
                }
              : item,
          ));
        } else {
          setComposerAttachments((prev) => prev.map((item) =>
            item.id === attachmentId
              ? { ...item, status: "error", error: "This file type cannot be attached here" }
              : item,
          ));
        }
      } catch (err) {
        setComposerAttachments((prev) => prev.map((item) =>
          item.id === attachmentId
            ? {
                ...item,
                status: "error",
                error: err instanceof Error ? err.message : "Upload failed",
              }
            : item,
        ));
      }
    }

    async function handleAttachFile(evt: ChangeEvent<HTMLInputElement>) {
      const file = evt.target.files?.[0];
      if (!file) return;
      setAttaching(true);
      try {
        await attachFile(file);
      } finally {
        setAttaching(false);
        if (attachInputRef.current) attachInputRef.current.value = "";
      }
    }

    async function handleDroppedFiles(files: FileList | null | undefined) {
      if (!files || files.length === 0) return;
      setAttaching(true);
      try {
        for (const file of Array.from(files)) {
          await attachFile(file);
        }
      } finally {
        setAttaching(false);
      }
    }

    function resetDragState() {
      dragDepthRef.current = 0;
      setIsDragOver(false);
    }

    function handleFileDragEnter(evt: ReactDragEvent<HTMLDivElement>) {
      if (!canAcceptFiles || !hasFilePayload(evt)) return;
      evt.preventDefault();
      evt.stopPropagation();
      dragDepthRef.current += 1;
      setIsDragOver(true);
    }

    function handleFileDragOver(evt: ReactDragEvent<HTMLDivElement>) {
      if (!canAcceptFiles || !hasFilePayload(evt)) return;
      evt.preventDefault();
      evt.stopPropagation();
      evt.dataTransfer.dropEffect = "copy";
    }

    function handleFileDragLeave(evt: ReactDragEvent<HTMLDivElement>) {
      if (!canAcceptFiles || !hasFilePayload(evt)) return;
      evt.preventDefault();
      evt.stopPropagation();
      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) setIsDragOver(false);
    }

    function handleFileDrop(evt: ReactDragEvent<HTMLDivElement>) {
      if (!canAcceptFiles || !hasFilePayload(evt)) return;
      evt.preventDefault();
      evt.stopPropagation();
      resetDragState();
      void handleDroppedFiles(evt.dataTransfer?.files);
    }

    const canSubmit = !submitting && !!body.trim();

    if (composerDisabledReason) {
      return (
        <div className="rounded-md border border-amber-300/70 bg-amber-50/80 px-3 py-2 text-sm text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100">
          {composerDisabledReason}
        </div>
      );
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
          <div
            data-testid="issue-chat-composer-drop-overlay"
            className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-sm border border-dashed border-primary/55 bg-background/75 px-4 py-3 text-center shadow-sm backdrop-blur-sm dark:bg-background/65"
          >
            <div className="flex max-w-md items-center gap-3 rounded-md bg-background/80 px-3 py-2 text-left shadow-sm ring-1 ring-border/60">
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                <Paperclip className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground">Drop to upload</div>
                <div className="mt-0.5 text-xs leading-5 text-muted-foreground">
                  Images insert into the reply. Other files are added to this issue.
                </div>
              </div>
            </div>
          </div>
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
          <div className="inline-flex items-center rounded-full border border-border/70 bg-muted/30 px-2 py-1 text-micro text-muted-foreground">
            {composerHint}
          </div>
        ) : null}

        {composerAttachments.length > 0 ? (
          <div
            data-testid="issue-chat-composer-attachments"
            className="mb-3 mt-2 space-y-1.5 rounded-md border border-dashed border-border/80 bg-muted/20 p-2"
          >
            {composerAttachments.map((attachment) => {
              const sizeLabel = formatAttachmentSize(attachment.size);
              const statusLabel =
                attachment.status === "uploading"
                  ? "Uploading to issue"
                  : attachment.status === "error"
                    ? attachment.error ?? "Upload failed"
                    : attachment.inline
                      ? "Inserted inline"
                      : "Attached to issue";
              return (
                <div
                  key={attachment.id}
                  className={cn(
                    "flex min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 text-xs",
                    attachment.status === "error"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-background/70 text-muted-foreground",
                  )}
                >
                  {attachment.status === "uploading" ? (
                    <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
                  ) : attachment.status === "attached" ? (
                    <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
                  ) : (
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
                  )}
                  <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                    {attachment.name}
                  </span>
                  {sizeLabel ? (
                    <span className="shrink-0 text-muted-foreground">{sizeLabel}</span>
                  ) : null}
                  <span className="shrink-0 text-muted-foreground">{statusLabel}</span>
                </div>
              );
            })}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-end gap-3">
          <div className="mr-auto flex items-center gap-2">
            {(onImageUpload || onAttachImage) ? (
              <>
                <Input
                  ref={attachInputRef}
                  type="file"
                  className="hidden"
                  onChange={handleAttachFile}
                />
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => attachInputRef.current?.click()}
                  disabled={attaching}
                  title="Attach file"
                >
                  <Paperclip className="h-4 w-4" />
                </Button>
              </>
            ) : null}
            {canToggleWorkMode ? (
              <Popover open={workModeMenuOpen} onOpenChange={setWorkModeMenuOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    data-testid="issue-chat-composer-work-mode-menu"
                    title="More composer options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-44 p-1" align="start">
                  <Button
                    type="button"
                    data-testid="issue-chat-composer-work-mode-menu-toggle"
                    data-pending-work-mode={pendingWorkMode}
                    variant="ghost"
                    size="xs"
                    className={cn(
                      "h-auto w-full justify-start gap-2 rounded px-2 py-1.5 text-xs hover:bg-accent/50",
                      isPlanning ? "text-amber-700 dark:text-amber-300" : "text-foreground",
                    )}
                    onClick={() => {
                      setPendingWorkMode((prev) => (prev === "planning" ? "standard" : "planning"));
                      setWorkModeMenuOpen(false);
                    }}
                  >
                    {isPlanning ? (
                      <Hammer className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    ) : (
                      <ClipboardList className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-300" aria-hidden />
                    )}
                    <span>{isPlanning ? "Switch to standard" : "Switch to planning"}</span>
                  </Button>
                </PopoverContent>
              </Popover>
            ) : null}
            {canToggleWorkMode && isPlanning ? (
              <Button
                type="button"
                data-testid="issue-chat-composer-work-mode-toggle"
                data-pending-work-mode={pendingWorkMode}
                aria-pressed
                title="Planning mode is on for this submission. Click to switch to Standard."
                onClick={() => setPendingWorkMode("standard")}
                variant="outline"
                size="xs"
                className="border-amber-500/60 bg-amber-500/15 text-xs text-amber-800 hover:bg-amber-500/25 dark:border-amber-500/50 dark:bg-amber-500/15 dark:text-amber-200 dark:hover:bg-amber-500/25"
              >
                <ClipboardList className="h-3.5 w-3.5" aria-hidden />
                <span>Planning</span>
              </Button>
            ) : null}
          </div>

          {enableReassign && reassignOptions.length > 0 ? (
            <InlineEntitySelector
              value={reassignTarget}
              options={reassignOptions}
              placeholder="Assignee"
              noneLabel="No assignee"
              searchPlaceholder="Search assignees..."
              emptyMessage="No assignees found."
              onChange={setReassignTarget}
              className="h-8 text-xs"
              renderTriggerValue={(option) => {
                if (!option) return <span className="text-muted-foreground">Assignee</span>;
                const agentId = option.id.startsWith("agent:") ? option.id.slice("agent:".length) : null;
                const agent = agentId ? agentMap?.get(agentId) : null;
                return (
                  <>
                    {agent ? (
                      <AgentIcon icon={agent.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                  </>
                );
              }}
              renderOption={(option) => {
                if (!option.id) return <span className="truncate">{option.label}</span>;
                const agentId = option.id.startsWith("agent:") ? option.id.slice("agent:".length) : null;
                const agent = agentId ? agentMap?.get(agentId) : null;
                return (
                  <>
                    {agent ? (
                      <AgentIcon icon={agent.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    ) : null}
                    <span className="truncate">{option.label}</span>
                  </>
                );
              }}
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
