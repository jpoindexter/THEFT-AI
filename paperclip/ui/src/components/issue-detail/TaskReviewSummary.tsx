import { Activity, AlertTriangle, Check, FileText, MessageSquare, Repeat, UserRound } from "lucide-react";
import type { Agent, Issue } from "@paperclipai/shared";

import { Button } from "@/components/ui/button";
import { TheftChip } from "@/components/theft/atoms/TheftChip";
import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import { TheftSectionHeader } from "@/components/theft/molecules/TheftSectionHeader";
import { TheftStat } from "@/components/theft/molecules/TheftStat";

type TaskReviewSummaryProps = {
  issue: Issue;
  owner: Agent | null;
  outputCount: number;
  outputTitles: string[];
  decisionCount: number;
  commentCount: number;
  childTaskCount: number;
  hasLiveRuns: boolean;
  hasBlocker: boolean;
};

function formatTaskStatus(status: string) {
  return status.replace(/_/g, " ");
}

export function TaskReviewSummary({
  issue,
  owner,
  outputCount,
  outputTitles,
  decisionCount,
  commentCount,
  childTaskCount,
  hasLiveRuns,
  hasBlocker,
}: TaskReviewSummaryProps) {
  const ownerLabel = owner
    ? `${owner.title ?? "Department lead"} · ${owner.name}`
    : "Operator has not assigned a department lead yet";
  const outputLabel = outputCount > 0
    ? `${outputCount} Library artifact${outputCount === 1 ? "" : "s"}`
    : "No Library artifact yet";
  const runLabel = hasLiveRuns ? "Live run active" : issue.executionRunId ? "Run attached" : "No active run";
  const taskStateLabel = hasBlocker
    ? "Blocked until next action"
    : issue.status === "done"
      ? "Ready in company memory"
      : "Ready for Operator review";
  const decisionLabel = decisionCount > 0
    ? `${decisionCount} founder decision${decisionCount === 1 ? "" : "s"} pending`
    : issue.status === "done"
      ? "Completed"
      : outputCount > 0
        ? "Review output"
        : "Await output";

  return (
    <TheftSurface padding="lg" className="space-y-4 text-foreground">
      <TheftSectionHeader
        eyebrow="Task Review"
        title="Output and decision"
        description="Review the delivered work first. Runtime diagnostics stay collapsed below the decision workflow."
        actions={
          <TheftChip tone={hasBlocker ? "warning" : "signal"}>
            {taskStateLabel}
          </TheftChip>
        }
        className="flex-col sm:flex-row"
      />

      <div className="grid gap-3 lg:grid-cols-3">
        <TheftSurface tone="plain" padding="md" className="space-y-3 lg:col-span-2">
          <div>
            <p className="theft-label-compact">Output & Evidence</p>
            <p className="mt-2 text-sm">{outputLabel}</p>
          </div>
          {outputTitles.length > 0 ? (
            <div className="space-y-2">
              {outputTitles.slice(0, 3).map((title) => (
                <TheftSurface key={title} tone="muted" padding="sm" className="flex items-start gap-2 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="line-clamp-2">{title}</span>
                </TheftSurface>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-5 text-muted-foreground">
              Saved documents and work products appear here as soon as the department publishes output.
            </p>
          )}
          <TheftSurface tone="muted" padding="sm">
            <p className="theft-label-compact">Objective</p>
            <p className="mt-2 line-clamp-4 text-xs leading-5 text-muted-foreground">
              {issue.description?.trim() || "No objective has been written for this task yet."}
            </p>
          </TheftSurface>
        </TheftSurface>

        <TheftSurface tone="muted" padding="md" className="space-y-3">
          <div>
            <p className="theft-label-compact">Decision</p>
            <p className="mt-2 text-sm">{decisionLabel}</p>
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {hasBlocker
                ? "Unblock this task before approving output."
                : outputCount > 0
                  ? "Approve the result, ask for revision, or complete the task."
                  : "Wait for department output or ask Operator to adjust the task."}
            </p>
          </div>
          <div className="grid gap-2">
            <Button size="sm" disabled={hasBlocker || outputCount === 0}>
              <Check className="h-4 w-4" />
              Approve
            </Button>
            <Button variant="outline" size="sm">
              <Repeat className="h-4 w-4" />
              Ask for revision
            </Button>
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4" />
              Ask Operator
            </Button>
          </div>
        </TheftSurface>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <TheftStat
          icon={<UserRound />}
          label="Owner"
          value={ownerLabel}
          description={childTaskCount > 0 ? `${childTaskCount} subtask${childTaskCount === 1 ? "" : "s"} in scope` : "Single task"}
        />
        <TheftStat
          icon={<AlertTriangle />}
          label="Review state"
          value={decisionCount > 0 ? `${decisionCount} pending` : "No founder decision pending"}
          description={`${commentCount} comment${commentCount === 1 ? "" : "s"} in the task thread`}
          tone={decisionCount > 0 ? "warning" : "default"}
        />
        <TheftStat
          icon={<Activity />}
          label="Runtime diagnostics"
          value={runLabel}
          description={`${formatTaskStatus(issue.status)} · ${issue.priority} priority`}
          tone={hasLiveRuns ? "signal" : "default"}
        />
      </div>
    </TheftSurface>
  );
}
