import { Button } from "@/components/ui/button";
import type { WatchdogDecisionInput } from "@/api/heartbeats";
import { Link } from "@/lib/router";
import { cn } from "@/lib/utils";

import type { LedgerRun } from "./types";
import { formatSilenceAge } from "./utils";

type IssueRunLedgerWatchdogBannerProps = {
  run: LedgerRun;
  pendingWatchdogDecision?: WatchdogDecisionInput["decision"] | null;
  canRecordWatchdogDecisions: boolean;
  watchdogDecisionError?: string | null;
  onWatchdogDecision?: (input: WatchdogDecisionInput) => void;
};

export function IssueRunLedgerWatchdogBanner({
  run,
  pendingWatchdogDecision,
  canRecordWatchdogDecisions,
  watchdogDecisionError,
  onWatchdogDecision,
}: IssueRunLedgerWatchdogBannerProps) {
  if (!run.outputSilence) return null;

  return (
    <div
      className={cn(
        "rounded-md border px-3 py-2 text-xs",
        run.outputSilence.level === "critical"
          ? "border-red-500/30 bg-red-500/10 text-red-900 dark:text-red-200"
          : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
      )}
    >
      <p className="font-medium">
        {run.outputSilence.level === "critical"
          ? "Stale-run watchdog alert"
          : "Output silence watchdog warning"}
      </p>
      <p className="mt-1">
        Latest active run has been silent for{" "}
        {formatSilenceAge(run.outputSilence.silenceAgeMs) ?? "an extended period"}.
        {run.outputSilence.evaluationIssueIdentifier ? (
          <>
            {" "}
            Review{" "}
            <Link
              to={`/issues/${run.outputSilence.evaluationIssueIdentifier}`}
              className="font-medium underline underline-offset-2"
            >
              {run.outputSilence.evaluationIssueIdentifier}
            </Link>
            {" "}for recovery context.
          </>
        ) : null}
      </p>
      {onWatchdogDecision && canRecordWatchdogDecisions ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="bg-background/80 text-foreground hover:bg-background"
            onClick={() =>
              onWatchdogDecision({
                runId: run.runId,
                decision: "continue",
                evaluationIssueId: run.outputSilence?.evaluationIssueId ?? null,
              })}
            disabled={pendingWatchdogDecision != null}
          >
            Continue monitoring
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="bg-background/80 text-foreground hover:bg-background"
            onClick={() =>
              onWatchdogDecision({
                runId: run.runId,
                decision: "snooze",
                evaluationIssueId: run.outputSilence?.evaluationIssueId ?? null,
                snoozedUntil: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
                reason: "Snoozed from issue run ledger",
              })}
            disabled={pendingWatchdogDecision != null}
          >
            Snooze 1h
          </Button>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className="bg-background/80 text-foreground hover:bg-background"
            onClick={() =>
              onWatchdogDecision({
                runId: run.runId,
                decision: "dismissed_false_positive",
                evaluationIssueId: run.outputSilence?.evaluationIssueId ?? null,
                reason: "Dismissed from issue run ledger",
              })}
            disabled={pendingWatchdogDecision != null}
          >
            Mark false positive
          </Button>
        </div>
      ) : null}
      {watchdogDecisionError ? (
        <p className="mt-2 rounded-md border border-red-500/30 bg-red-500/10 px-2 py-1 text-micro text-red-900 dark:text-red-200">
          {watchdogDecisionError}
        </p>
      ) : null}
    </div>
  );
}
