import type {
  PluginLauncherDeclaration,
  PluginUiSlotDeclaration,
  PluginLocalFolderDeclaration,
} from "@paperclipai/shared";

/**
 * Normalized UI contribution record returned by `GET /api/plugins/ui-contributions`.
 *
 * Only populated for plugins in `ready` state that declare at least one UI slot
 * or launcher. The `slots` array is sourced from `manifest.ui.slots`. The
 * `launchers` array aggregates both legacy `manifest.launchers` and
 * `manifest.ui.launchers`.
 */
export type PluginUiContribution = {
  pluginId: string;
  pluginKey: string;
  displayName: string;
  version: string;
  updatedAt?: string;
  /**
   * Relative filename of the UI entry module within the plugin's UI directory.
   * The host constructs the full import URL as
   * `/_plugins/${pluginId}/ui/${uiEntryFile}`.
   */
  uiEntryFile: string;
  slots: PluginUiSlotDeclaration[];
  launchers: PluginLauncherDeclaration[];
};

/**
 * Health check result returned by `GET /api/plugins/:pluginId/health`.
 *
 * The `healthy` flag summarises whether all checks passed. Individual check
 * results are available in `checks` for detailed diagnostics display.
 */
export interface PluginHealthCheckResult {
  pluginId: string;
  /** The plugin's current lifecycle status at time of check. */
  status: string;
  /** True if all health checks passed. */
  healthy: boolean;
  /** Individual diagnostic check results. */
  checks: Array<{
    name: string;
    passed: boolean;
    /** Human-readable description of a failure, if any. */
    message?: string;
  }>;
  /** The most recent error message if the plugin is in `error` state. */
  lastError?: string;
}

/**
 * Worker diagnostics returned as part of the dashboard response.
 */
export interface PluginWorkerDiagnostics {
  status: string;
  pid: number | null;
  uptime: number | null;
  consecutiveCrashes: number;
  totalCrashes: number;
  pendingRequests: number;
  lastCrashAt: number | null;
  nextRestartAt: number | null;
}

/**
 * A recent job run entry returned in the dashboard response.
 */
export interface PluginDashboardJobRun {
  id: string;
  jobId: string;
  jobKey?: string;
  trigger: string;
  status: string;
  durationMs: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

/**
 * A recent webhook delivery entry returned in the dashboard response.
 */
export interface PluginDashboardWebhookDelivery {
  id: string;
  webhookKey: string;
  status: string;
  durationMs: number | null;
  error: string | null;
  startedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

/**
 * Aggregated health dashboard data returned by `GET /api/plugins/:pluginId/dashboard`.
 *
 * Contains worker diagnostics, recent job runs, recent webhook deliveries,
 * and the current health check result in a single response.
 */
export interface PluginDashboardData {
  pluginId: string;
  /** Worker process diagnostics, or null if no worker is registered. */
  worker: PluginWorkerDiagnostics | null;
  /** Recent job execution history (newest first, max 10). */
  recentJobRuns: PluginDashboardJobRun[];
  /** Recent inbound webhook deliveries (newest first, max 10). */
  recentWebhookDeliveries: PluginDashboardWebhookDelivery[];
  /** Current health check results. */
  health: PluginHealthCheckResult;
  /** ISO 8601 timestamp when the dashboard data was generated. */
  checkedAt: string;
}

export interface AvailablePluginExample {
  packageName: string;
  pluginKey: string;
  displayName: string;
  description: string;
  localPath: string;
  tag: "example";
}

export interface PluginLocalFolderProblem {
  code:
    | "not_configured"
    | "not_absolute"
    | "missing"
    | "not_directory"
    | "not_readable"
    | "not_writable"
    | "missing_directory"
    | "missing_file"
    | "path_traversal"
    | "symlink_escape"
    | "atomic_write_failed";
  message: string;
  path?: string;
}

export interface PluginLocalFolderStatus {
  folderKey: string;
  configured: boolean;
  path: string | null;
  realPath: string | null;
  access: "read" | "readWrite";
  readable: boolean;
  writable: boolean;
  requiredDirectories: string[];
  requiredFiles: string[];
  missingDirectories: string[];
  missingFiles: string[];
  healthy: boolean;
  problems: PluginLocalFolderProblem[];
  checkedAt: string;
}

export interface PluginLocalFoldersResponse {
  pluginId: string;
  companyId: string;
  declarations: PluginLocalFolderDeclaration[];
  folders: PluginLocalFolderStatus[];
}

export interface PluginLocalFolderSaveInput {
  path: string;
  access?: "read" | "readWrite";
  requiredDirectories?: string[];
  requiredFiles?: string[];
}
