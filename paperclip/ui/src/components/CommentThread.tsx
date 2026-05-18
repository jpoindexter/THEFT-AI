import { useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import type {
  Agent,
  Approval,
  FeedbackDataSharingPreference,
  FeedbackVote,
  FeedbackVoteValue,
} from "@paperclipai/shared";
import { restoreSubmittedCommentDraft } from "../lib/comment-submit-draft";
import type { IssueTimelineEvent } from "../lib/issue-timeline-events";
import type { InlineEntityOption } from "./InlineEntitySelector";
import type { MarkdownEditorRef, MentionOption } from "./MarkdownEditor";
import { CommentComposer } from "./comment-thread/CommentComposer";
import { TimelineList } from "./comment-thread/TimelineList";
import { QueuedCommentsSection } from "./comment-thread/QueuedCommentsSection";
import {
  buildCommentTimeline,
  buildFeedbackVoteMap,
  buildMentionOptions,
} from "./comment-thread/commentThreadData";
import {
  clearDraft,
  DRAFT_DEBOUNCE_MS,
  loadDraft,
  parseReassignment,
  saveDraft,
  shouldImplicitlyReopenComment,
} from "./comment-thread/commentThreadHelpers";
import type {
  CommentReassignment,
  CommentWithRunMeta,
  LinkedRunItem,
} from "./comment-thread/CommentThreadTypes";

interface CommentThreadProps {
  comments: CommentWithRunMeta[];
  queuedComments?: CommentWithRunMeta[];
  linkedApprovals?: Approval[];
  feedbackVotes?: FeedbackVote[];
  feedbackDataSharingPreference?: FeedbackDataSharingPreference;
  feedbackTermsUrl?: string | null;
  linkedRuns?: LinkedRunItem[];
  timelineEvents?: IssueTimelineEvent[];
  companyId?: string | null;
  projectId?: string | null;
  onApproveApproval?: (approvalId: string) => Promise<void>;
  onRejectApproval?: (approvalId: string) => Promise<void>;
  pendingApprovalAction?: {
    approvalId: string;
    action: "approve" | "reject";
  } | null;
  onVote?: (
    commentId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  onAdd: (body: string, reopen?: boolean, reassignment?: CommentReassignment) => Promise<void>;
  issueStatus?: string;
  agentMap?: Map<string, Agent>;
  currentUserId?: string | null;
  imageUploadHandler?: (file: File) => Promise<string>;
  onAttachImage?: (file: File) => Promise<void>;
  draftKey?: string;
  liveRunSlot?: ReactNode;
  enableReassign?: boolean;
  reassignOptions?: InlineEntityOption[];
  currentAssigneeValue?: string;
  suggestedAssigneeValue?: string;
  mentions?: MentionOption[];
  onInterruptQueued?: (runId: string) => Promise<void>;
  interruptingQueuedRunId?: string | null;
  composerDisabledReason?: string | null;
}

export function CommentThread({
  comments,
  queuedComments = [],
  linkedApprovals = [],
  feedbackVotes = [],
  feedbackDataSharingPreference = "prompt",
  feedbackTermsUrl = null,
  linkedRuns = [],
  timelineEvents = [],
  companyId,
  projectId,
  onApproveApproval,
  onRejectApproval,
  pendingApprovalAction = null,
  onVote,
  onAdd,
  issueStatus,
  agentMap,
  currentUserId,
  imageUploadHandler,
  onAttachImage,
  draftKey,
  liveRunSlot,
  enableReassign = false,
  reassignOptions = [],
  currentAssigneeValue = "",
  suggestedAssigneeValue,
  mentions: providedMentions,
  onInterruptQueued,
  interruptingQueuedRunId = null,
  composerDisabledReason = null,
}: CommentThreadProps) {
  const [body, setBody] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [attaching, setAttaching] = useState(false);
  const effectiveSuggestedAssigneeValue = suggestedAssigneeValue ?? currentAssigneeValue;
  const [reassignTarget, setReassignTarget] = useState(effectiveSuggestedAssigneeValue);
  const [highlightCommentId, setHighlightCommentId] = useState<string | null>(null);
  const [votingTargetId, setVotingTargetId] = useState<string | null>(null);
  const editorRef = useRef<MarkdownEditorRef>(null);
  const attachInputRef = useRef<HTMLInputElement | null>(null);
  const draftTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();
  const hasScrolledRef = useRef(false);

  const timeline = useMemo(
    () => buildCommentTimeline({ comments, linkedApprovals, timelineEvents, linkedRuns }),
    [comments, linkedApprovals, timelineEvents, linkedRuns],
  );
  const feedbackVoteByTargetId = useMemo(() => buildFeedbackVoteMap(feedbackVotes), [feedbackVotes]);
  const mentions = useMemo<MentionOption[]>(
    () => buildMentionOptions(agentMap, providedMentions),
    [agentMap, providedMentions],
  );

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

  useEffect(() => () => {
    if (draftTimer.current) clearTimeout(draftTimer.current);
  }, []);

  useEffect(() => {
    setReassignTarget(effectiveSuggestedAssigneeValue);
  }, [effectiveSuggestedAssigneeValue]);

  useEffect(() => {
    const hash = location.hash;
    if (!hash.startsWith("#comment-") || comments.length + queuedComments.length === 0) return;
    const commentId = hash.slice("#comment-".length);
    if (hasScrolledRef.current) return;
    const el = document.getElementById(`comment-${commentId}`);
    if (!el) return;

    hasScrolledRef.current = true;
    setHighlightCommentId(commentId);
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightCommentId(null), 3000);
    return () => clearTimeout(timer);
  }, [location.hash, comments, queuedComments]);

  async function handleSubmit() {
    const trimmed = body.trim();
    if (!trimmed) return;
    const hasReassignment = enableReassign && reassignTarget !== currentAssigneeValue;
    const reassignment = hasReassignment ? parseReassignment(reassignTarget) : null;
    const reopen = shouldImplicitlyReopenComment(
      issueStatus,
      hasReassignment ? reassignTarget : currentAssigneeValue,
    ) ? true : undefined;

    setSubmitting(true);
    setBody("");
    try {
      await onAdd(trimmed, reopen, reassignment ?? undefined);
      if (draftKey) clearDraft(draftKey);
      setReassignTarget(effectiveSuggestedAssigneeValue);
    } catch {
      setBody((current) => restoreSubmittedCommentDraft({ currentBody: current, submittedBody: trimmed }));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAttachFile(evt: ChangeEvent<HTMLInputElement>) {
    const file = evt.target.files?.[0];
    if (!file) return;
    setAttaching(true);
    try {
      if (imageUploadHandler) {
        const url = await imageUploadHandler(file);
        const safeName = file.name.replace(/[[\]]/g, "\\$&");
        const markdown = `![${safeName}](${url})`;
        setBody((prev) => prev ? `${prev}\n\n${markdown}` : markdown);
      } else if (onAttachImage) {
        await onAttachImage(file);
      }
    } finally {
      setAttaching(false);
      if (attachInputRef.current) attachInputRef.current.value = "";
    }
  }

  async function handleFeedbackVote(
    commentId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) {
    if (!onVote) return;
    setVotingTargetId(commentId);
    try {
      await onVote(commentId, vote, options);
    } finally {
      setVotingTargetId(null);
    }
  }

  const canSubmit = !submitting && !!body.trim();

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold">Timeline ({timeline.length + queuedComments.length})</h3>

      <TimelineList
        timeline={timeline}
        agentMap={agentMap}
        currentUserId={currentUserId}
        companyId={companyId}
        projectId={projectId}
        onApproveApproval={onApproveApproval}
        onRejectApproval={onRejectApproval}
        pendingApprovalAction={pendingApprovalAction}
        feedbackVoteByTargetId={feedbackVoteByTargetId}
        feedbackDataSharingPreference={feedbackDataSharingPreference}
        onVote={onVote ? handleFeedbackVote : undefined}
        votingTargetId={votingTargetId}
        highlightCommentId={highlightCommentId}
        feedbackTermsUrl={feedbackTermsUrl}
      />

      {liveRunSlot}

      {queuedComments.length > 0 ? (
        <QueuedCommentsSection
          queuedComments={queuedComments}
          agentMap={agentMap}
          companyId={companyId}
          projectId={projectId}
          highlightCommentId={highlightCommentId}
          onInterruptQueued={onInterruptQueued}
          interruptingQueuedRunId={interruptingQueuedRunId}
        />
      ) : null}

      {composerDisabledReason ? (
        <div className="rounded-md border border-chart-3/40 bg-chart-3/10 px-3 py-2 text-sm text-foreground">
          {composerDisabledReason}
        </div>
      ) : (
        <CommentComposer
          body={body}
          setBody={setBody}
          submitting={submitting}
          attaching={attaching}
          canSubmit={canSubmit}
          editorRef={editorRef}
          attachInputRef={attachInputRef}
          mentions={mentions}
          imageUploadHandler={imageUploadHandler}
          onAttachImage={onAttachImage}
          enableReassign={enableReassign}
          reassignOptions={reassignOptions}
          reassignTarget={reassignTarget}
          setReassignTarget={setReassignTarget}
          agentMap={agentMap}
          onSubmit={handleSubmit}
          onAttachFile={handleAttachFile}
        />
      )}
    </div>
  );
}
