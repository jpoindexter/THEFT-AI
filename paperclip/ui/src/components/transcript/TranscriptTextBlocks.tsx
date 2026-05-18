import { useState } from "react";
import { Check, ChevronDown, ChevronRight, CircleAlert, TerminalSquare, User } from "lucide-react";
import { MarkdownBody } from "../MarkdownBody";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { TranscriptBlock, TranscriptDensity } from "./transcriptModel";

export function TranscriptMessageBlock({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "message" }>;
  density: TranscriptDensity;
}) {
  const isAssistant = block.role === "assistant";
  const compact = density === "compact";

  return (
    <div>
      {!isAssistant && (
        <div className="mb-1.5 flex items-center gap-2 text-micro font-semibold uppercase tracking-wide text-muted-foreground">
          <User className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
          <span>User</span>
        </div>
      )}
      <MarkdownBody
        className={cn(
          "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
          compact ? "text-xs leading-5 text-foreground/85" : "text-sm",
        )}
      >
        {block.text}
      </MarkdownBody>
      {block.streaming && (
        <div className="mt-2 inline-flex items-center gap-1 text-nano font-medium italic text-muted-foreground">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-current opacity-70" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-current" />
          </span>
          Streaming
        </div>
      )}
    </div>
  );
}

export function TranscriptThinkingBlock({
  block,
  density,
  className,
}: {
  block: Extract<TranscriptBlock, { type: "thinking" }>;
  density: TranscriptDensity;
  className?: string;
}) {
  return (
    <MarkdownBody
      className={cn(
        "italic text-foreground/70 [&>*:first-child]:mt-0 [&>*:last-child]:mb-0",
        density === "compact" ? "text-micro leading-5" : "text-sm leading-6",
        className,
      )}
    >
      {block.text}
    </MarkdownBody>
  );
}

export function TranscriptActivityRow({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "activity" }>;
  density: TranscriptDensity;
}) {
  return (
    <div className="flex items-start gap-2">
      {block.status === "completed" ? (
        <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-300" />
      ) : (
        <span className="relative mt-1 flex h-2.5 w-2.5 shrink-0">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-400 opacity-70" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-cyan-500" />
        </span>
      )}
      <div className={cn(
        "break-words text-foreground/80",
        density === "compact" ? "text-xs leading-5" : "text-sm leading-6",
      )}>
        {block.name}
      </div>
    </div>
  );
}

export function TranscriptEventRow({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "event" }>;
  density: TranscriptDensity;
}) {
  const compact = density === "compact";
  const toneClasses =
    block.tone === "error"
      ? "rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3 text-red-700 dark:text-red-300"
      : block.tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : block.tone === "info"
          ? "text-sky-700 dark:text-sky-300"
          : "text-foreground/75";

  return (
    <div className={toneClasses}>
      <div className="flex items-start gap-2">
        {block.tone === "error" ? (
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ) : block.tone === "warn" ? (
          <TerminalSquare className="mt-0.5 h-3.5 w-3.5 shrink-0" />
        ) : (
          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-current/50" />
        )}
        <div className="min-w-0 flex-1">
          {block.label === "result" && block.tone !== "error" ? (
            <MarkdownBody
              className={cn(
                "[&>*:first-child]:mt-0 [&>*:last-child]:mb-0 text-sky-700 dark:text-sky-300",
                compact ? "text-micro leading-5" : "text-xs leading-5",
              )}
            >
              {block.text}
            </MarkdownBody>
          ) : (
            <div className={cn("whitespace-pre-wrap break-words", compact ? "text-micro" : "text-xs")}>
              <span className="text-nano font-semibold uppercase tracking-wide text-muted-foreground/70">
                {block.label}
              </span>
              {block.text ? <span className="ml-2">{block.text}</span> : null}
            </div>
          )}
          {block.detail && (
            <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro text-foreground/75">
              {block.detail}
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}

export function TranscriptStdoutRow({
  block,
  density,
  collapseByDefault,
}: {
  block: Extract<TranscriptBlock, { type: "stdout" }>;
  density: TranscriptDensity;
  collapseByDefault: boolean;
}) {
  const [open, setOpen] = useState(!collapseByDefault);

  return (
    <div>
      <div className="flex items-center gap-2">
        <span className="text-nano font-semibold uppercase tracking-wide text-muted-foreground">
          stdout
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="h-5 w-5 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Collapse stdout" : "Expand stdout"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      {open && (
        <pre className={cn(
          "mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-foreground/80",
          density === "compact" ? "text-micro" : "text-xs",
        )}>
          {block.text}
        </pre>
      )}
    </div>
  );
}
