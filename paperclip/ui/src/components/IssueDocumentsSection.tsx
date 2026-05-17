import { useState, type ReactNode } from "react";
import type {
  FeedbackDataSharingPreference,
  FeedbackVote,
  FeedbackVoteValue,
  Issue,
} from "@paperclipai/shared";
import { Plus } from "lucide-react";

import { useLocation } from "@/lib/router";
import { Button } from "@/components/ui/button";
import type { MentionOption } from "./MarkdownEditor";
import { DocumentDiffModal } from "./DocumentDiffModal";
import { IssueDocumentCard } from "./issue-documents/IssueDocumentCard";
import { LegacyPlanDocumentCard } from "./issue-documents/LegacyPlanDocumentCard";
import { NewIssueDocumentDraftForm } from "./issue-documents/NewIssueDocumentDraftForm";
import { useIssueDocumentData } from "./issue-documents/useIssueDocumentData";
import { useIssueDocumentEditor } from "./issue-documents/useIssueDocumentEditor";
import { useIssueDocumentFoldState } from "./issue-documents/useIssueDocumentFoldState";

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
  const location = useLocation();
  const [revisionMenuOpenKey, setRevisionMenuOpenKey] = useState<string | null>(null);

  const {
    feedbackVoteByTargetId,
    getDocumentRevisions,
    invalidateIssueDocuments,
    isFetchingDocumentRevisions,
    sortedDocuments,
    syncDocumentCaches,
  } = useIssueDocumentData({ issue, feedbackVotes, revisionMenuOpenKey });

  const {
    foldedDocumentKeys,
    highlightDocumentKey,
    setFoldedDocumentKeys,
    toggleFoldedDocument,
  } = useIssueDocumentFoldState({
    issueId: issue.id,
    hasLegacyPlanDocument: Boolean(issue.legacyPlanDocument),
    locationHash: location.hash,
    sortedDocuments,
  });

  const editor = useIssueDocumentEditor({
    issueId: issue.id,
    sortedDocuments,
    getDocumentRevisions,
    invalidateIssueDocuments,
    revisionMenuOpenKey,
    setRevisionMenuOpenKey,
    syncDocumentCaches,
    setFoldedDocumentKeys,
  });

  const draft = editor.draft;
  const hasRealPlan = sortedDocuments.some((doc) => doc.key === "plan");
  const isEmpty = sortedDocuments.length === 0 && !issue.legacyPlanDocument;
  const diffDoc = editor.diffViewKey ? sortedDocuments.find((doc) => doc.key === editor.diffViewKey) ?? null : null;
  const documentBodyShellClassName = "mt-3";
  const documentBodyContentClassName = "paperclip-edit-in-place-content min-h-56 text-base leading-7";

  return (
    <div className="space-y-3">
      {isEmpty && !draft?.isNew ? (
        <div className="flex flex-wrap items-center justify-end gap-2 min-w-0">
          {extraActions}
          <NewDocumentButton onClick={editor.beginNewDocument} />
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <h3 className="w-full text-sm font-medium text-muted-foreground shrink-0 sm:w-auto">Documents</h3>
          <div className="flex flex-wrap items-center gap-2 min-w-0 sm:ml-auto">
            {extraActions}
            <NewDocumentButton onClick={editor.beginNewDocument} />
          </div>
        </div>
      )}

      {editor.error && <p className="text-xs text-destructive">{editor.error}</p>}

      {draft?.isNew ? (
        <NewIssueDocumentDraftForm
          draft={draft}
          keyError={editor.newDocumentKeyError}
          isSaving={editor.isSaving}
          mentions={mentions}
          imageUploadHandler={imageUploadHandler}
          setDraft={editor.setDraft}
          onCancel={editor.cancelDraft}
          onCommit={() => void editor.commitDraft(draft, { clearAfterSave: false, trackAutosave: false })}
          onBlurCapture={editor.handleDraftBlur}
          onKeyDown={editor.handleDraftKeyDown}
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
            activeConflict={editor.documentConflict?.key === doc.key ? editor.documentConflict : null}
            rawRevisionHistory={getDocumentRevisions(doc.key)}
            selectedRevisionId={editor.selectedRevisionIds[doc.key] ?? null}
            isRevisionMenuOpen={revisionMenuOpenKey === doc.key}
            isFetchingDocumentRevisions={isFetchingDocumentRevisions}
            highlighted={highlightDocumentKey === doc.key}
            isFolded={foldedDocumentKeys.includes(doc.key)}
            isCopied={editor.copiedDocumentKey === doc.key}
            canDeleteDocuments={canDeleteDocuments}
            isConfirmingDelete={editor.confirmDeleteKey === doc.key}
            isDeleting={editor.isDeleting}
            isSaving={editor.isSaving}
            isRestoring={editor.isRestoring && editor.restoringKey === doc.key}
            autosaveState={editor.autosaveState}
            autosaveDocumentKey={editor.autosaveDocumentKey}
            bodyShellClassName={documentBodyShellClassName}
            bodyContentClassName={documentBodyContentClassName}
            mentions={mentions}
            imageUploadHandler={imageUploadHandler}
            feedbackDataSharingPreference={feedbackDataSharingPreference}
            feedbackTermsUrl={feedbackTermsUrl}
            activeFeedbackVote={doc.latestRevisionId ? feedbackVoteByTargetId.get(doc.latestRevisionId) ?? null : null}
            onVote={onVote}
            setDraft={editor.setDraft}
            commitDraft={editor.commitDraft}
            markDocumentDirty={editor.markDocumentDirty}
            onToggleFold={toggleFoldedDocument}
            onRevisionMenuOpenChange={(key, open) => setRevisionMenuOpenKey(open ? key : null)}
            onPreviewRevision={editor.previewRevision}
            onCopyDocumentBody={editor.copyDocumentBody}
            onBeginEdit={editor.beginEdit}
            onOpenDiff={editor.setDiffViewKey}
            onConfirmDelete={editor.setConfirmDeleteKey}
            onDelete={editor.deleteDocument}
            onReturnToLatestRevision={editor.returnToLatestRevision}
            onRestoreRevision={editor.restoreDocumentRevision}
            onToggleConflictRemote={(key) =>
              editor.setDocumentConflict((current) =>
                current?.key === key ? { ...current, showRemote: !current.showRemote } : current,
              )
            }
            onKeepConflictedDraft={editor.keepConflictedDraft}
            onReloadDocumentFromServer={editor.reloadDocumentFromServer}
            onOverwriteDocumentFromDraft={(key) => void editor.overwriteDocumentFromDraft(key)}
            onDraftBlur={editor.handleDraftBlur}
            onDraftKeyDown={editor.handleDraftKeyDown}
          />
        ))}
      </div>

      {diffDoc ? (
        <DocumentDiffModal
          issueId={issue.id}
          documentKey={diffDoc.key}
          latestRevisionNumber={diffDoc.latestRevisionNumber}
          open
          onOpenChange={(open) => { if (!open) editor.setDiffViewKey(null); }}
        />
      ) : null}
    </div>
  );
}

function NewDocumentButton({ onClick }: { onClick: () => void }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="shrink-0">
      <Plus className="mr-1.5 h-3.5 w-3.5" />
      <span className="hidden sm:inline">New document</span>
      <span className="sm:hidden">New</span>
    </Button>
  );
}
