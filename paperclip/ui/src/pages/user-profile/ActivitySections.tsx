import type { UserProfileActivitySummary, UserProfileIssueSummary } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { StatusBadge } from "../../components/StatusBadge";
import { issueUrl, relativeTime } from "../../lib/utils";

export function RecentTasks({ issues }: { issues: UserProfileIssueSummary[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-sm font-semibold">Recent tasks</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{issues.length}</span>
      </div>
      {issues.length === 0 ? (
        <div className="pt-4 text-sm text-muted-foreground">No touched tasks yet.</div>
      ) : (
        <ul className="divide-y divide-border">
          {issues.map((issue) => (
            <li key={issue.id}>
              <Link
                to={issueUrl(issue)}
                className="flex flex-col gap-2 py-2.5 transition-colors hover:bg-accent/40 sm:flex-row sm:items-center"
              >
                <span className="font-mono text-xs text-muted-foreground">{issue.identifier ?? issue.id.slice(0, 8)}</span>
                <span className="min-w-0 flex-1 truncate text-sm">{issue.title}</span>
                <span className="flex shrink-0 items-center gap-3 sm:justify-end">
                  <StatusBadge status={issue.status} />
                  <span className="text-xs tabular-nums text-muted-foreground">{relativeTime(issue.updatedAt)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function RecentActivity({ events }: { events: UserProfileActivitySummary[] }) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 border-b border-border pb-3">
        <h2 className="text-sm font-semibold">Recent activity</h2>
        <span className="text-xs text-muted-foreground tabular-nums">{events.length}</span>
      </div>
      {events.length === 0 ? (
        <div className="pt-4 text-sm text-muted-foreground">No direct user actions recorded yet.</div>
      ) : (
        <ul className="divide-y divide-border">
          {events.map((event) => (
            <li key={event.id} className="flex flex-col gap-2 py-2.5 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <div className="truncate text-sm">{event.action.replaceAll("_", " ")}</div>
                <div className="truncate text-xs text-muted-foreground">
                  {event.entityType} · {event.entityId.slice(0, 12)}
                </div>
              </div>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground sm:justify-self-end">{relativeTime(event.createdAt)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
