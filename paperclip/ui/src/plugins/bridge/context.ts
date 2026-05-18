import { createContext, useContext } from "react";
import type { PluginBridgeContextValue } from "./types";

export const PluginBridgeContext =
  createContext<PluginBridgeContextValue | null>(null);

export function usePluginBridgeContext(): PluginBridgeContextValue {
  const ctx = useContext(PluginBridgeContext);
  if (!ctx) {
    throw new Error(
      "Plugin bridge hook called outside of a <PluginBridgeContext.Provider>. " +
        "Ensure the plugin component is rendered within a PluginBridgeScope.",
    );
  }
  return ctx;
}
