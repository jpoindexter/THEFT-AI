import { useEffect, useState } from "react";
import type { Issue } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Clock } from "lucide-react";
import { buildExecutionPolicy, stageParticipantValues } from "../../lib/issue-execution-policy";
import { formatMonitorOffset } from "../../lib/issue-monitor";
import { timeAgo } from "../../lib/timeAgo";
import { cn, formatDate } from "../../lib/utils";
import { toDateTimeLocalValue } from "./helpers";
import { PropertyPicker } from "./PropertyLayout";

type IssueExecutionMonitor = NonNullable<NonNullable<Issue["executionPolicy"]>["monitor"]>;

interface MonitorPropertyProps {
  issue: Issue;
  inline?: boolean;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function MonitorProperty({ issue, inline, onUpdate }: MonitorPropertyProps) {
  const [monitorOpen, setMonitorOpen] = useState(false);
  const [monitorAtInput, setMonitorAtInput] = useState(() => toDateTimeLocalValue(issue.executionPolicy?.monitor?.nextCheckAt));
  const [monitorNotesInput, setMonitorNotesInput] = useState(issue.executionPolicy?.monitor?.notes ?? "");
  const [monitorServiceInput, setMonitorServiceInput] = useState(issue.executionPolicy?.monitor?.serviceName ?? "");
  const reviewerValues = stageParticipantValues(issue.executionPolicy, "review");
  const approverValues = stageParticipantValues(issue.executionPolicy, "approval");

  useEffect(() => {
    setMonitorAtInput(toDateTimeLocalValue(issue.executionPolicy?.monitor?.nextCheckAt));
    setMonitorNotesInput(issue.executionPolicy?.monitor?.notes ?? "");
    setMonitorServiceInput(issue.executionPolicy?.monitor?.serviceName ?? "");
  }, [
    issue.executionPolicy?.monitor?.nextCheckAt,
    issue.executionPolicy?.monitor?.notes,
    issue.executionPolicy?.monitor?.serviceName,
  ]);

  const updateMonitor = (nextMonitor: IssueExecutionMonitor | null) => {
    const basePolicy = buildExecutionPolicy({
      existingPolicy: issue.executionPolicy ?? null,
      reviewerValues,
      approverValues,
    });
    if (!basePolicy && !nextMonitor) {
      onUpdate({ executionPolicy: null });
      return;
    }
    onUpdate({
      executionPolicy: {
        mode: basePolicy?.mode ?? issue.executionPolicy?.mode ?? "normal",
        commentRequired: true,
        stages: basePolicy?.stages ?? [],
        ...(nextMonitor ? { monitor: nextMonitor } : {}),
      },
    });
  };
  const saveMonitor = () => {
    if (!monitorAtInput) return;
    const nextCheckAt = new Date(monitorAtInput);
    if (Number.isNaN(nextCheckAt.getTime())) return;
    const serviceName = monitorServiceInput.trim() || null;
    updateMonitor({
      nextCheckAt: nextCheckAt.toISOString(),
      notes: monitorNotesInput.trim() || null,
      scheduledBy: "board",
      kind: serviceName ? "external_service" : null,
      serviceName,
      externalRef: null,
    });
    setMonitorOpen(false);
  };
  const clearMonitor = () => {
    updateMonitor(null);
    setMonitorOpen(false);
  };
  const currentMonitorLabel = (() => {
    if (issue.executionPolicy?.monitor?.nextCheckAt) {
      return `Next check ${formatDate(new Date(issue.executionPolicy.monitor.nextCheckAt))}`;
    }
    if (issue.executionState?.monitor?.status === "cleared") {
      return "Cleared";
    }
    if (issue.monitorLastTriggeredAt) {
      return `Last triggered ${timeAgo(issue.monitorLastTriggeredAt)}`;
    }
    return "Not scheduled";
  })();
  const monitorNextCheckAt = issue.executionPolicy?.monitor?.nextCheckAt ?? null;
  const monitorTrigger = (
    <span className="inline-flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {monitorNextCheckAt ? (
        <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
      ) : null}
      <span
        className={cn(
          "min-w-0 text-sm break-words",
          monitorNextCheckAt ? "text-foreground" : "text-muted-foreground",
        )}
        title={monitorNextCheckAt ? currentMonitorLabel : undefined}
      >
        {monitorNextCheckAt ? `Next check ${formatMonitorOffset(monitorNextCheckAt)}` : currentMonitorLabel}
      </span>
      {monitorNextCheckAt ? (
        <span className="text-xs text-muted-foreground" title={currentMonitorLabel}>
          {formatDate(new Date(monitorNextCheckAt))}
        </span>
      ) : null}
    </span>
  );
  const monitorAttemptBadge = issue.monitorAttemptCount && issue.monitorAttemptCount > 0 ? (
    <span className="text-xs text-muted-foreground">
      Attempt {issue.monitorAttemptCount}
    </span>
  ) : null;

  return (
    <PropertyPicker
      inline={inline}
      label="Monitor"
      open={monitorOpen}
      onOpenChange={setMonitorOpen}
      triggerContent={monitorTrigger}
      triggerClassName="min-w-0 max-w-full"
      popoverClassName={cn("max-w-full", inline ? "w-full" : "w-80 sm:w-lg")}
      extra={monitorAttemptBadge}
    >
      <div className="flex w-full flex-col gap-2">
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            type="datetime-local"
            className="h-8 px-2 py-1 text-xs md:text-xs"
            value={monitorAtInput}
            onChange={(e) => setMonitorAtInput(e.target.value)}
          />
          <Input
            type="text"
            className="h-8 min-w-0 flex-1 px-2 py-1 text-xs md:text-xs"
            placeholder="What should the agent re-check?"
            value={monitorNotesInput}
            onChange={(e) => setMonitorNotesInput(e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-2 md:flex-row">
          <Input
            type="text"
            className="h-8 min-w-0 flex-1 px-2 py-1 text-xs md:text-xs"
            placeholder="External service"
            value={monitorServiceInput}
            onChange={(e) => setMonitorServiceInput(e.target.value)}
          />
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground disabled:opacity-50"
              disabled={!monitorAtInput}
              onClick={saveMonitor}
            >
              Schedule
            </Button>
            {issue.executionPolicy?.monitor ? (
              <Button
                type="button"
                variant="outline"
                size="xs"
                className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
                onClick={clearMonitor}
              >
                Clear
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </PropertyPicker>
  );
}
