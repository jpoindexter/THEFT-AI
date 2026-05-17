import type { Dispatch, SetStateAction } from "react";
import type { Issue } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus } from "lucide-react";
import { cn } from "../../lib/utils";
import { StatusIcon } from "../StatusIcon";
import { PropertyRow } from "./PropertyLayout";
import { RemovableIssueReferencePill } from "./RemovableIssueReferencePill";

interface IssueBlockedByPropertyProps {
  issue: Issue;
  blockedByOpen: boolean;
  setBlockedByOpen: Dispatch<SetStateAction<boolean>>;
  blockedBySearch: string;
  setBlockedBySearch: Dispatch<SetStateAction<string>>;
  blockedByIds: string[];
  blockerOptions: Issue[];
  inline?: boolean;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function IssueBlockedByProperty({
  issue,
  blockedByOpen,
  setBlockedByOpen,
  blockedBySearch,
  setBlockedBySearch,
  blockedByIds,
  blockerOptions,
  inline,
  onUpdate,
}: IssueBlockedByPropertyProps) {
  const toggleBlockedBy = (blockedByIssueId: string) => {
    const nextBlockedByIds = blockedByIds.includes(blockedByIssueId)
      ? blockedByIds.filter((candidate) => candidate !== blockedByIssueId)
      : [...blockedByIds, blockedByIssueId];
    onUpdate({ blockedByIssueIds: nextBlockedByIds });
  };
  const removeBlockedBy = (blockedByIssueId: string) => {
    onUpdate({ blockedByIssueIds: blockedByIds.filter((candidate) => candidate !== blockedByIssueId) });
  };
  const renderAddBlockedByButton = (onClick?: () => void) => (
    <Button
      type="button"
      variant="outline"
      size="xs"
      className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
      onClick={onClick}
    >
      <Plus className="h-3 w-3" />
      Add blocker
    </Button>
  );
  const blockedByContent = (
    <>
      <Input
        className="mb-1 h-8 px-2 py-1.5 text-xs shadow-none md:text-xs"
        placeholder="Search issues..."
        value={blockedBySearch}
        onChange={(e) => setBlockedBySearch(e.target.value)}
        autoFocus={!inline}
      />
      <div className="max-h-48 overflow-y-auto overscroll-contain">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className={cn(
            "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
            blockedByIds.length === 0 && "bg-accent",
          )}
          onClick={() => onUpdate({ blockedByIssueIds: [] })}
        >
          No blockers
        </Button>
        {blockerOptions.map((candidate) => {
          const selected = blockedByIds.includes(candidate.id);
          return (
            <Button
              type="button"
              variant="ghost"
              size="xs"
              key={candidate.id}
              className={cn(
                "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-left text-xs",
                selected && "bg-accent",
              )}
              onClick={() => toggleBlockedBy(candidate.id)}
            >
              <StatusIcon status={candidate.status} />
              <span className="truncate">
                {candidate.identifier ? `${candidate.identifier} ` : ""}
                {candidate.title}
              </span>
            </Button>
          );
        })}
      </div>
    </>
  );

  if (inline) {
    return (
      <div>
        <PropertyRow label="Blocked by">
          {(issue.blockedBy ?? []).map((relation) => (
            <RemovableIssueReferencePill key={relation.id} issue={relation} onRemove={removeBlockedBy} />
          ))}
          {renderAddBlockedByButton(() => setBlockedByOpen((open) => !open))}
        </PropertyRow>
        {blockedByOpen && (
          <div className="rounded-md border border-border bg-popover p-1 mb-2">
            {blockedByContent}
          </div>
        )}
      </div>
    );
  }

  return (
    <PropertyRow label="Blocked by">
      {(issue.blockedBy ?? []).map((relation) => (
        <RemovableIssueReferencePill key={relation.id} issue={relation} onRemove={removeBlockedBy} />
      ))}
      <Popover
        open={blockedByOpen}
        onOpenChange={(open) => {
          setBlockedByOpen(open);
          if (!open) setBlockedBySearch("");
        }}
      >
        <PopoverTrigger asChild>
          {renderAddBlockedByButton()}
        </PopoverTrigger>
        <PopoverContent className="w-72 p-1" align="end" collisionPadding={16}>
          {blockedByContent}
        </PopoverContent>
      </Popover>
    </PropertyRow>
  );
}
