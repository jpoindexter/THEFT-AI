import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Puzzle } from "lucide-react";

import { pluginsApi } from "@/api/plugins";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { PageTabBar } from "@/components/PageTabBar";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import type { JsonSchemaNode } from "@/components/JsonSchemaForm";
import { Link, Navigate, useParams } from "@/lib/router";
import { queryKeys } from "@/lib/queryKeys";
import { usePluginSlots } from "@/plugins/slots";

import { PluginConfigurationTab } from "./plugin-settings/PluginConfigurationTab";
import { PluginStatusTab } from "./plugin-settings/PluginStatusTab";

type PluginSettingsTab = "configuration" | "status";

/**
 * Detailed settings and diagnostics page for a single installed plugin.
 * Runtime and form sections live in `plugin-settings/*`; this page owns route
 * params, queries, breadcrumbs, and high-level tab composition.
 */
export function PluginSettings() {
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { companyPrefix, pluginId } = useParams<{ companyPrefix?: string; pluginId: string }>();
  const [activeTab, setActiveTab] = useState<PluginSettingsTab>("configuration");

  const { data: plugin, isLoading: pluginLoading } = useQuery({
    queryKey: queryKeys.plugins.detail(pluginId!),
    queryFn: () => pluginsApi.get(pluginId!),
    enabled: !!pluginId,
  });

  const { data: healthData, isLoading: healthLoading } = useQuery({
    queryKey: queryKeys.plugins.health(pluginId!),
    queryFn: () => pluginsApi.health(pluginId!),
    enabled: !!pluginId && plugin?.status === "ready",
    refetchInterval: 30000,
  });

  const { data: dashboardData } = useQuery({
    queryKey: queryKeys.plugins.dashboard(pluginId!),
    queryFn: () => pluginsApi.dashboard(pluginId!),
    enabled: !!pluginId,
    refetchInterval: 30000,
  });

  const { data: recentLogs } = useQuery({
    queryKey: queryKeys.plugins.logs(pluginId!),
    queryFn: () => pluginsApi.logs(pluginId!, { limit: 50 }),
    enabled: !!pluginId && plugin?.status === "ready",
    refetchInterval: 30000,
  });

  const configSchema = plugin?.manifestJson?.instanceConfigSchema as JsonSchemaNode | undefined;
  const hasConfigSchema = configSchema?.properties && Object.keys(configSchema.properties).length > 0;
  const { data: configData, isLoading: configLoading } = useQuery({
    queryKey: queryKeys.plugins.config(pluginId!),
    queryFn: () => pluginsApi.getConfig(pluginId!),
    enabled: !!pluginId && !!hasConfigSchema,
  });

  const { slots } = usePluginSlots({
    slotTypes: ["settingsPage"],
    companyId: selectedCompanyId,
    enabled: !!selectedCompanyId,
  });
  const pluginSlots = slots.filter((slot) => slot.pluginId === pluginId);

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: "Settings", href: "/instance/settings/heartbeats" },
      { label: "Plugins", href: "/instance/settings/plugins" },
      { label: plugin?.manifestJson?.displayName ?? plugin?.packageName ?? "Plugin Details" },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs, plugin]);

  useEffect(() => {
    setActiveTab("configuration");
  }, [pluginId]);

  if (pluginLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading plugin details...</div>;
  }

  if (!plugin) {
    return <Navigate to="/instance/settings/plugins" replace />;
  }

  const displayStatus = plugin.status;
  const statusVariant =
    plugin.status === "ready"
      ? "default"
      : plugin.status === "error"
        ? "destructive"
        : "secondary";
  const pluginCapabilities = plugin.manifestJson.capabilities ?? [];

  return (
    <div className="max-w-5xl space-y-6">
      <PluginSettingsHeader plugin={plugin} statusVariant={statusVariant} displayStatus={displayStatus} />

      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as PluginSettingsTab)} className="space-y-6">
        <PageTabBar
          align="start"
          items={[
            { value: "configuration", label: "Configuration" },
            { value: "status", label: "Status" },
          ]}
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as PluginSettingsTab)}
        />

        <TabsContent value="configuration" className="space-y-6">
          <PluginConfigurationTab
            plugin={plugin}
            pluginId={pluginId!}
            companyId={selectedCompanyId}
            companyPrefix={companyPrefix ?? null}
            configSchema={configSchema}
            initialConfig={configData?.configJson}
            configLoading={configLoading}
            pluginSlots={pluginSlots}
          />
        </TabsContent>

        <TabsContent value="status" className="space-y-6">
          <PluginStatusTab
            plugin={plugin}
            pluginCapabilities={pluginCapabilities}
            dashboardData={dashboardData}
            recentLogs={recentLogs}
            healthData={healthData}
            healthLoading={healthLoading}
            statusVariant={statusVariant}
            displayStatus={displayStatus}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PluginSettingsHeader({
  plugin,
  statusVariant,
  displayStatus,
}: {
  plugin: Awaited<ReturnType<typeof pluginsApi.get>>;
  statusVariant: "default" | "destructive" | "secondary";
  displayStatus: string;
}) {
  return (
    <div className="flex items-center gap-4">
      <Link to="/instance/settings/plugins">
        <Button variant="outline" size="icon" className="h-8 w-8">
          <ArrowLeft className="h-4 w-4" />
        </Button>
      </Link>
      <div className="flex items-center gap-2">
        <Puzzle className="h-6 w-6 text-muted-foreground" />
        <h1 className="text-xl font-semibold">{plugin.manifestJson.displayName ?? plugin.packageName}</h1>
        <Badge variant={statusVariant} className="ml-2">{displayStatus}</Badge>
        <Badge variant="outline" className="ml-1">v{plugin.manifestJson.version ?? plugin.version}</Badge>
      </div>
    </div>
  );
}
