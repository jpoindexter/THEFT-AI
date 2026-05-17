import type { Dispatch, FocusEvent, KeyboardEvent, SetStateAction } from "react";
import type {
  DocumentRevision,
  FeedbackDataSharingPreference,
  FeedbackVoteValue,
  IssueDocument,
} from "@paperclipai/shared";
import { Check, ChevronDown, ChevronRight, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { AutosaveState } from "../../hooks/useAutosaveIndicator";
import { deriveDocumentRevisionState } from "../../lib/document-revisions";
import { cn, relativeTime } from "../../lib/utils";
import { MarkdownEditor, type MentionOption } from "../MarkdownEditor";
import { OutputFeedbackButtons } from "../OutputFeedbackButtons";
import {
  DocumentAutosaveStatus,
  DocumentConflictNotice,
  HistoricalRevisionNotice,
  IssueDocumentActionsMenu,
  IssueDocumentDeleteConfirm,
} from "./IssueDocumentCardParts";
import { IssueDocumentRevisionMenu } from "./IssueDocumentRevisionMenu";
import {
  isPlanKey,
  renderFoldableBody,
  titlesMatchKey,
  type DocumentConflictState,
  type DraftState,
} from "./IssueDocumentUtils";

type CommitDraft = (
  currentDraft: DraftState | null,
  options?: { clearAfterSave?: boolean; trackAutosave?: boolean; overrideConflict?: boolean },
) => Promise<boolean>;

interface IssueDocumentCardProps {
  document: IssueDocument;
  activeDraft: DraftState | null;
  activeConflict: DocumentConflictState | null;
  rawRevisionHistory: DocumentRevision[];
  selectedRevisionId: string | null;
  isRevisionMenuOpen: boolean;
  isFetchingDocumentRevisions: boolean;
  highlighted: boolean;
  isFolded: boolean;
  isCopied: boolean;
  canDeleteDocuments: boolean;
  isConfirmingDelete: boolean;
  isDeleting: boolean;
  isSaving: boolean;
  isRestoring: boolean;
  autosaveState: AutosaveState;
  autosaveDocumentKey: string | null;
  bodyShellClassName: string;
  bodyContentClassName: string;
  mentions?: MentionOption[];
  imageUploadHandler?: (file: File) => Promise<string>;
  feedbackDataSharingPreference: FeedbackDataSharingPreference;
  feedbackTermsUrl: string | null;
  activeFeedbackVote: FeedbackVoteValue | null;
  onVote?: (
    revisionId: string,
    vote: FeedbackVoteValue,
    options?: { allowSharing?: boolean; reason?: string },
  ) => Promise<void>;
  setDraft: Dispatch<SetStateAction<DraftState | null>>;
  commitDraft: CommitDraft;
  markDocumentDirty: (key: string) => void;
  onToggleFold: (key: string) => void;
  onRevisionMenuOpenChange: (key: string, open: boolean) => void;
  onPreviewRevision: (document: IssueDocument, revisionId: string) => void;
  onCopyDocumentBody: (key: string, body: string) => void | Promise<void>;
  onBeginEdit: (key: string) => void;
  onOpenDiff: (key: string) => void;
  onConfirmDelete: (key: string | null) => void;
  onDelete: (key: string) => void;
  onReturnToLatestRevision: (key: string) => void;
  onRestoreRevision: (key: string, revisionId: string) => void;
  onToggleConflictRemote: (key: string) => void;
  onKeepConflictedDraft: (key: string) => void;
  onReloadDocumentFromServer: (key: string) => void;
  onOverwriteDocumentFromDraft: (key: string) => void;
  onDraftBlur: (event: FocusEvent<HTMLDivElement>) => void | Promise<void>;
  onDraftKeyDown: (event: KeyboardEvent) => void | Promise<void>;
}

export function IssueDocumentCard(props: IssueDocumentCardProps) {
  const doc = props.document;
  const revisionState = deriveDocumentRevisionState(doc, props.rawRevisionHistory);
  const selectedHistoricalRevision = props.selectedRevisionId
    ? revisionState.revisions.find((revision) => revision.id === props.selectedRevisionId) ?? null
    : null;
  const isHistoricalPreview = Boolean(selectedHistoricalRevision);
  const displayedTitle = selectedHistoricalRevision?.title ?? props.activeDraft?.title ?? revisionState.currentRevision.title ?? "";
  const displayedBody = selectedHistoricalRevision?.body ?? props.activeDraft?.body ?? revisionState.currentRevision.body;
  const displayedRevisionNumber = selectedHistoricalRevision?.revisionNumber ?? revisionState.currentRevision.revisionNumber;
  const displayedUpdatedAt = selectedHistoricalRevision?.createdAt ?? revisionState.currentRevision.createdAt;
  const showTitle = !isPlanKey(doc.key) && !!displayedTitle.trim() && !titlesMatchKey(displayedTitle, doc.key);
  const canVoteOnDocument = Boolean(doc.latestRevisionId && doc.updatedByAgentId && !doc.updatedByUserId && props.onVote);

  return (
    <div
      id={`document-${doc.key}`}
      className={cn(
        "rounded-lg border border-border p-3 transition-colors duration-1000",
        props.highlighted && "border-primary/50 bg-primary/5",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              type="button"
              variant="ghost"
              size="icon-xs"
              className="size-5 rounded-sm text-muted-foreground hover:bg-accent/60 hover:text-foreground"
              onClick={() => props.onToggleFold(doc.key)}
              aria-label={props.isFolded ? `Expand ${doc.key} document` : `Collapse ${doc.key} document`}
              aria-expanded={!props.isFolded}
            >
              {props.isFolded ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </Button>
            <span className="shrink-0 rounded-full border border-border px-2 py-0.5 font-mono text-nano uppercase tracking-widest text-muted-foreground">
              {doc.key}
            </span>
            <IssueDocumentRevisionMenu
              document={doc}
              isOpen={props.isRevisionMenuOpen}
              isFetching={props.isFetchingDocumentRevisions}
              isHistoricalPreview={isHistoricalPreview}
              displayedRevisionNumber={displayedRevisionNumber}
              selectedRevisionId={props.selectedRevisionId}
              currentRevision={revisionState.currentRevision}
              revisionHistory={revisionState.revisions}
              rawRevisionHistoryLength={props.rawRevisionHistory.length}
              onOpenChange={(open) => props.onRevisionMenuOpenChange(doc.key, open)}
              onPreviewRevision={props.onPreviewRevision}
            />
            <a
              href={`#document-${encodeURIComponent(doc.key)}`}
              className="truncate text-micro text-muted-foreground transition-colors hover:text-foreground hover:underline"
            >
              updated {relativeTime(displayedUpdatedAt)}
            </a>
          </div>
          {showTitle ? <p className="mt-2 text-sm font-medium">{displayedTitle}</p> : null}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-xs"
            className={cn("text-muted-foreground transition-colors", props.isCopied && "text-foreground")}
            title={props.isCopied ? "Copied" : "Copy document"}
            onClick={() => void props.onCopyDocumentBody(doc.key, displayedBody)}
          >
            {props.isCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </Button>
          <IssueDocumentActionsMenu
            document={doc}
            displayedBody={displayedBody}
            isHistoricalPreview={isHistoricalPreview}
            canDeleteDocuments={props.canDeleteDocuments}
            onBeginEdit={props.onBeginEdit}
            onOpenDiff={props.onOpenDiff}
            onConfirmDelete={props.onConfirmDelete}
          />
        </div>
      </div>

      {!props.isFolded ? <IssueDocumentCardBody {...props} displayedBody={displayedBody} isHistoricalPreview={isHistoricalPreview} selectedHistoricalRevision={selectedHistoricalRevision} canVoteOnDocument={canVoteOnDocument} /> : null}
      {props.isConfirmingDelete ? <IssueDocumentDeleteConfirm documentKey={doc.key} isDeleting={props.isDeleting} onCancel={() => props.onConfirmDelete(null)} onDelete={props.onDelete} /> : null}
    </div>
  );
}

function IssueDocumentCardBody(props: IssueDocumentCardProps & {
  displayedBody: string;
  isHistoricalPreview: boolean;
  selectedHistoricalRevision: DocumentRevision | null;
  canVoteOnDocument: boolean;
}) {
  const doc = props.document;
  return (
    <div
      className="mt-3 space-y-3"
      onBlurCapture={!props.isHistoricalPreview && props.activeDraft ? props.onDraftBlur : undefined}
      onKeyDown={!props.isHistoricalPreview && props.activeDraft ? props.onDraftKeyDown : undefined}
    >
      {props.isHistoricalPreview && props.selectedHistoricalRevision ? (
        <HistoricalRevisionNotice
          documentKey={doc.key}
          revision={props.selectedHistoricalRevision}
          isRestoring={props.isRestoring}
          onReturnToLatestRevision={props.onReturnToLatestRevision}
          onRestoreRevision={props.onRestoreRevision}
        />
      ) : null}
      {props.activeConflict && !props.isHistoricalPreview ? (
        <DocumentConflictNotice conflict={props.activeConflict} {...props} />
      ) : null}
      {props.activeDraft && !isPlanKey(doc.key) && !props.isHistoricalPreview ? (
        <Input
          value={props.activeDraft.title}
          onChange={(event) => {
            props.markDocumentDirty(doc.key);
            props.setDraft((current) => current ? { ...current, title: event.target.value } : current);
          }}
          placeholder="Optional title"
        />
      ) : null}
      <div className={`${props.bodyShellClassName} ${props.activeDraft || props.isHistoricalPreview ? "" : "rounded-md hover:bg-accent/10"}`}>
        {props.isHistoricalPreview ? (
          renderFoldableBody(props.displayedBody, props.bodyContentClassName)
        ) : props.activeDraft ? (
          <MarkdownEditor
            value={props.displayedBody}
            onChange={(body) => {
              props.markDocumentDirty(doc.key);
              props.setDraft((current) => current && current.key === doc.key && !current.isNew ? { ...current, body } : current);
            }}
            placeholder="Markdown body"
            bordered={false}
            className="bg-transparent"
            contentClassName={props.bodyContentClassName}
            mentions={props.mentions}
            imageUploadHandler={props.imageUploadHandler}
            onSubmit={() => void props.commitDraft(props.activeDraft, { clearAfterSave: false, trackAutosave: true })}
          />
        ) : (
          renderFoldableBody(props.displayedBody, props.bodyContentClassName)
        )}
      </div>
      <DocumentAutosaveStatus {...props} documentKey={doc.key} />
      {props.canVoteOnDocument && doc.latestRevisionId ? (
        <OutputFeedbackButtons
          activeVote={props.activeFeedbackVote}
          sharingPreference={props.feedbackDataSharingPreference}
          termsUrl={props.feedbackTermsUrl}
          onVote={(vote, options) => props.onVote?.(doc.latestRevisionId!, vote, options) ?? Promise.resolve()}
        />
      ) : null}
    </div>
  );
}
