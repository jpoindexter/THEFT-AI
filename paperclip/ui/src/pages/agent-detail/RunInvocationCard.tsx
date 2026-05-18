import { ChevronRight } from "lucide-react";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

import { formatEnvForDisplay, redactCommandText, redactPathText, redactPathValue } from "./redaction";

export function RunInvocationCard({
  payload,
  censorUsernameInLogs,
}: {
  payload: Record<string, unknown>;
  censorUsernameInLogs: boolean;
}) {
  const rawCommandLine = [
    typeof payload.command === "string" ? payload.command : null,
    ...(Array.isArray(payload.commandArgs)
      ? payload.commandArgs.filter((value): value is string => typeof value === "string")
      : []),
  ]
    .filter((value): value is string => Boolean(value))
    .join(" ");
  const commandLine = rawCommandLine ? redactCommandText(rawCommandLine, censorUsernameInLogs) : "";

  const hasAdvancedDetails =
    commandLine.length > 0
    || (Array.isArray(payload.commandNotes) && payload.commandNotes.length > 0)
    || payload.prompt !== undefined
    || payload.context !== undefined
    || payload.env !== undefined;

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3 space-y-2">
      <div className="text-xs font-medium text-muted-foreground">Invocation</div>
      {typeof payload.adapterType === "string" && (
        <div className="text-xs"><span className="text-muted-foreground">Adapter: </span>{payload.adapterType}</div>
      )}
      {typeof payload.cwd === "string" && (
        <div className="text-xs break-all"><span className="text-muted-foreground">Working dir: </span><span className="font-mono">{payload.cwd}</span></div>
      )}
      {hasAdvancedDetails && (
        <Collapsible>
          <CollapsibleTrigger className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors group">
            <ChevronRight className="h-3 w-3 transition-transform group-data-[state=open]:rotate-90" />
            Details
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 space-y-2">
            {commandLine && (
              <div className="text-xs break-all">
                <span className="text-muted-foreground">Command: </span>
                <span className="font-mono">{commandLine}</span>
              </div>
            )}
            {Array.isArray(payload.commandNotes) && payload.commandNotes.length > 0 && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Command notes</div>
                <ul className="list-disc pl-5 space-y-1">
                  {payload.commandNotes
                    .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
                    .map((note, idx) => (
                      <li key={`${idx}-${note}`} className="text-xs break-all font-mono">
                        {note}
                      </li>
                    ))}
                </ul>
              </div>
            )}
            {payload.prompt !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Prompt</div>
                <pre className="bg-neutral-100 dark:bg-neutral-950 rounded-md p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                  {typeof payload.prompt === "string"
                    ? redactPathText(payload.prompt, censorUsernameInLogs)
                    : JSON.stringify(redactPathValue(payload.prompt, censorUsernameInLogs), null, 2)}
                </pre>
              </div>
            )}
            {payload.context !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Context</div>
                <pre className="bg-neutral-100 dark:bg-neutral-950 rounded-md p-2 text-xs overflow-x-auto whitespace-pre-wrap">
                  {JSON.stringify(redactPathValue(payload.context, censorUsernameInLogs), null, 2)}
                </pre>
              </div>
            )}
            {payload.env !== undefined && (
              <div>
                <div className="text-xs text-muted-foreground mb-1">Environment</div>
                <pre className="bg-neutral-100 dark:bg-neutral-950 rounded-md p-2 text-xs overflow-x-auto whitespace-pre-wrap font-mono">
                  {formatEnvForDisplay(payload.env, censorUsernameInLogs)}
                </pre>
              </div>
            )}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
