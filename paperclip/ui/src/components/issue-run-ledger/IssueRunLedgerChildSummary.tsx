import { Link } from "@/lib/router";

import type { ChildIssueSummary } from "./types";
import { statusLabel } from "./utils";

type IssueRunLedgerChildSummaryProps = {
  summary: ChildIssueSummary;
};

export function IssueRunLedgerChildSummary({ summary }: IssueRunLedgerChildSummaryProps) {
  if (summary.total === 0) return null;

  return (
    <div className="rounded-md border border-border/70 px-3 py-2">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-foreground">Child work</span>
        <span className="text-muted-foreground">
          {summary.active.length > 0
            ? `${summary.active.length} active, ${summary.done} done, ${summary.cancelled} cancelled`
            : `all ${summary.total} terminal (${summary.done} done, ${summary.cancelled} cancelled)`}
        </span>
      </div>
      {summary.active.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {summary.active.slice(0, 4).map((child) => (
            <Link
              key={child.id}
              to={`/issues/${child.identifier ?? child.id}`}
              className="inline-flex min-w-0 max-w-full items-center gap-1 rounded-md border border-border bg-background px-2 py-1 text-micro hover:bg-accent/40"
            >
              <span className="shrink-0 font-mono text-muted-foreground">{child.identifier ?? child.id.slice(0, 8)}</span>
              <span className="truncate">{child.title}</span>
              <span className="shrink-0 text-muted-foreground">{statusLabel(child.status)}</span>
            </Link>
          ))}
          {summary.active.length > 4 ? (
            <span className="rounded-md border border-border px-2 py-1 text-micro text-muted-foreground">
              +{summary.active.length - 4} more
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
