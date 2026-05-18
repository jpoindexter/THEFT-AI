import { useMemo, useState } from "react";
import type { TranscriptEntry } from "../../adapters";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import { RawTranscriptView } from "./RawTranscriptView";
import { TranscriptDiffGroup, TranscriptStderrGroup, TranscriptSystemGroup } from "./TranscriptChangeGroups";
import {
  TranscriptActivityRow,
  TranscriptEventRow,
  TranscriptMessageBlock,
  TranscriptStdoutRow,
  TranscriptThinkingBlock,
} from "./TranscriptTextBlocks";
import { TranscriptCommandGroup, TranscriptToolGroup } from "./TranscriptToolGroups";
import type { TranscriptBlock, TranscriptDensity, TranscriptMode } from "./transcriptModel";
import {
  formatToolPayload,
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
          {block.type === "stderr_group" && <TranscriptStderrGroup block={block} />}
          {block.type === "system_group" && <TranscriptSystemGroup block={block} />}
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
