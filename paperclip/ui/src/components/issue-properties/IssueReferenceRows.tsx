import type { Issue, IssueRelationIssueSummary } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { IssueReferencePill } from "../IssueReferencePill";
import { PropertyRow } from "./PropertyLayout";

interface IssueReferenceRowsProps {
  issue: Issue;
  childIssues: Issue[];
  relatedTasks: Array<
    Pick<IssueRelationIssueSummary, "id" | "identifier" | "title"> &
      Partial<Pick<IssueRelationIssueSummary, "status">>
  >;
  onAddSubIssue?: () => void;
}

export function IssueReferenceRows({
  issue,
  childIssues,
  relatedTasks,
  onAddSubIssue,
}: IssueReferenceRowsProps) {
  return (
    <>
      <PropertyRow label="Blocking">
        {(issue.blocks ?? []).length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {(issue.blocks ?? []).map((relation) => (
              <IssueReferencePill key={relation.id} issue={relation} />
            ))}
          </div>
        ) : null}
      </PropertyRow>

      <PropertyRow label="Sub-issues">
        <div className="flex flex-wrap items-center gap-1.5">
          {childIssues.length > 0
            ? childIssues.map((child) => (
              <IssueReferencePill key={child.id} issue={child} />
            ))
            : null}
          {onAddSubIssue ? (
            <Button
              type="button"
              variant="outline"
              size="xs"
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent/50 hover:text-foreground"
              onClick={onAddSubIssue}
            >
              <Plus className="h-3 w-3" />
              Add sub-issue
            </Button>
          ) : null}
        </div>
      </PropertyRow>

      {relatedTasks.length > 0 ? (
        <PropertyRow label="Related Tasks">
          <div className="flex flex-wrap gap-1">
            {relatedTasks.map((related) => (
              <IssueReferencePill key={related.id} issue={related} />
            ))}
          </div>
        </PropertyRow>
      ) : null}
    </>
  );
}
