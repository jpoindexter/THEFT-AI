import type { Issue } from "@paperclipai/shared";
import { TheftChip } from "@/components/theft";
import { Button } from "@/components/ui/button";
import type { WorkflowChecklistMeta } from "./workflow-checklist";

export function ChecklistDependencyChip({
  issueById,
  checklistMeta,
  unresolvedVisibleBlockers,
}: {
  issueById: ReadonlyMap<string, Issue>;
  checklistMeta: WorkflowChecklistMeta | null;
  unresolvedVisibleBlockers: string[];
}) {
  const visibleBlockerChips = unresolvedVisibleBlockers
    .map((blockerId) => {
      const blockerIssue = issueById.get(blockerId);
      if (!blockerIssue) return null;
      const label = blockerIssue.identifier ?? blockerIssue.id.slice(0, 8);
      const blockerStep = checklistMeta?.stepNumberByIssueId.get(blockerId);
      const blockerStepSuffix = blockerStep ? ` \u00b7 step ${blockerStep}` : "";
      return { blockerId, chipLabel: `blocked by ${label}${blockerStepSuffix}` };
    })
    .filter((chip): chip is { blockerId: string; chipLabel: string } => chip !== null);
  const firstVisibleBlockerChip = visibleBlockerChips[0] ?? null;
  const additionalVisibleBlockerCount = Math.max(visibleBlockerChips.length - 1, 0);
  const additionalVisibleBlockerLabel = additionalVisibleBlockerCount > 0
    ? ` ... and ${additionalVisibleBlockerCount} more`
    : "";
  const firstVisibleBlockerDisplayLabel = firstVisibleBlockerChip
    ? `${firstVisibleBlockerChip.chipLabel}${additionalVisibleBlockerLabel}`
    : "";
  const hiddenVisibleBlockerLabels = visibleBlockerChips
    .slice(1)
    .map((chip) => chip.chipLabel)
    .join(", ");
  const firstVisibleBlockerTitle = additionalVisibleBlockerCount > 0
    ? `${firstVisibleBlockerDisplayLabel}: ${hiddenVisibleBlockerLabels}`
    : firstVisibleBlockerDisplayLabel;

  return checklistMeta && firstVisibleBlockerChip ? (
    <TheftChip
      key={firstVisibleBlockerChip.blockerId}
      asChild
      tone="warning"
      density="compact"
    >
      <Button
        type="button"
        variant="ghost"
        size="xs"
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          const target = document.getElementById(`issue-workflow-row-${firstVisibleBlockerChip.blockerId}`);
          if (!target) return;
          target.scrollIntoView({ behavior: "smooth", block: "nearest" });
          target.focus?.();
        }}
        className="inline-flex items-center"
        title={firstVisibleBlockerTitle}
        aria-label={firstVisibleBlockerTitle}
      >
        {firstVisibleBlockerDisplayLabel}
      </Button>
    </TheftChip>
  ) : null;
}
