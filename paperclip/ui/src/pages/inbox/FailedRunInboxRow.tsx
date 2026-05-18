import { Link } from "@/lib/router";
import type { HeartbeatRun, Issue } from "@paperclipai/shared";
import { RotateCcw, X, XCircle } from "lucide-react";

import { StatusBadge } from "../../components/StatusBadge";
import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { timeAgo } from "../../lib/timeAgo";

type FailedRunUnreadState = "visible" | "fading" | "hidden" | null;

function firstNonEmptyLine(value: string | null | undefined): string | null {
  if (!value) return null;
  const line = value.split("\n").map((chunk) => chunk.trim()).find(Boolean);
  return line ?? null;
}

function runFailureMessage(run: HeartbeatRun): string {
  return firstNonEmptyLine(run.error) ?? firstNonEmptyLine(run.stderrExcerpt) ?? "Run exited with an error.";
}

function readIssueIdFromRun(run: HeartbeatRun): string | null {
  const context = run.contextSnapshot;
  if (!context) return null;

  const issueId = context["issueId"];
  if (typeof issueId === "string" && issueId.length > 0) return issueId;

  const taskId = context["taskId"];
  if (typeof taskId === "string" && taskId.length > 0) return taskId;

  return null;
}

export function FailedRunInboxRow({
  run,
  issueById,
  agentName: linkedAgentName,
  onDismiss,
  onRetry,
  isRetrying,
  unreadState = null,
  onMarkRead,
  onArchive,
  archiveDisabled,
  selected = false,
  className,
}: {
  run: HeartbeatRun;
  issueById: Map<string, Issue>;
  agentName: string | null;
  issueLinkState: unknown;
  onDismiss: () => void;
  onRetry: () => void;
  isRetrying: boolean;
  unreadState?: FailedRunUnreadState;
  onMarkRead?: () => void;
  onArchive?: () => void;
  archiveDisabled?: boolean;
  selected?: boolean;
  className?: string;
}) {
  const issueId = readIssueIdFromRun(run);
  const issue = issueId ? issueById.get(issueId) ?? null : null;
  const displayError = runFailureMessage(run);
  const showUnreadSlot = unreadState !== null;
  const showUnreadDot = unreadState === "visible" || unreadState === "fading";

  return (
    <div
      className={cn(
        "group border-b border-border px-2 py-2.5 last:border-b-0 sm:px-1 sm:pr-3 sm:py-2",
        className,
      )}
    >
      <div className="flex items-start gap-2 sm:items-center">
        {showUnreadSlot ? (
          <span className="hidden sm:inline-flex h-4 w-4 shrink-0 items-center justify-center self-center">
            {showUnreadDot ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onMarkRead}
                className={cn("h-4 w-4 rounded-full p-0 hover:bg-blue-500/20", unreadState === "fading" && "opacity-100")}
                aria-label="Mark as read"
              >
                <span
                  className={cn(
                    "block h-2 w-2 rounded-full bg-blue-600 transition-opacity duration-300 dark:bg-blue-400",
                    unreadState === "fading" ? "opacity-0" : "opacity-100",
                  )}
                />
              </Button>
            ) : onArchive ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                onClick={onArchive}
                disabled={archiveDisabled}
                className="h-4 w-4 rounded-md p-0 text-muted-foreground opacity-0 hover:bg-transparent hover:text-foreground group-hover:opacity-100 disabled:pointer-events-none disabled:opacity-30"
                aria-label="Dismiss from inbox"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <span className="inline-flex h-4 w-4" aria-hidden="true" />
            )}
          </span>
        ) : null}
        <Link
          to={`/agents/${run.agentId}/runs/${run.id}`}
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2 no-underline text-inherit transition-colors",
            selected ? "hover:bg-transparent" : "hover:bg-accent/50",
          )}
        >
          {!showUnreadSlot && <span className="hidden h-2 w-2 shrink-0 sm:inline-flex" aria-hidden="true" />}
          <span className="hidden h-3.5 w-3.5 shrink-0 sm:inline-flex" aria-hidden="true" />
          <span className="mt-0.5 shrink-0 rounded-md bg-red-500/20 p-1.5 sm:mt-0">
            <XCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-sm font-medium sm:truncate sm:line-clamp-none">
              {issue ? (
                <>
                  <span className="mr-1.5 font-mono text-muted-foreground">
                    {issue.identifier ?? issue.id.slice(0, 8)}
                  </span>
                  {issue.title}
                </>
              ) : (
                <>Failed run{linkedAgentName ? ` - ${linkedAgentName}` : ""}</>
              )}
            </span>
            <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
              <StatusBadge status={run.status} />
              {linkedAgentName && issue ? <span>{linkedAgentName}</span> : null}
              <span className="max-w-xs truncate">{displayError}</span>
              <span>{timeAgo(run.createdAt)}</span>
            </span>
          </span>
        </Link>
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 shrink-0 px-2.5"
            onClick={onRetry}
            disabled={isRetrying}
          >
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {isRetrying ? "Retrying..." : "Retry"}
          </Button>
          {!showUnreadSlot && (
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              onClick={onDismiss}
              className="h-6 w-6 text-muted-foreground opacity-0 hover:bg-accent hover:text-foreground group-hover:opacity-100"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="mt-3 flex gap-2 sm:hidden">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-8 shrink-0 px-2.5"
          onClick={onRetry}
          disabled={isRetrying}
        >
          <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
          {isRetrying ? "Retrying..." : "Retry"}
        </Button>
        {!showUnreadSlot && (
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            onClick={onDismiss}
            className="h-6 w-6 text-muted-foreground hover:bg-accent hover:text-foreground"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
