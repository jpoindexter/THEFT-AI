import { useCallback, useState, type Dispatch, type SetStateAction } from "react";
import type { DocumentRevision, IssueDocument } from "@paperclipai/shared";

import { deriveDocumentRevisionState } from "../../lib/document-revisions";
import {
  documentHasUnsavedChanges,
  type DocumentConflictState,
  type DraftState,
} from "./IssueDocumentUtils";

export function useIssueDocumentRevisionPreview({
  documentConflict,
  draft,
  getDocumentRevisions,
  resetAutosaveState,
  setDocumentConflict,
  setDraft,
  setError,
  setFoldedDocumentKeys,
}: {
  documentConflict: DocumentConflictState | null;
  draft: DraftState | null;
  getDocumentRevisions: (key: string) => DocumentRevision[];
  resetAutosaveState: () => void;
  setDocumentConflict: Dispatch<SetStateAction<DocumentConflictState | null>>;
  setDraft: Dispatch<SetStateAction<DraftState | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setFoldedDocumentKeys: Dispatch<SetStateAction<string[]>>;
}) {
  const [selectedRevisionIds, setSelectedRevisionIds] = useState<Record<string, string | null>>({});

  const returnToLatestRevision = useCallback((key: string) => {
    setSelectedRevisionIds((current) => ({ ...current, [key]: null }));
    setError(null);
  }, [setError]);

  const previewRevision = useCallback((doc: IssueDocument, revisionId: string) => {
    const revisionState = deriveDocumentRevisionState(doc, getDocumentRevisions(doc.key));
    const selectedRevision = revisionState.revisions.find((revision) => revision.id === revisionId);
    if (!selectedRevision) return;
    if (selectedRevision.id === revisionState.currentRevision.id) {
      returnToLatestRevision(doc.key);
      return;
    }
    if (documentConflict?.key === doc.key || documentHasUnsavedChanges(doc, draft)) {
      setError("Save or cancel your local changes before viewing an older revision.");
      return;
    }
    resetAutosaveState();
    setDraft((current) => current?.key === doc.key ? null : current);
    setDocumentConflict((current) => current?.key === doc.key ? null : current);
    setFoldedDocumentKeys((current) => current.filter((entry) => entry !== doc.key));
    setSelectedRevisionIds((current) => ({ ...current, [doc.key]: selectedRevision.id }));
    setError(null);
  }, [
    documentConflict,
    draft,
    getDocumentRevisions,
    resetAutosaveState,
    returnToLatestRevision,
    setDocumentConflict,
    setDraft,
    setError,
    setFoldedDocumentKeys,
  ]);

  return {
    previewRevision,
    returnToLatestRevision,
    selectedRevisionIds,
    setSelectedRevisionIds,
  };
}
