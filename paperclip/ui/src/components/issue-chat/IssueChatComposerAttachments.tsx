import { AlertTriangle, Check, Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

import {
  formatAttachmentSize,
  type ComposerAttachmentItem,
} from "./ComposerHelpers";

export function IssueChatComposerAttachments({
  attachments,
}: {
  attachments: ComposerAttachmentItem[];
}) {
  if (attachments.length === 0) return null;

  return (
    <div
      data-testid="issue-chat-composer-attachments"
      className="mb-3 mt-2 space-y-1.5 rounded-md border border-dashed border-border/80 bg-muted/20 p-2"
    >
      {attachments.map((attachment) => {
        const sizeLabel = formatAttachmentSize(attachment.size);
        const statusLabel =
          attachment.status === "uploading"
            ? "Uploading to issue"
            : attachment.status === "error"
              ? attachment.error ?? "Upload failed"
              : attachment.inline
                ? "Inserted inline"
                : "Attached to issue";

        return (
          <div
            key={attachment.id}
            className={cn(
              "flex min-w-0 items-center gap-2 rounded-sm px-2 py-1.5 text-xs",
              attachment.status === "error"
                ? "bg-destructive/10 text-destructive"
                : "bg-background/70 text-muted-foreground",
            )}
          >
            {attachment.status === "uploading" ? (
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
            ) : attachment.status === "attached" ? (
              <Check className="h-3.5 w-3.5 shrink-0 text-green-600 dark:text-green-400" />
            ) : (
              <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            )}
            <span className="min-w-0 flex-1 truncate font-medium text-foreground">
              {attachment.name}
            </span>
            {sizeLabel ? (
              <span className="shrink-0 text-muted-foreground">{sizeLabel}</span>
            ) : null}
            <span className="shrink-0 text-muted-foreground">{statusLabel}</span>
          </div>
        );
      })}
    </div>
  );
}
