import { Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { CommandSection } from "./workspace-runtime-controls/CommandSection";
import {
  buildWorkspaceRuntimeControlItems,
  buildWorkspaceRuntimeControlSections,
  getRunningRuntimeServiceUrl,
  hasRunningRuntimeServices,
} from "./workspace-runtime-controls/workspaceRuntimeModel";
import { WorkspaceRuntimeQuickControls } from "./workspace-runtime-controls/WorkspaceRuntimeQuickControls";
import type {
  WorkspaceRuntimeAction,
  WorkspaceRuntimeControlItem,
  WorkspaceRuntimeControlRequest,
  WorkspaceRuntimeControlSections,
} from "./workspace-runtime-controls/types";

export type {
  WorkspaceRuntimeAction,
  WorkspaceRuntimeControlItem,
  WorkspaceRuntimeControlRequest,
  WorkspaceRuntimeControlSections,
};

export {
  buildWorkspaceRuntimeControlItems,
  buildWorkspaceRuntimeControlSections,
  getRunningRuntimeServiceUrl,
  hasRunningRuntimeServices,
  WorkspaceRuntimeQuickControls,
};

type LegacyWorkspaceRuntimeControlItem = WorkspaceRuntimeControlItem & {
  status?: string | null;
};

type WorkspaceRuntimeControlsProps = {
  sections: WorkspaceRuntimeControlSections;
  items?: never;
  isPending?: boolean;
  pendingRequest?: WorkspaceRuntimeControlRequest | null;
  serviceEmptyMessage?: string;
  jobEmptyMessage?: string;
  emptyMessage?: never;
  disabledHint?: string | null;
  onAction: (request: WorkspaceRuntimeControlRequest) => void;
  className?: string;
  square?: boolean;
} | {
  sections?: never;
  items: LegacyWorkspaceRuntimeControlItem[];
  isPending?: boolean;
  pendingRequest?: WorkspaceRuntimeControlRequest | null;
  serviceEmptyMessage?: never;
  jobEmptyMessage?: never;
  emptyMessage?: string;
  disabledHint?: string | null;
  onAction: (request: WorkspaceRuntimeControlRequest) => void;
  className?: string;
  square?: boolean;
};

export function WorkspaceRuntimeControls({
  sections,
  items,
  isPending = false,
  pendingRequest = null,
  serviceEmptyMessage = "No services are configured for this workspace.",
  jobEmptyMessage = "No one-shot jobs are configured for this workspace.",
  emptyMessage,
  disabledHint = null,
  onAction,
  className,
  square,
}: WorkspaceRuntimeControlsProps) {
  const resolvedSections = sections ?? {
    services: (items ?? []).map((item) => ({
      ...item,
      statusLabel: item.statusLabel ?? item.status ?? "stopped",
    })),
    jobs: [],
    otherServices: [],
  };
  const resolvedServiceEmptyMessage = emptyMessage ?? serviceEmptyMessage;
  const runningCount = [...resolvedSections.services, ...resolvedSections.otherServices].filter(
    (item) => item.statusLabel === "running" || item.statusLabel === "starting",
  ).length;
  const visibleDisabledHint = runningCount > 0 || disabledHint === null ? null : disabledHint;
  const panelShape = square ? "workspace-runtime-square-corners" : "rounded-xl";

  return (
    <div className={cn("space-y-4", className)}>
      <div className={cn("border border-border/70 bg-background p-3", panelShape)}>
        <div className="space-y-1">
          <div className="theft-label-compact font-medium">Workspace commands</div>
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
                runningCount > 0
                  ? "border-primary/30 bg-primary/5 text-primary"
                  : "border-border bg-background text-muted-foreground",
              )}
            >
              <Activity className="h-3.5 w-3.5" />
              {runningCount > 0 ? `${runningCount} services running` : "No services running"}
            </span>
            <span className="text-xs text-muted-foreground">
              {resolvedSections.jobs.length > 0
                ? `${resolvedSections.jobs.length} job${resolvedSections.jobs.length === 1 ? "" : "s"} available to run on demand.`
                : "Each command can be controlled independently."}
            </span>
          </div>
          {visibleDisabledHint ? <p className="text-xs text-muted-foreground">{visibleDisabledHint}</p> : null}
        </div>
      </div>

      <CommandSection
        title="Services"
        description="Long-running commands that Paperclip can supervise for this workspace."
        items={resolvedSections.services}
        emptyMessage={resolvedServiceEmptyMessage}
        disabledHint={visibleDisabledHint}
        isPending={isPending}
        pendingRequest={pendingRequest}
        onAction={onAction}
        square={square}
      />

      <CommandSection
        title="Jobs"
        description="One-shot commands that run now and exit when they finish."
        items={resolvedSections.jobs}
        emptyMessage={jobEmptyMessage}
        isPending={isPending}
        pendingRequest={pendingRequest}
        onAction={onAction}
        square={square}
      />

      {resolvedSections.otherServices.length > 0 ? (
        <CommandSection
          title="Untracked services"
          description="Running services that no longer match the current workspace command config."
          items={resolvedSections.otherServices}
          emptyMessage=""
          isPending={isPending}
          pendingRequest={pendingRequest}
          onAction={onAction}
          square={square}
        />
      ) : null}
    </div>
  );
}
