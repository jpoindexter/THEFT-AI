import type { PluginLauncherRenderContextSnapshot } from "@paperclipai/shared";
import { api } from "./client";

export const pluginBridgeApi = {
  /**
   * Proxy a `getData` call from a plugin UI component to its worker backend.
   *
   * This is the HTTP transport for `usePluginData(key, params)`. The bridge
   * runtime calls this method and maps the response into `PluginDataResult<T>`.
   *
   * On success, the response is `{ data: T }`.
   * On failure, the response body is a `PluginBridgeError`-shaped object
   * with `code`, `message`, and optional `details`.
   *
   * @param pluginId - UUID of the plugin whose worker should handle the request
   * @param key - Plugin-defined data key (e.g. `"sync-health"`)
   * @param params - Optional query parameters forwarded to the worker handler
   * @param companyId - Optional company scope used for board/company access checks.
   * @param renderEnvironment - Optional launcher/page snapshot forwarded for
   *   launcher-backed UI so workers can distinguish modal, drawer, popover, and
   *   page execution.
   *
   * Error responses:
   * - `401`/`403` when auth or company access checks fail
   * - `404` when the plugin or handler key does not exist
   * - `409` when the plugin is not in a callable runtime state
   * - `5xx` with a `PluginBridgeError`-shaped body when the worker throws
   *
   * @see PLUGIN_SPEC.md §13.8 — `getData`
   * @see PLUGIN_SPEC.md §19.7 — Error Propagation Through The Bridge
   */
  bridgeGetData: (
    pluginId: string,
    key: string,
    params?: Record<string, unknown>,
    companyId?: string | null,
    renderEnvironment?: PluginLauncherRenderContextSnapshot | null,
  ) =>
    api.post<{ data: unknown }>(`/plugins/${pluginId}/data/${encodeURIComponent(key)}`, {
      companyId: companyId ?? undefined,
      params,
      renderEnvironment: renderEnvironment ?? undefined,
    }),

  /**
   * Proxy a `performAction` call from a plugin UI component to its worker backend.
   *
   * This is the HTTP transport for `usePluginAction(key)`. The bridge runtime
   * calls this method when the action function is invoked.
   *
   * On success, the response is `{ data: T }`.
   * On failure, the response body is a `PluginBridgeError`-shaped object
   * with `code`, `message`, and optional `details`.
   *
   * @param pluginId - UUID of the plugin whose worker should handle the request
   * @param key - Plugin-defined action key (e.g. `"resync"`)
   * @param params - Optional parameters forwarded to the worker handler
   * @param companyId - Optional company scope used for board/company access checks.
   * @param renderEnvironment - Optional launcher/page snapshot forwarded for
   *   launcher-backed UI so workers can distinguish modal, drawer, popover, and
   *   page execution.
   *
   * Error responses:
   * - `401`/`403` when auth or company access checks fail
   * - `404` when the plugin or handler key does not exist
   * - `409` when the plugin is not in a callable runtime state
   * - `5xx` with a `PluginBridgeError`-shaped body when the worker throws
   *
   * @see PLUGIN_SPEC.md §13.9 — `performAction`
   * @see PLUGIN_SPEC.md §19.7 — Error Propagation Through The Bridge
   */
  bridgePerformAction: (
    pluginId: string,
    key: string,
    params?: Record<string, unknown>,
    companyId?: string | null,
    renderEnvironment?: PluginLauncherRenderContextSnapshot | null,
  ) =>
    api.post<{ data: unknown }>(`/plugins/${pluginId}/actions/${encodeURIComponent(key)}`, {
      companyId: companyId ?? undefined,
      params,
      renderEnvironment: renderEnvironment ?? undefined,
    }),
};
