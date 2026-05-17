import type {
  DocumentRevision,
  Issue,
  IssueDocument,
} from "@paperclipai/shared";

import { ApiError } from "../../api/client";
import { FoldCurtain } from "../FoldCurtain";
import { MarkdownBody } from "../MarkdownBody";

export type DraftState = {
  key: string;
  title: string;
  body: string;
  baseRevisionId: string | null;
  isNew: boolean;
};

export type DocumentConflictState = {
  key: string;
  serverDocument: IssueDocument;
  localDraft: DraftState;
  showRemote: boolean;
};

export const DOCUMENT_AUTOSAVE_DEBOUNCE_MS = 900;
export const DOCUMENT_KEY_PATTERN = /^[a-z0-9][a-z0-9_-]*$/;

const getFoldedDocumentsStorageKey = (issueId: string) => `paperclip:issue-document-folds:${issueId}`;

export function loadFoldedDocumentKeys(issueId: string) {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(getFoldedDocumentsStorageKey(issueId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === "string") : [];
  } catch {
    return [];
  }
}

export function saveFoldedDocumentKeys(issueId: string, keys: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(getFoldedDocumentsStorageKey(issueId), JSON.stringify(keys));
}

export function renderFoldableBody(body: string, className?: string) {
  return (
    <FoldCurtain>
      <MarkdownBody className={className} softBreaks={false}>{body}</MarkdownBody>
    </FoldCurtain>
  );
}

export function isPlanKey(key: string) {
  return key.trim().toLowerCase() === "plan";
}

export function titlesMatchKey(title: string | null | undefined, key: string) {
  return (title ?? "").trim().toLowerCase() === key.trim().toLowerCase();
}

export function isDocumentConflictError(error: unknown) {
  return error instanceof ApiError && error.status === 409;
}

export function downloadDocumentFile(key: string, body: string) {
  const blob = new Blob([body], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `${key}.md`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function getRevisionActorLabel(revision: DocumentRevision) {
  if (revision.createdByUserId) return "board";
  if (revision.createdByAgentId) return "agent";
  return "system";
}

export function documentHasUnsavedChanges(doc: IssueDocument, draft: DraftState | null) {
  if (!draft || draft.isNew || draft.key !== doc.key) return false;
  return draft.body !== doc.body || (doc.title ?? "") !== draft.title;
}

export function toDocumentSummary(document: IssueDocument): NonNullable<Issue["documentSummaries"]>[number] {
  return {
    id: document.id,
    companyId: document.companyId,
    issueId: document.issueId,
    key: document.key,
    title: document.title,
    format: document.format,
    latestRevisionId: document.latestRevisionId,
    latestRevisionNumber: document.latestRevisionNumber,
    createdByAgentId: document.createdByAgentId,
    createdByUserId: document.createdByUserId,
    updatedByAgentId: document.updatedByAgentId,
    updatedByUserId: document.updatedByUserId,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
  };
}
