import type { DragEvent as ReactDragEvent } from "react";

import type { PaperclipIssueRuntimeReassignment } from "@/hooks/usePaperclipIssueRuntime";

export const DRAFT_DEBOUNCE_MS = 800;
export const COMPOSER_FOCUS_SCROLL_PADDING_PX = 96;
export const SUBMIT_SCROLL_RESERVE_VH = 0.4;

export type ComposerAttachmentItem = {
  id: string;
  name: string;
  size: number;
  status: "uploading" | "attached" | "error";
  inline: boolean;
  contentPath?: string;
  error?: string;
};

export function hasFilePayload(evt: ReactDragEvent<HTMLDivElement>) {
  return Array.from(evt.dataTransfer?.types ?? []).includes("Files");
}

export function formatAttachmentSize(bytes: number) {
  if (!Number.isFinite(bytes) || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function toIsoString(value: string | Date | null | undefined): string | null {
  if (!value) return null;
  return typeof value === "string" ? value : value.toISOString();
}

export function loadDraft(draftKey: string): string {
  try {
    return localStorage.getItem(draftKey) ?? "";
  } catch {
    return "";
  }
}

export function saveDraft(draftKey: string, value: string) {
  try {
    if (value.trim()) {
      localStorage.setItem(draftKey, value);
    } else {
      localStorage.removeItem(draftKey);
    }
  } catch {
    // Ignore localStorage failures.
  }
}

export function clearDraft(draftKey: string) {
  try {
    localStorage.removeItem(draftKey);
  } catch {
    // Ignore localStorage failures.
  }
}

export function parseReassignment(target: string): PaperclipIssueRuntimeReassignment | null {
  if (!target || target === "__none__") {
    return { assigneeAgentId: null, assigneeUserId: null };
  }
  if (target.startsWith("agent:")) {
    const assigneeAgentId = target.slice("agent:".length);
    return assigneeAgentId ? { assigneeAgentId, assigneeUserId: null } : null;
  }
  if (target.startsWith("user:")) {
    const assigneeUserId = target.slice("user:".length);
    return assigneeUserId ? { assigneeAgentId: null, assigneeUserId } : null;
  }
  return null;
}

export function shouldImplicitlyReopenComment(issueStatus: string | undefined, assigneeValue: string) {
  const resumesToTodo = issueStatus === "done" || issueStatus === "cancelled" || issueStatus === "blocked";
  return resumesToTodo && assigneeValue.startsWith("agent:");
}

export function isUnassignedReassignValue(value: string): boolean {
  return !value || value === "__none__";
}
