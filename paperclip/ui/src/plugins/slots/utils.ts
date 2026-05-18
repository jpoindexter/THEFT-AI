import type { PluginUiSlotType } from "@paperclipai/shared";
import type { PluginHostContext } from "../bridge";
import type { PluginSlotContext, ResolvedPluginSlot } from "./types";

/**
 * Returns the unique `routeSidebar` slot that pairs with a single `page` slot
 * for the given route, or `null` if no unambiguous pairing exists.
 *
 * Used to detect when a route is taken over by a plugin's full-page sidebar so
 * host chrome can be suppressed.
 */
export function resolveRouteSidebarSlot(
  slots: ResolvedPluginSlot[],
  routePath: string | null,
): ResolvedPluginSlot | null {
  if (!routePath) return null;

  const pageMatches = slots.filter((slot) => slot.type === "page" && slot.routePath === routePath);
  if (pageMatches.length !== 1) return null;

  const [pageSlot] = pageMatches;
  const sidebarMatches = slots.filter((slot) =>
    slot.type === "routeSidebar"
    && slot.routePath === routePath
    && slot.pluginId === pageSlot.pluginId,
  );

  if (sidebarMatches.length !== 1) return null;
  return sidebarMatches[0] ?? null;
}

export function requiresEntityType(slotType: PluginUiSlotType): boolean {
  return slotType === "detailTab"
    || slotType === "taskDetailView"
    || slotType === "contextMenuItem"
    || slotType === "commentAnnotation"
    || slotType === "commentContextMenuItem"
    || slotType === "projectSidebarItem"
    || slotType === "toolbarButton";
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "Unknown error";
}

/**
 * Maps the slot's `PluginSlotContext` to the full bridge host context.
 */
export function slotContextToHostContext(
  pluginSlotContext: PluginSlotContext,
  userId: string | null,
): PluginHostContext {
  return {
    companyId: pluginSlotContext.companyId ?? null,
    companyPrefix: pluginSlotContext.companyPrefix ?? null,
    projectId: pluginSlotContext.projectId ?? (pluginSlotContext.entityType === "project" ? pluginSlotContext.entityId ?? null : null),
    entityId: pluginSlotContext.entityId ?? null,
    entityType: pluginSlotContext.entityType ?? null,
    parentEntityId: pluginSlotContext.parentEntityId ?? null,
    userId,
    renderEnvironment: null,
  };
}
