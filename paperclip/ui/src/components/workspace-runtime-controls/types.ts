import type { WorkspaceRuntimeControlTarget } from "@paperclipai/shared";

export type WorkspaceRuntimeAction = "start" | "stop" | "restart" | "run";

export type WorkspaceRuntimeControlRequest = WorkspaceRuntimeControlTarget & {
  action: WorkspaceRuntimeAction;
};

export type WorkspaceRuntimeControlItem = {
  key: string;
  title: string;
  kind: "service" | "job";
  statusLabel: string;
  lifecycle: "shared" | "ephemeral" | null;
  healthStatus: "unknown" | "healthy" | "unhealthy" | null;
  command: string | null;
  cwd: string | null;
  port: number | null;
  url: string | null;
  canStart: boolean;
  canRun: boolean;
  workspaceCommandId?: string | null;
  runtimeServiceId?: string | null;
  serviceIndex?: number | null;
  disabledReason?: string | null;
};

export type WorkspaceRuntimeControlSections = {
  services: WorkspaceRuntimeControlItem[];
  jobs: WorkspaceRuntimeControlItem[];
  otherServices: WorkspaceRuntimeControlItem[];
};
