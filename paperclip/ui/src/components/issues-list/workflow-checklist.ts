import type { Issue, IssueStatus } from "@paperclipai/shared";
import { buildIssueTree } from "../../lib/issue-tree";

export type WorkflowChecklistMeta = {
  stepNumberByIssueId: Map<string, string>;
  unresolvedVisibleBlockersByIssueId: Map<string, string[]>;
  currentStepIssueId: string | null;
};

function isActionableWorkflowStatus(status: IssueStatus): boolean {
  return status !== "done" && status !== "cancelled" && status !== "blocked";
}

function buildChecklistStepNumberMap(issues: Issue[], nestingEnabled: boolean): Map<string, string> {
  const stepNumberByIssueId = new Map<string, string>();

  if (!nestingEnabled) {
    issues.forEach((issue, index) => {
      stepNumberByIssueId.set(issue.id, String(index + 1));
    });
    return stepNumberByIssueId;
  }

  const { roots, childMap } = buildIssueTree(issues);
  const visit = (siblings: Issue[], prefix: string | null) => {
    siblings.forEach((issue, index) => {
      const stepNumber = prefix ? `${prefix}.${index + 1}` : String(index + 1);
      stepNumberByIssueId.set(issue.id, stepNumber);
      visit(childMap.get(issue.id) ?? [], stepNumber);
    });
  };
  visit(roots, null);

  issues.forEach((issue, index) => {
    if (!stepNumberByIssueId.has(issue.id)) {
      stepNumberByIssueId.set(issue.id, String(index + 1));
    }
  });

  return stepNumberByIssueId;
}

function buildPreviousSiblingIssueIdMap(issues: Issue[], nestingEnabled: boolean): Map<string, string> {
  const previousSiblingByIssueId = new Map<string, string>();

  if (!nestingEnabled) {
    const previousByParentId = new Map<string, Issue>();
    for (const issue of issues) {
      if (!issue.parentId) continue;
      const previousSibling = previousByParentId.get(issue.parentId);
      if (previousSibling) {
        previousSiblingByIssueId.set(issue.id, previousSibling.id);
      }
      previousByParentId.set(issue.parentId, issue);
    }
    return previousSiblingByIssueId;
  }

  const { roots, childMap } = buildIssueTree(issues);
  const visit = (siblings: Issue[]) => {
    siblings.forEach((issue, index) => {
      const previousSibling = index > 0 ? siblings[index - 1] : null;
      if (issue.parentId && previousSibling?.parentId === issue.parentId) {
        previousSiblingByIssueId.set(issue.id, previousSibling.id);
      }
      visit(childMap.get(issue.id) ?? []);
    });
  };
  visit(roots);

  return previousSiblingByIssueId;
}

function shouldSuppressSinglePreviousSiblingBlockerChip(
  issue: Issue,
  unresolvedVisibleBlockerIds: string[],
  previousSiblingIssueId: string | undefined,
): boolean {
  return Boolean(
    issue.parentId
      && previousSiblingIssueId
      && (issue.blockedBy ?? []).length === 1
      && unresolvedVisibleBlockerIds.length === 1
      && unresolvedVisibleBlockerIds[0] === previousSiblingIssueId,
  );
}

export function buildWorkflowChecklistMeta(
  issues: Issue[],
  issueById: ReadonlyMap<string, Issue>,
  nestingEnabled: boolean,
): WorkflowChecklistMeta {
  const visibleIssueIds = new Set(issues.map((issue) => issue.id));
  const stepNumberByIssueId = buildChecklistStepNumberMap(issues, nestingEnabled);
  const previousSiblingIssueIdByIssueId = buildPreviousSiblingIssueIdMap(issues, nestingEnabled);
  const unresolvedVisibleBlockersByIssueId = new Map<string, string[]>();

  issues.forEach((issue) => {
    const unresolvedVisible = (issue.blockedBy ?? [])
      .map((blocker) => blocker.id)
      .filter((blockerId) => {
        if (!visibleIssueIds.has(blockerId)) return false;
        const blockerIssue = issueById.get(blockerId);
        if (!blockerIssue) return false;
        return blockerIssue.status !== "done" && blockerIssue.status !== "cancelled";
      });
    const shouldSuppressChip = shouldSuppressSinglePreviousSiblingBlockerChip(
      issue,
      unresolvedVisible,
      previousSiblingIssueIdByIssueId.get(issue.id),
    );
    unresolvedVisibleBlockersByIssueId.set(issue.id, shouldSuppressChip ? [] : unresolvedVisible);
  });

  const firstActionable = issues.find((issue) => isActionableWorkflowStatus(issue.status)) ?? null;
  const currentStepIssue = firstActionable ?? issues.find((issue) => issue.status === "blocked") ?? null;

  return {
    stepNumberByIssueId,
    unresolvedVisibleBlockersByIssueId,
    currentStepIssueId: currentStepIssue?.id ?? null,
  };
}
