import type { RoutineRevision } from "@paperclipai/shared";

import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { cn, relativeTime } from "../../lib/utils";

type RoutineRevisionListProps = {
  revisions: RoutineRevision[];
  latestRevisionId: string | null;
  selectedRevisionId: string | null;
  highlightedRevisionId: string | null;
  isEditDirty: boolean;
  totalRevisions: number;
  onSelect: (revisionId: string) => void;
  onShowOlder: () => void;
  showOlder: boolean;
};

export function RoutineRevisionList({
  revisions,
  latestRevisionId,
  selectedRevisionId,
  highlightedRevisionId,
  isEditDirty,
  totalRevisions,
  onSelect,
  onShowOlder,
  showOlder,
}: RoutineRevisionListProps) {
  return (
    <aside className="space-y-1">
      <header className="flex items-center justify-between pb-2">
        <p className="theft-label-compact text-muted-foreground">Revisions</p>
        <span className="text-micro text-muted-foreground">{totalRevisions} total</span>
      </header>
      {revisions.map((revision) => (
        <RevisionListItem
          key={revision.id}
          revision={revision}
          latestRevisionId={latestRevisionId}
          selectedRevisionId={selectedRevisionId}
          highlightedRevisionId={highlightedRevisionId}
          isEditDirty={isEditDirty}
          onSelect={onSelect}
        />
      ))}
      {totalRevisions > revisions.length && !showOlder && (
        <Button variant="ghost" size="sm" className="w-full" onClick={onShowOlder}>
          Show {totalRevisions - revisions.length} older&hellip;
        </Button>
      )}
    </aside>
  );
}

function RevisionListItem({
  revision,
  latestRevisionId,
  selectedRevisionId,
  highlightedRevisionId,
  isEditDirty,
  onSelect,
}: {
  revision: RoutineRevision;
  latestRevisionId: string | null;
  selectedRevisionId: string | null;
  highlightedRevisionId: string | null;
  isEditDirty: boolean;
  onSelect: (revisionId: string) => void;
}) {
  const isSelected = revision.id === selectedRevisionId;
  const isCurrent = revision.id === latestRevisionId;
  const isHistorical = !isCurrent;
  const isHighlighted = revision.id === highlightedRevisionId;
  const blockedByEdits = isEditDirty && isHistorical;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={blockedByEdits}
      onClick={() => onSelect(revision.id)}
      className={cn(
        "h-auto w-full justify-start whitespace-normal px-3 py-2 text-left transition-colors",
        isSelected && isHistorical && "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/10",
        isSelected && !isHistorical && "border-border bg-accent/40",
        blockedByEdits && "cursor-not-allowed border-amber-500/30 bg-amber-500/5 opacity-70",
        !isHighlighted && !isSelected && !blockedByEdits && "border-border/60 hover:bg-accent/40",
        isHighlighted && "border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/10",
      )}
      data-testid={`revision-row-${revision.revisionNumber}`}
    >
      <span className="flex min-w-0 flex-col gap-1">
        <span className="flex items-center gap-2 text-sm font-medium">
          <span>rev {revision.revisionNumber}</span>
          {isCurrent && (
            <Badge variant="outline" className="theft-label-nano px-1.5 text-muted-foreground">
              Current
            </Badge>
          )}
          {revision.restoredFromRevisionId && (
            <Badge
              variant="outline"
              className="theft-label-nano border-amber-500/40 bg-amber-500/10 px-1.5 text-amber-200"
            >
              Restored
            </Badge>
          )}
        </span>
        <span className="truncate text-xs font-normal text-muted-foreground">
          {relativeTime(revision.createdAt)}{" \u2022 "}{getRevisionActorLabel(revision)}
          {revision.changeSummary ? ` \u2022 ${revision.changeSummary}` : ""}
        </span>
      </span>
    </Button>
  );
}

function getRevisionActorLabel(revision: RoutineRevision): string {
  if (revision.createdByUserId) return "board";
  if (revision.createdByAgentId) return "agent";
  return "system";
}
