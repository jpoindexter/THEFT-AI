import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { PluginLauncherPlacementZone } from "@paperclipai/shared";
import { pluginsApi, type PluginUiContribution } from "@/api/plugins";
import { queryKeys } from "@/lib/queryKeys";
import { entityScopedZones, getErrorMessage } from "./utils";
import type { ResolvedPluginLauncher, UsePluginLaunchersFilters, UsePluginLaunchersResult } from "./types";

export function usePluginLaunchers(
  filters: UsePluginLaunchersFilters,
): UsePluginLaunchersResult {
  const queryEnabled = filters.enabled ?? true;
  const { data, isLoading, error } = useQuery({
    queryKey: queryKeys.plugins.uiContributions,
    queryFn: () => pluginsApi.listUiContributions(),
    enabled: queryEnabled,
  });

  const placementZonesKey = useMemo(
    () => [...filters.placementZones].sort().join("|"),
    [filters.placementZones],
  );

  const contributionsByPluginId = useMemo(() => {
    const byPluginId = new Map<string, PluginUiContribution>();
    for (const contribution of data ?? []) {
      byPluginId.set(contribution.pluginId, contribution);
    }
    return byPluginId;
  }, [data]);

  const launchers = useMemo(() => {
    const placementZones = new Set(
      placementZonesKey.split("|").filter(Boolean) as PluginLauncherPlacementZone[],
    );
    const rows: ResolvedPluginLauncher[] = [];
    for (const contribution of data ?? []) {
      for (const launcher of contribution.launchers) {
        if (!placementZones.has(launcher.placementZone)) continue;
        if (entityScopedZones.has(launcher.placementZone)) {
          if (!filters.entityType) continue;
          if (!launcher.entityTypes?.includes(filters.entityType)) continue;
        }
        rows.push({
          ...launcher,
          pluginId: contribution.pluginId,
          pluginKey: contribution.pluginKey,
          pluginDisplayName: contribution.displayName,
          pluginVersion: contribution.version,
          uiEntryFile: contribution.uiEntryFile,
        });
      }
    }

    rows.sort((a, b) => {
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      const pluginCmp = a.pluginDisplayName.localeCompare(b.pluginDisplayName);
      if (pluginCmp !== 0) return pluginCmp;
      return a.displayName.localeCompare(b.displayName);
    });

    return rows;
  }, [data, filters.entityType, placementZonesKey]);

  return {
    launchers,
    contributionsByPluginId,
    isLoading: queryEnabled && isLoading,
    errorMessage: error ? getErrorMessage(error) : null,
  };
}
