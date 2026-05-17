import { Hexagon, Repeat } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { readIssueDetailHeaderSeed } from "../../lib/issueDetailBreadcrumb";
import { PriorityIcon } from "../PriorityIcon";
import { StatusIcon } from "../StatusIcon";
import { IssueSectionSkeleton } from "./IssueSectionSkeleton";

function IssueChatSkeleton() {
  return (
    <div className="space-y-3 rounded-lg border border-border p-3">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-end gap-2">
          <div className="space-y-2 text-right">
            <Skeleton className="ml-auto h-3 w-20" />
            <Skeleton className="ml-auto h-3 w-14" />
          </div>
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <Skeleton className="ml-auto h-16 w-5/6 rounded-xl" />
      </div>
      <div className="space-y-2 border-t border-border pt-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function IssueDetailLoadingState({
  headerSeed,
}: {
  headerSeed: ReturnType<typeof readIssueDetailHeaderSeed>;
}) {
  const identifier = headerSeed?.identifier ?? headerSeed?.id.slice(0, 8) ?? null;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="space-y-3">
        <Skeleton className="h-3 w-40" />

        <div className="flex items-center gap-2 min-w-0 flex-wrap">
          {headerSeed ? (
            <>
              <StatusIcon status={headerSeed.status} blockerAttention={headerSeed.blockerAttention} />
              <PriorityIcon priority={headerSeed.priority} />
              {identifier ? (
                <span className="text-sm font-mono text-muted-foreground shrink-0">{identifier}</span>
              ) : null}
              {headerSeed.originKind === "routine_execution" && headerSeed.originId ? (
                <span className="inline-flex items-center gap-1 rounded-full border border-violet-500/30 bg-violet-500/10 px-2 py-0.5 text-micro font-medium text-violet-600 dark:text-violet-400 shrink-0">
                  <Repeat className="h-3 w-3" />
                  Routine
                </span>
              ) : null}
              {headerSeed.projectId ? (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground rounded px-1 -mx-1 py-0.5 min-w-0">
                  <Hexagon className="h-3 w-3 shrink-0" />
                  <span className="truncate">
                    {headerSeed.projectName ?? headerSeed.projectId.slice(0, 8)}
                  </span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground opacity-50 px-1 -mx-1 py-0.5">
                  <Hexagon className="h-3 w-3 shrink-0" />
                  No project
                </span>
              )}
            </>
          ) : (
            <>
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-6 w-6" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 w-28" />
            </>
          )}
        </div>

        {headerSeed ? (
          <>
            <h2 className="text-xl font-bold leading-tight">{headerSeed.title}</h2>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full max-w-xl" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </>
        ) : (
          <>
            <Skeleton className="h-8 w-full max-w-sm" />
            <Skeleton className="h-16 w-full" />
          </>
        )}
      </div>

      <Skeleton className="h-28 w-full rounded-lg border border-border" />

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
        <IssueChatSkeleton />
      </div>

      <IssueSectionSkeleton titleWidth="w-24" rows={3} />
    </div>
  );
}
