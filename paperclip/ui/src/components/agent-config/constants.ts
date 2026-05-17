import type { EnvBinding } from "@paperclipai/shared";
import type { AgentConfigOverlay } from "../../lib/agent-config-patch";

export const emptyOverlay: AgentConfigOverlay = {
  identity: {},
  adapterConfig: {},
  heartbeat: {},
  runtime: {},
};

/** Stable empty object used as fallback for missing env config to avoid new-object-per-render. */
export const EMPTY_ENV: Record<string, EnvBinding> = {};

export function isOverlayDirty(o: AgentConfigOverlay): boolean {
  return (
    Object.keys(o.identity).length > 0 ||
    o.adapterType !== undefined ||
    Object.keys(o.adapterConfig).length > 0 ||
    Object.keys(o.heartbeat).length > 0 ||
    Object.keys(o.runtime).length > 0 ||
    o.modelProfiles?.cheap !== undefined
  );
}

export const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

export function parseCommaArgs(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function formatArgList(value: unknown): string {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === "string")
      .join(", ");
  }
  return typeof value === "string" ? value : "";
}

export const codexThinkingEffortOptions = [
  { id: "", label: "Auto" },
  { id: "minimal", label: "Minimal" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "xhigh", label: "X-High" },
] as const;

export const openCodeThinkingEffortOptions = [
  { id: "", label: "Auto" },
  { id: "minimal", label: "Minimal" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
  { id: "xhigh", label: "X-High" },
  { id: "max", label: "Max" },
] as const;

export const cursorModeOptions = [
  { id: "", label: "Auto" },
  { id: "plan", label: "Plan" },
  { id: "ask", label: "Ask" },
] as const;

export const claudeThinkingEffortOptions = [
  { id: "", label: "Auto" },
  { id: "low", label: "Low" },
  { id: "medium", label: "Medium" },
  { id: "high", label: "High" },
] as const;

export const MAX_TURN_CONTINUATION_DEFAULT_MAX_ATTEMPTS = 2;
export const MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP = 10;
export const MAX_TURN_CONTINUATION_DEFAULT_DELAY_SEC = 1;
export const MAX_TURN_CONTINUATION_MAX_DELAY_SEC = 300;

export function clampInteger(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, Math.floor(value)));
}

export function clampDelayMsFromSeconds(value: number) {
  return clampInteger(value, 0, MAX_TURN_CONTINUATION_MAX_DELAY_SEC) * 1000;
}
