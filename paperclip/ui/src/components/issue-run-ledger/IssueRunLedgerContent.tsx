import { useMemo } from "react";

import { Link } from "@/lib/router";
import { IssueRunLedgerChildSummary } from "./IssueRunLedgerChildSummary";
import { IssueRunLedgerFeed } from "./IssueRunLedgerFeed";
import { IssueRunLedgerWatchdogBanner } from "./IssueRunLedgerWatchdogBanner";
import type { IssueRunLedgerContentProps, LedgerFeedItem } from "./types";
import {
  childIssueSummary,
  isActiveRun,
  mergeRuns,
  runSummary,
} from "./utils";

export function IssueRunLedgerContent({
  runs,
  liveRuns,
  activeRun,
  issueStatus,
  childIssues,
  agentMap,
  activityEvents,
  renderActivityEvent,
  pendingWatchdogDecision,
  canRecordWatchdogDecisions = true,
  watchdogDecisionError,
  onWatchdogDecision,
}: IssueRunLedgerContentProps) {
  const ledgerRuns = useMemo(() => mergeRuns(runs, liveRuns, activeRun), [activeRun, liveRuns, runs]);
  const latestRun = ledgerRuns[0] ?? null;
  const latestSilentRun = useMemo(
    () =>
      ledgerRuns.find((run) =>
        isActiveRun(run)
        && (run.outputSilence?.level === "critical" || run.outputSilence?.level === "suspicious"),
      ) ?? null,
    [ledgerRuns],
  );
  const children = childIssueSummary(childIssues);
  const canRenderActivityEvents = Boolean(renderActivityEvent);
  const feedItems = useMemo<LedgerFeedItem[]>(() => {
    const items: LedgerFeedItem[] = [];
    for (const run of ledgerRuns) {
      items.push({
        kind: "run",
        id: run.runId,
        timestamp: run.startedAt ?? run.createdAt,
        run,
      });
    }
    if (canRenderActivityEvents) {
      for (const event of activityEvents ?? []) {
        items.push({
          kind: "activity",
          id: event.id,
          timestamp: event.createdAt instanceof Date
            ? event.createdAt.toISOString()
            : String(event.createdAt),
          event,
        });
      }
    }
    return items.sort((a, b) => {
      const aTime = new Date(a.timestamp).getTime();
      const bTime = new Date(b.timestamp).getTime();
      if (aTime !== bTime) return bTime - aTime;
      if (a.kind !== b.kind) return a.kind === "run" ? -1 : 1;
      return b.id.localeCompare(a.id);
    });
  }, [activityEvents, canRenderActivityEvents, ledgerRuns]);

  return (
    <section className="space-y-3" aria-label="Issue run ledger">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-medium text-muted-foreground">Run ledger</h3>
          <p className="text-xs text-muted-foreground">
            {latestRun
              ? runSummary(latestRun, agentMap)
              : issueStatus === "in_progress"
                ? "Waiting for the first run record."
                : "No runs linked yet."}
          </p>
        </div>
        {latestRun ? (
          <Link
            to={`/agents/${latestRun.agentId}/runs/${latestRun.runId}`}
            className="shrink-0 rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Latest run
          </Link>
        ) : null}
      </div>

      <IssueRunLedgerChildSummary summary={children} />

      {latestSilentRun ? (
        <IssueRunLedgerWatchdogBanner
          run={latestSilentRun}
          pendingWatchdogDecision={pendingWatchdogDecision}
          canRecordWatchdogDecisions={canRecordWatchdogDecisions}
          watchdogDecisionError={watchdogDecisionError}
          onWatchdogDecision={onWatchdogDecision}
        />
      ) : null}

      <IssueRunLedgerFeed
        feedItems={feedItems}
        renderActivityEvent={renderActivityEvent}
        agentMap={agentMap}
      />
    </section>
  );
}
