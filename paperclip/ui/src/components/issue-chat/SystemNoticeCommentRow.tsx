import { useState } from "react";
import type { ThreadMessage } from "@assistant-ui/react";
import type {
  Agent,
  IssueCommentMetadata,
  IssueCommentPresentation,
  SuccessfulRunHandoffState,
} from "@paperclipai/shared";
import { Check, Copy, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MarkdownBody } from "@/components/MarkdownBody";
import { SystemNotice } from "@/components/SystemNotice";
import { buildSystemNoticeProps } from "@/lib/system-notice-comment";
import { formatDateTime, formatShortDate } from "@/lib/utils";
import { timeAgo } from "@/lib/timeAgo";
import {
  isStaleSuccessfulRunHandoffNotice,
  StaleDispositionWarningRow,
} from "./StaleDispositionWarning";

const SYSTEM_NOTICE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

type SystemNoticeCommentRowProps = {
  message: ThreadMessage;
  anchorId?: string;
  agentMap?: Map<string, Agent>;
  issueStatus?: string;
  successfulRunHandoff?: SuccessfulRunHandoffState | null;
  onImageClick?: (src: string) => void;
};

function systemNoticeDateLabel(date: Date | string | undefined): string {
  if (!date) return "";
  const then = new Date(date).getTime();
  if (Date.now() - then < SYSTEM_NOTICE_WEEK_MS) return timeAgo(date);
  return formatShortDate(date);
}

function isIssueCommentPresentation(value: unknown): value is IssueCommentPresentation {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.kind === "system_notice" || v.kind === "message";
}

function isIssueCommentMetadata(value: unknown): value is IssueCommentMetadata {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return v.version === 1 && Array.isArray(v.sections);
}

export function SystemNoticeCommentRow({
  message,
  anchorId,
  agentMap,
  issueStatus,
  successfulRunHandoff,
  onImageClick,
}: SystemNoticeCommentRowProps) {
  const custom = message.metadata.custom as Record<string, unknown>;
  const presentation = isIssueCommentPresentation(custom.presentation) ? custom.presentation : null;
  const commentMetadata = isIssueCommentMetadata(custom.commentMetadata) ? custom.commentMetadata : null;
  const runAgentId = typeof custom.runAgentId === "string" ? custom.runAgentId : null;
  const runId = typeof custom.runId === "string" ? custom.runId : null;
  const authorType = typeof custom.authorType === "string" ? custom.authorType : null;
  const authorName = typeof custom.authorName === "string" ? custom.authorName : null;
  const bodyText = message.content
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("\n\n");
  const staleSuccessfulRunHandoffNotice = isStaleSuccessfulRunHandoffNotice({
    bodyText,
    issueStatus,
    successfulRunHandoff,
    runId,
    metadata: commentMetadata,
  });
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const source = (() => {
    const runAgentName = runAgentId ? agentMap?.get(runAgentId)?.name ?? null : null;
    if (authorType === "system") {
      const label = runAgentName ?? "Paperclip";
      if (runAgentId && runId) return { label, href: `/agents/${runAgentId}/runs/${runId}` };
      return { label };
    }
    if (runAgentId && runId) {
      return { label: authorName ?? runAgentName ?? "Paperclip", href: `/agents/${runAgentId}/runs/${runId}` };
    }
    if (authorName) return { label: authorName };
    return undefined;
  })();

  const props = buildSystemNoticeProps({
    presentation,
    metadata: commentMetadata,
    body: (
      <MarkdownBody className="text-sm leading-6" softBreaks onImageClick={onImageClick}>
        {bodyText}
      </MarkdownBody>
    ),
    timestamp: message.createdAt ? new Date(message.createdAt).toISOString() : undefined,
    source,
    runAgentId,
  });

  const handleCopy = () => {
    void navigator.clipboard.writeText(bodyText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCopyLink = () => {
    if (!anchorId || typeof window === "undefined") return;
    const url = `${window.location.origin}${window.location.pathname}#${anchorId}`;
    void navigator.clipboard.writeText(url).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    });
  };

  if (staleSuccessfulRunHandoffNotice) {
    return (
      <StaleDispositionWarningRow
        anchorId={anchorId}
        message={message}
        metadata={commentMetadata}
        runAgentId={runAgentId}
      />
    );
  }

  return (
    <div id={anchorId} className="group">
      <div className="py-1">
        <SystemNotice {...props} />
        <div className="mt-1 flex items-center justify-end gap-1.5 px-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Tooltip>
            <TooltipTrigger asChild>
              <a
                href={anchorId ? `#${anchorId}` : undefined}
                className="text-micro text-muted-foreground hover:text-foreground hover:underline"
              >
                {message.createdAt ? systemNoticeDateLabel(message.createdAt) : ""}
              </a>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {message.createdAt ? formatDateTime(message.createdAt) : ""}
            </TooltipContent>
          </Tooltip>
          {anchorId ? (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="text-muted-foreground hover:text-foreground"
              title="Copy link"
              aria-label="Copy link to system notice"
              onClick={handleCopyLink}
            >
              {copiedLink ? <Check className="h-3.5 w-3.5" /> : <Paperclip className="h-3.5 w-3.5" />}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="text-muted-foreground hover:text-foreground"
            title="Copy notice text"
            aria-label="Copy system notice"
            onClick={handleCopy}
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}
