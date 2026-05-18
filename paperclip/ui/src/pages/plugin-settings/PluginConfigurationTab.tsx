import type { PluginRecord } from "@paperclipai/shared";

import { PluginSlotMount } from "@/plugins/slots";
import type { ResolvedPluginSlot } from "@/plugins/slots/types";
import { Link } from "@/lib/router";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { JsonSchemaNode } from "@/components/JsonSchemaForm";

import { PluginConfigForm } from "./PluginConfigForm";
import { PluginLocalFoldersSettings } from "./PluginLocalFoldersSettings";

interface PluginConfigurationTabProps {
  plugin: PluginRecord;
  pluginId: string;
  companyId: string | null;
  companyPrefix?: string | null;
  configSchema?: JsonSchemaNode;
  initialConfig?: Record<string, unknown>;
  configLoading?: boolean;
  pluginSlots: ResolvedPluginSlot[];
}

export function PluginConfigurationTab({
  plugin,
  pluginId,
  companyId,
  companyPrefix,
  configSchema,
  initialConfig,
  configLoading,
  pluginSlots,
}: PluginConfigurationTabProps) {
  const pluginDescription = plugin.manifestJson.description || "No description provided.";
  const environmentDrivers = plugin.manifestJson.environmentDrivers ?? [];
  const localFolderDeclarations = plugin.manifestJson.localFolders ?? [];
  const hasLocalFolders = localFolderDeclarations.length > 0;
  const hasConfigSchema = Boolean(configSchema?.properties && Object.keys(configSchema.properties).length > 0);
  const hasCustomSettingsPage = pluginSlots.length > 0;
  const environmentDriverNames = environmentDrivers
    .map((driver) => driver.displayName?.trim() || driver.driverKey)
    .filter((name, index, values) => values.indexOf(name) === index);

  return (
    <div className="space-y-8">
      <section className="space-y-5">
        <h2 className="text-base font-semibold">About</h2>
        <div className="grid gap-8 lg:grid-cols-3">
          <div className="space-y-2 lg:col-span-2">
            <h3 className="text-sm font-medium text-muted-foreground">Description</h3>
            <p className="text-sm leading-6 text-foreground/90">{pluginDescription}</p>
          </div>
          <PluginMetadata plugin={plugin} />
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-base font-semibold">Settings</h2>
        </div>
        {hasLocalFolders ? (
          <PluginLocalFoldersSettings
            pluginId={pluginId}
            companyId={companyId}
            declarations={localFolderDeclarations}
          />
        ) : null}
        <PluginSettingsBody
          plugin={plugin}
          pluginId={pluginId}
          companyId={companyId}
          companyPrefix={companyPrefix}
          configSchema={configSchema}
          initialConfig={initialConfig}
          configLoading={configLoading}
          pluginSlots={pluginSlots}
          hasConfigSchema={hasConfigSchema}
          hasCustomSettingsPage={hasCustomSettingsPage}
          hasLocalFolders={hasLocalFolders}
          driverLabel={environmentDriverNames.join(", ")}
          hasEnvironmentDrivers={environmentDrivers.length > 0}
        />
      </section>
    </div>
  );
}

function PluginMetadata({ plugin }: { plugin: PluginRecord }) {
  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-1.5">
        <h3 className="font-medium text-muted-foreground">Author</h3>
        <p className="text-foreground">{plugin.manifestJson.author}</p>
      </div>
      <div className="space-y-2">
        <h3 className="font-medium text-muted-foreground">Categories</h3>
        <div className="flex flex-wrap gap-2">
          {plugin.categories.length > 0 ? (
            plugin.categories.map((category) => (
              <Badge key={category} variant="outline" className="capitalize">
                {category}
              </Badge>
            ))
          ) : (
            <span className="text-foreground">None</span>
          )}
        </div>
      </div>
    </div>
  );
}

function PluginSettingsBody({
  plugin,
  pluginId,
  companyId,
  companyPrefix,
  configSchema,
  initialConfig,
  configLoading,
  pluginSlots,
  hasConfigSchema,
  hasCustomSettingsPage,
  hasLocalFolders,
  hasEnvironmentDrivers,
  driverLabel,
}: PluginConfigurationTabProps & {
  hasConfigSchema: boolean;
  hasCustomSettingsPage: boolean;
  hasLocalFolders: boolean;
  hasEnvironmentDrivers: boolean;
  driverLabel: string;
}) {
  if (hasCustomSettingsPage) {
    return (
      <div className="space-y-3">
        {pluginSlots.map((slot) => (
          <PluginSlotMount
            key={`${slot.pluginKey}:${slot.id}`}
            slot={slot}
            context={{
              companyId,
              companyPrefix: companyPrefix ?? null,
            }}
            missingBehavior="placeholder"
          />
        ))}
      </div>
    );
  }

  if (hasConfigSchema && configSchema) {
    return (
      <PluginConfigForm
        pluginId={pluginId}
        schema={configSchema}
        initialValues={initialConfig}
        isLoading={configLoading}
        pluginStatus={plugin.status}
        supportsConfigTest={(plugin as unknown as { supportsConfigTest?: boolean }).supportsConfigTest === true}
      />
    );
  }

  if (hasEnvironmentDrivers) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/20 px-4 py-3 text-sm">
        <p className="font-medium text-foreground">Configure this plugin from Company Environments.</p>
        <p className="mt-1 text-muted-foreground">
          {driverLabel || "This plugin"} registers environment runtime settings there so credentials stay
          company-scoped instead of instance-global.
        </p>
        <div className="mt-3">
          <Link to="/company/settings/environments">
            <Button variant="outline" size="sm">Open Company Environments</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!hasLocalFolders) {
    return <p className="text-sm text-muted-foreground">This plugin does not require any settings.</p>;
  }

  return null;
}
