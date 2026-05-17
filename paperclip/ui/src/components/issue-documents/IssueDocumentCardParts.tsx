import type { DocumentRevision, IssueDocument } from "@paperclipai/shared";
import { Diff, Download, FilePenLine, MoreHorizontal, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AutosaveState } from "../../hooks/useAutosaveIndicator";
import { cn, relativeTime } from "../../lib/utils";
import {
  downloadDocumentFile,
  isPlanKey,
  renderFoldableBody,
  type DocumentConflictState,
  type DraftState,
} from "./IssueDocumentUtils";

export function IssueDocumentActionsMenu({
  document,
  displayedBody,
  isHistoricalPreview,
  canDeleteDocuments,
  onBeginEdit,
  onOpenDiff,
  onConfirmDelete,
}: {
  document: IssueDocument;
  displayedBody: string;
  isHistoricalPreview: boolean;
  canDeleteDocuments: boolean;
  onBeginEdit: (key: string) => void;
  onOpenDiff: (key: string) => void;
  onConfirmDelete: (key: string | null) => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-xs" className="text-muted-foreground" title="Document actions">
          <MoreHorizontal className="h-3.5 w-3.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {!isHistoricalPreview ? (
          <DropdownMenuItem onClick={() => onBeginEdit(document.key)}>
            <FilePenLine className="h-3.5 w-3.5" />
            Edit document
          </DropdownMenuItem>
        ) : null}
        {!isHistoricalPreview ? <DropdownMenuSeparator /> : null}
        <DropdownMenuItem onClick={() => downloadDocumentFile(document.key, displayedBody)}>
          <Download className="h-3.5 w-3.5" />
          Download document
        </DropdownMenuItem>
        {document.latestRevisionNumber > 1 ? (
          <DropdownMenuItem onClick={() => onOpenDiff(document.key)}>
            <Diff className="h-3.5 w-3.5" />
            View diff
          </DropdownMenuItem>
        ) : null}
        {canDeleteDocuments ? <DropdownMenuSeparator /> : null}
        {canDeleteDocuments ? (
          <DropdownMenuItem variant="destructive" onClick={() => onConfirmDelete(document.key)}>
            <Trash2 className="h-3.5 w-3.5" />
            Delete document
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function HistoricalRevisionNotice({
  documentKey,
  revision,
  isRestoring,
  onReturnToLatestRevision,
  onRestoreRevision,
}: {
  documentKey: string;
  revision: DocumentRevision;
  isRestoring: boolean;
  onReturnToLatestRevision: (key: string) => void;
  onRestoreRevision: (key: string, revisionId: string) => void;
}) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-200">Viewing revision {revision.revisionNumber}</p>
          <p className="text-xs text-muted-foreground">
            This is a historical preview. Restoring it creates a new latest revision and keeps history append-only.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onReturnToLatestRevision(documentKey)}>
            Return to latest
          </Button>
          <Button size="sm" onClick={() => onRestoreRevision(documentKey, revision.id)} disabled={isRestoring}>
            {isRestoring ? "Restoring..." : "Restore this revision"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function DocumentConflictNotice({
  document,
  conflict,
  isSaving,
  onToggleConflictRemote,
  onKeepConflictedDraft,
  onReloadDocumentFromServer,
  onOverwriteDocumentFromDraft,
}: {
  document: IssueDocument;
  conflict: DocumentConflictState;
  isSaving: boolean;
  onToggleConflictRemote: (key: string) => void;
  onKeepConflictedDraft: (key: string) => void;
  onReloadDocumentFromServer: (key: string) => void;
  onOverwriteDocumentFromDraft: (key: string) => void;
}) {
  return (
    <div className="rounded-md border border-amber-500/30 bg-amber-500/5 px-3 py-3">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-200">Out of date</p>
          <p className="text-xs text-muted-foreground">
            This document changed while you were editing. Your local draft is preserved and autosave is paused.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onToggleConflictRemote(document.key)}>
            {conflict.showRemote ? "Hide remote" : "Review remote"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => onKeepConflictedDraft(document.key)}>
            Keep my draft
          </Button>
          <Button variant="outline" size="sm" onClick={() => onReloadDocumentFromServer(document.key)}>
            Reload remote
          </Button>
          <Button size="sm" onClick={() => onOverwriteDocumentFromDraft(document.key)} disabled={isSaving}>
            {isSaving ? "Saving..." : "Overwrite remote"}
          </Button>
        </div>
      </div>
      {conflict.showRemote ? (
        <div className="mt-3 rounded-md border border-border/70 bg-background/60 p-3">
          <div className="mb-2 flex items-center gap-2 text-micro text-muted-foreground">
            <span>Remote revision {conflict.serverDocument.latestRevisionNumber}</span>
            <span>•</span>
            <span>updated {relativeTime(conflict.serverDocument.updatedAt)}</span>
          </div>
          {!isPlanKey(document.key) && conflict.serverDocument.title ? (
            <p className="mb-2 text-sm font-medium">{conflict.serverDocument.title}</p>
          ) : null}
          {renderFoldableBody(conflict.serverDocument.body, "text-sm leading-7")}
        </div>
      ) : null}
    </div>
  );
}

export function DocumentAutosaveStatus({
  isHistoricalPreview,
  activeConflict,
  activeDraft,
  autosaveDocumentKey,
  autosaveState,
  documentKey,
}: {
  isHistoricalPreview: boolean;
  activeConflict: DocumentConflictState | null;
  activeDraft: DraftState | null;
  autosaveDocumentKey: string | null;
  autosaveState: AutosaveState;
  documentKey: string;
}) {
  const text = isHistoricalPreview
    ? "Viewing historical revision"
    : activeDraft && activeConflict
      ? "Out of date"
      : activeDraft && autosaveDocumentKey === documentKey
        ? autosaveState === "saving"
          ? "Autosaving..."
          : autosaveState === "saved"
            ? "Saved"
            : autosaveState === "error"
              ? "Could not save"
              : ""
        : "";
  return (
    <div className="flex min-h-4 items-center justify-end px-1">
      <span
        className={cn(
          "text-micro transition-opacity duration-150",
          isHistoricalPreview || activeConflict
            ? "text-amber-300"
            : autosaveState === "error"
              ? "text-destructive"
              : "text-muted-foreground",
          activeDraft || isHistoricalPreview ? "opacity-100" : "opacity-0",
        )}
      >
        {text}
      </span>
    </div>
  );
}

export function IssueDocumentDeleteConfirm({
  documentKey,
  isDeleting,
  onCancel,
  onDelete,
}: {
  documentKey: string;
  isDeleting: boolean;
  onCancel: () => void;
  onDelete: (key: string) => void;
}) {
  return (
    <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-destructive/20 bg-destructive/5 px-4 py-3">
      <p className="text-sm text-destructive font-medium">Delete this document? This cannot be undone.</p>
      <div className="flex items-center gap-2 shrink-0">
        <Button variant="ghost" size="sm" onClick={onCancel} disabled={isDeleting}>
          Cancel
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(documentKey)} disabled={isDeleting}>
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </div>
  );
}
