import { Link } from "@/lib/router";
import { ChevronRight, RotateCcw } from "lucide-react";
import type { HeartbeatRun } from "@paperclipai/shared";

import type { ClaudeLoginResult } from "../../api/agents";
import { CopyText } from "../../components/CopyText";
import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn, formatTokens, relativeTime } from "../../lib/utils";
import { describeRunRetryState } from "../../lib/runRetryState";

type RunMetricsSummary = { input: number; output: number; cached: number; cost: number; provider: string | null; model: string | null };
type AsyncActionState = { isPending: boolean; error: unknown };

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}
const formatDuration = (seconds: number) => seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
const ErrorMessage = ({ error, fallback }: { error: unknown; fallback: string }) => <div className="text-xs text-destructive">{error instanceof Error ? error.message : fallback}</div>;
const RunMetric = ({ label, value }: { label: string; value: string }) => <div><div className="text-xs text-muted-foreground">{label}</div><div className="font-mono text-sm font-medium">{value}</div></div>;

export function RunSummaryCard({
  run,
  agentRouteId,
  adapterType,
  adapterConfig,
  metrics,
  startTime,
  endTime,
  displayDurationSec,
  hasMetrics,
  sessionOpen,
  onSessionOpenChange,
  touchedIssueIds,
  claudeLoginResult,
  cancelRun,
  resumeRun,
  retryRun,
  runClaudeLogin,
  clearSessionsForTouchedIssues,
  onCancelRun,
  onResumeRun,
  onRetryRun,
  onRunClaudeLogin,
  onClearSessionsForTouchedIssues,
}: {
  run: HeartbeatRun;
  agentRouteId: string;
  adapterType: string;
  adapterConfig: Record<string, unknown>;
  metrics: RunMetricsSummary;
  startTime: string | null;
  endTime: string | null;
  displayDurationSec: number | null;
  hasMetrics: boolean;
  sessionOpen: boolean;
  onSessionOpenChange: (open: boolean) => void;
  touchedIssueIds: string[];
  claudeLoginResult: ClaudeLoginResult | null;
  cancelRun: AsyncActionState;
  resumeRun: AsyncActionState;
  retryRun: AsyncActionState;
  runClaudeLogin: AsyncActionState;
  clearSessionsForTouchedIssues: AsyncActionState;
  onCancelRun: () => void;
  onResumeRun: () => void;
  onRetryRun: () => void;
  onRunClaudeLogin: () => void;
  onClearSessionsForTouchedIssues: () => void;
}) {
  const canCancel = run.status === "running" || run.status === "queued";
  const canResumeLostRun = run.errorCode === "process_lost" && run.status === "failed";
  const canRetryRun = run.status === "failed" || run.status === "timed_out";
  const displayProvider = metrics.provider ?? asNonEmptyString(adapterConfig?.provider);
  const displayModel = metrics.model ?? asNonEmptyString(adapterConfig?.model);
  const hasAdapterIdentity = Boolean(adapterType || displayProvider || displayModel);
  const hasSession = Boolean(run.sessionIdBefore || run.sessionIdAfter);
  const sessionChanged = Boolean(run.sessionIdBefore && run.sessionIdAfter && run.sessionIdBefore !== run.sessionIdAfter);
  const hasNonZeroExit = run.exitCode !== null && run.exitCode !== 0;
  const retryState = describeRunRetryState(run);

  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div className="flex flex-col sm:flex-row">
        <div className="flex-1 space-y-3 p-4">
          <div className="flex items-center gap-2">
            <StatusBadge status={run.status} />
            {canCancel && (
              <Button
                variant="ghost"
                size="xs"
                className="text-destructive hover:text-destructive"
                onClick={onCancelRun}
                disabled={cancelRun.isPending}
              >
                {cancelRun.isPending ? "Cancelling..." : "Cancel"}
              </Button>
            )}
            {canResumeLostRun && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onResumeRun}
                disabled={resumeRun.isPending}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {resumeRun.isPending ? "Resuming..." : "Resume"}
              </Button>
            )}
            {canRetryRun && !canResumeLostRun && (
              <Button
                variant="ghost"
                size="xs"
                onClick={onRetryRun}
                disabled={retryRun.isPending}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                {retryRun.isPending ? "Retrying..." : "Retry"}
              </Button>
            )}
          </div>

          {hasAdapterIdentity && (
            <div className="flex flex-wrap items-center gap-1.5 font-mono text-micro text-muted-foreground">
              {adapterType && (
                <span className="rounded bg-muted px-1.5 py-0.5 text-nano font-medium uppercase">
                  {adapterType.replace(/_/g, " ")}
                </span>
              )}
              {displayProvider && displayModel && <span>{displayProvider}/{displayModel}</span>}
              {!displayProvider && displayModel && <span>{displayModel}</span>}
            </div>
          )}

          {resumeRun.error ? <ErrorMessage error={resumeRun.error} fallback="Failed to resume run" /> : null}
          {retryRun.error ? <ErrorMessage error={retryRun.error} fallback="Failed to retry run" /> : null}

          {startTime && (
            <div className="space-y-0.5">
              <div className="font-mono text-sm">
                {startTime}
                {endTime && <span className="text-muted-foreground"> &rarr; </span>}
                {endTime}
              </div>
              <div className="text-micro text-muted-foreground">
                {relativeTime(run.startedAt!)}
                {run.finishedAt && <> &rarr; {relativeTime(run.finishedAt)}</>}
              </div>
              {displayDurationSec !== null && (
                <div className="text-xs text-muted-foreground">
                  Duration: {formatDuration(displayDurationSec)}
                </div>
              )}
            </div>
          )}

          {run.error && (
            <div className="text-xs">
              <span className="text-red-600 dark:text-red-400">{run.error}</span>
              {run.errorCode && <span className="ml-1 text-muted-foreground">({run.errorCode})</span>}
            </div>
          )}

          {run.errorCode === "claude_auth_required" && adapterType === "claude_local" && (
            <div className="space-y-2">
              <Button
                variant="outline"
                size="xs"
                onClick={onRunClaudeLogin}
                disabled={runClaudeLogin.isPending}
              >
                {runClaudeLogin.isPending ? "Running claude login..." : "Login to Claude Code"}
              </Button>
              {runClaudeLogin.error ? <ErrorMessage error={runClaudeLogin.error} fallback="Failed to run Claude login" /> : null}
              {claudeLoginResult?.loginUrl && (
                <p className="text-xs">
                  Login URL:
                  <a
                    href={claudeLoginResult.loginUrl}
                    className="ml-1 break-all text-blue-600 underline underline-offset-2 dark:text-blue-400"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {claudeLoginResult.loginUrl}
                  </a>
                </p>
              )}
              {claudeLoginResult?.stdout && (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-3 font-mono text-xs text-foreground dark:bg-neutral-950">
                  {claudeLoginResult.stdout}
                </pre>
              )}
              {claudeLoginResult?.stderr && (
                <pre className="overflow-x-auto whitespace-pre-wrap rounded-md bg-neutral-100 p-3 font-mono text-xs text-red-700 dark:bg-neutral-950 dark:text-red-300">
                  {claudeLoginResult.stderr}
                </pre>
              )}
            </div>
          )}

          {hasNonZeroExit && (
            <div className="text-xs text-red-600 dark:text-red-400">
              Exit code {run.exitCode}
              {run.signal && <span className="ml-1 text-muted-foreground">(signal: {run.signal})</span>}
            </div>
          )}

          {retryState && (
            <div className="rounded-md border border-border/70 bg-accent/20 px-3 py-2 text-xs leading-5">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-md border px-1.5 py-0.5 text-micro font-medium", retryState.tone)}>
                  {retryState.badgeLabel}
                </span>
                {retryState.retryOfRunId ? (
                  <Link to={`/agents/${agentRouteId}/runs/${retryState.retryOfRunId}`} className="font-mono text-foreground hover:underline">
                    {retryState.retryOfRunId.slice(0, 8)}
                  </Link>
                ) : null}
              </div>
              {retryState.detail ? <p className="mt-2 text-muted-foreground">{retryState.detail}</p> : null}
              {retryState.secondary ? <p className="text-muted-foreground">{retryState.secondary}</p> : null}
            </div>
          )}
        </div>

        {hasMetrics && (
          <div className="grid content-center grid-cols-2 gap-x-4 gap-y-3 border-t border-border p-4 tabular-nums sm:border-l sm:border-t-0 sm:gap-x-8">
            <RunMetric label="Input" value={formatTokens(metrics.input)} />
            <RunMetric label="Output" value={formatTokens(metrics.output)} />
            <RunMetric label="Cached" value={formatTokens(metrics.cached)} />
            <RunMetric label="Cost" value={metrics.cost > 0 ? `$${metrics.cost.toFixed(4)}` : "-"} />
          </div>
        )}
      </div>

      {hasSession && (
        <div className="border-t border-border">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            className="h-auto w-full justify-start px-4 py-2 font-normal text-muted-foreground"
            onClick={() => onSessionOpenChange(!sessionOpen)}
          >
            <ChevronRight className={cn("h-3 w-3 transition-transform", sessionOpen && "rotate-90")} />
            Session
            {sessionChanged && <span className="ml-1 text-muted-foreground">(changed)</span>}
          </Button>
          {sessionOpen && (
            <div className="space-y-1 px-4 pb-3 text-xs">
              {run.sessionIdBefore && (
                <div className="flex items-center gap-2">
                  <span className="w-12 text-muted-foreground">{sessionChanged ? "Before" : "ID"}</span>
                  <CopyText text={run.sessionIdBefore} className="font-mono" />
                </div>
              )}
              {sessionChanged && run.sessionIdAfter && (
                <div className="flex items-center gap-2">
                  <span className="w-12 text-muted-foreground">After</span>
                  <CopyText text={run.sessionIdAfter} className="font-mono" />
                </div>
              )}
              {touchedIssueIds.length > 0 && (
                <div className="pt-1">
                  <Button
                    type="button"
                    variant="link"
                    size="xs"
                    className="h-auto px-0 py-0 text-micro font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    disabled={clearSessionsForTouchedIssues.isPending}
                    onClick={onClearSessionsForTouchedIssues}
                  >
                    {clearSessionsForTouchedIssues.isPending ? "clearing session..." : "clear session for these issues"}
                  </Button>
                  {clearSessionsForTouchedIssues.error ? (
                    <p className="mt-1 text-micro text-destructive">
                      {clearSessionsForTouchedIssues.error instanceof Error
                        ? clearSessionsForTouchedIssues.error.message
                        : "Failed to clear sessions"}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
