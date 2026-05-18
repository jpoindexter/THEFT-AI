import { useMemo, useState } from "react";
import type { TranscriptEntry } from "../../adapters";
import { MarkdownBody } from "../MarkdownBody";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { RawTranscriptView } from "./RawTranscriptView";
import type { TranscriptBlock, TranscriptDensity, TranscriptMode } from "./transcriptModel";
import {
  formatToolPayload,
  humanizeLabel,
  normalizeTranscript,
  parseStructuredToolResult,
  summarizeToolInput,
  summarizeToolResult,
  truncate,
} from "./transcriptModel";
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleAlert,
  GitCompare,
  TerminalSquare,
  User,
  Wrench,
} from "lucide-react";

export type { TranscriptDensity, TranscriptMode } from "./transcriptModel";
export { normalizeTranscript } from "./transcriptModel";

interface RunTranscriptViewProps {
  entries: TranscriptEntry[];
  mode?: TranscriptMode;
  density?: TranscriptDensity;
  limit?: number;
  streaming?: boolean;
  collapseStdout?: boolean;
  emptyMessage?: string;
  className?: string;
  thinkingClassName?: string;
}

function TranscriptMessageBlock({
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

function TranscriptThinkingBlock({
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

function TranscriptToolCard({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "tool" }>;
  density: TranscriptDensity;
}) {
  const [open, setOpen] = useState(block.status === "error");
  const compact = density === "compact";
  const parsedResult = parseStructuredToolResult(block.result);
  const statusLabel =
    block.status === "running"
      ? "Running"
      : block.status === "error"
        ? "Errored"
        : "Completed";
  const statusTone =
    block.status === "running"
      ? "text-cyan-700 dark:text-cyan-300"
      : block.status === "error"
        ? "text-red-700 dark:text-red-300"
        : "text-emerald-700 dark:text-emerald-300";
  const detailsClass = cn(
    "space-y-3",
    block.status === "error" && "rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3",
  );
  const iconClass = cn(
    "mt-0.5 h-3.5 w-3.5 shrink-0",
    block.status === "error"
      ? "text-red-600 dark:text-red-300"
      : block.status === "completed"
        ? "text-emerald-600 dark:text-emerald-300"
        : "text-cyan-600 dark:text-cyan-300",
  );
  const summary = block.status === "running"
    ? summarizeToolInput(block.name, block.input, density)
    : block.status === "completed" && parsedResult?.body
      ? truncate(parsedResult.body.split("\n")[0] ?? parsedResult.body, compact ? 84 : 140)
      : summarizeToolResult(block.result, block.isError, density);

  return (
    <div className={cn(block.status === "error" && "rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3")}>
      <div className="flex items-start gap-2">
        {block.status === "error" ? (
          <CircleAlert className={iconClass} />
        ) : block.status === "completed" ? (
          <Check className={iconClass} />
        ) : (
          <Wrench className={iconClass} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-micro font-semibold uppercase tracking-wide text-muted-foreground">
              {block.name}
            </span>
            <span className={cn("text-nano font-semibold uppercase tracking-wide", statusTone)}>
              {statusLabel}
            </span>
          </div>
          <div className={cn("mt-1 break-words text-foreground/80", compact ? "text-xs" : "text-sm")}>
            {summary}
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="mt-0.5 h-5 w-5 text-muted-foreground hover:text-foreground"
          onClick={() => setOpen((value) => !value)}
          aria-label={open ? "Collapse tool details" : "Expand tool details"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      {open && (
        <div className="mt-3">
          <div className={detailsClass}>
            <div className={cn("grid gap-3", compact ? "grid-cols-1" : "lg:grid-cols-2")}>
              <div>
                <div className="mb-1 text-nano font-semibold uppercase tracking-wide text-muted-foreground">
                  Input
                </div>
                <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro text-foreground/80">
                  {formatToolPayload(block.input) || "<empty>"}
                </pre>
              </div>
              <div>
                <div className="mb-1 text-nano font-semibold uppercase tracking-wide text-muted-foreground">
                  Result
                </div>
                <pre className={cn(
                  "overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro",
                  block.status === "error" ? "text-red-700 dark:text-red-300" : "text-foreground/80",
                )}>
                  {block.result ? formatToolPayload(block.result) : "Waiting for result..."}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function hasSelectedText() {
  if (typeof window === "undefined") return false;
  return (window.getSelection()?.toString().length ?? 0) > 0;
}

function TranscriptCommandGroup({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "command_group" }>;
  density: TranscriptDensity;
}) {
  const [open, setOpen] = useState(false);
  const compact = density === "compact";
  const runningItem = [...block.items].reverse().find((item) => item.status === "running");
  const latestItem = block.items[block.items.length - 1] ?? null;
  const hasError = block.items.some((item) => item.status === "error");
  const isRunning = Boolean(runningItem);
  const showExpandedErrorState = open && hasError;
  const title = isRunning
    ? "Executing command"
    : block.items.length === 1
      ? "Executed command"
      : `Executed ${block.items.length} commands`;
  const subtitle = runningItem
    ? summarizeToolInput("command_execution", runningItem.input, density)
    : null;
  const statusTone = isRunning
      ? "text-cyan-700 dark:text-cyan-300"
      : "text-foreground/70";

  return (
    <div className={cn(showExpandedErrorState && "rounded-xl border border-red-500/20 bg-red-500/[0.04] p-3")}>
      <div
        role="button"
        tabIndex={0}
        className={cn("flex cursor-pointer gap-2", subtitle ? "items-start" : "items-center")}
        onClick={() => {
          if (hasSelectedText()) return;
          setOpen((value) => !value);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        <div className={cn("flex shrink-0 items-center", subtitle && "mt-0.5")}>
          {block.items.slice(0, Math.min(block.items.length, 3)).map((_, index) => (
            <span
              key={index}
              className={cn(
                "inline-flex h-6 w-6 items-center justify-center rounded-full border shadow-sm",
                index > 0 && "-ml-1.5",
                isRunning
                  ? "border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-600 dark:text-cyan-300"
                  : "border-border/70 bg-background text-foreground/55",
                isRunning && "animate-pulse",
              )}
            >
              <TerminalSquare className="h-3.5 w-3.5" />
            </span>
          ))}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-micro font-semibold uppercase leading-none tracking-wide text-muted-foreground/70">
            {title}
          </div>
          {subtitle && (
            <div className={cn("mt-1 break-words font-mono text-foreground/85", compact ? "text-xs" : "text-sm")}>
              {subtitle}
            </div>
          )}
          {!subtitle && latestItem?.status === "error" && open && (
            <div className={cn("mt-1", compact ? "text-xs" : "text-sm", statusTone)}>
              Command failed
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn(
            "h-5 w-5 text-muted-foreground hover:text-foreground",
            subtitle && "mt-0.5",
          )}
          onClick={(event) => {
            event.stopPropagation();
            setOpen((value) => !value);
          }}
          aria-label={open ? "Collapse command details" : "Expand command details"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      {open && (
        <div className={cn("mt-3 space-y-3", hasError && "rounded-xl border border-red-500/20 bg-red-500/[0.06] p-3")}>
          {block.items.map((item, index) => (
            <div key={`${item.ts}-${index}`} className="space-y-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  item.status === "error"
                    ? "border-red-500/25 bg-red-500/[0.08] text-red-600 dark:text-red-300"
                    : item.status === "running"
                      ? "border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-600 dark:text-cyan-300"
                      : "border-border/70 bg-background text-foreground/55",
                )}>
                  <TerminalSquare className="h-3 w-3" />
                </span>
                <span className={cn("font-mono break-all", compact ? "text-micro" : "text-xs")}>
                  {summarizeToolInput("command_execution", item.input, density)}
                </span>
              </div>
              {item.result && (
                <pre className={cn(
                  "overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro",
                  item.status === "error" ? "text-red-700 dark:text-red-300" : "text-foreground/80",
                )}>
                  {formatToolPayload(item.result)}
                </pre>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TranscriptToolGroup({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "tool_group" }>;
  density: TranscriptDensity;
}) {
  const [open, setOpen] = useState(false);
  const compact = density === "compact";
  const runningItem = [...block.items].reverse().find((item) => item.status === "running");
  const hasError = block.items.some((item) => item.status === "error");
  const isRunning = Boolean(runningItem);
  const uniqueNames = [...new Set(block.items.map((item) => item.name))];
  const toolLabel =
    uniqueNames.length === 1
      ? humanizeLabel(uniqueNames[0])
      : `${uniqueNames.length} tools`;
  const title = isRunning
    ? `Using ${toolLabel}`
    : block.items.length === 1
      ? `Used ${toolLabel}`
      : `Used ${toolLabel} (${block.items.length} calls)`;
  const subtitle = runningItem
    ? summarizeToolInput(runningItem.name, runningItem.input, density)
    : null;
  const statusTone = isRunning
    ? "text-cyan-700 dark:text-cyan-300"
    : "text-foreground/70";

  return (
    <div className="rounded-xl border border-border/40 bg-muted/[0.25]">
      <div
        role="button"
        tabIndex={0}
        className={cn("flex cursor-pointer gap-2 px-3 py-2.5", subtitle ? "items-start" : "items-center")}
        onClick={() => { if (hasSelectedText()) return; setOpen((v) => !v); }}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <div className={cn("flex shrink-0 items-center", subtitle && "mt-0.5")}>
          {block.items.slice(0, Math.min(block.items.length, 3)).map((item, index) => {
            const isItemRunning = item.status === "running";
            const isItemError = item.status === "error";
            return (
              <span
                key={`${item.ts}-${index}`}
                className={cn(
                  "inline-flex h-6 w-6 items-center justify-center rounded-full border shadow-sm",
                  index > 0 && "-ml-1.5",
                  isItemRunning
                    ? "border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-600 dark:text-cyan-300"
                    : isItemError
                      ? "border-red-500/25 bg-red-500/[0.08] text-red-600 dark:text-red-300"
                      : "border-border/70 bg-background text-foreground/55",
                  isItemRunning && "animate-pulse",
                )}
              >
                <Wrench className="h-3.5 w-3.5" />
              </span>
            );
          })}
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("font-semibold uppercase leading-none tracking-wide", compact ? "text-nano" : "text-micro", "text-muted-foreground/70")}>
            {title}
          </div>
          {subtitle && (
            <div className={cn("mt-1 break-words font-mono text-foreground/85", compact ? "text-xs" : "text-sm")}>
              {subtitle}
            </div>
          )}
        </div>
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className={cn("h-5 w-5 text-muted-foreground hover:text-foreground", subtitle && "mt-0.5")}
          onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
          aria-label={open ? "Collapse tool details" : "Expand tool details"}
        >
          {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>
      {open && (
        <div className={cn("space-y-2 border-t border-border/30 px-3 py-3", hasError && "rounded-b-xl")}>
          {block.items.map((item, index) => (
            <div key={`${item.ts}-${index}`} className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border",
                  item.status === "error"
                    ? "border-red-500/25 bg-red-500/[0.08] text-red-600 dark:text-red-300"
                    : item.status === "running"
                      ? "border-cyan-500/25 bg-cyan-500/[0.08] text-cyan-600 dark:text-cyan-300"
                      : "border-border/70 bg-background text-foreground/55",
                )}>
                  <Wrench className="h-3 w-3" />
                </span>
                <span className={cn("text-nano font-semibold uppercase tracking-wide text-muted-foreground")}>
                  {humanizeLabel(item.name)}
                </span>
                <span className={cn("text-nano font-semibold uppercase tracking-wide",
                  item.status === "running" ? "text-cyan-700 dark:text-cyan-300"
                  : item.status === "error" ? "text-red-700 dark:text-red-300"
                  : "text-emerald-700 dark:text-emerald-300"
                )}>
                  {item.status === "running" ? "Running" : item.status === "error" ? "Errored" : "Completed"}
                </span>
              </div>
              <div className={cn("grid gap-2 pl-7", compact ? "grid-cols-1" : "lg:grid-cols-2")}>
                <div>
                  <div className="mb-0.5 text-nano font-semibold uppercase tracking-wide text-muted-foreground">Input</div>
                  <pre className="overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro text-foreground/80">
                    {formatToolPayload(item.input) || "<empty>"}
                  </pre>
                </div>
                {item.result && (
                  <div>
                    <div className="mb-0.5 text-nano font-semibold uppercase tracking-wide text-muted-foreground">Result</div>
                    <pre className={cn(
                      "overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro",
                      item.status === "error" ? "text-red-700 dark:text-red-300" : "text-foreground/80",
                    )}>
                      {formatToolPayload(item.result)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TranscriptActivityRow({
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

function TranscriptEventRow({
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

function TranscriptDiffGroup({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "diff_group" }>;
  density: TranscriptDensity;
}) {
  const [open, setOpen] = useState(false);
  const compact = density === "compact";

  // Count add/remove lines (exclude context, hunk, file_header, truncation)
  const addCount = block.hunks.filter((h) => h.changeType === "add").length;
  const removeCount = block.hunks.filter((h) => h.changeType === "remove").length;
  const hasChanges = addCount > 0 || removeCount > 0;

  // Extract a short file name from the path
  const shortFile = block.filePath
    ? block.filePath.split("/").pop() ?? block.filePath
    : "diff";

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-2">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <GitCompare className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className={cn("text-micro font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300")}>
          {shortFile}
        </span>
        {hasChanges && (
          <span className="text-nano tabular-nums">
            <span className="text-emerald-600 dark:text-emerald-400">+{addCount}</span>
            {" "}
            <span className="text-red-600 dark:text-red-400">-{removeCount}</span>
          </span>
        )}
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </div>
      {open && (
        <pre className={cn(
          "mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono pl-5",
          compact ? "text-micro" : "text-xs",
        )}>
          {block.hunks.map((hunk, i) => {
            const key = `${i}-${hunk.changeType}`;
            switch (hunk.changeType) {
              case "remove":
                return (
                  <span key={key} className="block bg-red-500/[0.10] text-red-700 dark:text-red-300 -mx-2 px-2">
                    <span className="select-none mr-2 text-red-500/60 dark:text-red-400/50">-</span>
                    {hunk.text}
                    {"\n"}
                  </span>
                );
              case "add":
                return (
                  <span key={key} className="block bg-emerald-500/[0.10] text-emerald-700 dark:text-emerald-300 -mx-2 px-2">
                    <span className="select-none mr-2 text-emerald-500/60 dark:text-emerald-400/50">+</span>
                    {hunk.text}
                    {"\n"}
                  </span>
                );
              case "file_header":
                return (
                  <span key={key} className="block font-semibold text-blue-600 dark:text-blue-300 mt-2 first:mt-0">
                    {hunk.text}
                    {"\n"}
                  </span>
                );
              case "truncation":
                return (
                  <span key={key} className="block text-muted-foreground italic mt-1">
                    {hunk.text}
                    {"\n"}
                  </span>
                );
              case "context":
              default:
                return (
                  <span key={key} className="block text-muted-foreground/70">
                    {" "}
                    {hunk.text}
                    {"\n"}
                  </span>
                );
            }
          })}
        </pre>
      )}
    </div>
  );
}

function TranscriptStderrGroup({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "stderr_group" }>;
  density: TranscriptDensity;
}) {
  const [open, setOpen] = useState(false);
  const compact = density === "compact";
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-2 text-amber-700 dark:text-amber-300">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <span className={cn("text-nano font-semibold uppercase tracking-wide")}>
          {block.lines.length} log {block.lines.length === 1 ? "line" : "lines"}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </div>
      {open && (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro text-amber-700/80 dark:text-amber-300/80 pl-5">
          {block.lines.map((line, i) => (
            <span key={`${line.ts}-${i}`}>
              <span className="select-none text-amber-500/50 dark:text-amber-400/40">{i > 0 ? "\n" : ""}</span>
              {line.text}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}

function TranscriptSystemGroup({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "system_group" }>;
  density: TranscriptDensity;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-2 text-blue-700 dark:text-blue-300">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setOpen((v) => !v); } }}
      >
        <TerminalSquare className="h-3.5 w-3.5 shrink-0" />
        <span className="text-nano font-semibold uppercase tracking-wide">
          {block.lines.length} system {block.lines.length === 1 ? "message" : "messages"}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </div>
      {open && (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words font-mono text-micro text-blue-700/80 dark:text-blue-300/80 pl-5">
          {block.lines.map((line, i) => (
            <span key={`${line.ts}-${i}`}>
              <span className="select-none text-blue-500/40 dark:text-blue-400/30">{i > 0 ? "\n" : ""}</span>
              {line.text}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}

function TranscriptStdoutRow({
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

export function RunTranscriptView({
  entries,
  mode = "nice",
  density = "comfortable",
  limit,
  streaming = false,
  collapseStdout = false,
  emptyMessage = "No transcript yet.",
  className,
  thinkingClassName,
}: RunTranscriptViewProps) {
  const blocks = useMemo(
    () => (mode === "raw" ? [] : normalizeTranscript(entries, streaming)),
    [entries, mode, streaming],
  );
  const visibleBlocks = limit ? blocks.slice(-limit) : blocks;
  const visibleEntries = limit ? entries.slice(-limit) : entries;

  if (entries.length === 0) {
    return (
      <div className={cn("rounded-2xl border border-dashed border-border/70 bg-background/40 p-4 text-sm text-muted-foreground", className)}>
        {emptyMessage}
      </div>
    );
  }

  if (mode === "raw") {
    return (
      <div className={className}>
        <RawTranscriptView entries={visibleEntries} density={density} />
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {visibleBlocks.map((block, index) => (
        <div
          key={`${block.type}-${block.ts}-${index}`}
          className={cn(index === visibleBlocks.length - 1 && streaming && "animate-in fade-in slide-in-from-bottom-1 duration-300")}
        >
          {block.type === "message" && <TranscriptMessageBlock block={block} density={density} />}
          {block.type === "thinking" && (
            <TranscriptThinkingBlock block={block} density={density} className={thinkingClassName} />
          )}
          {block.type === "tool" && <TranscriptToolCard block={block} density={density} />}
          {block.type === "command_group" && <TranscriptCommandGroup block={block} density={density} />}
          {block.type === "tool_group" && <TranscriptToolGroup block={block} density={density} />}
          {block.type === "diff_group" && <TranscriptDiffGroup block={block} density={density} />}
          {block.type === "stderr_group" && <TranscriptStderrGroup block={block} density={density} />}
          {block.type === "system_group" && <TranscriptSystemGroup block={block} density={density} />}
          {block.type === "stdout" && (
            <TranscriptStdoutRow block={block} density={density} collapseByDefault={collapseStdout} />
          )}
          {block.type === "activity" && <TranscriptActivityRow block={block} density={density} />}
          {block.type === "event" && <TranscriptEventRow block={block} density={density} />}
        </div>
      ))}
    </div>
  );
}
