import type { PluginRecord } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { AlertTriangle, Power, Puzzle, Settings, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type InstalledPluginsSectionProps = {
  plugins: PluginRecord[];
  examplePackageNames: Set<string>;
  errorSummaryByPluginId: Map<string, string>;
  enablePending: boolean;
  disablePending: boolean;
  uninstallPending: boolean;
  onEnable: (pluginId: string) => void;
  onDisable: (pluginId: string) => void;
  onRequestUninstall: (plugin: PluginRecord) => void;
  onShowErrorDetails: (plugin: PluginRecord) => void;
};

export function InstalledPluginsSection({
  plugins,
  examplePackageNames,
  errorSummaryByPluginId,
  enablePending,
  disablePending,
  uninstallPending,
  onEnable,
  onDisable,
  onRequestUninstall,
  onShowErrorDetails,
}: InstalledPluginsSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Puzzle className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Installed Plugins</h2>
      </div>

      {!plugins.length ? (
        <Card className="bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-10">
            <Puzzle className="mb-4 h-10 w-10 text-muted-foreground" />
            <p className="text-sm font-medium">No plugins installed</p>
            <p className="mt-1 text-xs text-muted-foreground">Install a plugin to extend functionality.</p>
          </CardContent>
        </Card>
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {plugins.map((plugin) => (
            <li key={plugin.id}>
              <div className="flex items-start gap-4 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      to={`/instance/settings/plugins/${plugin.id}`}
                      className="block truncate font-medium hover:underline"
                      title={plugin.manifestJson.displayName ?? plugin.packageName}
                    >
                      {plugin.manifestJson.displayName ?? plugin.packageName}
                    </Link>
                    {examplePackageNames.has(plugin.packageName) ? <Badge variant="outline">Example</Badge> : null}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground" title={plugin.packageName}>
                    {plugin.packageName} · v{plugin.manifestJson.version ?? plugin.version}
                  </p>
                  <p className="mt-0.5 truncate text-sm text-muted-foreground" title={plugin.manifestJson.description}>
                    {plugin.manifestJson.description || "No description provided."}
                  </p>
                  {plugin.status === "error" ? (
                    <div className="mt-3 rounded-md border border-destructive/25 bg-destructive/5 px-3 py-2">
                      <div className="flex flex-wrap items-start gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 text-sm font-medium text-destructive">
                            <AlertTriangle className="h-4 w-4 shrink-0" />
                            <span>Plugin error</span>
                          </div>
                          <p className="mt-1 break-words text-sm text-destructive" title={plugin.lastError ?? undefined}>
                            {errorSummaryByPluginId.get(plugin.id)}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" onClick={() => onShowErrorDetails(plugin)}>
                          View full error
                        </Button>
                      </div>
                    </div>
                  ) : null}
                </div>
                <div className="flex shrink-0 self-center">
                  <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          plugin.status === "ready"
                            ? "default"
                            : plugin.status === "error"
                              ? "destructive"
                              : "secondary"
                        }
                        className="shrink-0"
                      >
                        {plugin.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="h-8 w-8"
                        title={plugin.status === "ready" ? "Disable" : "Enable"}
                        onClick={() => {
                          if (plugin.status === "ready") onDisable(plugin.id);
                          else onEnable(plugin.id);
                        }}
                        disabled={enablePending || disablePending}
                      >
                        <Power className={cn("h-4 w-4", plugin.status === "ready" ? "text-primary" : "")} />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon-sm"
                        className="h-8 w-8 text-destructive hover:text-destructive"
                        title="Uninstall"
                        onClick={() => onRequestUninstall(plugin)}
                        disabled={uninstallPending}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2 h-8" asChild>
                      <Link to={`/instance/settings/plugins/${plugin.id}`}>
                        <Settings className="h-4 w-4" />
                        Configure
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
