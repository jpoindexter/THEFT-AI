import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";

type NewIssueDialogFooterProps = {
  canDiscardDraft: boolean;
  errorMessage: string | null;
  isSubIssueMode: boolean;
  pending: boolean;
  titleHasText: boolean;
  onDiscardDraft: () => void;
  onSubmit: () => void;
};

export function NewIssueDialogFooter({
  canDiscardDraft,
  errorMessage,
  isSubIssueMode,
  pending,
  titleHasText,
  onDiscardDraft,
  onSubmit,
}: NewIssueDialogFooterProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2.5 border-t border-border shrink-0">
      <Button
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        onClick={onDiscardDraft}
        disabled={pending || !canDiscardDraft}
      >
        Discard Draft
      </Button>
      <div className="flex items-center gap-3">
        <div className="min-h-5 text-right">
          {pending ? (
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Creating issue...
            </span>
          ) : errorMessage ? (
            <span className="text-xs text-destructive">{errorMessage}</span>
          ) : null}
        </div>
        <Button
          size="sm"
          className="min-w-36 disabled:opacity-100"
          disabled={!titleHasText || pending}
          onClick={onSubmit}
          aria-busy={pending}
        >
          <span className="inline-flex items-center justify-center gap-1.5">
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            <span>{pending ? "Creating..." : isSubIssueMode ? "Create Sub-Issue" : "Create Issue"}</span>
          </span>
        </Button>
      </div>
    </div>
  );
}
