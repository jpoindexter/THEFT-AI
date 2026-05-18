import { useMemo } from "react";
import type { HeartbeatRun } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { cn, relativeTime } from "../../lib/utils";
import { MarkdownBody } from "../../components/MarkdownBody";
import { StatusBadge } from "../../components/StatusBadge";
import {
  defaultRunStatusInfo,
  runStatusIcons,
  sourceLabels,
} from "./RunsTab";

function summarizeRunResult(summaryRaw: string): string {
  if (!summaryRaw) return "";
  const lines = summaryRaw
    .replace(/^#{1,6}\s+/gm, "")
    .split("\n")
    .map((line) => line.trim())
    .filter((line) =>
      line.length > 0 &&
      !line.startsWith("---") &&
      !line.startsWith("|") &&
      !line.startsWith("```") &&
      !/^[-*>]/.test(line) &&
      !/^\d+\./.test(line)
    );
  const excerpt: string[] = [];
  let chars = 0;
  for (const line of lines) {
    if (excerpt.length >= 3 || chars + line.length > 280) break;
    excerpt.push(line);
    chars += line.length;
  }
  return excerpt.join(" ");
}

export function LatestRunCard({ runs, agentId }: { runs: HeartbeatRun[]; agentId: string }) {
  const run = useMemo(() => {
    if (runs.length === 0) return null;
    const sorted = [...runs].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return sorted.find((item) => item.status === "running" || item.status === "queued") ?? sorted[0];
  }, [runs]);

  const summaryRaw = run?.resultJson
    ? String(
      (run.resultJson as Record<string, unknown>).summary ??
      (run.resultJson as Record<string, unknown>).result ??
      "",
    )
    : run?.error ?? "";
  const summary = useMemo(() => summarizeRunResult(summaryRaw), [summaryRaw]);

  if (!run) return null;

  const isLive = run.status === "running" || run.status === "queued";
  const statusInfo = runStatusIcons[run.status] ?? defaultRunStatusInfo;
  const StatusIcon = statusInfo.icon;

  return (
    <div className="space-y-3">
      <div className="flex w-full items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          {isLive && (
            <span className="relative flex h-2 w-2">
              <span className="animate-pulse absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-400" />
            </span>
          )}
          {isLive ? "Live Run" : "Latest Run"}
        </h3>
        <Link
          to={`/agents/${agentId}/runs/${run.id}`}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground transition-colors no-underline"
        >
          View details &rarr;
        </Link>
      </div>

      <Link
        to={`/agents/${agentId}/runs/${run.id}`}
        className={cn(
          "block w-full cursor-pointer space-y-2 rounded-lg border p-4 no-underline transition-colors hover:bg-muted/50",
          isLive ? "border-cyan-500/30 bg-cyan-500/5" : "border-border",
        )}
      >
        <div className="flex items-center gap-2">
          <StatusIcon
            className={cn(
              "h-3.5 w-3.5",
              statusInfo.color,
              run.status === "running" && "animate-spin",
            )}
          />
          <StatusBadge status={run.status} />
          <span className="font-mono text-xs text-muted-foreground">{run.id.slice(0, 8)}</span>
          <span
            className={cn(
              "theft-label-nano inline-flex items-center rounded-full px-1.5 py-0.5",
              run.invocationSource === "timer"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                : run.invocationSource === "assignment"
                  ? "bg-violet-100 text-violet-700 dark:bg-violet-900/50 dark:text-violet-300"
                  : run.invocationSource === "on_demand"
                    ? "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300"
                    : "bg-muted text-muted-foreground",
            )}
          >
            {sourceLabels[run.invocationSource] ?? run.invocationSource}
          </span>
          <span className="ml-auto text-xs text-muted-foreground">{relativeTime(run.createdAt)}</span>
        </div>

        {summary && (
          <div className="max-h-16 overflow-hidden">
            <MarkdownBody className="[&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
              {summary}
            </MarkdownBody>
          </div>
        )}
      </Link>
    </div>
  );
}
