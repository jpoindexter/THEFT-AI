import type { WorkspaceOperation } from "@paperclipai/shared";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { StatusPill } from "./WorkspaceDetailPrimitives";

export function WorkspaceRuntimeLogsCard({
  operations,
  isLoading,
  error,
}: {
  operations: WorkspaceOperation[] | undefined;
  isLoading: boolean;
  error: Error | null;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Runtime and cleanup logs</CardTitle>
        <CardDescription>Recent operations</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading workspace operations...</p>
        ) : error ? (
          <p className="text-sm text-destructive">
            {error.message || "Failed to load workspace operations."}
          </p>
        ) : operations && operations.length > 0 ? (
          <div className="space-y-3">
            {operations.map((operation) => (
              <div key={operation.id} className="rounded-md border border-border/80 bg-background px-4 py-3">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="text-sm font-medium">{operation.command ?? operation.phase}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDateTime(operation.startedAt)}
                      {operation.finishedAt ? ` -> ${formatDateTime(operation.finishedAt)}` : ""}
                    </div>
                    {operation.stderrExcerpt ? (
                      <div className="whitespace-pre-wrap break-words text-xs text-destructive">{operation.stderrExcerpt}</div>
                    ) : operation.stdoutExcerpt ? (
                      <div className="whitespace-pre-wrap break-words text-xs text-muted-foreground">{operation.stdoutExcerpt}</div>
                    ) : null}
                  </div>
                  <StatusPill className="self-start">{operation.status}</StatusPill>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workspace operations have been recorded yet.</p>
        )}
      </CardContent>
    </Card>
  );
}
