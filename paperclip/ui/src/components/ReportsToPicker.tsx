import { useState } from "react";
import type { Agent } from "@paperclipai/shared";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { User } from "lucide-react";
import { cn } from "../lib/utils";
import { roleLabels } from "./agent-config-primitives";
import { AgentIcon } from "./AgentIconPicker";

export function ReportsToPicker({
  agents,
  value,
  onChange,
  disabled = false,
  excludeAgentIds = [],
  disabledEmptyLabel = "Reports to: N/A (CEO)",
  chooseLabel = "Reports to...",
}: {
  agents: Agent[];
  value: string | null;
  onChange: (id: string | null) => void;
  disabled?: boolean;
  excludeAgentIds?: string[];
  disabledEmptyLabel?: string;
  chooseLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const exclude = new Set(excludeAgentIds);
  const rows = agents.filter(
    (a) => a.status !== "terminated" && !exclude.has(a.id),
  );
  const current = value ? agents.find((a) => a.id === value) : null;
  const terminatedManager = current?.status === "terminated";
  const unknownManager = Boolean(value && !current);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="xs"
          className={cn(
            "max-w-full min-w-0 justify-start gap-1.5 overflow-hidden border-border px-2 font-normal hover:bg-accent/50",
            terminatedManager && "border-amber-600/45 bg-amber-500/5",
          )}
          disabled={disabled}
        >
          {unknownManager ? (
            <>
              <User className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate text-muted-foreground">Unknown manager (stale ID)</span>
            </>
          ) : current ? (
            <>
              <AgentIcon icon={current.icon} className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span
                className={cn(
                  "min-w-0 truncate",
                  terminatedManager && "text-amber-900 dark:text-amber-200",
                )}
              >
                {`Reports to ${current.name}${terminatedManager ? " (terminated)" : ""}`}
              </span>
            </>
          ) : (
            <>
              <User className="h-3 w-3 shrink-0 text-muted-foreground" />
              <span className="min-w-0 truncate">
                {disabled ? disabledEmptyLabel : chooseLabel}
              </span>
            </>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-1" align="start">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className={cn(
            "h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50",
            value === null && "bg-accent",
          )}
          onClick={() => {
            onChange(null);
            setOpen(false);
          }}
        >
          No manager
        </Button>
        {terminatedManager && (
          <div className="flex min-w-0 items-center gap-2 overflow-hidden px-2 py-1.5 text-xs text-muted-foreground border-b border-border mb-0.5">
            <AgentIcon icon={current.icon} className="shrink-0 h-3 w-3" />
            <span className="min-w-0 truncate">
              Current: {current.name} (terminated)
            </span>
          </div>
        )}
        {unknownManager && (
          <div className="px-2 py-1.5 text-xs text-muted-foreground border-b border-border mb-0.5">
            Saved manager is missing from this company. Choose a new manager or clear.
          </div>
        )}
        {rows.map((a) => (
          <Button
            type="button"
            key={a.id}
            variant="ghost"
            size="xs"
            className={cn(
              "h-auto w-full min-w-0 justify-start gap-2 overflow-hidden px-2 py-1.5 font-normal hover:bg-accent/50",
              a.id === value && "bg-accent",
            )}
            onClick={() => {
              onChange(a.id);
              setOpen(false);
            }}
          >
            <AgentIcon icon={a.icon} className="shrink-0 h-3 w-3 text-muted-foreground" />
            <span className="min-w-0 truncate">{a.name}</span>
            <span className="text-muted-foreground ml-auto shrink-0">{roleLabels[a.role] ?? a.role}</span>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}
