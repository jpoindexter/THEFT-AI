import type { HeartbeatRunEvent } from "@paperclipai/shared";
import { cn } from "../../lib/utils";
import { redactPathText, redactPathValue } from "./redaction";

const levelColors: Record<string, string> = {
  info: "text-foreground",
  warn: "text-yellow-600 dark:text-yellow-400",
  error: "text-red-600 dark:text-red-400",
};

const streamColors: Record<string, string> = {
  stdout: "text-foreground",
  stderr: "text-red-600 dark:text-red-300",
  system: "text-blue-600 dark:text-blue-300",
};

export function RunEventsList({
  censorUsernameInLogs,
  events,
}: {
  censorUsernameInLogs: boolean;
  events: HeartbeatRunEvent[];
}) {
  if (events.length === 0) return null;

  return (
    <div>
      <div className="mb-2 text-xs font-medium text-muted-foreground">Events ({events.length})</div>
      <div className="bg-neutral-100 rounded-lg p-3 font-mono text-xs space-y-0.5 dark:bg-neutral-950">
        {events.map((event) => (
          <RunEventRow
            key={event.id}
            censorUsernameInLogs={censorUsernameInLogs}
            event={event}
          />
        ))}
      </div>
    </div>
  );
}

function RunEventRow({
  censorUsernameInLogs,
  event,
}: {
  censorUsernameInLogs: boolean;
  event: HeartbeatRunEvent;
}) {
  const color = event.color
    ?? (event.level ? levelColors[event.level] : null)
    ?? (event.stream ? streamColors[event.stream] : null)
    ?? "text-foreground";

  return (
    <div className="flex gap-2">
      <span className="text-neutral-400 shrink-0 select-none w-16 dark:text-neutral-600">
        {new Date(event.createdAt).toLocaleTimeString("en-US", { hour12: false })}
      </span>
      <span className={cn("shrink-0 w-14", event.stream ? (streamColors[event.stream] ?? "text-neutral-500") : "text-neutral-500")}>
        {event.stream ? `[${event.stream}]` : ""}
      </span>
      <span className={cn("break-all", color)}>
        {event.message
          ? redactPathText(event.message, censorUsernameInLogs)
          : event.payload
            ? JSON.stringify(redactPathValue(event.payload, censorUsernameInLogs))
            : ""}
      </span>
    </div>
  );
}
