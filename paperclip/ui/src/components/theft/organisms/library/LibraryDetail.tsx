import type { IssueDocument } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Download, ExternalLink, FileText, Pin, PinOff, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MarkdownBody } from "@/components/MarkdownBody";
import { TheftChip, TheftSectionHeader, TheftSurface } from "@/components/theft";
import type { LibraryItem } from "@/lib/library-items";
import { formatBytes, itemKindLabel } from "@/lib/libraryPage";
import { formatDateTime } from "@/lib/utils";

export function LibraryDetail({
  item,
  pinned,
  onTogglePin,
  document,
  documentLoading,
  documentDraft,
  onDocumentDraftChange,
  editingDocument,
  onEditDocument,
  onCancelDocumentEdit,
  onSaveDocument,
  saveError,
  saving,
}: {
  item: LibraryItem;
  pinned: boolean;
  onTogglePin: () => void;
  document: IssueDocument | null;
  documentLoading: boolean;
  documentDraft: string;
  onDocumentDraftChange: (value: string) => void;
  editingDocument: boolean;
  onEditDocument: () => void;
  onCancelDocumentEdit: () => void;
  onSaveDocument: () => void;
  saveError: Error | null;
  saving: boolean;
}) {
  return (
    <div className="mx-auto max-w-5xl">
      <TheftSectionHeader
        eyebrow="Artifact inspector"
        title={(
          <span className="flex min-w-0 flex-wrap items-center gap-2">
            <span className="truncate">{item.title}</span>
            {item.isImportant ? <TheftChip tone="important">Important</TheftChip> : null}
          </span>
        )}
        description={`${itemKindLabel(item)} · ${item.department} · ${item.provenance}`}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={onTogglePin}>
              {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
              {pinned ? "Unpin" : "Pin"}
            </Button>
            {item.href ? (
              <Button variant="outline" size="sm" asChild>
                <a href={item.href} target={item.href.startsWith("/api/") ? undefined : "_blank"} rel="noreferrer">
                  {item.kind === "attachment" ? <Download className="h-4 w-4" /> : <ExternalLink className="h-4 w-4" />}
                  Open
                </a>
              </Button>
            ) : null}
          </div>
        )}
      />

      <LibraryMetadata item={item} />

      <div className="mt-5">
        {item.kind === "document" ? (
          <LibraryDocumentBody
            document={document}
            documentLoading={documentLoading}
            documentDraft={documentDraft}
            onDocumentDraftChange={onDocumentDraftChange}
            editingDocument={editingDocument}
            onEditDocument={onEditDocument}
            onCancelDocumentEdit={onCancelDocumentEdit}
            onSaveDocument={onSaveDocument}
            saveError={saveError}
            saving={saving}
          />
        ) : (
          <LibraryNonDocumentBody item={item} />
        )}
      </div>
    </div>
  );
}

function LibraryMetadata({ item }: { item: LibraryItem }) {
  return (
    <dl className="mt-5 grid min-w-0 gap-3 border-y border-border py-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
      <div className="min-w-0">
        <dt className="text-xs uppercase text-muted-foreground">Source task</dt>
        <dd className="mt-1 break-words font-medium [overflow-wrap:anywhere]">
          <Link className="hover:underline" to={`/issues/${item.issueId}`}>
            {item.sourceTaskLabel}
          </Link>
        </dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs uppercase text-muted-foreground">Owner department</dt>
        <dd className="mt-1 break-words font-medium">{item.department}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs uppercase text-muted-foreground">Provenance</dt>
        <dd className="mt-1 break-words font-medium [overflow-wrap:anywhere]">{item.provenance}</dd>
      </div>
      <div className="min-w-0">
        <dt className="text-xs uppercase text-muted-foreground">Updated</dt>
        <dd className="mt-1 break-words font-medium">{formatDateTime(item.updatedAt)}</dd>
      </div>
    </dl>
  );
}

function LibraryDocumentBody({
  document,
  documentLoading,
  documentDraft,
  onDocumentDraftChange,
  editingDocument,
  onEditDocument,
  onCancelDocumentEdit,
  onSaveDocument,
  saveError,
  saving,
}: {
  document: IssueDocument | null;
  documentLoading: boolean;
  documentDraft: string;
  onDocumentDraftChange: (value: string) => void;
  editingDocument: boolean;
  onEditDocument: () => void;
  onCancelDocumentEdit: () => void;
  onSaveDocument: () => void;
  saveError: Error | null;
  saving: boolean;
}) {
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold">Artifact body</h3>
        {document && !editingDocument ? (
          <Button variant="outline" size="sm" onClick={onEditDocument}>
            <FileText className="h-4 w-4" />
            Edit markdown
          </Button>
        ) : null}
      </div>
      {documentLoading ? (
        <div className="text-sm text-muted-foreground">Loading document...</div>
      ) : !document ? (
        <TheftSurface tone="plain" padding="md" className="text-sm text-muted-foreground">
          This document could not be loaded from the task record.
        </TheftSurface>
      ) : editingDocument ? (
        <EditableDocument
          document={document}
          documentDraft={documentDraft}
          onDocumentDraftChange={onDocumentDraftChange}
          onCancelDocumentEdit={onCancelDocumentEdit}
          onSaveDocument={onSaveDocument}
          saveError={saveError}
          saving={saving}
        />
      ) : (
        <TheftSurface tone="plain" padding="md" className="text-foreground">
          <MarkdownBody>{document.body || "_Empty document_"}</MarkdownBody>
        </TheftSurface>
      )}
    </div>
  );
}

function EditableDocument({
  document,
  documentDraft,
  onDocumentDraftChange,
  onCancelDocumentEdit,
  onSaveDocument,
  saveError,
  saving,
}: {
  document: IssueDocument;
  documentDraft: string;
  onDocumentDraftChange: (value: string) => void;
  onCancelDocumentEdit: () => void;
  onSaveDocument: () => void;
  saveError: Error | null;
  saving: boolean;
}) {
  return (
    <div className="space-y-3">
      <Textarea
        value={documentDraft}
        onChange={(event) => onDocumentDraftChange(event.target.value)}
        className="theft-library-editor font-mono text-sm"
        aria-label="Markdown document body"
      />
      {saveError ? <p className="text-sm text-destructive">{saveError.message}</p> : null}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancelDocumentEdit} disabled={saving}>
          Cancel
        </Button>
        <Button size="sm" onClick={onSaveDocument} disabled={saving || documentDraft === document.body}>
          <Save className="h-4 w-4" />
          Save
        </Button>
      </div>
    </div>
  );
}

function LibraryNonDocumentBody({ item }: { item: LibraryItem }) {
  return (
    <TheftSurface tone="plain" padding="md" className="text-foreground">
      <h3 className="text-sm font-semibold">Artifact body</h3>
      <p className="mt-2 text-sm text-muted-foreground">{item.subtitle}</p>
      <p className="mt-2 text-xs text-muted-foreground">{item.reviewState ?? item.status ?? itemKindLabel(item)}</p>
      {item.contentType || item.byteSize ? (
        <p className="mt-3 text-sm text-muted-foreground">
          {[item.contentType, formatBytes(item.byteSize)].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {item.kind === "work_product" && !item.href ? (
        <p className="mt-3 text-sm text-muted-foreground">
          This work product has no external URL yet. It is still tracked as company runtime output.
        </p>
      ) : null}
    </TheftSurface>
  );
}
