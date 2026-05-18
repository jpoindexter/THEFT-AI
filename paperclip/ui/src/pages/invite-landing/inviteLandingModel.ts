import { AGENT_ADAPTER_TYPES } from "@paperclipai/shared";
import type { AgentAdapterType } from "@paperclipai/shared";

export type AuthMode = "sign_in" | "sign_up";
export type AuthFeedback = { tone: "error" | "info"; message: string };

export const joinAdapterOptions: AgentAdapterType[] = [...AGENT_ADAPTER_TYPES];
export const ENABLED_INVITE_ADAPTERS = new Set([
  "claude_local",
  "codex_local",
  "gemini_local",
  "opencode_local",
  "pi_local",
  "cursor",
]);

export function readNestedString(value: unknown, path: string[]): string | null {
  let current: unknown = value;
  for (const segment of path) {
    if (!current || typeof current !== "object") return null;
    current = (current as Record<string, unknown>)[segment];
  }
  return typeof current === "string" && current.trim().length > 0 ? current : null;
}

export function formatHumanRole(role: string | null | undefined) {
  if (!role) return null;
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function getAuthErrorCode(error: unknown) {
  if (!error || typeof error !== "object") return null;
  const code = (error as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code : null;
}

export function getAuthErrorMessage(error: unknown) {
  if (!(error instanceof Error)) return null;
  const message = error.message.trim();
  return message.length > 0 ? message : null;
}

export function mapInviteAuthFeedback(
  error: unknown,
  authMode: AuthMode,
  email: string,
): AuthFeedback {
  const code = getAuthErrorCode(error);
  const message = getAuthErrorMessage(error);
  const emailLabel = email.trim().length > 0 ? email.trim() : "that email";

  if (code === "USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL") {
    return {
      tone: "info",
      message: `An account already exists for ${emailLabel}. Sign in below to continue with this invite.`,
    };
  }

  if (code === "INVALID_EMAIL_OR_PASSWORD" || (authMode === "sign_in" && message === "Request failed: 401")) {
    return {
      tone: "error",
      message:
        "That email and password did not match an existing THEFT account. Check both fields, or create an account first if you are new here.",
    };
  }

  if (authMode === "sign_up" && message === "Request failed: 422") {
    return {
      tone: "info",
      message: `An account may already exist for ${emailLabel}. Try signing in instead.`,
    };
  }

  return {
    tone: "error",
    message: message ?? "Authentication failed",
  };
}

export function isBootstrapAcceptancePayload(payload: unknown) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      "bootstrapAccepted" in (payload as Record<string, unknown>),
  );
}

export function isApprovedHumanJoinPayload(payload: unknown, showsAgentForm: boolean) {
  if (!payload || typeof payload !== "object" || showsAgentForm) return false;
  const status = (payload as { status?: unknown }).status;
  return status === "approved";
}
