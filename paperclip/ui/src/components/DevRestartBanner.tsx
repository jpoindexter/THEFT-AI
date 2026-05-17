import { AlertTriangle, RotateCcw, TimerReset } from "lucide-react";
import type { DevServerHealthStatus } from "../api/health";

function formatRelativeTimestamp(value: string | null): string | null {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (Number.isNaN(timestamp)) return null;

  const deltaMs = Date.now() - timestamp;
  if (deltaMs < 60_000) return "just now";
  const deltaMinutes = Math.round(deltaMs / 60_000);
  if (deltaMinutes < 60) return `${deltaMinutes}m ago`;
  const deltaHours = Math.round(deltaMinutes / 60);
  if (deltaHours < 24) return `${deltaHours}h ago`;
  const deltaDays = Math.round(deltaHours / 24);
  return `${deltaDays}d ago`;
}

function describeReason(devServer: DevServerHealthStatus): string {
  if (devServer.reason === "backend_changes_and_pending_migrations") {
    return "backend files changed and migrations are pending";
  }
  if (devServer.reason === "pending_migrations") {
    return "pending migrations need a fresh boot";
  }
  return "backend files changed since this server booted";
}

export function DevRestartBanner({ devServer }: { devServer?: DevServerHealthStatus }) {
  if (!devServer?.enabled || !devServer.restartRequired) return null;

  const changedAt = formatRelativeTimestamp(devServer.lastChangedAt);
  const sample = devServer.changedPathsSample.slice(0, 3);

  return (
    <div className="border-b border-border bg-background text-foreground">
      <div className="flex min-h-9 flex-col gap-1 px-3 py-1.5 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs">
          <div className="theft-label-compact flex items-center gap-1.5 font-semibold text-foreground">
            <AlertTriangle className="h-3 w-3 shrink-0" />
            <span>Restart required</span>
            {devServer.autoRestartEnabled ? (
              <span className="theft-label-compact rounded-full bg-muted px-2 py-0.5 text-nano text-foreground">
                Auto-Restart On
              </span>
            ) : null}
          </div>
          <span className="text-muted-foreground">
            {describeReason(devServer)}
            {changedAt ? ` · updated ${changedAt}` : ""}
          </span>
          {sample.length > 0 ? (
            <span className="truncate text-muted-foreground">
              Changed: {sample.join(", ")}
              {devServer.changedPathCount > sample.length ? ` +${devServer.changedPathCount - sample.length} more` : ""}
            </span>
          ) : null}
          {devServer.pendingMigrations.length > 0 ? (
            <span className="truncate text-muted-foreground">
              Pending migrations: {devServer.pendingMigrations.slice(0, 2).join(", ")}
              {devServer.pendingMigrations.length > 2 ? ` +${devServer.pendingMigrations.length - 2} more` : ""}
            </span>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center gap-2 text-xs font-medium">
          {devServer.waitingForIdle ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-foreground">
              <TimerReset className="h-3 w-3" />
              <span>Waiting for {devServer.activeRunCount} live run{devServer.activeRunCount === 1 ? "" : "s"} to finish</span>
            </div>
          ) : devServer.autoRestartEnabled ? (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-foreground">
              <RotateCcw className="h-3 w-3" />
              <span>Auto-restart will trigger when the instance is idle</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-foreground">
              <RotateCcw className="h-3 w-3" />
              <span>Restart <code>pnpm dev:once</code> after the active work is safe to interrupt</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
