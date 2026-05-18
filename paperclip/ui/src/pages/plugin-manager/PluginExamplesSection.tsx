import type { PluginRecord } from "@paperclipai/shared";
import type { AvailablePluginExample } from "@/api/plugins";
import { Link } from "@/lib/router";
import { FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

type PluginExamplesSectionProps = {
  examples: AvailablePluginExample[];
  isLoading: boolean;
  hasError: boolean;
  installedByPackageName: Map<string, PluginRecord>;
  installPending: boolean;
  installingPackageName: string | undefined;
  installingIsLocalPath: boolean | undefined;
  onInstallExample: (example: AvailablePluginExample) => void;
  onEnable: (pluginId: string) => void;
  enablePending: boolean;
};

export function PluginExamplesSection({
  examples,
  isLoading,
  hasError,
  installedByPackageName,
  installPending,
  installingPackageName,
  installingIsLocalPath,
  onInstallExample,
  onEnable,
  enablePending,
}: PluginExamplesSectionProps) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <FlaskConical className="h-5 w-5 text-muted-foreground" />
        <h2 className="text-base font-semibold">Available Plugins</h2>
        <Badge variant="outline">Examples</Badge>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading bundled examples...</div>
      ) : hasError ? (
        <div className="text-sm text-destructive">Failed to load bundled examples.</div>
      ) : examples.length === 0 ? (
        <div className="rounded-md border border-dashed px-4 py-3 text-sm text-muted-foreground">
          No bundled example plugins were found in this checkout.
        </div>
      ) : (
        <ul className="divide-y rounded-md border bg-card">
          {examples.map((example) => {
            const installedPlugin = installedByPackageName.get(example.packageName);
            const isInstalling =
              installPending && installingIsLocalPath && installingPackageName === example.localPath;

            return (
              <li key={example.packageName}>
                <div className="flex items-center gap-4 px-4 py-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{example.displayName}</span>
                      <Badge variant="outline">Example</Badge>
                      {installedPlugin ? (
                        <Badge variant={installedPlugin.status === "ready" ? "default" : "secondary"}>
                          {installedPlugin.status}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Not installed</Badge>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{example.description}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{example.packageName}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    {installedPlugin ? (
                      <>
                        {installedPlugin.status !== "ready" ? (
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={enablePending}
                            onClick={() => onEnable(installedPlugin.id)}
                          >
                            Enable
                          </Button>
                        ) : null}
                        <Button variant="outline" size="sm" asChild>
                          <Link to={`/instance/settings/plugins/${installedPlugin.id}`}>
                            {installedPlugin.status === "ready" ? "Open Settings" : "Review"}
                          </Link>
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        disabled={isInstalling || installPending}
                        onClick={() => onInstallExample(example)}
                      >
                        {isInstalling ? "Installing..." : "Install Example"}
                      </Button>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
