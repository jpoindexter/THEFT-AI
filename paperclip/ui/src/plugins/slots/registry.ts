import type { ComponentType } from "react";
import type {
  PluginSlotComponentProps,
  RegisteredPluginComponent,
  ResolvedPluginSlot,
} from "./types";

/**
 * In-memory registry for plugin UI exports loaded by the host page.
 * Keys are `${pluginKey}:${exportName}` to match manifest slot declarations.
 */
const registry = new Map<string, RegisteredPluginComponent>();

function buildRegistryKey(pluginKey: string, exportName: string): string {
  return `${pluginKey}:${exportName}`;
}

/**
 * Registers a React component export for a plugin UI slot.
 */
export function registerPluginReactComponent(
  pluginKey: string,
  exportName: string,
  component: ComponentType<PluginSlotComponentProps>,
): void {
  registry.set(buildRegistryKey(pluginKey, exportName), {
    kind: "react",
    component,
  });
}

/**
 * Registers a custom element tag for a plugin UI slot.
 */
export function registerPluginWebComponent(
  pluginKey: string,
  exportName: string,
  tagName: string,
): void {
  registry.set(buildRegistryKey(pluginKey, exportName), {
    kind: "web-component",
    tagName,
  });
}

export function resolveRegisteredComponent(slot: ResolvedPluginSlot): RegisteredPluginComponent | null {
  return registry.get(buildRegistryKey(slot.pluginKey, slot.exportName)) ?? null;
}

export function resolveRegisteredPluginComponent(
  pluginKey: string,
  exportName: string,
): RegisteredPluginComponent | null {
  return registry.get(buildRegistryKey(pluginKey, exportName)) ?? null;
}

export function clearRegisteredPluginComponents(): void {
  registry.clear();
}
