import { ActivitySquare, AlertTriangle, CalendarClock, Clock, Cpu, Webhook } from "lucide-react";
import type { PluginDashboardData } from "@/api/plugins";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import { DeliveryStatusDot, JobStatusDot } from "./StatusDots";
import { formatDuration, formatRelativeTime, formatTimestamp, formatUptime } from "./formatters";

export type PluginLogEntry = {
  id: string;
  pluginId: string;
  level: string;
  message: string;
  meta: Record<string, unknown> | null;
  createdAt: string;
};

export function PluginRuntimeColumn({
  dashboardData,
  recentLogs,
}: {
  dashboardData?: PluginDashboardData | null;
  recentLogs?: PluginLogEntry[];
}) {
  return (
    <div className="space-y-6">
      <RuntimeDashboardCard dashboardData={dashboardData} />
      {recentLogs && recentLogs.length > 0 ? <RecentLogsCard recentLogs={recentLogs} /> : null}
    </div>
  );
}

function RuntimeDashboardCard({ dashboardData }: { dashboardData?: PluginDashboardData | null }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <Cpu className="h-4 w-4" />
          Runtime Dashboard
        </CardTitle>
        <CardDescription>Worker process, scheduled jobs, and webhook deliveries</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {dashboardData ? (
          <>
            <WorkerProcessSection dashboardData={dashboardData} />
            <Separator />
            <RecentJobRunsSection dashboardData={dashboardData} />
            <Separator />
            <RecentWebhookDeliveriesSection dashboardData={dashboardData} />
            <div className="flex items-center gap-1.5 border-t border-border/50 pt-2 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              Last checked: {new Date(dashboardData.checkedAt).toLocaleTimeString()}
            </div>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Runtime diagnostics are unavailable right now.</p>
        )}
      </CardContent>
    </Card>
  );
}

function WorkerProcessSection({ dashboardData }: { dashboardData: PluginDashboardData }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
        <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
        Worker Process
      </h3>
      {dashboardData.worker ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Status</span>
            <Badge variant={dashboardData.worker.status === "running" ? "default" : "secondary"}>
              {dashboardData.worker.status}
            </Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">PID</span>
            <span className="font-mono text-xs">{dashboardData.worker.pid ?? "—"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Uptime</span>
            <span className="text-xs">{formatUptime(dashboardData.worker.uptime)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Pending RPCs</span>
            <span className="text-xs">{dashboardData.worker.pendingRequests}</span>
          </div>
          <WorkerCrashDetails dashboardData={dashboardData} />
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">No worker process registered.</p>
      )}
    </div>
  );
}

function WorkerCrashDetails({ dashboardData }: { dashboardData: PluginDashboardData }) {
  if (!dashboardData.worker || dashboardData.worker.totalCrashes <= 0) return null;

  return (
    <>
      <div className="col-span-2 flex justify-between">
        <span className="flex items-center gap-1 text-muted-foreground">
          <AlertTriangle className="h-3 w-3 text-amber-500" />
          Crashes
        </span>
        <span className="text-xs">
          {dashboardData.worker.consecutiveCrashes} consecutive / {dashboardData.worker.totalCrashes} total
        </span>
      </div>
      {dashboardData.worker.lastCrashAt ? (
        <div className="col-span-2 flex justify-between">
          <span className="text-muted-foreground">Last Crash</span>
          <span className="text-xs">{formatTimestamp(dashboardData.worker.lastCrashAt)}</span>
        </div>
      ) : null}
    </>
  );
}

function RecentJobRunsSection({ dashboardData }: { dashboardData: PluginDashboardData }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
        <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
        Recent Job Runs
      </h3>
      {dashboardData.recentJobRuns.length > 0 ? (
        <div className="space-y-2">
          {dashboardData.recentJobRuns.map((run) => (
            <div key={run.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <JobStatusDot status={run.status} />
                <span className="truncate font-mono text-xs" title={run.jobKey ?? run.jobId}>
                  {run.jobKey ?? run.jobId.slice(0, 8)}
                </span>
                <Badge variant="outline" className="px-1 py-0 text-nano">{run.trigger}</Badge>
              </div>
              <RunTimeMeta durationMs={run.durationMs} createdAt={run.createdAt} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">No job runs recorded yet.</p>
      )}
    </div>
  );
}

function RecentWebhookDeliveriesSection({ dashboardData }: { dashboardData: PluginDashboardData }) {
  return (
    <div>
      <h3 className="mb-3 flex items-center gap-1.5 text-sm font-medium">
        <Webhook className="h-3.5 w-3.5 text-muted-foreground" />
        Recent Webhook Deliveries
      </h3>
      {dashboardData.recentWebhookDeliveries.length > 0 ? (
        <div className="space-y-2">
          {dashboardData.recentWebhookDeliveries.map((delivery) => (
            <div key={delivery.id} className="flex items-center justify-between gap-2 rounded-md bg-muted/50 px-2 py-1.5 text-sm">
              <div className="flex min-w-0 items-center gap-2">
                <DeliveryStatusDot status={delivery.status} />
                <span className="truncate font-mono text-xs" title={delivery.webhookKey}>
                  {delivery.webhookKey}
                </span>
              </div>
              <RunTimeMeta durationMs={delivery.durationMs} createdAt={delivery.createdAt} />
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm italic text-muted-foreground">No webhook deliveries recorded yet.</p>
      )}
    </div>
  );
}

function RunTimeMeta({ durationMs, createdAt }: { durationMs: number | null; createdAt: string }) {
  return (
    <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
      {durationMs != null ? <span>{formatDuration(durationMs)}</span> : null}
      <span title={createdAt}>{formatRelativeTime(createdAt)}</span>
    </div>
  );
}

function RecentLogsCard({ recentLogs }: { recentLogs: PluginLogEntry[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <ActivitySquare className="h-4 w-4" />
          Recent Logs
        </CardTitle>
        <CardDescription>Last {recentLogs.length} log entries</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="max-h-64 space-y-1 overflow-y-auto font-mono text-xs">
          {recentLogs.map((entry) => (
            <div key={entry.id} className={`flex gap-2 py-0.5 ${getLogLevelClass(entry.level)}`}>
              <span className="shrink-0 text-muted-foreground/50">{new Date(entry.createdAt).toLocaleTimeString()}</span>
              <Badge variant="outline" className="h-4 shrink-0 px-1 text-nano">{entry.level}</Badge>
              <span className="truncate" title={entry.message}>{entry.message}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function getLogLevelClass(level: string) {
  if (level === "error") return "text-destructive";
  if (level === "warn") return "text-yellow-600 dark:text-yellow-400";
  if (level === "debug") return "text-muted-foreground/60";
  return "text-muted-foreground";
}
