import {
  useCallback,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { useMutation } from "@tanstack/react-query";
import type { DocumentRevision, IssueDocument } from "@paperclipai/shared";

import { issuesApi } from "../../api/issues";
import { useAutosaveIndicator } from "../../hooks/useAutosaveIndicator";
import {
  DOCUMENT_KEY_PATTERN,
  isDocumentConflictError,
  isPlanKey,
  type DocumentConflictState,
  type DraftState,
} from "./IssueDocumentUtils";
import { useIssueDocumentAutosave } from "./useIssueDocumentAutosave";
import { useIssueDocumentConflictSync } from "./useIssueDocumentConflictSync";
import { useIssueDocumentCopyAction } from "./useIssueDocumentCopyAction";
import { useIssueDocumentDraftActions } from "./useIssueDocumentDraftActions";
import { useIssueDocumentDraftEvents } from "./useIssueDocumentDraftEvents";
import { useIssueDocumentRevisionPreview } from "./useIssueDocumentRevisionPreview";
import { useIssueDocumentServerMutations } from "./useIssueDocumentServerMutations";

export function useIssueDocumentEditor({
  issueId,
  sortedDocuments,
  getDocumentRevisions,
  invalidateIssueDocuments,
  revisionMenuOpenKey,
  setRevisionMenuOpenKey,
  syncDocumentCaches,
  setFoldedDocumentKeys,
}: {
  issueId: string;
  sortedDocuments: IssueDocument[];
  getDocumentRevisions: (key: string) => DocumentRevision[];
  invalidateIssueDocuments: () => void;
  revisionMenuOpenKey: string | null;
  setRevisionMenuOpenKey: Dispatch<SetStateAction<string | null>>;
  syncDocumentCaches: (document: IssueDocument) => void;
  setFoldedDocumentKeys: Dispatch<SetStateAction<string[]>>;
}) {
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [documentConflict, setDocumentConflict] = useState<DocumentConflictState | null>(null);
  const [autosaveDocumentKey, setAutosaveDocumentKey] = useState<string | null>(null);
  const [diffViewKey, setDiffViewKey] = useState<string | null>(null);
  const { state: autosaveState, markDirty, reset, runSave } = useAutosaveIndicator();

  const resetAutosaveState = useCallback(() => {
    setAutosaveDocumentKey(null);
    reset();
  }, [reset]);

  const markDocumentDirty = useCallback((key: string) => {
    setAutosaveDocumentKey(key);
    markDirty();
  }, [markDirty]);

  const { copiedDocumentKey, copyDocumentBody } = useIssueDocumentCopyAction(setError);

  const upsertDocument = useMutation({
    mutationFn: async (nextDraft: DraftState) =>
      issuesApi.upsertDocument(issueId, nextDraft.key, {
        title: isPlanKey(nextDraft.key) ? null : nextDraft.title.trim() || null,
        format: "markdown",
        body: nextDraft.body,
        baseRevisionId: nextDraft.baseRevisionId,
      }),
  });

  const newDocumentKeyError =
    draft?.isNew && draft.key.trim().length > 0 && !DOCUMENT_KEY_PATTERN.test(draft.key.trim())
      ? "Use lowercase letters, numbers, -, or _, and start with a letter or number."
      : null;

  const commitDraft = useCallback(async (
    currentDraft: DraftState | null,
    options?: { clearAfterSave?: boolean; trackAutosave?: boolean; overrideConflict?: boolean },
  ) => {
    if (!currentDraft || upsertDocument.isPending) return false;
    const normalizedKey = currentDraft.key.trim().toLowerCase();
    const normalizedBody = currentDraft.body.trim();
    const normalizedTitle = currentDraft.title.trim();
    const activeConflict = documentConflict?.key === normalizedKey ? documentConflict : null;

    if (activeConflict && !options?.overrideConflict) {
      if (options?.trackAutosave) resetAutosaveState();
      return false;
    }
    if (!normalizedKey || !normalizedBody) {
      setError(currentDraft.isNew ? "Document key and body are required" : "Document body cannot be empty");
      if (options?.trackAutosave) resetAutosaveState();
      return false;
    }
    if (!DOCUMENT_KEY_PATTERN.test(normalizedKey)) {
      setError("Document key must start with a letter or number and use only lowercase letters, numbers, -, or _.");
      if (options?.trackAutosave) resetAutosaveState();
      return false;
    }

    const existing = sortedDocuments.find((doc) => doc.key === normalizedKey);
    if (!currentDraft.isNew && existing && existing.body === currentDraft.body && (existing.title ?? "") === currentDraft.title) {
      if (options?.clearAfterSave) setDraft((value) => (value?.key === normalizedKey ? null : value));
      if (options?.trackAutosave) resetAutosaveState();
      return true;
    }

    const save = async () => {
      const saved = await upsertDocument.mutateAsync({
        ...currentDraft,
        key: normalizedKey,
        title: isPlanKey(normalizedKey) ? "" : normalizedTitle,
        body: currentDraft.body,
        baseRevisionId: options?.overrideConflict
          ? activeConflict?.serverDocument.latestRevisionId ?? currentDraft.baseRevisionId
          : currentDraft.baseRevisionId,
      });
      setError(null);
      setDocumentConflict((current) => current?.key === normalizedKey ? null : current);
      setDraft((value) => {
        if (!value || value.key !== normalizedKey) return value;
        if (options?.clearAfterSave) return null;
        return { key: saved.key, title: saved.title ?? "", body: saved.body, baseRevisionId: saved.latestRevisionId, isNew: false };
      });
      syncDocumentCaches(saved);
      invalidateIssueDocuments();
    };

    try {
      if (options?.trackAutosave) {
        setAutosaveDocumentKey(normalizedKey);
        await runSave(save);
      } else {
        await save();
      }
      return true;
    } catch (err) {
      if (!isDocumentConflictError(err)) {
        setError(err instanceof Error ? err.message : "Failed to save document");
        return false;
      }
      try {
        const latestDocument = await issuesApi.getDocument(issueId, normalizedKey);
        setDocumentConflict({
          key: normalizedKey,
          serverDocument: latestDocument,
          localDraft: {
            key: normalizedKey,
            title: isPlanKey(normalizedKey) ? "" : normalizedTitle,
            body: currentDraft.body,
            baseRevisionId: currentDraft.baseRevisionId,
            isNew: false,
          },
          showRemote: true,
        });
        setFoldedDocumentKeys((current) => current.filter((key) => key !== normalizedKey));
        setError(null);
        resetAutosaveState();
      } catch {
        setError("Document changed remotely and the latest version could not be loaded");
      }
      return false;
    }
  }, [documentConflict, invalidateIssueDocuments, issueId, resetAutosaveState, runSave, setFoldedDocumentKeys, sortedDocuments, syncDocumentCaches, upsertDocument]);

  const clearAutosaveDebounce = useIssueDocumentAutosave({
    autosaveState,
    commitDraft,
    documentConflict,
    draft,
    markDocumentDirty,
    resetAutosaveState,
    sortedDocuments,
  });

  const {
    beginEdit,
    beginNewDocument,
    cancelDraft,
  } = useIssueDocumentDraftActions({
    clearAutosaveDebounce,
    documentConflict,
    resetAutosaveState,
    setDocumentConflict,
    setDraft,
    setError,
    setFoldedDocumentKeys,
    sortedDocuments,
  });

  const reloadDocumentFromServer = useCallback((key: string) => {
    if (documentConflict?.key !== key) return;
    const serverDocument = documentConflict.serverDocument;
    setDraft({ key: serverDocument.key, title: serverDocument.title ?? "", body: serverDocument.body, baseRevisionId: serverDocument.latestRevisionId, isNew: false });
    setDocumentConflict(null);
    resetAutosaveState();
    setError(null);
  }, [documentConflict, resetAutosaveState]);

  const overwriteDocumentFromDraft = useCallback(async (key: string) => {
    if (documentConflict?.key !== key) return;
    const sourceDraft = draft && draft.key === key && !draft.isNew ? draft : documentConflict.localDraft;
    await commitDraft({ ...sourceDraft, baseRevisionId: documentConflict.serverDocument.latestRevisionId }, {
      clearAfterSave: false,
      trackAutosave: true,
      overrideConflict: true,
    });
  }, [commitDraft, documentConflict, draft]);

  const keepConflictedDraft = useCallback((key: string) => {
    if (documentConflict?.key !== key) return;
    setDraft(documentConflict.localDraft);
    setDocumentConflict((current) => current?.key === key ? { ...current, showRemote: false } : current);
    setError(null);
  }, [documentConflict]);

  const {
    previewRevision,
    returnToLatestRevision,
    selectedRevisionIds,
    setSelectedRevisionIds,
  } = useIssueDocumentRevisionPreview({
    documentConflict,
    draft,
    getDocumentRevisions,
    resetAutosaveState,
    setDocumentConflict,
    setDraft,
    setError,
    setFoldedDocumentKeys,
  });

  const documentMutations = useIssueDocumentServerMutations({
    issueId,
    invalidateIssueDocuments,
    resetAutosaveState,
    setConfirmDeleteKey,
    setDocumentConflict,
    setDraft,
    setError,
    setSelectedRevisionIds,
    syncDocumentCaches,
  });

  const { handleDraftBlur, handleDraftKeyDown } = useIssueDocumentDraftEvents({
    cancelDraft,
    clearAutosaveDebounce,
    commitDraft,
    draft,
  });

  useIssueDocumentConflictSync({
    documentConflict,
    setDocumentConflict,
    sortedDocuments,
  });

  return {
    confirmDeleteKey,
    copiedDocumentKey,
    diffViewKey,
    documentConflict,
    draft,
    error,
    revisionMenuOpenKey,
    selectedRevisionIds,
    autosaveDocumentKey,
    autosaveState,
    isDeleting: documentMutations.isDeleting,
    isRestoring: documentMutations.isRestoring,
    isSaving: upsertDocument.isPending,
    restoringKey: documentMutations.restoringKey,
    newDocumentKeyError,
    beginEdit,
    beginNewDocument,
    cancelDraft,
    commitDraft,
    copyDocumentBody,
    handleDraftBlur,
    handleDraftKeyDown,
    keepConflictedDraft,
    markDocumentDirty,
    overwriteDocumentFromDraft,
    previewRevision,
    reloadDocumentFromServer,
    returnToLatestRevision,
    setConfirmDeleteKey,
    setDiffViewKey,
    setDocumentConflict,
    setDraft,
    setRevisionMenuOpenKey,
    deleteDocument: documentMutations.deleteDocument,
    restoreDocumentRevision: documentMutations.restoreDocumentRevision,
  };
}
