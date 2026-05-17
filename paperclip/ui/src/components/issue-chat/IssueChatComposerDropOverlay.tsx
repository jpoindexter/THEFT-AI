import { Paperclip } from "lucide-react";

export function IssueChatComposerDropOverlay() {
  return (
    <div
      data-testid="issue-chat-composer-drop-overlay"
      className="pointer-events-none absolute inset-2 z-30 flex items-center justify-center rounded-sm border border-dashed border-primary/55 bg-background/75 px-4 py-3 text-center shadow-sm backdrop-blur-sm dark:bg-background/65"
    >
      <div className="flex max-w-md items-center gap-3 rounded-md bg-background/80 px-3 py-2 text-left shadow-sm ring-1 ring-border/60">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <Paperclip className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <div className="text-sm font-medium text-foreground">Drop to upload</div>
          <div className="mt-0.5 text-xs leading-5 text-muted-foreground">
            Images insert into the reply. Other files are added to this issue.
          </div>
        </div>
      </div>
    </div>
  );
}
