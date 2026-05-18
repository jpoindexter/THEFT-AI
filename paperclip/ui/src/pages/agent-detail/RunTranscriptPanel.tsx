import type { ComponentProps, RefObject } from "react";
import type { HeartbeatRun } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { RunTranscriptView, type TranscriptMode } from "../../components/transcript/RunTranscriptView";
import { cn } from "../../lib/utils";

type TranscriptEntries = ComponentProps<typeof RunTranscriptView>["entries"];

export function RunTranscriptPanel({
  hasMoreLog,
  isFollowing,
  isLive,
  loadingMoreLog,
  logEndRef,
  logError,
  logOffset,
  onJumpToLive,
  onLoadMoreLog,
  run,
  setTranscriptMode,
  transcript,
  transcriptMode,
}: {
  hasMoreLog: boolean;
  isFollowing: boolean;
  isLive: boolean;
  loadingMoreLog: boolean;
  logEndRef: RefObject<HTMLDivElement | null>;
  logError: string | null;
  logOffset: number;
  onJumpToLive: () => void;
  onLoadMoreLog: () => void;
  run: HeartbeatRun;
  setTranscriptMode: (mode: TranscriptMode) => void;
  transcript: TranscriptEntries;
  transcriptMode: TranscriptMode;
}) {
  return (
    <>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">
          Transcript ({transcript.length})
        </span>
        <div className="flex items-center gap-2">
          <TranscriptModeToggle mode={transcriptMode} setMode={setTranscriptMode} />
          {isLive && !isFollowing ? (
            <Button variant="ghost" size="xs" onClick={onJumpToLive}>
              Jump to live
            </Button>
          ) : null}
          {isLive ? <LiveBadge /> : null}
        </div>
      </div>

      <div className="agent-run-transcript-panel overflow-y-auto rounded-2xl border border-border/70 bg-background/40 p-3 sm:p-4">
        <RunTranscriptView
          entries={transcript}
          mode={transcriptMode}
          streaming={isLive}
          emptyMessage={run.logRef ? "Waiting for transcript..." : "No persisted transcript for this run."}
        />
        {hasMoreLog ? (
          <LoadMoreLog
            loadingMoreLog={loadingMoreLog}
            logBytes={run.logBytes}
            logOffset={logOffset}
            onLoadMoreLog={onLoadMoreLog}
          />
        ) : null}
        {logError ? (
          <div className="mt-3 rounded-xl border border-red-500/20 bg-red-500/[0.06] px-3 py-2 text-xs text-red-700 dark:text-red-300">
            {logError}
          </div>
        ) : null}
        <div ref={logEndRef} />
      </div>
    </>
  );
}

function TranscriptModeToggle({
  mode,
  setMode,
}: {
  mode: TranscriptMode;
  setMode: (mode: TranscriptMode) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border/70 bg-background/70 p-0.5">
      {(["nice", "raw"] as const).map((option) => (
        <Button
          key={option}
          type="button"
          variant="ghost"
          size="xs"
          className={cn(
            "theft-label-nano rounded-md px-2.5 py-1 capitalize transition-colors",
            mode === option ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
          onClick={() => setMode(option)}
        >
          {option}
        </Button>
      ))}
    </div>
  );
}

function LiveBadge() {
  return (
    <span className="flex items-center gap-1 text-xs text-cyan-400">
      <span className="relative flex h-2 w-2">
        <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
        <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-400" />
      </span>
      Live
    </span>
  );
}

function LoadMoreLog({
  loadingMoreLog,
  logBytes,
  logOffset,
  onLoadMoreLog,
}: {
  loadingMoreLog: boolean;
  logBytes?: number | null;
  logOffset: number;
  onLoadMoreLog: () => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
      <Button type="button" variant="outline" size="xs" onClick={onLoadMoreLog} disabled={loadingMoreLog}>
        {loadingMoreLog ? "Loading..." : "Load more log"}
      </Button>
      <span className="text-xs text-muted-foreground">
        Showing the first {Math.round(logOffset / 1024).toLocaleString("en-US")} KB
        {typeof logBytes === "number" && logBytes > 0
          ? ` of ${Math.round(logBytes / 1024).toLocaleString("en-US")} KB`
          : ""}
      </span>
    </div>
  );
}
