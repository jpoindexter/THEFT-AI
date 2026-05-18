import type { PluginDashboardData, PluginHealthCheckResult } from "@/api/plugins";
import type { PluginRecord } from "@paperclipai/shared";

import { PluginRuntimeColumn, type PluginLogEntry } from "./PluginRuntimeDashboard";
import { PluginStatusSidebar } from "./PluginStatusSidebar";

export function PluginStatusTab({
  plugin,
  pluginCapabilities,
  dashboardData,
  recentLogs,
  healthData,
  healthLoading,
  statusVariant,
  displayStatus,
}: {
  plugin: PluginRecord;
  pluginCapabilities: string[];
  dashboardData?: PluginDashboardData | null;
  recentLogs?: PluginLogEntry[];
  healthData?: PluginHealthCheckResult;
  healthLoading: boolean;
  statusVariant: "default" | "destructive" | "secondary";
  displayStatus: string;
}) {
  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <div className="xl:col-span-2">
        <PluginRuntimeColumn dashboardData={dashboardData} recentLogs={recentLogs} />
      </div>
      <PluginStatusSidebar
        plugin={plugin}
        pluginCapabilities={pluginCapabilities}
        healthData={healthData}
        healthLoading={healthLoading}
        statusVariant={statusVariant}
        displayStatus={displayStatus}
      />
    </div>
  );
}
