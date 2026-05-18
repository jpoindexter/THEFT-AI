import type {
  PluginBridgeErrorCode,
  PluginLauncherRenderContextSnapshot,
} from "@paperclipai/shared";
import { ApiError } from "@/api/client";
import type { PluginBridgeError, PluginRenderEnvironmentContext } from "./types";

export function extractBridgeError(err: unknown): PluginBridgeError {
  if (err instanceof ApiError && err.body && typeof err.body === "object") {
    const body = err.body as Record<string, unknown>;
    if (typeof body.code === "string" && typeof body.message === "string") {
      return {
        code: body.code as PluginBridgeErrorCode,
        message: body.message,
        details: body.details,
      };
    }
    if (typeof body.error === "string") {
      return {
        code: "UNKNOWN",
        message: body.error,
      };
    }
  }

  return {
    code: "UNKNOWN",
    message: err instanceof Error ? err.message : String(err),
  };
}

export function serializeParams(params?: Record<string, unknown>): string {
  if (!params) return "";
  try {
    return JSON.stringify(params, Object.keys(params).sort());
  } catch {
    return "";
  }
}

export function serializeRenderEnvironment(
  renderEnvironment?: PluginRenderEnvironmentContext | null,
): PluginLauncherRenderContextSnapshot | null {
  if (!renderEnvironment) return null;
  return {
    environment: renderEnvironment.environment,
    launcherId: renderEnvironment.launcherId,
    bounds: renderEnvironment.bounds,
  };
}

export function serializeRenderEnvironmentSnapshot(
  snapshot: PluginLauncherRenderContextSnapshot | null,
): string {
  return snapshot ? JSON.stringify(snapshot) : "";
}
