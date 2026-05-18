/**
 * @fileoverview Plugin Manager page — admin UI for discovering,
 * installing, enabling/disabling, and uninstalling plugins.
 *
 * @see PLUGIN_SPEC.md §9 — Plugin Marketplace / Manager
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { PluginRecord } from "@paperclipai/shared";
import { AlertTriangle, Puzzle } from "lucide-react";
import { useCompany } from "@/context/CompanyContext";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { pluginsApi } from "@/api/plugins";
import { queryKeys } from "@/lib/queryKeys";
import { useToastActions } from "@/context/ToastContext";
import { InstallPluginDialog } from "./plugin-manager/InstallPluginDialog";
import { InstalledPluginsSection } from "./plugin-manager/InstalledPluginsSection";
import { PluginErrorDetailsDialog, UninstallPluginDialog } from "./plugin-manager/PluginManagerDialogs";
import { PluginExamplesSection } from "./plugin-manager/PluginExamplesSection";
import { getPluginErrorSummary } from "./plugin-manager/pluginManagerModel";

/**
 * PluginManager page component.
 *
 * Provides a management UI for the Paperclip plugin system:
 * - Lists all installed plugins with their status, version, and category badges.
 * - Allows installing new plugins by npm package name.
 * - Provides per-plugin actions: enable, disable, navigate to settings.
 * - Uninstall with a two-step confirmation dialog to prevent accidental removal.
 *
 * Data flow:
 * - Reads from `GET /api/plugins` via `pluginsApi.list()`.
 * - Mutations (install / uninstall / enable / disable) invalidate
 *   `queryKeys.plugins.all` so the list refreshes automatically.
 *
 * @see PluginSettings — linked from the Settings icon on each plugin row.
 * @see doc/plugins/PLUGIN_SPEC.md §3 — Plugin Lifecycle for status semantics.
 */
export function PluginManager() {
  const { selectedCompany } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const [installPackage, setInstallPackage] = useState("");
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [uninstallPluginId, setUninstallPluginId] = useState<string | null>(null);
  const [uninstallPluginName, setUninstallPluginName] = useState<string>("");
  const [errorDetailsPlugin, setErrorDetailsPlugin] = useState<PluginRecord | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: "Settings", href: "/instance/settings/heartbeats" },
      { label: "Plugins" },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs]);

  const { data: plugins, isLoading, error } = useQuery({
    queryKey: queryKeys.plugins.all,
    queryFn: () => pluginsApi.list(),
  });

  const examplesQuery = useQuery({
    queryKey: queryKeys.plugins.examples,
    queryFn: () => pluginsApi.listExamples(),
  });

  const invalidatePluginQueries = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.plugins.all });
    queryClient.invalidateQueries({ queryKey: queryKeys.plugins.examples });
    queryClient.invalidateQueries({ queryKey: queryKeys.plugins.uiContributions });
  };

  const installMutation = useMutation({
    mutationFn: (params: { packageName: string; version?: string; isLocalPath?: boolean }) =>
      pluginsApi.install(params),
    onSuccess: () => {
      invalidatePluginQueries();
      setInstallDialogOpen(false);
      setInstallPackage("");
      pushToast({ title: "Plugin installed successfully", tone: "success" });
    },
    onError: (err: Error) => {
      pushToast({ title: "Failed to install plugin", body: err.message, tone: "error" });
    },
  });

  const uninstallMutation = useMutation({
    mutationFn: (pluginId: string) => pluginsApi.uninstall(pluginId),
    onSuccess: () => {
      invalidatePluginQueries();
      pushToast({ title: "Plugin uninstalled successfully", tone: "success" });
    },
    onError: (err: Error) => {
      pushToast({ title: "Failed to uninstall plugin", body: err.message, tone: "error" });
    },
  });

  const enableMutation = useMutation({
    mutationFn: (pluginId: string) => pluginsApi.enable(pluginId),
    onSuccess: () => {
      invalidatePluginQueries();
      pushToast({ title: "Plugin enabled", tone: "success" });
    },
    onError: (err: Error) => {
      pushToast({ title: "Failed to enable plugin", body: err.message, tone: "error" });
    },
  });

  const disableMutation = useMutation({
    mutationFn: (pluginId: string) => pluginsApi.disable(pluginId),
    onSuccess: () => {
      invalidatePluginQueries();
      pushToast({ title: "Plugin disabled", tone: "info" });
    },
    onError: (err: Error) => {
      pushToast({ title: "Failed to disable plugin", body: err.message, tone: "error" });
    },
  });

  const installedPlugins = plugins ?? [];
  const examples = examplesQuery.data ?? [];
  const installedByPackageName = new Map(installedPlugins.map((plugin) => [plugin.packageName, plugin]));
  const examplePackageNames = new Set(examples.map((example) => example.packageName));
  const errorSummaryByPluginId = useMemo(
    () =>
      new Map(
        installedPlugins.map((plugin) => [plugin.id, getPluginErrorSummary(plugin)])
      ),
    [installedPlugins]
  );

  if (isLoading) return <div className="p-4 text-sm text-muted-foreground">Loading plugins...</div>;
  if (error) return <div className="p-4 text-sm text-destructive">Failed to load plugins.</div>;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Puzzle className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Plugin Manager</h1>
        </div>

        <InstallPluginDialog
          open={installDialogOpen}
          packageName={installPackage}
          isPending={installMutation.isPending}
          onOpenChange={setInstallDialogOpen}
          onPackageNameChange={setInstallPackage}
          onInstall={() => installMutation.mutate({ packageName: installPackage })}
        />
      </div>

      <div className="rounded-lg border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          <div className="space-y-1 text-sm">
            <p className="font-medium text-foreground">Plugins are alpha.</p>
            <p className="text-muted-foreground">
              The plugin runtime and API surface are still changing. Expect breaking changes while this feature settles.
            </p>
          </div>
        </div>
      </div>

      <PluginExamplesSection
        examples={examples}
        isLoading={examplesQuery.isLoading}
        hasError={Boolean(examplesQuery.error)}
        installedByPackageName={installedByPackageName}
        installPending={installMutation.isPending}
        installingPackageName={installMutation.variables?.packageName}
        installingIsLocalPath={installMutation.variables?.isLocalPath}
        onInstallExample={(example) =>
          installMutation.mutate({
            packageName: example.localPath,
            isLocalPath: true,
          })
        }
        onEnable={(pluginId) => enableMutation.mutate(pluginId)}
        enablePending={enableMutation.isPending}
      />

      <InstalledPluginsSection
        plugins={installedPlugins}
        examplePackageNames={examplePackageNames}
        errorSummaryByPluginId={errorSummaryByPluginId}
        enablePending={enableMutation.isPending}
        disablePending={disableMutation.isPending}
        uninstallPending={uninstallMutation.isPending}
        onEnable={(pluginId) => enableMutation.mutate(pluginId)}
        onDisable={(pluginId) => disableMutation.mutate(pluginId)}
        onRequestUninstall={(plugin) => {
          setUninstallPluginId(plugin.id);
          setUninstallPluginName(plugin.manifestJson.displayName ?? plugin.packageName);
        }}
        onShowErrorDetails={setErrorDetailsPlugin}
      />

      <UninstallPluginDialog
        pluginId={uninstallPluginId}
        pluginName={uninstallPluginName}
        isPending={uninstallMutation.isPending}
        onOpenChange={(open) => {
          if (!open) setUninstallPluginId(null);
        }}
        onConfirm={() => {
          if (!uninstallPluginId) return;
          uninstallMutation.mutate(uninstallPluginId, {
            onSettled: () => setUninstallPluginId(null),
          });
        }}
      />

      <PluginErrorDetailsDialog
        plugin={errorDetailsPlugin}
        onOpenChange={(open) => {
          if (!open) setErrorDetailsPlugin(null);
        }}
      />
    </div>
  );
}
