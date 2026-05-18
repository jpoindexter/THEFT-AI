import { memo, useEffect, useState, type DragEvent, type RefObject } from "react";
import { FileText, Paperclip, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "../../lib/utils";
import { MarkdownEditor, type MarkdownEditorRef, type MentionOption } from "../MarkdownEditor";
import type { StagedIssueFile } from "./useStagedIssueFiles";

type NewIssueDescriptionSectionProps = {
  value: string;
  expanded: boolean;
  mentions: MentionOption[];
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  imageUploadHandler: (file: File) => Promise<string>;
  stagedFiles: StagedIssueFile[];
  isFileDragOver: boolean;
  pending: boolean;
  onChange: (value: string) => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
  onRemoveStagedFile: (id: string) => void;
};

const IssueDescriptionEditor = memo(function IssueDescriptionEditor({
  value,
  expanded,
  mentions,
  descriptionEditorRef,
  imageUploadHandler,
  onChange,
}: {
  value: string;
  expanded: boolean;
  mentions: MentionOption[];
  descriptionEditorRef: RefObject<MarkdownEditorRef | null>;
  imageUploadHandler: (file: File) => Promise<string>;
  onChange: (value: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(value);

  useEffect(() => {
    setDraftValue(value);
  }, [value]);

  return (
    <MarkdownEditor
      ref={descriptionEditorRef}
      value={draftValue}
      onChange={(nextValue) => {
        setDraftValue(nextValue);
        onChange(nextValue);
      }}
      placeholder="Add description..."
      bordered={false}
      mentions={mentions}
      contentClassName={cn("text-sm text-muted-foreground pb-12", expanded ? "min-h-56" : "min-h-32")}
      imageUploadHandler={imageUploadHandler}
    />
  );
});

function formatFileSize(file: File) {
  if (file.size < 1024) return `${file.size} B`;
  if (file.size < 1024 * 1024) return `${(file.size / 1024).toFixed(1)} KB`;
  return `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
}

export function NewIssueDescriptionSection({
  value,
  expanded,
  mentions,
  descriptionEditorRef,
  imageUploadHandler,
  stagedFiles,
  isFileDragOver,
  pending,
  onChange,
  onDragEnter,
  onDragOver,
  onDragLeave,
  onDrop,
  onRemoveStagedFile,
}: NewIssueDescriptionSectionProps) {
  const stagedDocuments = stagedFiles.filter((file) => file.kind === "document");
  const stagedAttachments = stagedFiles.filter((file) => file.kind === "attachment");

  return (
    <div
      className="border-t border-border/60 px-4 pb-2 pt-3"
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <div
        className={cn(
          "rounded-md transition-colors",
          isFileDragOver && "bg-accent/20",
        )}
      >
        <IssueDescriptionEditor
          value={value}
          expanded={expanded}
          mentions={mentions}
          descriptionEditorRef={descriptionEditorRef}
          imageUploadHandler={imageUploadHandler}
          onChange={onChange}
        />
      </div>
      {stagedFiles.length > 0 ? (
        <div className="mt-4 space-y-3 rounded-lg border border-border/70 p-3">
          {stagedDocuments.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Documents</div>
              <div className="space-y-2">
                {stagedDocuments.map((file) => (
                  <div key={file.id} className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-border px-2 py-0.5 font-mono text-nano uppercase tracking-wide text-muted-foreground">
                          {file.documentKey}
                        </span>
                        <span className="truncate text-sm">{file.file.name}</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-micro text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span>{file.title || file.file.name}</span>
                        <span>•</span>
                        <span>{formatFileSize(file.file)}</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-muted-foreground"
                      onClick={() => onRemoveStagedFile(file.id)}
                      disabled={pending}
                      title="Remove document"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {stagedAttachments.length > 0 ? (
            <div className="space-y-2">
              <div className="text-xs font-medium text-muted-foreground">Attachments</div>
              <div className="space-y-2">
                {stagedAttachments.map((file) => (
                  <div key={file.id} className="flex items-start justify-between gap-3 rounded-md border border-border/70 px-3 py-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate text-sm">{file.file.name}</span>
                      </div>
                      <div className="mt-1 text-micro text-muted-foreground">
                        {file.file.type || "application/octet-stream"} • {formatFileSize(file.file)}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      className="shrink-0 text-muted-foreground"
                      onClick={() => onRemoveStagedFile(file.id)}
                      disabled={pending}
                      title="Remove attachment"
                    >
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
