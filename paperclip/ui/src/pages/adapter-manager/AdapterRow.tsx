import { Download, FolderOpen, Package, Power, RefreshCw, Trash2 } from "lucide-react";
import type { AdapterInfo } from "@/api/adapters";
import { getAdapterLabel } from "@/adapters/adapter-display-registry";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AdapterRowProps = {
  adapter: AdapterInfo;
  canRemove: boolean;
  onToggle: (type: string, disabled: boolean) => void;
  onRemove: (type: string) => void;
  onReload?: (type: string) => void;
  onReinstall?: (type: string) => void;
  isToggling: boolean;
  isReloading?: boolean;
  isReinstalling?: boolean;
  overriddenBy?: string;
  toggleTitleEnabled?: string;
  toggleTitleDisabled?: string;
  disabledBadgeLabel?: string;
};

export function AdapterRow({
  adapter,
  canRemove,
  onToggle,
  onRemove,
  onReload,
  onReinstall,
  isToggling,
  isReloading,
  isReinstalling,
  overriddenBy,
  toggleTitleEnabled,
  toggleTitleDisabled,
  disabledBadgeLabel,
}: AdapterRowProps) {
  return (
    <li>
      <div className="flex items-center gap-4 px-4 py-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("font-medium", adapter.disabled && "text-muted-foreground line-through")}>
              {adapter.label || getAdapterLabel(adapter.type)}
            </span>
            <Badge variant="outline">{adapter.source === "external" ? "External" : "Built-in"}</Badge>
            {adapter.source === "external" && (
              <span title={adapter.isLocalPath ? "Installed from local path" : "Installed from npm"}>
                {adapter.isLocalPath ? (
                  <FolderOpen className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Package className="h-4 w-4 text-muted-foreground" />
                )}
              </span>
            )}
            {adapter.version && (
              <Badge variant="secondary" className="font-mono text-nano">
                v{adapter.version}
              </Badge>
            )}
            {adapter.overriddenBuiltin && <Badge variant="secondary">Overrides built-in</Badge>}
            {overriddenBy && <Badge variant="secondary">Overridden by {overriddenBy}</Badge>}
            {adapter.disabled && (
              <Badge variant="secondary">
                {disabledBadgeLabel ?? "Hidden from menus"}
              </Badge>
            )}
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {adapter.type}
            {adapter.packageName && adapter.packageName !== adapter.type && <> · {adapter.packageName}</>}
            {" · "}{adapter.modelsCount} models
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onReinstall && (
            <Button
              variant="outline"
              size="icon-sm"
              title="Reinstall adapter (pull latest from npm)"
              disabled={isReinstalling}
              onClick={() => onReinstall(adapter.type)}
            >
              <Download className={cn("h-4 w-4", isReinstalling && "animate-bounce")} />
            </Button>
          )}
          {onReload && (
            <Button
              variant="outline"
              size="icon-sm"
              title="Reload adapter (hot-swap)"
              disabled={isReloading}
              onClick={() => onReload(adapter.type)}
            >
              <RefreshCw className={cn("h-4 w-4", isReloading && "animate-spin")} />
            </Button>
          )}
          <Button
            variant="outline"
            size="icon-sm"
            title={adapter.disabled
              ? (toggleTitleEnabled ?? "Show in agent menus")
              : (toggleTitleDisabled ?? "Hide from agent menus")}
            disabled={isToggling}
            onClick={() => onToggle(adapter.type, !adapter.disabled)}
          >
            <Power className={cn("h-4 w-4", adapter.disabled ? "text-muted-foreground" : "text-foreground")} />
          </Button>
          {canRemove && (
            <Button
              variant="outline"
              size="icon-sm"
              className="text-destructive hover:text-destructive"
              title="Remove adapter"
              onClick={() => onRemove(adapter.type)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </li>
  );
}
