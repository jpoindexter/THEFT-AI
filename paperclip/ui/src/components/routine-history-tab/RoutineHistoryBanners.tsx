import { RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RoutineHistoryDirtyFieldDescriptor } from "./routineHistoryTypes";

interface HistoricalPreviewBannerProps {
  revisionNumber: number;
  nextRevisionNumber: number;
  onReturn: () => void;
  onRestore: () => void;
  pending: boolean;
}

export function HistoricalPreviewBanner({
  revisionNumber,
  nextRevisionNumber,
  onReturn,
  onRestore,
  pending,
}: HistoricalPreviewBannerProps) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-200">
            Viewing revision {revisionNumber} (read-only)
          </p>
          <p className="text-xs text-muted-foreground">
            Restoring this revision creates a new revision {nextRevisionNumber} with the same content.
            History stays append-only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onReturn} disabled={pending}>
            Return to current
          </Button>
          <Button size="sm" onClick={onRestore} disabled={pending}>
            <RotateCcw className="mr-1.5 h-3.5 w-3.5" />
            Restore as new revision
          </Button>
        </div>
      </div>
    </div>
  );
}

interface ConflictBannerProps {
  dirtyFields: RoutineHistoryDirtyFieldDescriptor[];
  onDiscard: () => void;
  onSave: () => void;
}

export function ConflictBanner({
  dirtyFields,
  onDiscard,
  onSave,
}: ConflictBannerProps) {
  const labels = dirtyFields.length > 0
    ? dirtyFields.map((field) => field.label)
    : ["the routine"];
  const fieldsText = formatDirtyFieldList(labels);

  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-4 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-200">Unsaved routine edits</p>
          <p className="text-xs text-muted-foreground">
            You changed {fieldsText} but haven&apos;t saved yet. Save or discard before previewing or
            restoring an older revision.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={onDiscard}>
            Discard changes
          </Button>
          <Button size="sm" onClick={onSave}>
            Save and continue
          </Button>
        </div>
      </div>
      {dirtyFields.length > 0 && (
        <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
          {dirtyFields.map((field) => (
            <li key={field.key} className="flex items-center gap-2">
              <span className="h-1 w-1 rounded-full bg-amber-400" />
              {field.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatDirtyFieldList(labels: string[]): string {
  if (labels.length === 0) return "the routine";
  if (labels.length === 1) return labels[0];
  if (labels.length === 2) return `${labels[0]} and ${labels[1]}`;
  return `${labels.slice(0, -1).join(", ")}, and ${labels[labels.length - 1]}`;
}
