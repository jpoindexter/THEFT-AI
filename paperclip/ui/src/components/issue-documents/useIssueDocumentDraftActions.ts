import { useCallback, type Dispatch, type SetStateAction } from "react";
import type { IssueDocument } from "@paperclipai/shared";

import type {
  DocumentConflictState,
  DraftState,
} from "./IssueDocumentUtils";

export function useIssueDocumentDraftActions({
  clearAutosaveDebounce,
  documentConflict,
  resetAutosaveState,
  setDocumentConflict,
  setDraft,
  setError,
  setFoldedDocumentKeys,
  sortedDocuments,
}: {
  clearAutosaveDebounce: () => void;
  documentConflict: DocumentConflictState | null;
  resetAutosaveState: () => void;
  setDocumentConflict: Dispatch<SetStateAction<DocumentConflictState | null>>;
  setDraft: Dispatch<SetStateAction<DraftState | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setFoldedDocumentKeys: Dispatch<SetStateAction<string[]>>;
  sortedDocuments: IssueDocument[];
}) {
  const beginNewDocument = useCallback(() => {
    resetAutosaveState();
    setDocumentConflict(null);
    setDraft({ key: "", title: "", body: "", baseRevisionId: null, isNew: true });
    setError(null);
  }, [resetAutosaveState, setDocumentConflict, setDraft, setError]);

  const beginEdit = useCallback((key: string) => {
    const doc = sortedDocuments.find((entry) => entry.key === key);
    if (!doc) return;
    const conflictedDraft = documentConflict?.key === key ? documentConflict.localDraft : null;
    setFoldedDocumentKeys((current) => current.filter((entry) => entry !== key));
    resetAutosaveState();
    setDocumentConflict((current) => current?.key === key ? current : null);
    setDraft({
      key: conflictedDraft?.key ?? doc.key,
      title: conflictedDraft?.title ?? doc.title ?? "",
      body: conflictedDraft?.body ?? doc.body,
      baseRevisionId: conflictedDraft?.baseRevisionId ?? doc.latestRevisionId,
      isNew: false,
    });
    setError(null);
  }, [
    documentConflict,
    resetAutosaveState,
    setDocumentConflict,
    setDraft,
    setError,
    setFoldedDocumentKeys,
    sortedDocuments,
  ]);

  const cancelDraft = useCallback(() => {
    clearAutosaveDebounce();
    resetAutosaveState();
    setDocumentConflict(null);
    setDraft(null);
    setError(null);
  }, [clearAutosaveDebounce, resetAutosaveState, setDocumentConflict, setDraft, setError]);

  return {
    beginEdit,
    beginNewDocument,
    cancelDraft,
  };
}
