import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DocumentRevision,
  FeedbackDataSharingPreference,
  FeedbackVote,
  FeedbackVoteValue,
  Issue,
  IssueDocument,
} from "@paperclipai/shared";
import { isSystemIssueDocumentKey } from "@paperclipai/shared";
import { useLocation } from "@/lib/router";
import { issuesApi } from "../api/issues";
import { useAutosaveIndicator } from "../hooks/useAutosaveIndicator";
import { deriveDocumentRevisionState } from "../lib/document-revisions";
import { queryKeys } from "../lib/queryKeys";
import type { MentionOption } from "./MarkdownEditor";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { DocumentDiffModal } from "./DocumentDiffModal";
import { IssueDocumentCard } from "./issue-documents/IssueDocumentCard";
import { LegacyPlanDocumentCard } from "./issue-documents/LegacyPlanDocumentCard";
import { NewIssueDocumentDraftForm } from "./issue-documents/NewIssueDocumentDraftForm";
import {
  DOCUMENT_AUTOSAVE_DEBOUNCE_MS,
  DOCUMENT_KEY_PATTERN,
  documentHasUnsavedChanges,
  isDocumentConflictError,
  isPlanKey,
  loadFoldedDocumentKeys,
  saveFoldedDocumentKeys,
  toDocumentSummary,
  type DocumentConflictState,
  type DraftState,
} from "./issue-documents/IssueDocumentUtils";

export function IssueDocumentsSection({
  issue,
  canDeleteDocuments,
  feedbackVotes = [],
  feedbackDataSharingPreference = "prompt",
  feedbackTermsUrl = null,
  mentions,
  imageUploadHandler,
  onVote,
  extraActions,
}: {
  issue: Issue;
  canDeleteDocuments: boolean;
  feedbackVotes?: FeedbackVote[];
  feedbackDataSharingPreference?: FeedbackDataSharingPreference;
  feedbackTermsUrl?: string | null;
  mentions?: MentionOption[];
  imageUploadHandler?: (file: File) => Promise<string>;
  onVote?: (
    revisionId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  extraActions?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const location = useLocation();
  const [confirmDeleteKey, setConfirmDeleteKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<DraftState | null>(null);
  const [documentConflict, setDocumentConflict] = useState<DocumentConflictState | null>(null);
  const [foldedDocumentKeys, setFoldedDocumentKeys] = useState<string[]>(() => loadFoldedDocumentKeys(issue.id));
  const [autosaveDocumentKey, setAutosaveDocumentKey] = useState<string | null>(null);
  const [copiedDocumentKey, setCopiedDocumentKey] = useState<string | null>(null);
  const [highlightDocumentKey, setHighlightDocumentKey] = useState<string | null>(null);
  const [revisionMenuOpenKey, setRevisionMenuOpenKey] = useState<string | null>(null);
  const [selectedRevisionIds, setSelectedRevisionIds] = useState<Record<string, string | null>>({});
  const [diffViewKey, setDiffViewKey] = useState<string | null>(null);
  const autosaveDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const copiedDocumentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasScrolledToHashRef = useRef(false);
  const {
    state: autosaveState,
    markDirty,
    reset,
    runSave,
  } = useAutosaveIndicator();

  const { data: documents } = useQuery({
    queryKey: queryKeys.issues.documents(issue.id),
    queryFn: () => issuesApi.listDocuments(issue.id),
  });

  const { data: activeDocumentRevisions, isFetching: isFetchingDocumentRevisions } = useQuery({
    queryKey: revisionMenuOpenKey
      ? queryKeys.issues.documentRevisions(issue.id, revisionMenuOpenKey)
      : ["issues", "document-revisions", issue.id, "__idle__"],
    queryFn: async () => {
      if (!revisionMenuOpenKey) return [];
      return issuesApi.listDocumentRevisions(issue.id, revisionMenuOpenKey);
    },
    enabled: Boolean(revisionMenuOpenKey),
  });

  const invalidateIssueDocuments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issue.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.documents(issue.id) });
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey)
        && query.queryKey[0] === "issues"
        && query.queryKey[1] === "document-revisions"
        && query.queryKey[2] === issue.id,
    });
  }, [issue.id, queryClient]);

  const syncDocumentCaches = useCallback((document: IssueDocument) => {
    if (isSystemIssueDocumentKey(document.key)) return;
    queryClient.setQueryData<IssueDocument[] | undefined>(
      queryKeys.issues.documents(issue.id),
      (current) => {
        if (!current) return [document];
        const existingIndex = current.findIndex((entry) => entry.key === document.key);
        if (existingIndex === -1) return [...current, document];
        return current.map((entry, index) => index === existingIndex ? document : entry);
      },
    );
    queryClient.setQueryData<Issue | undefined>(
      queryKeys.issues.detail(issue.id),
      (current) => {
        if (!current) return current;
        const nextSummaries = (() => {
          const summary = toDocumentSummary(document);
          const existingIndex = (current.documentSummaries ?? []).findIndex((entry) => entry.key === document.key);
          if (existingIndex === -1) return [...(current.documentSummaries ?? []), summary];
          return (current.documentSummaries ?? []).map((entry, index) => index === existingIndex ? summary : entry);
        })();
        return {
          ...current,
          planDocument: document.key === "plan" ? document : current.planDocument ?? null,
          documentSummaries: nextSummaries,
          legacyPlanDocument: document.key === "plan" ? null : current.legacyPlanDocument ?? null,
        };
      },
    );
  }, [issue.id, queryClient]);

  const upsertDocument = useMutation({
    mutationFn: async (nextDraft: DraftState) =>
      issuesApi.upsertDocument(issue.id, nextDraft.key, {
        title: isPlanKey(nextDraft.key) ? null : nextDraft.title.trim() || null,
        format: "markdown",
        body: nextDraft.body,
        baseRevisionId: nextDraft.baseRevisionId,
      }),
  });

  const deleteDocument = useMutation({
    mutationFn: (key: string) => issuesApi.deleteDocument(issue.id, key),
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
      issuesApi.restoreDocumentRevision(issue.id, key, revisionId),
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

  const sortedDocuments = useMemo(() => {
    return (documents ?? []).filter((doc) => !isSystemIssueDocumentKey(doc.key)).sort((a, b) => {
      if (a.key === "plan" && b.key !== "plan") return -1;
      if (a.key !== "plan" && b.key === "plan") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [documents]);

  const feedbackVoteByTargetId = useMemo(() => {
    const map = new Map<string, FeedbackVoteValue>();
    for (const feedbackVote of feedbackVotes) {
      if (feedbackVote.targetType !== "issue_document_revision") continue;
      map.set(feedbackVote.targetId, feedbackVote.vote);
    }
    return map;
  }, [feedbackVotes]);

  const hasRealPlan = sortedDocuments.some((doc) => doc.key === "plan");
  const isEmpty = sortedDocuments.length === 0 && !issue.legacyPlanDocument;
  const newDocumentKeyError =
    draft?.isNew && draft.key.trim().length > 0 && !DOCUMENT_KEY_PATTERN.test(draft.key.trim())
      ? "Use lowercase letters, numbers, -, or _, and start with a letter or number."
      : null;

  const resetAutosaveState = useCallback(() => {
    setAutosaveDocumentKey(null);
    reset();
  }, [reset]);

  const markDocumentDirty = useCallback((key: string) => {
    setAutosaveDocumentKey(key);
    markDirty();
  }, [markDirty]);

  const beginNewDocument = () => {
    resetAutosaveState();
    setDocumentConflict(null);
    setDraft({
      key: "",
      title: "",
      body: "",
      baseRevisionId: null,
      isNew: true,
    });
    setError(null);
  };

  const beginEdit = (key: string) => {
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
  };

  const cancelDraft = () => {
    if (autosaveDebounceRef.current) {
      clearTimeout(autosaveDebounceRef.current);
    }
    resetAutosaveState();
    setDocumentConflict(null);
    setDraft(null);
    setError(null);
  };

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
      if (options?.trackAutosave) {
        resetAutosaveState();
      }
      return false;
    }

    if (!normalizedKey || !normalizedBody) {
      if (currentDraft.isNew) {
        setError("Document key and body are required");
      } else if (!normalizedBody) {
        setError("Document body cannot be empty");
      }
      if (options?.trackAutosave) {
        resetAutosaveState();
      }
      return false;
    }

    if (!DOCUMENT_KEY_PATTERN.test(normalizedKey)) {
      setError("Document key must start with a letter or number and use only lowercase letters, numbers, -, or _.");
      if (options?.trackAutosave) {
        resetAutosaveState();
      }
      return false;
    }

    const existing = sortedDocuments.find((doc) => doc.key === normalizedKey);
    if (
      !currentDraft.isNew &&
      existing &&
      existing.body === currentDraft.body &&
      (existing.title ?? "") === currentDraft.title
    ) {
      if (options?.clearAfterSave) {
        setDraft((value) => (value?.key === normalizedKey ? null : value));
      }
      if (options?.trackAutosave) {
        resetAutosaveState();
      }
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
        return {
          key: saved.key,
          title: saved.title ?? "",
          body: saved.body,
          baseRevisionId: saved.latestRevisionId,
          isNew: false,
        };
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
      if (isDocumentConflictError(err)) {
        try {
          const latestDocument = await issuesApi.getDocument(issue.id, normalizedKey);
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
          return false;
        } catch {
          setError("Document changed remotely and the latest version could not be loaded");
          return false;
        }
      }
      setError(err instanceof Error ? err.message : "Failed to save document");
      return false;
    }
  }, [documentConflict, invalidateIssueDocuments, issue.id, resetAutosaveState, runSave, sortedDocuments, syncDocumentCaches, upsertDocument]);

  const reloadDocumentFromServer = useCallback((key: string) => {
    if (documentConflict?.key !== key) return;
    const serverDocument = documentConflict.serverDocument;
    setDraft({
      key: serverDocument.key,
      title: serverDocument.title ?? "",
      body: serverDocument.body,
      baseRevisionId: serverDocument.latestRevisionId,
      isNew: false,
    });
    setDocumentConflict(null);
    resetAutosaveState();
    setError(null);
  }, [documentConflict, resetAutosaveState]);

  const overwriteDocumentFromDraft = useCallback(async (key: string) => {
    if (documentConflict?.key !== key) return;
    const sourceDraft =
      draft && draft.key === key && !draft.isNew
        ? draft
        : documentConflict.localDraft;
    await commitDraft(
      {
        ...sourceDraft,
        baseRevisionId: documentConflict.serverDocument.latestRevisionId,
      },
      {
        clearAfterSave: false,
        trackAutosave: true,
        overrideConflict: true,
      },
    );
  }, [commitDraft, documentConflict, draft]);

  const keepConflictedDraft = useCallback((key: string) => {
    if (documentConflict?.key !== key) return;
    setDraft(documentConflict.localDraft);
    setDocumentConflict((current) =>
      current?.key === key
        ? { ...current, showRemote: false }
        : current,
    );
    setError(null);
  }, [documentConflict]);

  const copyDocumentBody = useCallback(async (key: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
      setCopiedDocumentKey(key);
      if (copiedDocumentTimerRef.current) {
        clearTimeout(copiedDocumentTimerRef.current);
      }
      copiedDocumentTimerRef.current = setTimeout(() => {
        setCopiedDocumentKey((current) => current === key ? null : current);
      }, 1400);
    } catch {
      setError("Could not copy document");
    }
  }, []);

  const getDocumentRevisions = useCallback((key: string) => {
    const cached = queryClient.getQueryData<DocumentRevision[]>(queryKeys.issues.documentRevisions(issue.id, key));
    if (cached) return cached;
    if (revisionMenuOpenKey === key) return activeDocumentRevisions ?? [];
    return [];
  }, [activeDocumentRevisions, issue.id, queryClient, revisionMenuOpenKey]);

  const returnToLatestRevision = useCallback((key: string) => {
    setSelectedRevisionIds((current) => ({ ...current, [key]: null }));
    setError(null);
  }, []);

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
  }, [documentConflict, draft, getDocumentRevisions, resetAutosaveState, returnToLatestRevision]);

  const handleDraftBlur = async (event: React.FocusEvent<HTMLDivElement>) => {
    if (event.currentTarget.contains(event.relatedTarget as Node | null)) return;
    if (autosaveDebounceRef.current) {
      clearTimeout(autosaveDebounceRef.current);
    }
    await commitDraft(draft, { clearAfterSave: true, trackAutosave: true });
  };

  const handleDraftKeyDown = async (event: React.KeyboardEvent) => {
    if (event.key === "Escape") {
      event.preventDefault();
      cancelDraft();
      return;
    }
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      if (autosaveDebounceRef.current) {
        clearTimeout(autosaveDebounceRef.current);
      }
      await commitDraft(draft, { clearAfterSave: false, trackAutosave: true });
    }
  };

  useEffect(() => {
    setFoldedDocumentKeys(loadFoldedDocumentKeys(issue.id));
  }, [issue.id]);

  useEffect(() => {
    hasScrolledToHashRef.current = false;
  }, [issue.id, location.hash]);

  useEffect(() => {
    const validKeys = new Set(sortedDocuments.map((doc) => doc.key));
    setFoldedDocumentKeys((current) => {
      const next = current.filter((key) => validKeys.has(key));
      if (next.length !== current.length) {
        saveFoldedDocumentKeys(issue.id, next);
      }
      return next;
    });
  }, [issue.id, sortedDocuments]);

  useEffect(() => {
    saveFoldedDocumentKeys(issue.id, foldedDocumentKeys);
  }, [foldedDocumentKeys, issue.id]);

  useEffect(() => {
    if (!documentConflict) return;
    const latest = sortedDocuments.find((doc) => doc.key === documentConflict.key);
    if (!latest || latest.latestRevisionId === documentConflict.serverDocument.latestRevisionId) return;
    setDocumentConflict((current) =>
      current?.key === latest.key
        ? { ...current, serverDocument: latest }
        : current,
    );
  }, [documentConflict, sortedDocuments]);

  useEffect(() => {
    const hash = location.hash;
    if (!hash.startsWith("#document-")) return;
    const documentKey = decodeURIComponent(hash.slice("#document-".length));
    const targetExists = sortedDocuments.some((doc) => doc.key === documentKey)
      || (documentKey === "plan" && Boolean(issue.legacyPlanDocument));
    if (!targetExists || hasScrolledToHashRef.current) return;
    setFoldedDocumentKeys((current) => current.filter((key) => key !== documentKey));
    const element = document.getElementById(`document-${documentKey}`);
    if (!element) return;
    hasScrolledToHashRef.current = true;
    setHighlightDocumentKey(documentKey);
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    const timer = setTimeout(() => setHighlightDocumentKey((current) => current === documentKey ? null : current), 3000);
    return () => clearTimeout(timer);
  }, [issue.legacyPlanDocument, location.hash, sortedDocuments]);

  useEffect(() => {
    return () => {
      if (autosaveDebounceRef.current) {
        clearTimeout(autosaveDebounceRef.current);
      }
      if (copiedDocumentTimerRef.current) {
        clearTimeout(copiedDocumentTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!draft || draft.isNew) return;
    if (documentConflict?.key === draft.key) return;
    const existing = sortedDocuments.find((doc) => doc.key === draft.key);
    if (!existing) return;
    const hasChanges =
      existing.body !== draft.body ||
      (existing.title ?? "") !== draft.title;
    if (!hasChanges) {
      if (autosaveState !== "saved") {
        resetAutosaveState();
      }
      return;
    }
    markDocumentDirty(draft.key);
    if (autosaveDebounceRef.current) {
      clearTimeout(autosaveDebounceRef.current);
    }
    autosaveDebounceRef.current = setTimeout(() => {
      void commitDraft(draft, { clearAfterSave: false, trackAutosave: true });
    }, DOCUMENT_AUTOSAVE_DEBOUNCE_MS);

    return () => {
      if (autosaveDebounceRef.current) {
        clearTimeout(autosaveDebounceRef.current);
      }
    };
  }, [autosaveState, commitDraft, documentConflict, draft, markDocumentDirty, resetAutosaveState, sortedDocuments]);

  const documentBodyShellClassName = "mt-3";
  const documentBodyContentClassName = "paperclip-edit-in-place-content min-h-56 text-base leading-7";
  const toggleFoldedDocument = (key: string) => {
    setFoldedDocumentKeys((current) =>
      current.includes(key)
        ? current.filter((entry) => entry !== key)
        : [...current, key],
    );
  };

  return (
    <div className="space-y-3">
      {isEmpty && !draft?.isNew ? (
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
          {extraActions}
          <Button variant="outline" size="sm" onClick={beginNewDocument} className="shrink-0">
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            <span className="hidden sm:inline">New document</span>
            <span className="sm:hidden">New</span>
          </Button>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h3 className="w-full text-sm font-medium text-muted-foreground shrink-0 sm:w-auto">Documents</h3>
          <div className="flex flex-wrap items-center gap-2 min-w-0 sm:ml-auto">
            {extraActions}
            <Button variant="outline" size="sm" onClick={beginNewDocument} className="shrink-0">
              <Plus className="mr-1.5 h-3.5 w-3.5" />
              <span className="hidden sm:inline">New document</span>
              <span className="sm:hidden">New</span>
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {draft?.isNew ? (
        <NewIssueDocumentDraftForm
          draft={draft}
          keyError={newDocumentKeyError}
          isSaving={upsertDocument.isPending}
          mentions={mentions}
          imageUploadHandler={imageUploadHandler}
          setDraft={setDraft}
          onCancel={cancelDraft}
          onCommit={() => void commitDraft(draft, { clearAfterSave: false, trackAutosave: false })}
          onBlurCapture={handleDraftBlur}
          onKeyDown={handleDraftKeyDown}
        />
      ) : null}

      {!hasRealPlan && issue.legacyPlanDocument ? (
        <LegacyPlanDocumentCard
          body={issue.legacyPlanDocument.body}
          highlighted={highlightDocumentKey === "plan"}
          bodyClassName={documentBodyContentClassName}
        />
      ) : null}

      <div className="space-y-3">
        {sortedDocuments.map((doc) => (
          <IssueDocumentCard
            key={doc.id}
            document={doc}
            activeDraft={draft?.key === doc.key && !draft.isNew ? draft : null}
            activeConflict={documentConflict?.key === doc.key ? documentConflict : null}
            rawRevisionHistory={getDocumentRevisions(doc.key)}
            selectedRevisionId={selectedRevisionIds[doc.key] ?? null}
            isRevisionMenuOpen={revisionMenuOpenKey === doc.key}
            isFetchingDocumentRevisions={isFetchingDocumentRevisions}
            highlighted={highlightDocumentKey === doc.key}
            isFolded={foldedDocumentKeys.includes(doc.key)}
            isCopied={copiedDocumentKey === doc.key}
            canDeleteDocuments={canDeleteDocuments}
            isConfirmingDelete={confirmDeleteKey === doc.key}
            isDeleting={deleteDocument.isPending}
            isSaving={upsertDocument.isPending}
            isRestoring={restoreDocumentRevision.isPending && restoreDocumentRevision.variables?.key === doc.key}
            autosaveState={autosaveState}
            autosaveDocumentKey={autosaveDocumentKey}
            bodyShellClassName={documentBodyShellClassName}
            bodyContentClassName={documentBodyContentClassName}
            mentions={mentions}
            imageUploadHandler={imageUploadHandler}
            feedbackDataSharingPreference={feedbackDataSharingPreference}
            feedbackTermsUrl={feedbackTermsUrl}
            activeFeedbackVote={doc.latestRevisionId ? feedbackVoteByTargetId.get(doc.latestRevisionId) ?? null : null}
            onVote={onVote}
            setDraft={setDraft}
            commitDraft={commitDraft}
            markDocumentDirty={markDocumentDirty}
            onToggleFold={toggleFoldedDocument}
            onRevisionMenuOpenChange={(key, open) => setRevisionMenuOpenKey(open ? key : null)}
            onPreviewRevision={previewRevision}
            onCopyDocumentBody={copyDocumentBody}
            onBeginEdit={beginEdit}
            onOpenDiff={setDiffViewKey}
            onConfirmDelete={setConfirmDeleteKey}
            onDelete={(key) => deleteDocument.mutate(key)}
            onReturnToLatestRevision={returnToLatestRevision}
            onRestoreRevision={(key, revisionId) => restoreDocumentRevision.mutate({ key, revisionId })}
            onToggleConflictRemote={(key) =>
              setDocumentConflict((current) =>
                current?.key === key ? { ...current, showRemote: !current.showRemote } : current,
              )
            }
            onKeepConflictedDraft={keepConflictedDraft}
            onReloadDocumentFromServer={reloadDocumentFromServer}
            onOverwriteDocumentFromDraft={(key) => void overwriteDocumentFromDraft(key)}
            onDraftBlur={handleDraftBlur}
            onDraftKeyDown={handleDraftKeyDown}
          />
        ))}
      </div>

      {diffViewKey && (() => {
        const diffDoc = sortedDocuments.find((d) => d.key === diffViewKey);
        if (!diffDoc) return null;
        return (
          <DocumentDiffModal
            issueId={issue.id}
            documentKey={diffDoc.key}
            latestRevisionNumber={diffDoc.latestRevisionNumber}
            open
            onOpenChange={(open) => { if (!open) setDiffViewKey(null); }}
          />
        );
      })()}
    </div>
  );
}
