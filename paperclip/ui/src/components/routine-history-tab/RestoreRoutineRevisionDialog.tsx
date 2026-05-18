import type { RoutineRevision } from "@paperclipai/shared";
import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { collectWebhookTriggerDifferences } from "./routineHistoryFormat";

export function RestoreRoutineRevisionDialog({
  open,
  onOpenChange,
  target,
  current,
  changeSummary,
  onChangeSummaryChange,
  onConfirm,
  pending,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  target: RoutineRevision;
  current: RoutineRevision;
  changeSummary: string;
  onChangeSummaryChange: (value: string) => void;
  onConfirm: () => void;
  pending: boolean;
}) {
  const newRevisionNumber = current.revisionNumber + 1;
  const recreatedWebhookLabels = collectWebhookTriggerDifferences(target, current);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Restore revision {target.revisionNumber}?</DialogTitle>
          <DialogDescription>
            This creates a new revision {newRevisionNumber} with the same content as revision{" "}
            {target.revisionNumber}. Revisions {target.revisionNumber}–{current.revisionNumber} stay
            in history and are not modified.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Routine field values, variables, and schedule cron will revert.
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Previous run history is preserved.
          </li>
          {recreatedWebhookLabels.map((label) => (
            <li key={label} className="flex items-start gap-2 text-amber-200">
              <span className="mt-1 inline-block h-1.5 w-1.5 rounded-full bg-amber-400" />
              The webhook trigger {label} will be recreated with a new URL and secret. Paperclip will
              show the secret once after restore — copy it before closing.
            </li>
          ))}
        </ul>
        <div className="space-y-1.5">
          <Label htmlFor="restore-change-summary" className="text-xs">
            Change summary (optional)
          </Label>
          <Input
            id="restore-change-summary"
            value={changeSummary}
            placeholder="Why are you restoring? Visible in history."
            onChange={(event) => onChangeSummaryChange(event.target.value)}
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={pending}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            {pending ? "Restoring…" : `Restore as revision ${newRevisionNumber}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
