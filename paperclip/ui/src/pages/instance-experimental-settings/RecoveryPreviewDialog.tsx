import type { IssueGraphLivenessAutoRecoveryPreview } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

function issueHref(identifier: string | null, issueId: string) {
  if (!identifier) return `/issues/${issueId}`;
  const prefix = identifier.split("-")[0] || "PAP";
  return `/${prefix}/issues/${identifier}`;
}

function formatRecoveryState(state: string) {
  return state.replace(/_/g, " ");
}

export function RecoveryPreviewDialog({
  preview,
  open,
  onOpenChange,
  onEnableOnly,
  onEnableAndRun,
  isPending,
}: {
  preview: IssueGraphLivenessAutoRecoveryPreview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEnableOnly: () => void;
  onEnableAndRun: () => void;
  isPending: boolean;
}) {
  const count = preview?.recoverableFindings ?? 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Confirm auto-recovery</DialogTitle>
          <DialogDescription>
            {preview
              ? `${count} recovery ${count === 1 ? "task" : "tasks"} match the last ${preview.lookbackHours} hours.`
              : "Checking recovery candidates before enabling."}
          </DialogDescription>
        </DialogHeader>

        <div className="max-h-dialog-list space-y-3 overflow-y-auto pr-1">
          {preview && preview.items.length === 0 ? (
            <div className="rounded-md border border-border bg-muted/30 px-3 py-4 text-sm text-muted-foreground">
              No recovery tasks would be created right now. Auto-recovery can still run for future liveness incidents in
              this window.
            </div>
          ) : null}

          {preview?.items.map((item) => (
            <div key={item.incidentKey} className="rounded-md border border-border bg-card px-3 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <a
                  href={issueHref(item.identifier, item.issueId)}
                  className="text-sm font-medium text-primary underline-offset-2 hover:underline"
                >
                  {item.identifier ?? item.issueId}
                </a>
                <span className="rounded-sm bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                  {formatRecoveryState(item.state)}
                </span>
              </div>
              <p className="mt-1 text-sm text-foreground">{item.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{item.reason}</p>
              <div className="mt-2 text-xs text-muted-foreground">
                Recovery target:{" "}
                <a
                  href={issueHref(item.recoveryIdentifier, item.recoveryIssueId)}
                  className="text-primary underline-offset-2 hover:underline"
                >
                  {item.recoveryIdentifier ?? item.recoveryIssueId}
                </a>
              </div>
            </div>
          ))}
        </div>

        {preview && preview.skippedOutsideLookback > 0 ? (
          <p className="text-xs text-muted-foreground">
            {preview.skippedOutsideLookback} current{" "}
            {preview.skippedOutsideLookback === 1 ? "finding is" : "findings are"} outside the configured lookback and
            will not be touched.
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button variant="outline" onClick={onEnableOnly} disabled={isPending || !preview}>
            Enable only
          </Button>
          <Button onClick={onEnableAndRun} disabled={isPending || !preview}>
            {count > 0 ? `Enable and create ${count}` : "Enable"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
