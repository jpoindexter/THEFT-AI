import type { DocumentRevision, IssueDocument } from "@paperclipai/shared";
import { ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn, relativeTime } from "../../lib/utils";
import { getRevisionActorLabel } from "./IssueDocumentUtils";

interface IssueDocumentRevisionMenuProps {
  document: IssueDocument;
  isOpen: boolean;
  isFetching: boolean;
  isHistoricalPreview: boolean;
  displayedRevisionNumber: number;
  selectedRevisionId: string | null;
  currentRevision: DocumentRevision;
  revisionHistory: DocumentRevision[];
  rawRevisionHistoryLength: number;
  onOpenChange: (open: boolean) => void;
  onPreviewRevision: (document: IssueDocument, revisionId: string) => void;
}

export function IssueDocumentRevisionMenu({
  document,
  isOpen,
  isFetching,
  isHistoricalPreview,
  displayedRevisionNumber,
  selectedRevisionId,
  currentRevision,
  revisionHistory,
  rawRevisionHistoryLength,
  onOpenChange,
  onPreviewRevision,
}: IssueDocumentRevisionMenuProps) {
  return (
    <DropdownMenu open={isOpen} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-auto px-1.5 py-0 text-micro font-normal text-muted-foreground hover:text-foreground",
            isHistoricalPreview && "text-amber-300 hover:text-amber-200",
          )}
        >
          rev {displayedRevisionNumber}
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Revision history</DropdownMenuLabel>
        {isOpen && isFetching && rawRevisionHistoryLength === 0 ? (
          <DropdownMenuItem disabled>Loading revisions...</DropdownMenuItem>
        ) : revisionHistory.length > 0 ? (
          <DropdownMenuRadioGroup value={selectedRevisionId ?? currentRevision.id ?? ""}>
            {revisionHistory.map((revision) => {
              const isCurrentRevision = revision.id === currentRevision.id;
              return (
                <DropdownMenuRadioItem
                  key={revision.id}
                  value={revision.id}
                  onSelect={() => onPreviewRevision(document, revision.id)}
                  className="items-start"
                >
                  <div className="flex min-w-0 flex-col">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">rev {revision.revisionNumber}</span>
                      {isCurrentRevision ? (
                        <span className="rounded-full border border-border px-1.5 py-0.5 text-nano uppercase tracking-wide text-muted-foreground">
                          Current
                        </span>
                      ) : null}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {relativeTime(revision.createdAt)} • {getRevisionActorLabel(revision)}
                    </span>
                  </div>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        ) : (
          <DropdownMenuItem disabled>No revisions yet</DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
