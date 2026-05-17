import type { Agent } from "@paperclipai/shared";

import type { IssueRunLedgerContentProps, LedgerFeedItem } from "./types";
import { IssueRunLedgerFeedItem } from "./IssueRunLedgerFeedItem";

type IssueRunLedgerFeedProps = {
  feedItems: LedgerFeedItem[];
  renderActivityEvent?: IssueRunLedgerContentProps["renderActivityEvent"];
  agentMap: ReadonlyMap<string, Pick<Agent, "name">>;
};

export function IssueRunLedgerFeed({
  feedItems,
  renderActivityEvent,
  agentMap,
}: IssueRunLedgerFeedProps) {
  if (feedItems.length === 0) {
    return (
      <div className="rounded-md border border-dashed border-border px-3 py-3 text-sm text-muted-foreground">
        {renderActivityEvent
          ? "Runs and activity will appear here once this issue has history."
          : "Historical runs without liveness metadata will appear here once linked to this issue."}
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {feedItems.slice(0, 20).map((item) => {
        if (item.kind === "activity") {
          return <div key={`activity:${item.id}`}>{renderActivityEvent?.(item.event)}</div>;
        }
        return (
          <IssueRunLedgerFeedItem
            key={`run:${item.run.runId}`}
            run={item.run}
            timestamp={item.timestamp}
            agentMap={agentMap}
          />
        );
      })}
      {feedItems.length > 20 ? (
        <div className="px-3 py-2 text-xs text-muted-foreground">
          {feedItems.length - 20} older items not shown
        </div>
      ) : null}
    </div>
  );
}
