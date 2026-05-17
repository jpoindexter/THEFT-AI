import { useCallback, useEffect, useRef } from "react";
import type { IssueDocument } from "@paperclipai/shared";

import type { AutosaveState } from "../../hooks/useAutosaveIndicator";
import {
  DOCUMENT_AUTOSAVE_DEBOUNCE_MS,
  type DocumentConflictState,
  type DraftState,
} from "./IssueDocumentUtils";

type CommitDraft = (
  currentDraft: DraftState | null,
  options?: { clearAfterSave?: boolean; trackAutosave?: boolean; overrideConflict?: boolean },
) => Promise<boolean>;

export function useIssueDocumentAutosave({
  autosaveState,
  commitDraft,
  documentConflict,
  draft,
  markDocumentDirty,
  resetAutosaveState,
  sortedDocuments,
}: {
  autosaveState: AutosaveState;
  commitDraft: CommitDraft;
  documentConflict: DocumentConflictState | null;
  draft: DraftState | null;
  markDocumentDirty: (key: string) => void;
  resetAutosaveState: () => void;
  sortedDocuments: IssueDocument[];
}) {
  const autosaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAutosaveDebounce = useCallback(() => {
    if (autosaveDebounceRef.current) {
      clearTimeout(autosaveDebounceRef.current);
      autosaveDebounceRef.current = null;
    }
  }, []);

  useEffect(() => () => {
    clearAutosaveDebounce();
  }, [clearAutosaveDebounce]);

  useEffect(() => {
    if (!draft || draft.isNew || documentConflict?.key === draft.key) return;
    const existing = sortedDocuments.find((doc) => doc.key === draft.key);
    if (!existing) return;
    const hasChanges = existing.body !== draft.body || (existing.title ?? "") !== draft.title;
    if (!hasChanges) {
      if (autosaveState !== "saved") resetAutosaveState();
      return;
    }
    markDocumentDirty(draft.key);
    clearAutosaveDebounce();
    autosaveDebounceRef.current = setTimeout(() => {
      void commitDraft(draft, { clearAfterSave: false, trackAutosave: true });
    }, DOCUMENT_AUTOSAVE_DEBOUNCE_MS);
    return clearAutosaveDebounce;
  }, [
    autosaveState,
    clearAutosaveDebounce,
    commitDraft,
    documentConflict,
    draft,
    markDocumentDirty,
    resetAutosaveState,
    sortedDocuments,
  ]);

  return clearAutosaveDebounce;
}
