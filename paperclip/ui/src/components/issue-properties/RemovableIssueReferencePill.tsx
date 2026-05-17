import { useState } from "react";
import type { MouseEvent } from "react";
import type { Issue } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";
import { StatusIcon } from "../StatusIcon";

export function RemovableIssueReferencePill({
  issue,
  onRemove,
}: {
  issue: NonNullable<Issue["blockedBy"]>[number];
  onRemove: (issueId: string) => void;
}) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const issueLabel = issue.identifier ?? issue.title;
  const confirmLabel = issue.identifier ? `${issue.identifier}: ${issue.title}` : issue.title;
  const content = (
    <>
      <StatusIcon status={issue.status} className="h-3 w-3 shrink-0" />
      <span className="truncate">{issueLabel}</span>
    </>
  );
  const removeLabel = `Remove ${issueLabel} as blocker`;
  const handleRemove = (event: MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsConfirmOpen(true);
  };
  const confirmRemove = () => {
    onRemove(issue.id);
    setIsConfirmOpen(false);
  };

  return (
    <>
      <span
        data-mention-kind="issue"
        className={cn(
          "paperclip-mention-chip paperclip-mention-chip--issue group",
          "inline-flex items-center gap-1 rounded-full border border-border py-0.5 pl-1 pr-2 text-xs",
        )}
        title={issue.title}
        aria-label={`Issue ${issueLabel}: ${issue.title}`}
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-colors transition-opacity hover:bg-destructive/10 hover:text-destructive focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
          aria-label={removeLabel}
          title={removeLabel}
          onClick={handleRemove}
        >
          <X className="h-3 w-3" />
        </Button>
        {issue.identifier ? (
          <Link
            to={`/issues/${issueLabel}`}
            className="inline-flex min-w-0 items-center gap-1 no-underline hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            aria-label={`Issue ${issueLabel}: ${issue.title}`}
          >
            {content}
          </Link>
        ) : (
          <span className="inline-flex min-w-0 items-center gap-1">{content}</span>
        )}
      </span>
      <Dialog open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Remove blocker?</DialogTitle>
            <DialogDescription>
              Remove {confirmLabel} as a blocker for this issue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="button" variant="destructive" onClick={confirmRemove}>
              Remove blocker
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
