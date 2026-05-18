import { useEffect, useState, type ComponentType } from "react";
import type { PluginLauncherDeclaration } from "@paperclipai/shared";
import type { PluginUiContribution } from "@/api/plugins";
import {
  clearRegisteredPluginComponents,
  registerPluginReactComponent,
  registerPluginWebComponent,
} from "./registry";
import {
  _applyJsxRuntimeKeyForTests,
  _rewriteBareSpecifiersForTests,
  importPluginModule,
  resetShimBlobUrls,
} from "./module-shims";
import type { PluginSlotComponentProps } from "./types";

type PluginLoadState = "idle" | "loading" | "loaded" | "error";

/**
 * Tracks load state for each plugin's UI module by contribution cache key.
 */
const pluginLoadStates = new Map<string, PluginLoadState>();

/**
 * Promise cache to prevent concurrent duplicate imports for the same plugin.
 */
const inflightImports = new Map<string, Promise<void>>();

function buildPluginModuleKey(contribution: PluginUiContribution): string {
  const cacheHint = contribution.updatedAt ?? contribution.version ?? "0";
  return `${contribution.pluginId}:${cacheHint}`;
}

function buildPluginUiUrl(contribution: PluginUiContribution): string {
  const cacheHint = encodeURIComponent(contribution.updatedAt ?? contribution.version ?? "0");
  return `/_plugins/${encodeURIComponent(contribution.pluginId)}/ui/${contribution.uiEntryFile}?v=${cacheHint}`;
}

function isLauncherComponentTarget(launcher: PluginLauncherDeclaration): boolean {
  return launcher.action.type === "openModal"
    || launcher.action.type === "openDrawer"
    || launcher.action.type === "openPopover";
}

/**
 * Dynamically import a plugin's UI entry module and register declared exports.
 */
async function loadPluginModule(contribution: PluginUiContribution): Promise<void> {
  const { pluginId, pluginKey, slots, launchers } = contribution;
  const moduleKey = buildPluginModuleKey(contribution);

  const state = pluginLoadStates.get(moduleKey);
  if (state === "loaded" || state === "loading") {
    const inflight = inflightImports.get(pluginId);
    if (inflight) await inflight;
    return;
  }

  const running = inflightImports.get(pluginId);
  if (running) {
    await running;
    if (pluginLoadStates.get(moduleKey) === "loaded") return;
  }

  pluginLoadStates.set(moduleKey, "loading");
  const url = buildPluginUiUrl(contribution);

  const importPromise = (async () => {
    try {
      const mod: Record<string, unknown> = await importPluginModule(url);
      const declaredExports = new Set<string>();

      for (const slot of slots) {
        declaredExports.add(slot.exportName);
      }
      for (const launcher of launchers) {
        if (launcher.exportName) declaredExports.add(launcher.exportName);
        if (isLauncherComponentTarget(launcher)) declaredExports.add(launcher.action.target);
      }

      for (const exportName of declaredExports) {
        const exported = mod[exportName];
        if (exported === undefined) {
          console.warn(
            `Plugin "${pluginKey}" declares slot export "${exportName}" but the module does not export it.`,
          );
          continue;
        }

        if (typeof exported === "function") {
          registerPluginReactComponent(
            pluginKey,
            exportName,
            exported as ComponentType<PluginSlotComponentProps>,
          );
          continue;
        }

        if (typeof exported === "string") {
          registerPluginWebComponent(pluginKey, exportName, exported);
          continue;
        }

        console.warn(
          `Plugin "${pluginKey}" export "${exportName}" is neither a function nor a string tag name - skipping.`,
        );
      }

      pluginLoadStates.set(moduleKey, "loaded");
    } catch (err) {
      pluginLoadStates.set(moduleKey, "error");
      console.error(`Failed to load UI module for plugin "${pluginKey}"`, err);
    } finally {
      inflightImports.delete(pluginId);
    }
  })();

  inflightImports.set(pluginId, importPromise);
  await importPromise;
}

async function ensurePluginModulesLoaded(contributions: PluginUiContribution[]): Promise<void> {
  await Promise.all(contributions.map((contribution) => loadPluginModule(contribution)));
}

export async function ensurePluginContributionLoaded(
  contribution: PluginUiContribution,
): Promise<void> {
  await loadPluginModule(contribution);
}

export function getInflightPluginImport(pluginId: string): Promise<void> | undefined {
  return inflightImports.get(pluginId);
}

export function aggregatePluginLoadState(contributions: PluginUiContribution[]): "loading" | "loaded" {
  for (const contribution of contributions) {
    const state = pluginLoadStates.get(buildPluginModuleKey(contribution));
    if (state === "loading" || state === "idle" || state === undefined) return "loading";
  }
  return "loaded";
}

export function usePluginModuleLoader(contributions: PluginUiContribution[] | undefined) {
  const [, setTick] = useState(0);

  useEffect(() => {
    if (!contributions || contributions.length === 0) return;

    const unloaded = contributions.filter((contribution) => {
      const state = pluginLoadStates.get(buildPluginModuleKey(contribution));
      return state !== "loaded" && state !== "loading";
    });

    if (unloaded.length === 0) return;

    let cancelled = false;
    void ensurePluginModulesLoaded(unloaded).then(() => {
      if (!cancelled) setTick((tick) => tick + 1);
    });

    return () => {
      cancelled = true;
    };
  }, [contributions]);
}

/**
 * Reset the module loader state. Only use in tests.
 * @internal
 */
export function _resetPluginModuleLoader(): void {
  pluginLoadStates.clear();
  inflightImports.clear();
  clearRegisteredPluginComponents();
  resetShimBlobUrls();
}

export { _applyJsxRuntimeKeyForTests, _rewriteBareSpecifiersForTests };
