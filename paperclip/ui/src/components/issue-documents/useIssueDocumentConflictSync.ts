import { useEffect, type Dispatch, type SetStateAction } from "react";
import type { IssueDocument } from "@paperclipai/shared";

import type { DocumentConflictState } from "./IssueDocumentUtils";

export function useIssueDocumentConflictSync({
  documentConflict,
  setDocumentConflict,
  sortedDocuments,
}: {
  documentConflict: DocumentConflictState | null;
  setDocumentConflict: Dispatch<SetStateAction<DocumentConflictState | null>>;
  sortedDocuments: IssueDocument[];
}) {
  useEffect(() => {
    if (!documentConflict) return;
    const latest = sortedDocuments.find((doc) => doc.key === documentConflict.key);
    if (!latest || latest.latestRevisionId === documentConflict.serverDocument.latestRevisionId) return;
    setDocumentConflict((current) => current?.key === latest.key ? { ...current, serverDocument: latest } : current);
  }, [documentConflict, setDocumentConflict, sortedDocuments]);
}
