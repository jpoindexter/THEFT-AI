import type { PluginRecord } from "@paperclipai/shared";

function firstNonEmptyLine(value: string | null | undefined): string | null {
  if (!value) return null;
  const line = value
    .split(/\r?\n/)
    .map((entry) => entry.trim())
    .find(Boolean);
  return line ?? null;
}

export function getPluginErrorSummary(plugin: PluginRecord): string {
  return firstNonEmptyLine(plugin.lastError) ?? "Plugin entered an error state without a stored error message.";
}
