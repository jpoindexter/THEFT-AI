import type { Dispatch, SetStateAction } from "react";
import { useMutation } from "@tanstack/react-query";
import type { IssueDocument } from "@paperclipai/shared";

import { issuesApi } from "../../api/issues";
import type {
  DocumentConflictState,
  DraftState,
} from "./IssueDocumentUtils";

export function useIssueDocumentServerMutations({
  issueId,
  invalidateIssueDocuments,
  resetAutosaveState,
  setConfirmDeleteKey,
  setDocumentConflict,
  setDraft,
  setError,
  setSelectedRevisionIds,
  syncDocumentCaches,
}: {
  issueId: string;
  invalidateIssueDocuments: () => void;
  resetAutosaveState: () => void;
  setConfirmDeleteKey: Dispatch<SetStateAction<string | null>>;
  setDocumentConflict: Dispatch<SetStateAction<DocumentConflictState | null>>;
  setDraft: Dispatch<SetStateAction<DraftState | null>>;
  setError: Dispatch<SetStateAction<string | null>>;
  setSelectedRevisionIds: Dispatch<SetStateAction<Record<string, string | null>>>;
  syncDocumentCaches: (document: IssueDocument) => void;
}) {
  const deleteDocument = useMutation({
    mutationFn: (key: string) => issuesApi.deleteDocument(issueId, key),
    onSuccess: () => {
      setError(null);
      setConfirmDeleteKey(null);
      invalidateIssueDocuments();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to delete document");
    },
  });

  const restoreDocumentRevision = useMutation({
    mutationFn: ({ key, revisionId }: { key: string; revisionId: string }) =>
      issuesApi.restoreDocumentRevision(issueId, key, revisionId),
    onSuccess: (document, variables) => {
      syncDocumentCaches(document);
      setSelectedRevisionIds((current) => ({ ...current, [variables.key]: null }));
      setDraft((current) => current?.key === variables.key ? null : current);
      setDocumentConflict((current) => current?.key === variables.key ? null : current);
      resetAutosaveState();
      setError(null);
      invalidateIssueDocuments();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : "Failed to restore document revision");
    },
  });

  return {
    isDeleting: deleteDocument.isPending,
    isRestoring: restoreDocumentRevision.isPending,
    restoringKey: restoreDocumentRevision.variables?.key ?? null,
    deleteDocument: (key: string) => deleteDocument.mutate(key),
    restoreDocumentRevision: (key: string, revisionId: string) =>
      restoreDocumentRevision.mutate({ key, revisionId }),
  };
}
