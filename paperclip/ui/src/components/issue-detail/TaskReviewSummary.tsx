import { Activity, AlertTriangle, Check, FileText, Library, MessageSquare, Repeat, UserRound } from "lucide-react";
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
  approving: boolean;
  onStartExecution: () => void;
  onApprove: () => void;
  onAskRevision: () => void;
  onAskOperator: () => void;
  onOpenLibrary: () => void;
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
  approving,
  onStartExecution,
  onApprove,
  onAskRevision,
  onAskOperator,
  onOpenLibrary,
}: TaskReviewSummaryProps) {
  const ownerLabel = owner
    ? `${owner.title ?? "Department lead"} · ${owner.name}`
    : "Operator has not assigned a department lead yet";
  const outputLabel = outputCount > 0
    ? `${outputCount} Library artifact${outputCount === 1 ? "" : "s"}`
    : "No Library artifact yet";
  const canStartExecution = !hasLiveRuns && !hasBlocker && !["done", "cancelled"].includes(issue.status);
  const runLabel = hasLiveRuns
    ? "Live run active"
    : issue.executionRunId
      ? "Run attached"
      : canStartExecution
      ? "Ready to run"
      : "No active run";
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
  const hasOutput = outputCount > 0;
  const canApprove = !hasBlocker && hasOutput && issue.status !== "done";
  const approveLabel = issue.status === "done"
    ? "Approved"
    : !hasOutput
      ? "No output to approve"
      : approving
        ? "Approving..."
        : "Approve output";
  const outputHelp = hasOutput
    ? "Saved output is available in Library. Open it there to inspect the durable artifact before approving."
    : "This task can only be approved after the department publishes a concrete Library artifact.";

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
            <p className="mt-2 text-xs leading-5 text-muted-foreground">
              {outputHelp}
            </p>
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
            <TheftSurface tone="muted" padding="sm" className="space-y-2">
              <p className="text-xs font-medium text-foreground">Where the work should land</p>
              <div className="grid gap-2 text-xs leading-5 text-muted-foreground sm:grid-cols-3">
                <span>1. Department produces work.</span>
                <span>2. Operator saves it to Library.</span>
                <span>3. Founder approves or asks for revision.</span>
              </div>
            </TheftSurface>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={hasOutput ? onOpenLibrary : onAskOperator}
          >
            {hasOutput ? <Library className="h-4 w-4" /> : <MessageSquare className="h-4 w-4" />}
            {hasOutput ? "Open Library artifact" : "Ask Operator to publish output"}
          </Button>
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
                  ? "Approve the saved artifact or send a revision note into the task thread."
                  : "Ask Operator to publish the missing output before this task is marked complete."}
            </p>
          </div>
          <div className="grid gap-2">
            <Button variant="outline" size="sm" disabled={!canStartExecution} onClick={onStartExecution}>
              <Activity className="h-4 w-4" />
              {canStartExecution ? "Start execution" : "Execution unavailable"}
            </Button>
            <Button size="sm" disabled={!canApprove || approving} onClick={onApprove}>
              <Check className="h-4 w-4" />
              {approveLabel}
            </Button>
            <Button variant="outline" size="sm" onClick={onAskRevision}>
              <Repeat className="h-4 w-4" />
              Ask for revision
            </Button>
            <Button variant="outline" size="sm" onClick={onAskOperator}>
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
