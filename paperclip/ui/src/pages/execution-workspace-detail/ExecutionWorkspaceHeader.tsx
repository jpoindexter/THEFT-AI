import type { ComponentProps } from "react";
import { Tabs } from "@/components/ui/tabs";
import { PageTabBar } from "@/components/PageTabBar";
import { WorkspaceRuntimeQuickControls } from "@/components/WorkspaceRuntimeControls";
import type { WorkspaceRuntimeControlRequest } from "@/components/WorkspaceRuntimeControls";
import type { ExecutionWorkspaceTab } from "./workspaceTabs";

type RuntimeControlSections = ComponentProps<typeof WorkspaceRuntimeQuickControls>["sections"];

export function ExecutionWorkspaceHeader({
  workspaceName,
  activeTab,
  runtimeControlSections,
  isRuntimePending,
  pendingRuntimeAction,
  runtimeActionErrorMessage,
  runtimeActionMessage,
  onRuntimeAction,
  onTabChange,
}: {
  workspaceName: string;
  activeTab: ExecutionWorkspaceTab | null;
  runtimeControlSections: RuntimeControlSections;
  isRuntimePending: boolean;
  pendingRuntimeAction: WorkspaceRuntimeControlRequest | null;
  runtimeActionErrorMessage: string | null;
  runtimeActionMessage: string | null;
  onRuntimeAction: (request: WorkspaceRuntimeControlRequest) => void;
  onTabChange: (tab: ExecutionWorkspaceTab) => void;
}) {
  return (
    <>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="text-xs font-medium uppercase tracking-widest text-muted-foreground">
            Execution workspace
          </div>
          <h1 className="truncate text-xl font-semibold sm:text-2xl">{workspaceName}</h1>
        </div>
        <WorkspaceRuntimeQuickControls
          sections={runtimeControlSections}
          isPending={isRuntimePending}
          pendingRequest={pendingRuntimeAction}
          onAction={onRuntimeAction}
        />
      </div>
      {runtimeActionErrorMessage ? <p className="text-sm text-destructive">{runtimeActionErrorMessage}</p> : null}
      {!runtimeActionErrorMessage && runtimeActionMessage ? <p className="text-sm text-muted-foreground">{runtimeActionMessage}</p> : null}

      <Tabs value={activeTab ?? "issues"} onValueChange={(value) => onTabChange(value as ExecutionWorkspaceTab)}>
        <PageTabBar
          items={[
            { value: "issues", label: "Issues" },
            { value: "services", label: "Services" },
            { value: "configuration", label: "Configuration" },
            { value: "runtime_logs", label: "Runtime logs" },
            { value: "routines", label: "Routines" },
          ]}
          align="start"
          value={activeTab ?? "issues"}
          onValueChange={(value) => onTabChange(value as ExecutionWorkspaceTab)}
        />
      </Tabs>
    </>
  );
}
