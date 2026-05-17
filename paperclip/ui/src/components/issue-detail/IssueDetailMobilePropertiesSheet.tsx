import type { Issue } from "@paperclipai/shared";

import { IssueProperties } from "@/components/IssueProperties";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

type IssueDetailMobilePropertiesSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  issue: Issue;
  childIssues: Issue[];
  onAddSubIssue: () => void;
  onUpdateIssue: (data: Record<string, unknown>) => void;
};

export function IssueDetailMobilePropertiesSheet({
  open,
  onOpenChange,
  issue,
  childIssues,
  onAddSubIssue,
  onUpdateIssue,
}: IssueDetailMobilePropertiesSheetProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-dvh pb-[env(safe-area-inset-bottom)]">
        <SheetHeader>
          <SheetTitle className="text-sm">Properties</SheetTitle>
        </SheetHeader>
        <ScrollArea className="flex-1 overflow-y-auto">
          <div className="px-4 pb-4">
            <IssueProperties
              issue={issue}
              childIssues={childIssues}
              onAddSubIssue={onAddSubIssue}
              onUpdate={onUpdateIssue}
              inline
            />
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
