import type { Agent } from "@paperclipai/shared";

import { Link } from "@/lib/router";
import { cn, relativeTime } from "@/lib/utils";
import { describeRunRetryState } from "@/lib/runRetryState";
import { RUN_OUTPUT_SILENCE_COPY } from "./constants";
import type { LedgerRun } from "./types";
import {
  compactAgentName,
  continuationLabel,
  formatDuration,
  hasExhaustedContinuation,
  lastUsefulActionLabel,
  livenessCopyForRun,
  modelProfileBadgeTone,
  modelProfileForRun,
  modelProfileTitle,
  statusLabel,
  stopReasonLabel,
  stopStatusLabel,
} from "./utils";

type IssueRunLedgerFeedItemProps = {
  run: LedgerRun;
  timestamp: string;
  agentMap: ReadonlyMap<string, Pick<Agent, "name">>;
};

export function IssueRunLedgerFeedItem({
  run,
  timestamp,
  agentMap,
}: IssueRunLedgerFeedItemProps) {
  const liveness = livenessCopyForRun(run);
  const stopReason = stopReasonLabel(run);
  const duration = formatDuration(run.startedAt, run.finishedAt);
  const exhausted = hasExhaustedContinuation(run);
  const continuation = continuationLabel(run);
  const retryState = describeRunRetryState(run);
  const agentName = compactAgentName(run, agentMap);
  const profile = modelProfileForRun(run);

  return (
    <article
      className="space-y-1.5 rounded-lg border border-border/60 px-3 py-2 text-xs text-muted-foreground"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="font-medium text-foreground">Run</span>
        <Link
          to={`/agents/${run.agentId}/runs/${run.runId}`}
          className="min-w-0 max-w-full truncate font-mono text-foreground hover:underline"
        >
          {run.runId.slice(0, 8)}
        </Link>
        <span>by {agentName}</span>
        <span className="rounded-md border border-border px-1.5 py-0.5 text-micro capitalize text-muted-foreground">
          {statusLabel(run.status)}
        </span>
        {run.isLive ? (
          <span className="inline-flex items-center gap-1 rounded-md border border-cyan-500/30 bg-cyan-500/10 px-1.5 py-0.5 text-micro text-cyan-700 dark:text-cyan-300">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
            live
          </span>
        ) : null}
        <span
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-micro font-medium",
            liveness.tone,
          )}
          title={liveness.description}
        >
          {liveness.label}
        </span>
        {exhausted ? (
          <span className="rounded-md border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 text-micro font-medium text-red-700 dark:text-red-300">
            Exhausted
          </span>
        ) : null}
        {continuation ? (
          <span className="text-micro text-muted-foreground">{continuation}</span>
        ) : null}
        {retryState ? (
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-micro font-medium",
              retryState.tone,
            )}
          >
            {retryState.badgeLabel}
          </span>
        ) : null}
        {run.outputSilence && RUN_OUTPUT_SILENCE_COPY[run.outputSilence.level] ? (
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-micro font-medium",
              RUN_OUTPUT_SILENCE_COPY[run.outputSilence.level]?.tone,
            )}
          >
            {RUN_OUTPUT_SILENCE_COPY[run.outputSilence.level]?.label}
          </span>
        ) : null}
        {profile ? (
          <span
            className={cn(
              "rounded-md border px-1.5 py-0.5 text-micro font-medium",
              modelProfileBadgeTone(profile),
            )}
            title={modelProfileTitle(profile)}
          >
            {profile.applied === profile.requested
              ? `Profile: ${profile.requested}`
              : profile.applied
                ? `Profile: ${profile.requested} → ${profile.applied}`
                : `Profile: ${profile.requested} (unavailable)`}
          </span>
        ) : null}
        <span className="ml-auto shrink-0">{relativeTime(timestamp)}</span>
      </div>

      <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
        <div className="min-w-0">
          <span className="text-foreground">Elapsed</span>{" "}
          {duration ?? "unknown"}
        </div>
        <div className="min-w-0">
          <span className="text-foreground">Last useful action</span>{" "}
          {lastUsefulActionLabel(run)}
        </div>
        <div className="min-w-0">
          <span className="text-foreground">Stop</span>{" "}
          {stopStatusLabel(run, stopReason)}
        </div>
      </div>

      {retryState ? (
        <div className="rounded-md border border-border/70 bg-accent/20 px-2 py-2 text-xs leading-5 text-muted-foreground">
          {retryState.detail ? <p>{retryState.detail}</p> : null}
          {retryState.secondary ? <p>{retryState.secondary}</p> : null}
          {retryState.retryOfRunId ? (
            <p>
              Retry of{" "}
              <Link
                to={`/agents/${run.agentId}/runs/${retryState.retryOfRunId}`}
                className="font-mono text-foreground hover:underline"
              >
                {retryState.retryOfRunId.slice(0, 8)}
              </Link>
            </p>
          ) : null}
        </div>
      ) : null}

      {profile?.fallbackReason && profile.applied !== profile.requested ? (
        <p className="min-w-0 break-words text-micro leading-5 text-amber-700 dark:text-amber-300">
          {profile.requested === "cheap"
            ? "Cheap profile fell back to primary"
            : `${profile.requested} profile unavailable`}
          {": "}
          <span className="font-mono">{profile.fallbackReason}</span>
        </p>
      ) : null}

      {run.livenessReason ? (
        <p className="min-w-0 break-words text-xs leading-5 text-muted-foreground">
          {run.livenessReason}
        </p>
      ) : null}

      {run.nextAction ? (
        <div className="min-w-0 rounded-md bg-accent/40 px-2 py-1.5 text-xs leading-5">
          <span className="font-medium text-foreground">Next action: </span>
          <span className="break-words text-muted-foreground">{run.nextAction}</span>
        </div>
      ) : null}
    </article>
  );
}
