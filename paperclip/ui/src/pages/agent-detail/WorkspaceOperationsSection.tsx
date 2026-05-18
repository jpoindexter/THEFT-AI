import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { WorkspaceOperation } from "@paperclipai/shared";
import { redactHomePathUserSegments } from "@paperclipai/adapter-utils";

import { heartbeatsApi } from "../../api/heartbeats";
import { Button } from "@/components/ui/button";
import { cn, relativeTime } from "../../lib/utils";

type RunLogChunk = {
  ts: string;
  stream: "stdout" | "stderr" | "system";
  chunk: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function redactPathText(value: string, censorUsernameInLogs: boolean) {
  return redactHomePathUserSegments(value, { enabled: censorUsernameInLogs });
}

function parseStoredLogContent(content: string): RunLogChunk[] {
  const parsed: RunLogChunk[] = [];
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const raw = JSON.parse(trimmed) as { ts?: unknown; stream?: unknown; chunk?: unknown };
      const stream =
        raw.stream === "stderr" || raw.stream === "system" ? raw.stream : "stdout";
      const chunk = typeof raw.chunk === "string" ? raw.chunk : "";
      const ts = typeof raw.ts === "string" ? raw.ts : new Date().toISOString();
      if (!chunk) continue;
      parsed.push({ ts, stream, chunk });
    } catch {
      // Ignore malformed log lines.
    }
  }
  return parsed;
}

function workspaceOperationPhaseLabel(phase: WorkspaceOperation["phase"]) {
  switch (phase) {
    case "worktree_prepare":
      return "Worktree setup";
    case "workspace_provision":
      return "Provision";
    case "workspace_teardown":
      return "Teardown";
    case "worktree_cleanup":
      return "Worktree cleanup";
    default:
      return phase;
  }
}

function workspaceOperationStatusTone(status: WorkspaceOperation["status"]) {
  switch (status) {
    case "succeeded":
      return "border-green-500/20 bg-green-500/10 text-green-700 dark:text-green-300";
    case "failed":
      return "border-red-500/20 bg-red-500/10 text-red-700 dark:text-red-300";
    case "running":
      return "border-cyan-500/20 bg-cyan-500/10 text-cyan-700 dark:text-cyan-300";
    case "skipped":
      return "border-yellow-500/20 bg-yellow-500/10 text-yellow-700 dark:text-yellow-300";
    default:
      return "border-border bg-muted/40 text-muted-foreground";
  }
}

function WorkspaceOperationStatusBadge({ status }: { status: WorkspaceOperation["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-micro font-medium capitalize",
        workspaceOperationStatusTone(status),
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function WorkspaceOperationLogViewer({
  operation,
  censorUsernameInLogs,
}: {
  operation: WorkspaceOperation;
  censorUsernameInLogs: boolean;
}) {
  const [open, setOpen] = useState(false);
  const { data: logData, isLoading, error } = useQuery({
    queryKey: ["workspace-operation-log", operation.id],
    queryFn: () => heartbeatsApi.workspaceOperationLog(operation.id),
    enabled: open && Boolean(operation.logRef),
    refetchInterval: open && operation.status === "running" ? 2000 : false,
  });

  const chunks = useMemo(
    () => (logData?.content ? parseStoredLogContent(logData.content) : []),
    [logData?.content],
  );

  return (
    <div className="space-y-2">
      <Button
        type="button"
        variant="link"
        size="xs"
        className="h-auto px-0 py-0 text-micro font-normal text-muted-foreground underline underline-offset-2 hover:text-foreground"
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide full log" : "Show full log"}
      </Button>
      {open && (
        <div className="rounded-md border border-border bg-background/70 p-2">
          {isLoading && <div className="text-xs text-muted-foreground">Loading log...</div>}
          {error && (
            <div className="text-xs text-destructive">
              {error instanceof Error ? error.message : "Failed to load workspace operation log"}
            </div>
          )}
          {!isLoading && !error && chunks.length === 0 && (
            <div className="text-xs text-muted-foreground">No persisted log lines.</div>
          )}
          {chunks.length > 0 && (
            <div className="max-h-64 overflow-y-auto rounded bg-neutral-100 p-2 font-mono text-xs dark:bg-neutral-950">
              {chunks.map((chunk, index) => (
                <div key={`${chunk.ts}-${index}`} className="flex gap-2">
                  <span className="shrink-0 text-neutral-500">
                    {new Date(chunk.ts).toLocaleTimeString("en-US", { hour12: false })}
                  </span>
                  <span
                    className={cn(
                      "w-14 shrink-0",
                      chunk.stream === "stderr"
                        ? "text-red-600 dark:text-red-300"
                        : chunk.stream === "system"
                          ? "text-blue-600 dark:text-blue-300"
                          : "text-muted-foreground",
                    )}
                  >
                    [{chunk.stream}]
                  </span>
                  <span className="whitespace-pre-wrap break-all">
                    {redactPathText(chunk.chunk, censorUsernameInLogs)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetadataValue({ label, value, breakAll = false }: { label: string; value: string; breakAll?: boolean }) {
  return (
    <div className={cn(breakAll && "break-all")}>
      <span className="text-muted-foreground">{label}: </span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function WorkspaceOperationsSection({
  operations,
  censorUsernameInLogs,
}: {
  operations: WorkspaceOperation[];
  censorUsernameInLogs: boolean;
}) {
  if (operations.length === 0) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-background/60 p-3">
      <div className="text-xs font-medium text-muted-foreground">
        Workspace ({operations.length})
      </div>
      <div className="space-y-3">
        {operations.map((operation) => {
          const metadata = asRecord(operation.metadata);
          const branchName = asNonEmptyString(metadata?.branchName);
          const baseRef = asNonEmptyString(metadata?.baseRef);
          const worktreePath = asNonEmptyString(metadata?.worktreePath);
          const repoRoot = asNonEmptyString(metadata?.repoRoot);
          const cleanupAction = asNonEmptyString(metadata?.cleanupAction);

          return (
            <div key={operation.id} className="space-y-2 rounded-md border border-border/70 bg-background/70 p-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-sm font-medium">{workspaceOperationPhaseLabel(operation.phase)}</div>
                <WorkspaceOperationStatusBadge status={operation.status} />
                <div className="text-micro text-muted-foreground">
                  {relativeTime(operation.startedAt)}
                  {operation.finishedAt && ` to ${relativeTime(operation.finishedAt)}`}
                </div>
              </div>
              {operation.command && (
                <div className="break-all text-xs">
                  <span className="text-muted-foreground">Command: </span>
                  <span className="font-mono">{operation.command}</span>
                </div>
              )}
              {operation.cwd && (
                <div className="break-all text-xs">
                  <span className="text-muted-foreground">Working dir: </span>
                  <span className="font-mono">{operation.cwd}</span>
                </div>
              )}
              {(branchName || baseRef || worktreePath || repoRoot || cleanupAction) && (
                <div className="grid gap-1 text-xs sm:grid-cols-2">
                  {branchName && <MetadataValue label="Branch" value={branchName} />}
                  {baseRef && <MetadataValue label="Base ref" value={baseRef} />}
                  {worktreePath && <MetadataValue label="Worktree" value={worktreePath} breakAll />}
                  {repoRoot && <MetadataValue label="Repo root" value={repoRoot} breakAll />}
                  {cleanupAction && <MetadataValue label="Cleanup" value={cleanupAction} />}
                </div>
              )}
              {typeof metadata?.created === "boolean" && (
                <div className="text-xs text-muted-foreground">
                  {metadata.created ? "Created by this run" : "Reused existing workspace"}
                </div>
              )}
              {operation.stderrExcerpt && operation.stderrExcerpt.trim() && (
                <div>
                  <div className="mb-1 text-xs text-red-700 dark:text-red-300">stderr excerpt</div>
                  <pre className="whitespace-pre-wrap break-all rounded-md bg-red-50 p-2 text-xs text-red-800 dark:bg-neutral-950 dark:text-red-100">
                    {redactPathText(operation.stderrExcerpt, censorUsernameInLogs)}
                  </pre>
                </div>
              )}
              {operation.stdoutExcerpt && operation.stdoutExcerpt.trim() && (
                <div>
                  <div className="mb-1 text-xs text-muted-foreground">stdout excerpt</div>
                  <pre className="whitespace-pre-wrap break-all rounded-md bg-neutral-100 p-2 text-xs dark:bg-neutral-950">
                    {redactPathText(operation.stdoutExcerpt, censorUsernameInLogs)}
                  </pre>
                </div>
              )}
              {operation.logRef && (
                <WorkspaceOperationLogViewer
                  operation={operation}
                  censorUsernameInLogs={censorUsernameInLogs}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
