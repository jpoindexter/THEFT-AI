/**
 * Plugin bridge initialization.
 *
 * Registers the host's React instances and bridge hook implementations
 * on a global object so that the plugin module loader can inject them
 * into plugin UI bundles at load time.
 *
 * Call `initPluginBridge()` once during app startup (in `main.tsx`), before
 * any plugin UI modules are loaded.
 *
 * @see PLUGIN_SPEC.md §19.0.1 — Plugin UI SDK
 * @see PLUGIN_SPEC.md §19.0.2 — Bundle Isolation
 */

import { ManagedRoutinesList as HostManagedRoutinesList } from "@/components/ManagedRoutinesList";

import {
  usePluginData,
  usePluginAction,
  useHostContext,
  useHostLocation,
  useHostNavigation,
  usePluginStream,
  usePluginToast,
} from "./bridge.js";
import { PluginSdkAssigneePicker, PluginSdkProjectPicker } from "./bridge-entity-pickers";
import {
  PluginSdkFileTree,
  PluginSdkMarkdownBlock,
  PluginSdkMarkdownEditor,
} from "./bridge-file-markdown";
import { PluginSdkIssuesList } from "./bridge-issues-list";

export interface PluginBridgeRegistry {
  react: unknown;
  reactDom: unknown;
  sdkUi: Record<string, unknown>;
}

declare global {
  // eslint-disable-next-line no-var
  var __paperclipPluginBridge__: PluginBridgeRegistry | undefined;
}

export function initPluginBridge(
  react: typeof import("react"),
  reactDom: typeof import("react-dom"),
): void {
  globalThis.__paperclipPluginBridge__ = {
    react,
    reactDom,
    sdkUi: {
      usePluginData,
      usePluginAction,
      useHostContext,
      useHostLocation,
      useHostNavigation,
      usePluginStream,
      usePluginToast,
      MarkdownBlock: PluginSdkMarkdownBlock,
      MarkdownEditor: PluginSdkMarkdownEditor,
      FileTree: PluginSdkFileTree,
      IssuesList: PluginSdkIssuesList,
      AssigneePicker: PluginSdkAssigneePicker,
      ProjectPicker: PluginSdkProjectPicker,
      ManagedRoutinesList: HostManagedRoutinesList,
    },
  };
}
