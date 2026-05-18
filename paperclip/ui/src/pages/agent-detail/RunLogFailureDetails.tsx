import type { HeartbeatRun } from "@paperclipai/shared";
import { redactPathText, redactPathValue } from "./redaction";

export function RunLogFailureDetails({
  censorUsernameInLogs,
  run,
}: {
  censorUsernameInLogs: boolean;
  run: HeartbeatRun;
}) {
  if (run.status !== "failed" && run.status !== "timed_out") return null;

  return (
    <div className="rounded-lg border border-red-300 bg-red-50 p-3 space-y-2 dark:border-red-500/30 dark:bg-red-950/20">
      <div className="text-xs font-medium text-red-700 dark:text-red-300">Failure details</div>
      {run.error ? (
        <div className="text-xs text-red-600 dark:text-red-200">
          <span className="text-red-700 dark:text-red-300">Error: </span>
          {redactPathText(run.error, censorUsernameInLogs)}
        </div>
      ) : null}
      {run.stderrExcerpt?.trim() ? (
        <FailurePre title="stderr excerpt" value={redactPathText(run.stderrExcerpt, censorUsernameInLogs)} />
      ) : null}
      {run.resultJson ? (
        <FailurePre
          title="adapter result JSON"
          value={JSON.stringify(redactPathValue(run.resultJson, censorUsernameInLogs), null, 2)}
        />
      ) : null}
      {run.stdoutExcerpt?.trim() && !run.resultJson ? (
        <FailurePre title="stdout excerpt" value={redactPathText(run.stdoutExcerpt, censorUsernameInLogs)} />
      ) : null}
    </div>
  );
}

function FailurePre({ title, value }: { title: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-red-700 dark:text-red-300 mb-1">{title}</div>
      <pre className="bg-red-50 rounded-md p-2 text-xs overflow-x-auto whitespace-pre-wrap text-red-800 dark:bg-neutral-950 dark:text-red-100">
        {value}
      </pre>
    </div>
  );
}
