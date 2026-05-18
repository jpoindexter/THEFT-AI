import {
  DEFAULT_COMPANY_ATTACHMENT_MAX_BYTES,
  MAX_COMPANY_ATTACHMENT_MAX_BYTES,
} from "@paperclipai/shared";

export type AgentSnippetInput = {
  onboardingTextUrl: string;
  connectionCandidates?: string[] | null;
  testResolutionUrl?: string | null;
};

export const BYTES_PER_MIB = 1024 * 1024;
export const DEFAULT_COMPANY_ATTACHMENT_MAX_MIB =
  DEFAULT_COMPANY_ATTACHMENT_MAX_BYTES / BYTES_PER_MIB;
export const MAX_COMPANY_ATTACHMENT_MAX_MIB =
  MAX_COMPANY_ATTACHMENT_MAX_BYTES / BYTES_PER_MIB;

export function getAttachmentMaxBytes(value: string) {
  return Number.parseInt(value, 10) * BYTES_PER_MIB;
}

export function isValidAttachmentMaxBytes(value: number) {
  return (
    Number.isInteger(value) &&
    value >= BYTES_PER_MIB &&
    value <= MAX_COMPANY_ATTACHMENT_MAX_BYTES
  );
}

export function getAttachmentMaxMiB(bytes?: number | null) {
  return String(Math.round((bytes ?? DEFAULT_COMPANY_ATTACHMENT_MAX_BYTES) / BYTES_PER_MIB));
}

export function getDefaultColorPickerValue() {
  return ["#", "6366f1"].join("");
}
