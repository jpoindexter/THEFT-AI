import { useState } from "react";
import type { ReactNode } from "react";
import type { Project } from "@paperclipai/shared";
import { AlertCircle, Archive, ArchiveRestore, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "../../lib/utils";
import { statusBadge, statusBadgeDefault } from "../../lib/status-colors";
import type { ProjectFieldSaveState } from "./ProjectPropertiesTypes";

const PROJECT_STATUSES = [
  { value: "backlog", label: "Backlog" },
  { value: "planned", label: "Planned" },
  { value: "in_progress", label: "In Progress" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function SaveIndicator({ state }: { state: ProjectFieldSaveState }) {
  if (state === "saving") {
    return (
      <span className="inline-flex items-center gap-1 text-micro text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving
      </span>
    );
  }
  if (state === "saved") {
    return (
      <span className="inline-flex items-center gap-1 text-micro text-chart-2">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  }
  if (state === "error") {
    return (
      <span className="inline-flex items-center gap-1 text-micro text-destructive">
        <AlertCircle className="h-3 w-3" />
        Failed
      </span>
    );
  }
  return null;
}

export function FieldLabel({
  label,
  state,
}: {
  label: string;
  state: ProjectFieldSaveState;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <SaveIndicator state={state} />
    </div>
  );
}

export function PropertyRow({
  label,
  children,
  alignStart = false,
  valueClassName = "",
}: {
  label: ReactNode;
  children: ReactNode;
  alignStart?: boolean;
  valueClassName?: string;
}) {
  return (
    <div className="flex items-start gap-3 py-1.5">
      <div className="mt-0.5 w-20 shrink-0">{label}</div>
      <div className={cn("min-w-0 flex-1", alignStart ? "pt-0.5" : "flex flex-wrap items-center gap-1.5", valueClassName)}>
        {children}
      </div>
    </div>
  );
}

export function ProjectStatusPicker({ status, onChange }: { status: string; onChange: (status: string) => void }) {
  const [open, setOpen] = useState(false);
  const colorClass = statusBadge[status] ?? statusBadgeDefault;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto shrink-0 cursor-pointer whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium hover:opacity-80",
            colorClass,
          )}
        >
          {status.replace("_", " ")}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-40 p-1" align="start">
        {PROJECT_STATUSES.map((statusOption) => (
          <Button
            key={statusOption.value}
            variant="ghost"
            size="sm"
            className={cn("w-full justify-start gap-2 text-xs", statusOption.value === status && "bg-accent")}
            onClick={() => {
              onChange(statusOption.value);
              setOpen(false);
            }}
          >
            {statusOption.label}
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export function ArchiveDangerZone({
  project,
  onArchive,
  archivePending,
}: {
  project: Project;
  onArchive: (archived: boolean) => void;
  archivePending?: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const isArchive = !project.archivedAt;
  const action = isArchive ? "Archive" : "Unarchive";

  return (
    <div className="space-y-3 rounded-md border border-destructive/40 bg-destructive/5 px-4 py-4">
      <p className="text-sm text-muted-foreground">
        {isArchive
          ? "Archive this project to hide it from the sidebar and project selectors."
          : "Unarchive this project to restore it in the sidebar and project selectors."}
      </p>
      {archivePending ? (
        <Button size="sm" variant="destructive" disabled>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          {isArchive ? "Archiving..." : "Unarchiving..."}
        </Button>
      ) : confirming ? (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-destructive">
            {action} &ldquo;{project.name}&rdquo;?
          </span>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => {
              setConfirming(false);
              onArchive(isArchive);
            }}
          >
            Confirm
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setConfirming(false)}
          >
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="destructive"
          onClick={() => setConfirming(true)}
        >
          {isArchive ? (
            <><Archive className="mr-1 h-3 w-3" />{action} project</>
          ) : (
            <><ArchiveRestore className="mr-1 h-3 w-3" />{action} project</>
          )}
        </Button>
      )}
    </div>
  );
}
