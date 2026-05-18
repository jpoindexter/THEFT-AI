import type { QueryClient } from "@tanstack/react-query";
import type { Agent } from "@paperclipai/shared";
import type { CompanyUserDirectoryResponse } from "../../api/access";
import { queryKeys } from "../../lib/queryKeys";

export const TOAST_COOLDOWN_WINDOW_MS = 10_000;
export const TOAST_COOLDOWN_MAX = 3;
export const RECONNECT_SUPPRESS_MS = 2000;
export const SOCKET_CONNECTING = 0;
export const SOCKET_OPEN = 1;
export const TERMINAL_RUN_STATUSES = new Set(["succeeded", "failed", "cancelled", "timed_out"]);

export type LiveUpdatesSocketLike = {
  readyState: number;
  onopen: ((this: WebSocket, ev: Event) => unknown) | null;
  onmessage: ((this: WebSocket, ev: MessageEvent) => unknown) | null;
  onerror: ((this: WebSocket, ev: Event) => unknown) | null;
  onclose: ((this: WebSocket, ev: CloseEvent) => unknown) | null;
  close: (code?: number, reason?: string) => void;
};

export interface ToastGate {
  cooldownHits: Map<string, number[]>;
  suppressUntil: number;
}

export function readString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

export function readRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function shortId(value: string) {
  return value.slice(0, 8);
}

export function resolveAgentName(
  queryClient: QueryClient,
  companyId: string,
  agentId: string,
): string | null {
  const agents = queryClient.getQueryData<Agent[]>(queryKeys.agents.list(companyId));
  if (!agents) return null;
  const agent = agents.find((a) => a.id === agentId);
  return agent?.name ?? null;
}

export function resolveUserName(
  queryClient: QueryClient,
  companyId: string,
  userId: string,
): string | null {
  const directory = queryClient.getQueryData<CompanyUserDirectoryResponse>(
    queryKeys.access.companyUserDirectory(companyId),
  );
  if (!directory) return null;
  const entry = directory.users.find((u) => u.principalId === userId);
  return entry?.user?.name?.trim() || entry?.user?.email?.trim() || null;
}

export function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max - 1) + "\u2026";
}

export function resolveActorLabel(
  queryClient: QueryClient,
  companyId: string,
  actorType: string | null,
  actorId: string | null,
): string {
  if (actorType === "agent" && actorId) {
    return resolveAgentName(queryClient, companyId, actorId) ?? `Agent ${shortId(actorId)}`;
  }
  if (actorType === "system") return "System";
  if (actorType === "user" && actorId) {
    return resolveUserName(queryClient, companyId, actorId) ?? "Board";
  }
  return "Someone";
}

export function shouldSuppressToast(gate: ToastGate, category: string): boolean {
  const now = Date.now();
  if (now < gate.suppressUntil) return true;

  const hits = gate.cooldownHits.get(category);
  if (!hits) return false;

  const recent = hits.filter((t) => now - t < TOAST_COOLDOWN_WINDOW_MS);
  gate.cooldownHits.set(category, recent);
  return recent.length >= TOAST_COOLDOWN_MAX;
}

export function recordToastHit(gate: ToastGate, category: string) {
  const now = Date.now();
  const hits = gate.cooldownHits.get(category) ?? [];
  hits.push(now);
  gate.cooldownHits.set(category, hits);
}
