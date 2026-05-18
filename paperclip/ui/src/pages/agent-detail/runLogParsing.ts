import { ApiError } from "../../api/client";

export const RUN_LOG_PAGE_BYTES = 256_000;

export type RunLogLine = {
  ts: string;
  stream: "stdout" | "stderr" | "system";
  chunk: string;
};

export function isRunLogUnavailable(err: unknown): boolean {
  return err instanceof ApiError && err.status === 404;
}

export function parseRunLogContent(
  content: string,
  pendingLine: string,
  finalize = false,
): { lines: RunLogLine[]; pendingLine: string } {
  if (!content && !finalize) return { lines: [], pendingLine };

  const combined = `${pendingLine}${content}`;
  const split = combined.split("\n");
  let nextPendingLine = split.pop() ?? "";
  if (finalize && nextPendingLine) {
    split.push(nextPendingLine);
    nextPendingLine = "";
  }

  const lines: RunLogLine[] = [];
  for (const line of split) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    try {
      const raw = JSON.parse(trimmed) as { ts?: unknown; stream?: unknown; chunk?: unknown };
      const stream = raw.stream === "stderr" || raw.stream === "system" ? raw.stream : "stdout";
      const chunk = typeof raw.chunk === "string" ? raw.chunk : "";
      const ts = typeof raw.ts === "string" ? raw.ts : new Date().toISOString();
      if (chunk) lines.push({ ts, stream, chunk });
    } catch {
      // Ignore malformed log lines written by interrupted processes.
    }
  }

  return { lines, pendingLine: nextPendingLine };
}
