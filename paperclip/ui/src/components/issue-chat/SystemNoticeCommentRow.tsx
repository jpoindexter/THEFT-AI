import { useId, useState } from "react";
import type { ThreadMessage } from "@assistant-ui/react";
import type {
  Agent,
  IssueCommentMetadata,
  IssueCommentPresentation,
  SuccessfulRunHandoffState,
} from "@paperclipai/shared";
import { Check, ChevronDown, Copy, Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MarkdownBody } from "@/components/MarkdownBody";
import {
  SystemNotice,
  type SystemNoticeMetadataRow,
  type SystemNoticeMetadataSection,
} from "@/components/SystemNotice";
import {
  buildSystemNoticeProps,
  mapCommentMetadataToSystemNoticeSections,
} from "@/lib/system-notice-comment";
import { isSuccessfulRunHandoffComment } from "@/lib/successful-run-handoff";
import { cn, formatDateTime, formatShortDate } from "@/lib/utils";
import { timeAgo } from "@/lib/timeAgo";

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

function issueStatusIsTerminalDisposition(issueStatus: string | undefined) {
  return issueStatus === "done" || issueStatus === "cancelled";
}

function sourceRunIdFromSuccessfulRunHandoffMetadata(metadata: IssueCommentMetadata | null) {
  if (metadata?.sourceRunId) return metadata.sourceRunId;
  const runLinks = [];
  for (const section of metadata?.sections ?? []) {
    for (const row of section.rows) {
      if (row.type === "run_link") runLinks.push(row.runId);
    }
  }
  return runLinks.length === 1 ? runLinks[0] : null;
}

function isStaleSuccessfulRunHandoffNotice(input: {
  bodyText: string;
  issueStatus?: string;
  successfulRunHandoff?: SuccessfulRunHandoffState | null;
  runId?: string | null;
  metadata: IssueCommentMetadata | null;
}) {
  if (!isSuccessfulRunHandoffComment(input.bodyText)) return false;

  const currentHandoff = input.successfulRunHandoff ?? null;
  if (currentHandoff?.state === "resolved") return true;
  if (issueStatusIsTerminalDisposition(input.issueStatus)) return true;

  const noticeSourceRunId = sourceRunIdFromSuccessfulRunHandoffMetadata(input.metadata) ?? input.runId ?? null;
  if (
    noticeSourceRunId
    && currentHandoff?.sourceRunId
    && noticeSourceRunId !== currentHandoff.sourceRunId
  ) {
    return true;
  }

  return false;
}

function StaleDispositionWarningMetadataRow({ row }: { row: SystemNoticeMetadataRow }) {
  const label = (
    <span className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
      {row.label}
    </span>
  );
  const value = (() => {
    switch (row.kind) {
      case "text":
        return <span>{row.value}</span>;
      case "code":
        return (
          <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-micro text-foreground/80">
            {row.value}
          </code>
        );
      case "issue": {
        const content = (
          <>
            <span>{row.identifier}</span>
            {row.title ? <span className="text-muted-foreground"> - {row.title}</span> : null}
          </>
        );
        return row.href ? (
          <a href={row.href} className="font-medium text-foreground underline-offset-2 hover:underline">
            {content}
          </a>
        ) : (
          <span className="font-medium text-foreground">{content}</span>
        );
      }
      case "agent":
        return row.href ? (
          <a href={row.href} className="font-medium text-foreground underline-offset-2 hover:underline">
            {row.name}
          </a>
        ) : (
          <span className="font-medium text-foreground">{row.name}</span>
        );
      case "run": {
        const runShort = row.runId.length > 12 ? `${row.runId.slice(0, 8)}...` : row.runId;
        const content = (
          <>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-micro text-foreground/80">
              {runShort}
            </code>
            {row.status ? <span>{row.status}</span> : null}
          </>
        );
        return row.href ? (
          <a href={row.href} className="inline-flex items-center gap-1.5 underline-offset-2 hover:underline">
            {content}
          </a>
        ) : (
          <span className="inline-flex items-center gap-1.5">{content}</span>
        );
      }
    }
  })();

  return (
    <div className="grid grid-cols-4 gap-2 text-xs leading-5">
      <div className="col-span-1 min-w-0">{label}</div>
      <div className="col-span-3 min-w-0 break-words text-foreground/80">{value}</div>
    </div>
  );
}

function metadataRowKey(row: SystemNoticeMetadataRow) {
  switch (row.kind) {
    case "issue":
      return `issue:${row.label}:${row.identifier}:${row.href ?? ""}:${row.title ?? ""}`;
    case "agent":
      return `agent:${row.label}:${row.name}:${row.href ?? ""}`;
    case "run":
      return `run:${row.label}:${row.runId}:${row.href ?? ""}:${row.status ?? ""}`;
    default:
      return `${row.kind}:${row.label}:${row.value}`;
  }
}

function metadataSectionKey(section: SystemNoticeMetadataSection) {
  return `${section.title ?? "details"}:${section.rows.map(metadataRowKey).join("|")}`;
}

function StaleDispositionWarningDetails({
  sections,
}: {
  sections: SystemNoticeMetadataSection[];
}) {
  if (sections.length === 0) {
    return <div className="text-xs leading-5 text-muted-foreground">No additional details.</div>;
  }

  return (
    <div className="space-y-3 text-left">
      {sections.map((section) => (
        <div key={metadataSectionKey(section)} className="space-y-1.5">
          {section.title ? (
            <div className="text-micro font-semibold uppercase tracking-widest text-muted-foreground">
              {section.title}
            </div>
          ) : null}
          <div className="space-y-1">
            {section.rows.map((row) => (
              <StaleDispositionWarningMetadataRow key={metadataRowKey(row)} row={row} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function StaleDispositionWarningRow({
  anchorId,
  message,
  metadata,
  runAgentId,
}: {
  anchorId?: string;
  message: ThreadMessage;
  metadata: IssueCommentMetadata | null;
  runAgentId?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const detailsId = useId();
  const sections = mapCommentMetadataToSystemNoticeSections(metadata, { runAgentId });

  return (
    <div id={anchorId} data-testid="stale-disposition-warning">
      <div className="flex items-start gap-2.5 py-1.5">
        <span className="size-6 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1">
          <Button
            type="button"
            aria-expanded={open}
            aria-controls={detailsId}
            variant="ghost"
            className="group h-auto w-full justify-start gap-2 px-0 py-0.5 text-left hover:bg-transparent"
            onClick={() => setOpen((value) => !value)}
          >
            <span className="text-sm font-medium text-foreground/80">
              Stale disposition warning
            </span>
            <span className="ml-auto flex items-center gap-1.5">
              {message.createdAt ? (
                <span data-testid="stale-disposition-warning-time" className="text-micro text-muted-foreground/50">
                  {systemNoticeDateLabel(message.createdAt)}
                </span>
              ) : null}
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/40 transition-transform", open && "rotate-180")} />
            </span>
          </Button>
          <div id={detailsId} hidden={!open} className="space-y-1 py-1">
            <StaleDispositionWarningDetails sections={sections} />
          </div>
        </div>
      </div>
    </div>
  );
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
