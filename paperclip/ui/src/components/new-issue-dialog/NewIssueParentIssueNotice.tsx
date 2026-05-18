import { ListTree } from "lucide-react";

type NewIssueParentIssueNoticeProps = {
  isSubIssueMode: boolean;
  parentIssueLabel: string;
  parentTitle?: string | null;
};

export function NewIssueParentIssueNotice({
  isSubIssueMode,
  parentIssueLabel,
  parentTitle,
}: NewIssueParentIssueNoticeProps) {
  if (!isSubIssueMode) return null;

  return (
    <div className="px-4 pb-2">
      <div className="max-w-full rounded-md border border-border bg-muted/30 px-2.5 py-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <ListTree className="h-3.5 w-3.5 shrink-0" />
          <span className="shrink-0">Sub-issue of</span>
          <span className="font-medium text-foreground">{parentIssueLabel}</span>
        </div>
        {parentTitle ? (
          <div className="pl-5 text-foreground/80 truncate">
            {parentTitle}
          </div>
        ) : null}
      </div>
    </div>
  );
}
