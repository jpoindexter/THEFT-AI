import { useState } from "react";
import { ChevronDown, ChevronRight, TerminalSquare, Wrench } from "lucide-react";
import { Button } from "../ui/button";
import { cn } from "../../lib/utils";
import type { TranscriptBlock, TranscriptDensity } from "./transcriptModel";
import {
  formatToolPayload,
  humanizeLabel,
  summarizeToolInput,
} from "./transcriptModel";

function hasSelectedText() {
  if (typeof window === "undefined") return false;
  return (window.getSelection()?.toString().length ?? 0) > 0;
}

export function TranscriptCommandGroup({
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

export function TranscriptToolGroup({
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
