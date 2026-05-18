import type {
  UserProfileAgentUsage,
  UserProfileProviderUsage,
  UserProfileWindowStats,
} from "@paperclipai/shared";
import { providerDisplayName } from "../../lib/utils";

export const NO_COMPANY = "__none__";

export interface UsageRow {
  key: string;
  label: string;
  sublabel: string;
  costCents: number;
  inputTokens: number;
  cachedInputTokens: number;
  outputTokens: number;
}

export function initials(name: string | null | undefined) {
  const value = name?.trim() || "User";
  const parts = value.split(/\s+/).filter(Boolean);
  if (parts.length > 1) {
    return `${parts[0]?.[0] ?? ""}${parts[parts.length - 1]?.[0] ?? ""}`.toUpperCase();
  }
  return value.slice(0, 2).toUpperCase();
}

export function totalTokens(
  stats: Pick<UserProfileWindowStats, "inputTokens" | "cachedInputTokens" | "outputTokens">,
) {
  return stats.inputTokens + stats.cachedInputTokens + stats.outputTokens;
}

export function completionRate(stats: UserProfileWindowStats) {
  if (stats.touchedIssues === 0) return "0%";
  return `${Math.round((stats.completedIssues / stats.touchedIssues) * 100)}%`;
}

export function buildAgentUsageRows(rows: UserProfileAgentUsage[] = []): UsageRow[] {
  return rows.map((row) => ({
    key: row.agentId ?? "unknown",
    label: row.agentName ?? (row.agentId ? row.agentId.slice(0, 8) : "unknown"),
    sublabel: "Issue-linked usage",
    costCents: row.costCents,
    inputTokens: row.inputTokens,
    cachedInputTokens: row.cachedInputTokens,
    outputTokens: row.outputTokens,
  }));
}

export function buildProviderUsageRows(rows: UserProfileProviderUsage[] = []): UsageRow[] {
  return rows.map((row) => ({
    key: `${row.provider}:${row.biller}:${row.model}`,
    label: `${providerDisplayName(row.provider)} / ${row.model}`,
    sublabel: `Billed through ${providerDisplayName(row.biller)}`,
    costCents: row.costCents,
    inputTokens: row.inputTokens,
    cachedInputTokens: row.cachedInputTokens,
    outputTokens: row.outputTokens,
  }));
}
