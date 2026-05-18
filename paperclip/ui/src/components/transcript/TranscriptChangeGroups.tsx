import { useState } from "react";
import { ChevronDown, ChevronRight, GitCompare, TerminalSquare } from "lucide-react";
import { cn } from "../../lib/utils";
import type { TranscriptBlock, TranscriptDensity } from "./transcriptModel";

export function TranscriptDiffGroup({
  block,
  density,
}: {
  block: Extract<TranscriptBlock, { type: "diff_group" }>;
  density: TranscriptDensity;
}) {
  const [open, setOpen] = useState(false);
  const compact = density === "compact";
  const addCount = block.hunks.filter((h) => h.changeType === "add").length;
  const removeCount = block.hunks.filter((h) => h.changeType === "remove").length;
  const hasChanges = addCount > 0 || removeCount > 0;
  const shortFile = block.filePath
    ? block.filePath.split("/").pop() ?? block.filePath
    : "diff";

  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-2">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        <GitCompare className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
        <span className="text-micro font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-300">
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
          {block.hunks.map((hunk, index) => {
            const key = `${index}-${hunk.changeType}`;
            if (hunk.changeType === "remove") {
              return (
                <span key={key} className="block bg-red-500/[0.10] px-2 text-red-700 -mx-2 dark:text-red-300">
                  <span className="mr-2 select-none text-red-500/60 dark:text-red-400/50">-</span>
                  {hunk.text}
                  {"\n"}
                </span>
              );
            }
            if (hunk.changeType === "add") {
              return (
                <span key={key} className="block bg-emerald-500/[0.10] px-2 text-emerald-700 -mx-2 dark:text-emerald-300">
                  <span className="mr-2 select-none text-emerald-500/60 dark:text-emerald-400/50">+</span>
                  {hunk.text}
                  {"\n"}
                </span>
              );
            }
            if (hunk.changeType === "file_header") {
              return (
                <span key={key} className="mt-2 block font-semibold text-blue-600 first:mt-0 dark:text-blue-300">
                  {hunk.text}
                  {"\n"}
                </span>
              );
            }
            if (hunk.changeType === "truncation") {
              return (
                <span key={key} className="mt-1 block text-muted-foreground italic">
                  {hunk.text}
                  {"\n"}
                </span>
              );
            }
            return (
              <span key={key} className="block text-muted-foreground/70">
                {" "}
                {hunk.text}
                {"\n"}
              </span>
            );
          })}
        </pre>
      )}
    </div>
  );
}

export function TranscriptStderrGroup({
  block,
}: {
  block: Extract<TranscriptBlock, { type: "stderr_group" }>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-amber-500/20 bg-amber-500/[0.06] p-2 text-amber-700 dark:text-amber-300">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        <span className="text-nano font-semibold uppercase tracking-wide">
          {block.lines.length} log {block.lines.length === 1 ? "line" : "lines"}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </div>
      {open && (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words pl-5 font-mono text-micro text-amber-700/80 dark:text-amber-300/80">
          {block.lines.map((line, index) => (
            <span key={`${line.ts}-${index}`}>
              <span className="select-none text-amber-500/50 dark:text-amber-400/40">{index > 0 ? "\n" : ""}</span>
              {line.text}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}

export function TranscriptSystemGroup({
  block,
}: {
  block: Extract<TranscriptBlock, { type: "system_group" }>;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-blue-500/20 bg-blue-500/[0.04] p-2 text-blue-700 dark:text-blue-300">
      <div
        role="button"
        tabIndex={0}
        className="flex cursor-pointer items-center gap-2"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
      >
        <TerminalSquare className="h-3.5 w-3.5 shrink-0" />
        <span className="text-nano font-semibold uppercase tracking-wide">
          {block.lines.length} system {block.lines.length === 1 ? "message" : "messages"}
        </span>
        {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
      </div>
      {open && (
        <pre className="mt-2 overflow-x-auto whitespace-pre-wrap break-words pl-5 font-mono text-micro text-blue-700/80 dark:text-blue-300/80">
          {block.lines.map((line, index) => (
            <span key={`${line.ts}-${index}`}>
              <span className="select-none text-blue-500/40 dark:text-blue-400/30">{index > 0 ? "\n" : ""}</span>
              {line.text}
            </span>
          ))}
        </pre>
      )}
    </div>
  );
}
