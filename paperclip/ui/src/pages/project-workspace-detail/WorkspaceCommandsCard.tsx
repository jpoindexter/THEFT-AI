import type { ProjectWorkspace } from "@paperclipai/shared";
import { TheftLabel } from "@/components/theft/atoms/TheftLabel";
import { TheftSurface } from "@/components/theft/atoms/TheftSurface";
import {
  WorkspaceRuntimeControls,
  type WorkspaceRuntimeControlRequest,
  type WorkspaceRuntimeControlSections,
} from "@/components/WorkspaceRuntimeControls";

type WorkspaceCommandsCardProps = {
  workspace: ProjectWorkspace;
  sections: WorkspaceRuntimeControlSections;
  isPending: boolean;
  pendingRequest: WorkspaceRuntimeControlRequest | null;
  onAction: (request: WorkspaceRuntimeControlRequest) => void;
};

export function WorkspaceCommandsCard({
  workspace,
  sections,
  isPending,
  pendingRequest,
  onAction,
}: WorkspaceCommandsCardProps) {
  return (
    <TheftSurface padding="lg" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <TheftLabel density="compact">Workspace commands</TheftLabel>
          <h2 className="text-lg font-semibold">Services and jobs</h2>
          <p className="text-sm text-muted-foreground">
            Long-running services stay supervised here, while one-shot jobs run on demand against this workspace.
            Execution workspaces inherit this config unless they override it.
          </p>
        </div>
      </div>
      <WorkspaceRuntimeControls
        sections={sections}
        isPending={isPending}
        pendingRequest={pendingRequest}
        serviceEmptyMessage={
          workspace.runtimeConfig?.workspaceRuntime
            ? "No services have been started for this workspace yet."
            : "No workspace command config is defined for this workspace yet."
        }
        jobEmptyMessage="No one-shot jobs are configured for this workspace yet."
        disabledHint="Project workspaces need a working directory before local commands can run, and services also need runtime config."
        onAction={onAction}
      />
    </TheftSurface>
  );
}
