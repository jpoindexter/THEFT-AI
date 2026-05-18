import { ActivitySquare, CheckCircle, ShieldAlert, XCircle } from "lucide-react";
import type { PluginHealthCheckResult } from "@/api/plugins";
import type { PluginRecord } from "@paperclipai/shared";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PluginStatusSidebar({
  plugin,
  pluginCapabilities,
  healthData,
  healthLoading,
  statusVariant,
  displayStatus,
}: {
  plugin: PluginRecord;
  pluginCapabilities: string[];
  healthData?: PluginHealthCheckResult;
  healthLoading: boolean;
  statusVariant: "default" | "destructive" | "secondary";
  displayStatus: string;
}) {
  return (
    <div className="space-y-6">
      <HealthStatusCard
        plugin={plugin}
        healthData={healthData}
        healthLoading={healthLoading}
        statusVariant={statusVariant}
        displayStatus={displayStatus}
      />
      <PluginDetailsCard plugin={plugin} />
      <PluginPermissionsCard pluginCapabilities={pluginCapabilities} />
    </div>
  );
}

function HealthStatusCard({
  plugin,
  healthData,
  healthLoading,
  statusVariant,
  displayStatus,
}: {
  plugin: PluginRecord;
  healthData?: PluginHealthCheckResult;
  healthLoading: boolean;
  statusVariant: "default" | "destructive" | "secondary";
  displayStatus: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <ActivitySquare className="h-4 w-4" />
          Health Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {healthLoading ? (
          <p className="text-sm text-muted-foreground">Checking health...</p>
        ) : healthData ? (
          <HealthChecks healthData={healthData} />
        ) : (
          <FallbackLifecycleStatus plugin={plugin} statusVariant={statusVariant} displayStatus={displayStatus} />
        )}
      </CardContent>
    </Card>
  );
}

function HealthChecks({ healthData }: { healthData: PluginHealthCheckResult }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <span className="text-muted-foreground">Overall</span>
        <Badge variant={healthData.healthy ? "default" : "destructive"}>{healthData.status}</Badge>
      </div>

      {healthData.checks.length > 0 ? (
        <div className="space-y-2 border-t border-border/50 pt-2">
          {healthData.checks.map((check, i) => (
            <div key={i} className="flex items-start justify-between gap-2">
              <span className="truncate text-muted-foreground" title={check.name}>{check.name}</span>
              {check.passed ? (
                <CheckCircle className="h-4 w-4 shrink-0 text-green-500" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-destructive" />
              )}
            </div>
          ))}
        </div>
      ) : null}

      {healthData.lastError ? (
        <div className="break-words rounded border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {healthData.lastError}
        </div>
      ) : null}
    </div>
  );
}

function FallbackLifecycleStatus({
  plugin,
  statusVariant,
  displayStatus,
}: {
  plugin: PluginRecord;
  statusVariant: "default" | "destructive" | "secondary";
  displayStatus: string;
}) {
  return (
    <div className="space-y-3 text-sm text-muted-foreground">
      <div className="flex items-center justify-between">
        <span>Lifecycle</span>
        <Badge variant={statusVariant}>{displayStatus}</Badge>
      </div>
      <p>Health checks run once the plugin is ready.</p>
      {plugin.lastError ? (
        <div className="break-words rounded border border-destructive/20 bg-destructive/10 p-2 text-xs text-destructive">
          {plugin.lastError}
        </div>
      ) : null}
    </div>
  );
}

function PluginDetailsCard({ plugin }: { plugin: PluginRecord }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Details</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <DetailRow label="Plugin ID" value={plugin.id} mono />
        <DetailRow label="Plugin Key" value={plugin.pluginKey} mono />
        <div className="flex justify-between gap-3">
          <span>NPM Package</span>
          <span className="max-w-44 truncate text-right text-xs" title={plugin.packageName}>
            {plugin.packageName}
          </span>
        </div>
        <DetailRow label="Version" value={`v${plugin.manifestJson.version ?? plugin.version}`} />
      </CardContent>
    </Card>
  );
}

function PluginPermissionsCard({ pluginCapabilities }: { pluginCapabilities: string[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-1.5 text-base">
          <ShieldAlert className="h-4 w-4" />
          Permissions
        </CardTitle>
      </CardHeader>
      <CardContent>
        {pluginCapabilities.length > 0 ? (
          <ul className="space-y-2 text-sm text-muted-foreground">
            {pluginCapabilities.map((cap) => (
              <li key={cap} className="rounded-md bg-muted/40 px-2.5 py-2 font-mono text-xs text-foreground/85">
                {cap}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm italic text-muted-foreground">No special permissions requested.</p>
        )}
      </CardContent>
    </Card>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span>{label}</span>
      <span className={`${mono ? "font-mono text-xs" : "text-foreground"} text-right`}>{value}</span>
    </div>
  );
}
