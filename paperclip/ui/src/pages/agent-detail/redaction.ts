import { redactCommandText as redactCommandSecretText } from "@paperclipai/adapter-utils";
import { redactHomePathUserSegments, redactHomePathUserSegmentsInValue } from "@paperclipai/adapter-utils";

import { asRecord } from "./valueUtils";

const REDACTED_ENV_VALUE = "***REDACTED***";
const SECRET_ENV_KEY_RE =
  /(api[-_]?key|access[-_]?token|auth(?:_?token)?|authorization|bearer|secret|passwd|password|credential|jwt|private[-_]?key|cookie|connectionstring)/i;
const COMMAND_ENV_KEY_RE = /(^command$|^cmd$|command[-_]?line|resolved[-_]?command|PAPERCLIP_RESOLVED_COMMAND)/i;
const JWT_VALUE_RE = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?$/;

export function redactPathText(value: string, censorUsernameInLogs: boolean) {
  return redactHomePathUserSegments(value, { enabled: censorUsernameInLogs });
}

export function redactPathValue<T>(value: T, censorUsernameInLogs: boolean): T {
  return redactHomePathUserSegmentsInValue(value, { enabled: censorUsernameInLogs });
}

export function redactCommandText(value: string, censorUsernameInLogs: boolean): string {
  return redactPathText(redactCommandSecretText(value, REDACTED_ENV_VALUE), censorUsernameInLogs);
}

function shouldRedactSecretValue(key: string, value: unknown): boolean {
  if (SECRET_ENV_KEY_RE.test(key)) return true;
  if (typeof value !== "string") return false;
  return JWT_VALUE_RE.test(value);
}

function redactEnvValue(key: string, value: unknown, censorUsernameInLogs: boolean): string {
  if (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { type?: unknown }).type === "secret_ref"
  ) {
    return "***SECRET_REF***";
  }
  if (shouldRedactSecretValue(key, value)) return REDACTED_ENV_VALUE;
  if (value === null || value === undefined) return "";
  if (typeof value === "string" && COMMAND_ENV_KEY_RE.test(key)) return redactCommandText(value, censorUsernameInLogs);
  if (typeof value === "string") return redactPathText(value, censorUsernameInLogs);
  try {
    return JSON.stringify(redactPathValue(value, censorUsernameInLogs));
  } catch {
    return redactPathText(String(value), censorUsernameInLogs);
  }
}

export function formatEnvForDisplay(envValue: unknown, censorUsernameInLogs: boolean): string {
  const env = asRecord(envValue);
  if (!env) return "<unable-to-parse>";

  const keys = Object.keys(env);
  if (keys.length === 0) return "<empty>";

  return keys
    .sort()
    .map((key) => `${key}=${redactEnvValue(key, env[key], censorUsernameInLogs)}`)
    .join("\n");
}
