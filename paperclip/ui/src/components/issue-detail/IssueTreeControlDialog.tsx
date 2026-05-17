import { Link } from "@/lib/router";
import { ApiError } from "@/api/client";
import { AgentIcon } from "@/components/AgentIconPicker";
import { StatusIcon } from "@/components/StatusIcon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { createIssueDetailPath } from "@/lib/issueDetailBreadcrumb";
import { cn } from "@/lib/utils";
import type {
  Agent,
  Issue,
  IssueTreeControlMode,
  IssueTreeControlPreview,
} from "@paperclipai/shared";

const TREE_PREVIEW_DEPTH_CLASSES = ["pl-0", "pl-3.5", "pl-7", "pl-10", "pl-14", "pl-16", "pl-20"];

const TREE_CONTROL_MODE_LABEL: Record<IssueTreeControlMode, string> = {
  pause: "Pause subtree",
  resume: "Resume subtree",
  cancel: "Cancel subtree",
  restore: "Restore subtree",
};

const LEAF_WORK_CONTROL_MODE_LABEL: Partial<Record<IssueTreeControlMode, string>> = {
  pause: "Pause work",
  resume: "Resume work",
};

const TREE_CONTROL_MODE_HELP_TEXT: Record<IssueTreeControlMode, string> = {
  pause: "Pause active execution in this issue subtree until an explicit resume.",
  resume: "Release the active subtree pause hold so held work can continue.",
  cancel: "Cancel non-terminal issues in this subtree and stop queued/running work where possible.",
  restore: "Restore issues cancelled by this subtree operation so work can resume.",
};

const LEAF_WORK_CONTROL_MODE_HELP_TEXT: Partial<Record<IssueTreeControlMode, string>> = {
  pause: "Pause active execution on this issue until an explicit resume.",
  resume: "Release the active pause hold so this issue can continue.",
};

type IssueTreePreviewIssueRow = {
  candidate: IssueTreeControlPreview["issues"][number];
  issue: Issue;
};

type IssueTreePreviewAgentRow = IssueTreeControlPreview["affectedAgents"][number] & {
  agent: Agent | null;
};

type IssueTreeControlDialogProps = {
  open: boolean;
  mode: IssueTreeControlMode;
  scope: "leaf" | "subtree";
  reason: string;
  wakeAgentsOnResume: boolean;
  cancelConfirmed: boolean;
  previewLoading: boolean;
  previewError: unknown;
  preview: IssueTreeControlPreview | null | undefined;
  warnings: IssueTreeControlPreview["warnings"];
  affectedIssueRows: IssueTreePreviewIssueRow[];
  affectedAgentRows: IssueTreePreviewAgentRow[];
  affectedIssueCount: number;
  affectedAgentCount: number;
  primaryButtonLabel: string;
  canApply: boolean;
  applying: boolean;
  onOpenChange: (open: boolean) => void;
  onReasonChange: (reason: string) => void;
  onWakeAgentsOnResumeChange: (checked: boolean) => void;
  onCancelConfirmedChange: (checked: boolean) => void;
  onRetryPreview: () => void;
  onApply: () => void;
};

function treePreviewDepthClass(depth: number) {
  return TREE_PREVIEW_DEPTH_CLASSES[Math.min(Math.max(depth, 0), TREE_PREVIEW_DEPTH_CLASSES.length - 1)];
}

export function issueTreeControlLabel(mode: IssueTreeControlMode, scope: "leaf" | "subtree") {
  return scope === "leaf"
    ? LEAF_WORK_CONTROL_MODE_LABEL[mode] ?? TREE_CONTROL_MODE_LABEL[mode]
    : TREE_CONTROL_MODE_LABEL[mode];
}

function issueTreeControlHelpText(mode: IssueTreeControlMode, scope: "leaf" | "subtree") {
  return scope === "leaf"
    ? LEAF_WORK_CONTROL_MODE_HELP_TEXT[mode] ?? TREE_CONTROL_MODE_HELP_TEXT[mode]
    : TREE_CONTROL_MODE_HELP_TEXT[mode];
}

function treeControlPreviewErrorCopy(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 403) return "Only board users can preview subtree controls.";
    if (error.status === 409) return "Preview is stale because subtree hold state changed. Retry to refresh.";
    if (error.status === 422) return "This subtree action is currently invalid for the selected issues.";
  }
  return error instanceof Error ? error.message : "Unable to load preview.";
}

export function IssueTreeControlDialog({
  open,
  mode,
  scope,
  reason,
  wakeAgentsOnResume,
  cancelConfirmed,
  previewLoading,
  previewError,
  preview,
  warnings,
  affectedIssueRows,
  affectedAgentRows,
  affectedIssueCount,
  affectedAgentCount,
  primaryButtonLabel,
  canApply,
  applying,
  onOpenChange,
  onReasonChange,
  onWakeAgentsOnResumeChange,
  onCancelConfirmedChange,
  onRetryPreview,
  onApply,
}: IssueTreeControlDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-dvh flex-col gap-0 overflow-hidden p-0 sm:max-w-xl">
        <DialogHeader className="border-b border-border/60 px-6 pb-4 pr-12 pt-6">
          <DialogTitle>{issueTreeControlLabel(mode, scope)}</DialogTitle>
          <DialogDescription>
            {issueTreeControlHelpText(mode, scope)}
          </DialogDescription>
        </DialogHeader>
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto overscroll-contain px-6 py-4">
          {mode === "cancel" ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
              Cancelling a subtree is destructive. Non-terminal issues will be marked cancelled, and running or queued work will be interrupted where possible.
            </div>
          ) : null}

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground">
              Reason (optional)
            </label>
            <Textarea
              value={reason}
              onChange={(event) => onReasonChange(event.target.value)}
              placeholder="Explain why this subtree control is being applied..."
              className="min-h-24"
            />
          </div>

          {mode === "resume" || mode === "restore" ? (
            <div className="space-y-2">
              <label className="flex items-start gap-2 text-sm">
                <Checkbox
                  className="mt-0.5"
                  disabled={affectedAgentCount === 0}
                  checked={wakeAgentsOnResume}
                  onCheckedChange={(checked) => onWakeAgentsOnResumeChange(checked === true)}
                />
                <span>
                  <span className="block font-medium">Wake affected agents ({affectedAgentCount})</span>
                  <span className="text-xs text-muted-foreground">
                    {affectedAgentCount === 0
                      ? "No assigned agents are eligible to wake from this preview."
                      : "Wake assigned agents after this operation completes."}
                  </span>
                </span>
              </label>
              {wakeAgentsOnResume && affectedAgentRows.length > 0 ? (
                <div className="max-h-32 space-y-1 overflow-y-auto overscroll-contain">
                  {affectedAgentRows.map(({ agentId, agent }) => (
                    <div key={agentId} className="flex items-center gap-2 rounded-sm px-1 py-1 text-sm hover:bg-accent/50">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                        <AgentIcon icon={agent?.icon} className="h-3.5 w-3.5 text-muted-foreground" />
                      </span>
                      <span className="min-w-0 flex-1 truncate">{agent?.name ?? agentId.slice(0, 8)}</span>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {mode === "cancel" ? (
            <label className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-2 text-sm">
              <Checkbox
                className="mt-0.5"
                checked={cancelConfirmed}
                onCheckedChange={(checked) => onCancelConfirmedChange(checked === true)}
              />
              <span>I understand this will cancel {affectedIssueCount} issues.</span>
            </label>
          ) : null}

          <div className="space-y-2">
            {previewLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
                <Skeleton className="h-3 w-2/3" />
              </div>
            ) : previewError ? (
              <div className="space-y-2">
                <p className="text-xs text-destructive">{treeControlPreviewErrorCopy(previewError)}</p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetryPreview}
                >
                  Retry preview
                </Button>
              </div>
            ) : preview ? (
              <div className="space-y-2">
                {warnings.length > 0 ? (
                  <div className="space-y-1">
                    {warnings.map((warning) => (
                      <p key={warning.code} className="text-xs text-amber-700 dark:text-amber-300">
                        {warning.message}
                      </p>
                    ))}
                  </div>
                ) : null}
                {affectedIssueRows.length > 0 ? (
                  <div className="max-h-56 overflow-y-auto overscroll-contain">
                    {affectedIssueRows.map(({ candidate, issue: previewIssue }) => (
                      <div key={candidate.id} className={treePreviewDepthClass(candidate.depth)}>
                        <Link
                          to={createIssueDetailPath(candidate.identifier ?? candidate.id)}
                          issuePrefetch={previewIssue}
                          className={cn(
                            "group flex items-start gap-2 border-b border-border py-2 pl-1 pr-2 text-sm no-underline text-inherit transition-colors last:border-b-0 hover:bg-accent/50 sm:items-center",
                            candidate.skipped && "opacity-60",
                          )}
                        >
                          <StatusIcon status={candidate.status} />
                          <span className="shrink-0 font-mono text-xs text-muted-foreground">
                            {candidate.identifier ?? candidate.id.slice(0, 8)}
                          </span>
                          <span className="min-w-0 flex-1 truncate">{candidate.title}</span>
                          {candidate.skipped && candidate.skipReason === "terminal_status" ? (
                            <span className="shrink-0 text-xs text-muted-foreground">Complete</span>
                          ) : null}
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">Preview unavailable.</p>
            )}
          </div>
        </div>
        <DialogFooter className="border-t border-border/60 bg-background px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={applying}>
            Close
          </Button>
          <Button
            onClick={onApply}
            disabled={applying || !canApply}
            variant={mode === "cancel" ? "destructive" : "default"}
          >
            {applying ? "Applying..." : primaryButtonLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
