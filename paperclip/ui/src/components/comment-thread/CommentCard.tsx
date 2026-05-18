import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import type {
  Agent,
  FeedbackDataSharingPreference,
  FeedbackVoteValue,
} from "@paperclipai/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { PluginSlotOutlet } from "@/plugins/slots";
import { cn, formatDateTime } from "../../lib/utils";
import { Identity } from "../Identity";
import { MarkdownBody } from "../MarkdownBody";
import { OutputFeedbackButtons } from "../OutputFeedbackButtons";
import type { CommentWithRunMeta } from "./CommentThreadTypes";

async function copyTextWithFallback(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.className = "fixed -left-full";
  document.body.appendChild(textarea);

  try {
    textarea.select();
    const success = document.execCommand("copy");
    if (!success) throw new Error("execCommand copy failed");
  } finally {
    document.body.removeChild(textarea);
  }
}

function CopyMarkdownButton({ text }: { text: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  const label = status === "copied" ? "Copied" : status === "failed" ? "Copy failed" : "Copy";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      className={cn(
        "min-h-8 gap-1.5 px-2.5 text-xs",
        status === "copied"
          ? "bg-chart-2/10 text-chart-2"
          : status === "failed"
            ? "bg-destructive/10 text-destructive"
            : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
      )}
      title={label}
      aria-label="Copy comment as markdown"
      onClick={() => {
        void copyTextWithFallback(text)
          .then(() => setStatus("copied"))
          .catch(() => setStatus("failed"));

        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setStatus("idle");
          timeoutRef.current = null;
        }, 1500);
      }}
    >
      {status === "copied" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      <span className="sm:hidden">{label}</span>
      <span className="sr-only" aria-live="polite">
        {label}
      </span>
    </Button>
  );
}

function RunPill({
  runId,
  runAgentId,
}: {
  runId: string;
  runAgentId?: string | null;
}) {
  const className = "inline-flex items-center rounded-md border border-border bg-accent/30 px-2 py-1 font-mono text-nano text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground";
  if (runAgentId) {
    return (
      <Link to={`/agents/${runAgentId}/runs/${runId}`} className={className}>
        run {runId.slice(0, 8)}
      </Link>
    );
  }

  return <span className={className}>run {runId.slice(0, 8)}</span>;
}

export function CommentCard({
  comment,
  agentMap,
  companyId,
  projectId,
  feedbackVote = null,
  feedbackDataSharingPreference = "prompt",
  feedbackTermsUrl = null,
  onVote,
  voting = false,
  highlightCommentId,
  queued = false,
}: {
  comment: CommentWithRunMeta;
  agentMap?: Map<string, Agent>;
  companyId?: string | null;
  projectId?: string | null;
  feedbackVote?: FeedbackVoteValue | null;
  feedbackDataSharingPreference?: FeedbackDataSharingPreference;
  feedbackTermsUrl?: string | null;
  onVote?: (
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  voting?: boolean;
  highlightCommentId?: string | null;
  queued?: boolean;
}) {
  const isHighlighted = highlightCommentId === comment.id;
  const isPending = comment.clientStatus === "pending";
  const isQueued = queued || comment.queueState === "queued" || comment.clientStatus === "queued";
  const followUpRequested = comment.followUpRequested === true;

  return (
    <div
      key={comment.id}
      id={`comment-${comment.id}`}
      className={cn(
        "min-w-0 overflow-hidden rounded-sm border p-3 transition-colors duration-1000",
        isQueued
          ? "border-chart-3/40 bg-chart-3/10"
          : isHighlighted
            ? "border-primary/50 bg-primary/5"
            : "border-border",
        isPending && "opacity-80",
      )}
    >
      <div className="mb-1 flex items-center justify-between">
        {comment.authorAgentId ? (
          <Link to={`/agents/${comment.authorAgentId}`} className="hover:underline">
            <Identity
              name={agentMap?.get(comment.authorAgentId)?.name ?? comment.authorAgentId.slice(0, 8)}
              size="sm"
            />
          </Link>
        ) : (
          <Identity name="You" size="sm" />
        )}
        <span className="flex items-center gap-1.5">
          {isQueued ? (
            <span className="theft-label-nano inline-flex items-center rounded-full border border-chart-3/40 bg-chart-3/10 px-2 py-0.5 text-chart-3">
              Queued
            </span>
          ) : null}
          {followUpRequested ? (
            <Badge variant="outline" className="theft-label-nano">
              Follow-up
            </Badge>
          ) : null}
          {companyId && !isPending ? (
            <PluginSlotOutlet
              slotTypes={["commentContextMenuItem"]}
              entityType="comment"
              context={{
                companyId,
                projectId: projectId ?? null,
                entityId: comment.id,
                entityType: "comment",
                parentEntityId: comment.issueId,
              }}
              className="flex flex-wrap items-center gap-1.5"
              itemClassName="inline-flex"
              missingBehavior="placeholder"
            />
          ) : null}
          {isPending ? (
            <span className="text-xs text-muted-foreground">{isQueued ? "Queueing..." : "Sending..."}</span>
          ) : (
            <a
              href={`#comment-${comment.id}`}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              {formatDateTime(comment.createdAt)}
            </a>
          )}
          <CopyMarkdownButton text={comment.body} />
        </span>
      </div>
      <MarkdownBody className="text-sm" softBreaks>{comment.body}</MarkdownBody>
      {companyId && !isPending ? (
        <div className="mt-2 space-y-2">
          <PluginSlotOutlet
            slotTypes={["commentAnnotation"]}
            entityType="comment"
            context={{
              companyId,
              projectId: projectId ?? null,
              entityId: comment.id,
              entityType: "comment",
              parentEntityId: comment.issueId,
            }}
            className="space-y-2"
            itemClassName="rounded-md"
            missingBehavior="placeholder"
          />
        </div>
      ) : null}
      {comment.authorAgentId && onVote && !isQueued && !isPending ? (
        <OutputFeedbackButtons
          activeVote={feedbackVote}
          disabled={voting}
          sharingPreference={feedbackDataSharingPreference}
          termsUrl={feedbackTermsUrl}
          onVote={onVote}
          rightSlot={comment.runId ? <RunPill runId={comment.runId} runAgentId={comment.runAgentId} /> : undefined}
        />
      ) : null}
      {comment.runId && !isPending && !(comment.authorAgentId && onVote && !isQueued) ? (
        <div className="mt-3 border-t border-border/60 pt-3">
          <RunPill runId={comment.runId} runAgentId={comment.runAgentId} />
        </div>
      ) : null}
    </div>
  );
}
