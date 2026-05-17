import { useEffect, useRef, useState } from "react";
import type { IssueDocument } from "@paperclipai/shared";

import {
  loadFoldedDocumentKeys,
  saveFoldedDocumentKeys,
} from "./IssueDocumentUtils";

export function useIssueDocumentFoldState({
  issueId,
  hasLegacyPlanDocument,
  locationHash,
  sortedDocuments,
}: {
  issueId: string;
  hasLegacyPlanDocument: boolean;
  locationHash: string;
  sortedDocuments: IssueDocument[];
}) {
  const [foldedDocumentKeys, setFoldedDocumentKeys] = useState<string[]>(() => loadFoldedDocumentKeys(issueId));
  const [highlightDocumentKey, setHighlightDocumentKey] = useState<string | null>(null);
  const hasScrolledToHashRef = useRef(false);

  useEffect(() => {
    setFoldedDocumentKeys(loadFoldedDocumentKeys(issueId));
  }, [issueId]);

  useEffect(() => {
    hasScrolledToHashRef.current = false;
  }, [issueId, locationHash]);

  useEffect(() => {
    const validKeys = new Set(sortedDocuments.map((doc) => doc.key));
    setFoldedDocumentKeys((current) => {
      const next = current.filter((key) => validKeys.has(key));
      if (next.length !== current.length) {
        saveFoldedDocumentKeys(issueId, next);
      }
      return next;
    });
  }, [issueId, sortedDocuments]);

  useEffect(() => {
    saveFoldedDocumentKeys(issueId, foldedDocumentKeys);
  }, [foldedDocumentKeys, issueId]);

  useEffect(() => {
    const hash = locationHash;
    if (!hash.startsWith("#document-")) return;
    const documentKey = decodeURIComponent(hash.slice("#document-".length));
    const targetExists = sortedDocuments.some((doc) => doc.key === documentKey)
      || (documentKey === "plan" && hasLegacyPlanDocument);
    if (!targetExists || hasScrolledToHashRef.current) return;
    setFoldedDocumentKeys((current) => current.filter((key) => key !== documentKey));
    const element = document.getElementById(`document-${documentKey}`);
    if (!element) return;
    hasScrolledToHashRef.current = true;
    setHighlightDocumentKey(documentKey);
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightDocumentKey((current) => current === documentKey ? null : current), 3000);
    return () => clearTimeout(timer);
  }, [hasLegacyPlanDocument, locationHash, sortedDocuments]);

  const toggleFoldedDocument = (key: string) => {
    setFoldedDocumentKeys((current) =>
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key],
    );
  };

  return {
    foldedDocumentKeys,
    highlightDocumentKey,
    setFoldedDocumentKeys,
    toggleFoldedDocument,
  };
}
