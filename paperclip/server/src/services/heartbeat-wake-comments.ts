import { parseObject } from "../adapters/utils.js";

export const WAKE_COMMENT_IDS_KEY = "wakeCommentIds";
export const PAPERCLIP_WAKE_PAYLOAD_KEY = "paperclipWake";
export const PAPERCLIP_HARNESS_CHECKOUT_KEY = "paperclipHarnessCheckedOut";

function readNonEmptyString(value: unknown): string | null {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

export function extractWakeCommentIds(
  contextSnapshot: Record<string, unknown> | null | undefined,
): string[] {
  const raw = contextSnapshot?.[WAKE_COMMENT_IDS_KEY];
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const entry of raw) {
    const value = readNonEmptyString(entry);
    if (!value || out.includes(value)) continue;
    out.push(value);
  }
  return out;
}

export function mergeWakeCommentIds(...values: Array<unknown>): string[] {
  const merged: string[] = [];
  const append = (value: unknown) => {
    const normalized = readNonEmptyString(value);
    if (!normalized || merged.includes(normalized)) return;
    merged.push(normalized);
  };

  for (const value of values) {
    if (Array.isArray(value)) {
      for (const entry of value) append(entry);
      continue;
    }
    if (typeof value === "object" && value !== null) {
      const candidate = value as Record<string, unknown>;
      const batched = extractWakeCommentIds(candidate);
      if (batched.length > 0) {
        for (const entry of batched) append(entry);
        continue;
      }
      append(candidate.wakeCommentId);
      append(candidate.commentId);
      continue;
    }
    append(value);
  }

  return merged;
}

export function deriveCommentId(
  contextSnapshot: Record<string, unknown> | null | undefined,
  payload: Record<string, unknown> | null | undefined,
) {
  const batchedCommentId = extractWakeCommentIds(contextSnapshot).at(-1);
  return (
    batchedCommentId ??
    readNonEmptyString(contextSnapshot?.wakeCommentId) ??
    readNonEmptyString(contextSnapshot?.commentId) ??
    readNonEmptyString(payload?.commentId) ??
    null
  );
}

const INTERACTION_CONTINUATION_CONTEXT_KEYS = [
  "interactionId",
  "interactionKind",
  "interactionStatus",
  "continuationPolicy",
] as const;

function isInteractionResolutionWakePayload(payload: Record<string, unknown> | null | undefined) {
  return readNonEmptyString(payload?.mutation) === "interaction";
}

function clearInteractionContinuationWakeContext(contextSnapshot: Record<string, unknown>) {
  for (const key of INTERACTION_CONTINUATION_CONTEXT_KEYS) {
    delete contextSnapshot[key];
  }
}

function hasInteractionContinuationWakeContext(contextSnapshot: Record<string, unknown>) {
  return INTERACTION_CONTINUATION_CONTEXT_KEYS.some((key) => readNonEmptyString(contextSnapshot[key]));
}

export function normalizeInteractionContinuationWakeContext(
  contextSnapshot: Record<string, unknown>,
  payload: Record<string, unknown> | null | undefined,
) {
  if (isInteractionResolutionWakePayload(payload)) return;
  clearInteractionContinuationWakeContext(contextSnapshot);
}

export function mergeCoalescedContextSnapshot(
  existingRaw: unknown,
  incoming: Record<string, unknown>,
) {
  const existing = parseObject(existingRaw);
  const merged: Record<string, unknown> = {
    ...existing,
    ...incoming,
  };
  const mergedCommentIds = mergeWakeCommentIds(existing, incoming);
  if (mergedCommentIds.length > 0) {
    const latestCommentId = mergedCommentIds[mergedCommentIds.length - 1];
    merged[WAKE_COMMENT_IDS_KEY] = mergedCommentIds;
    merged.commentId = latestCommentId;
    merged.wakeCommentId = latestCommentId;
    delete merged[PAPERCLIP_WAKE_PAYLOAD_KEY];
  }
  if (!hasInteractionContinuationWakeContext(incoming)) {
    clearInteractionContinuationWakeContext(merged);
  }
  return merged;
}
