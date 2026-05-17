import { useState, type DragEvent, type ReactNode } from "react";
import { Trash2 } from "lucide-react";
import type { IssueAttachment } from "@paperclipai/shared";

import { Button } from "@/components/ui/button";

import { IssueSectionSkeleton } from "./IssueSectionSkeleton";

type IssueAttachmentsSectionProps = {
  initialLoading: boolean;
  imageAttachments: IssueAttachment[];
  nonImageAttachments: IssueAttachment[];
  uploadAction: ReactNode;
  error: string | null;
  deletePending: boolean;
  onOpenImage: (attachment: IssueAttachment) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onDragActiveChange: (active: boolean) => void;
  onDropFiles: (files: File[]) => void;
};

export function IssueAttachmentsSection({
  initialLoading,
  imageAttachments,
  nonImageAttachments,
  uploadAction,
  error,
  deletePending,
  onOpenImage,
  onDeleteAttachment,
  onDragActiveChange,
  onDropFiles,
}: IssueAttachmentsSectionProps) {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const hasAttachments = imageAttachments.length > 0 || nonImageAttachments.length > 0;

  if (initialLoading) {
    return <IssueSectionSkeleton titleWidth="w-24" rows={2} />;
  }

  if (!hasAttachments) return null;

  function handleDrop(evt: DragEvent<HTMLDivElement>) {
    evt.preventDefault();
    onDragActiveChange(false);
    const files = Array.from(evt.dataTransfer.files ?? []);
    if (files.length > 0) onDropFiles(files);
  }

  return (
    <div
      className="space-y-3 rounded-lg transition-colors"
      onDragEnter={(evt) => {
        evt.preventDefault();
        onDragActiveChange(true);
      }}
      onDragOver={(evt) => {
        evt.preventDefault();
        onDragActiveChange(true);
      }}
      onDragLeave={(evt) => {
        if (evt.currentTarget.contains(evt.relatedTarget as Node | null)) return;
        onDragActiveChange(false);
      }}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-medium text-muted-foreground">Attachments</h3>
        {uploadAction}
      </div>

      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : null}

      {imageAttachments.length > 0 ? (
        <div className="grid grid-cols-4 gap-2">
          {imageAttachments.map((attachment) => (
            <div
              key={attachment.id}
              className="group relative aspect-square cursor-pointer overflow-hidden rounded-lg border border-border bg-accent/10"
              onClick={() => onOpenImage(attachment)}
            >
              <img
                src={attachment.contentPath}
                alt={attachment.originalFilename ?? "attachment"}
                className="h-full w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
              {confirmDeleteId === attachment.id ? (
                <div
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 bg-black/60"
                  onClick={(event) => event.stopPropagation()}
                >
                  <p className="text-xs font-medium text-white">Delete?</p>
                  <div className="flex gap-1.5">
                    <Button
                      type="button"
                      variant="destructive"
                      size="xs"
                      className="h-6 px-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteAttachment(attachment.id);
                        setConfirmDeleteId(null);
                      }}
                      disabled={deletePending}
                    >
                      Yes
                    </Button>
                    <Button
                      type="button"
                      variant="secondary"
                      size="xs"
                      className="h-6 px-2"
                      onClick={(event) => {
                        event.stopPropagation();
                        setConfirmDeleteId(null);
                      }}
                    >
                      No
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute right-1.5 top-1.5 bg-black/50 text-white opacity-0 transition-opacity hover:bg-destructive hover:text-white group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation();
                    setConfirmDeleteId(attachment.id);
                  }}
                  title="Delete attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {nonImageAttachments.length > 0 ? (
        <div className="space-y-2">
          {nonImageAttachments.map((attachment) => (
            <div key={attachment.id} className="rounded-md border border-border p-2">
              <div className="flex items-center justify-between gap-2">
                <a
                  href={attachment.contentPath}
                  target="_blank"
                  rel="noreferrer"
                  className="truncate text-xs hover:underline"
                  title={attachment.originalFilename ?? attachment.id}
                >
                  {attachment.originalFilename ?? attachment.id}
                </a>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => onDeleteAttachment(attachment.id)}
                  disabled={deletePending}
                  title="Delete attachment"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                {attachment.contentType} · {(attachment.byteSize / 1024).toFixed(1)} KB
              </p>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
