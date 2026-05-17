import type { Dispatch, SetStateAction } from "react";
import type { Issue } from "@paperclipai/shared";
import { Link } from "@/lib/router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowUpRight } from "lucide-react";
import { cn } from "../../lib/utils";
import { StatusIcon } from "../StatusIcon";
import { PropertyPicker } from "./PropertyLayout";

interface IssueParentPropertyProps {
  issue: Issue;
  parentOpen: boolean;
  setParentOpen: Dispatch<SetStateAction<boolean>>;
  parentSearch: string;
  setParentSearch: Dispatch<SetStateAction<string>>;
  parentOptions: Issue[];
  parentIdentifier: string | null | undefined;
  parentTitle: string | null | undefined;
  inline?: boolean;
  onUpdate: (data: Record<string, unknown>) => void;
}

export function IssueParentProperty({
  issue,
  parentOpen,
  setParentOpen,
  parentSearch,
  setParentSearch,
  parentOptions,
  parentIdentifier,
  parentTitle,
  inline,
  onUpdate,
}: IssueParentPropertyProps) {
  const parentTrigger = issue.parentId ? (
    <span className="text-sm break-words min-w-0 inline">
      {parentIdentifier ? `${parentIdentifier} ` : ""}
      {parentTitle}
    </span>
  ) : (
    <span className="text-sm text-muted-foreground">No parent</span>
  );
  const parentLink = issue.parentId ? (
    <Link
      to={`/issues/${parentIdentifier ?? issue.parentId}`}
      className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
      onClick={(e) => e.stopPropagation()}
    >
      <ArrowUpRight className="h-3 w-3" />
    </Link>
  ) : undefined;

  return (
    <PropertyPicker
      inline={inline}
      label="Parent"
      open={parentOpen}
      onOpenChange={(open) => {
        setParentOpen(open);
        if (!open) setParentSearch("");
      }}
      triggerContent={parentTrigger}
      triggerClassName="min-w-0 max-w-full"
      popoverClassName="w-72"
      extra={parentLink}
    >
      <Input
        className="mb-1 h-8 px-2 py-1.5 text-xs shadow-none md:text-xs"
        placeholder="Search issues..."
        value={parentSearch}
        onChange={(e) => setParentSearch(e.target.value)}
        autoFocus={!inline}
      />
      <div className="max-h-48 overflow-y-auto overscroll-contain">
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className={cn(
            "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-xs",
            !issue.parentId && "bg-accent",
          )}
          onClick={() => {
            onUpdate({ parentId: null });
            setParentOpen(false);
          }}
        >
          No parent
        </Button>
        {parentOptions.map((candidate) => (
          <Button
            type="button"
            variant="ghost"
            size="xs"
            key={candidate.id}
            className={cn(
              "flex w-full items-center justify-start gap-2 px-2 py-1.5 text-left text-xs",
              candidate.id === issue.parentId && "bg-accent",
            )}
            onClick={() => {
              onUpdate({ parentId: candidate.id });
              setParentOpen(false);
            }}
          >
            <StatusIcon status={candidate.status} />
            <span className="truncate">
              {candidate.identifier ? `${candidate.identifier} ` : ""}
              {candidate.title}
            </span>
          </Button>
        ))}
      </div>
    </PropertyPicker>
  );
}
