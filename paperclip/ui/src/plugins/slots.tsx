/**
 * @fileoverview Plugin UI slot system public surface.
 *
 * The implementation is split into route-safe modules for:
 * - component registry
 * - dynamic ESM module loading
 * - slot discovery
 * - slot rendering
 *
 * @see PLUGIN_SPEC.md section 19 - UI Extension Model
 * @see PLUGIN_SPEC.md section 19.0.3 - Bundle Serving
 */
export type {
  PluginSlotComponentProps,
  PluginSlotContext,
  PluginSlotMountProps,
  PluginSlotOutletProps,
  RegisteredPluginComponent,
  ResolvedPluginSlot,
  SlotFilters,
  UsePluginSlotsResult,
} from "./slots/types";
export {
  registerPluginReactComponent,
  registerPluginWebComponent,
  resolveRegisteredPluginComponent,
} from "./slots/registry";
export {
  _applyJsxRuntimeKeyForTests,
  _resetPluginModuleLoader,
  _rewriteBareSpecifiersForTests,
  ensurePluginContributionLoaded,
} from "./slots/module-loader";
export { usePluginSlots } from "./slots/usePluginSlots";
export { PluginSlotMount } from "./slots/PluginSlotMount";
export { PluginSlotOutlet } from "./slots/PluginSlotOutlet";
export { resolveRouteSidebarSlot } from "./slots/utils";
