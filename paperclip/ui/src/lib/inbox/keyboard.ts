import type { InboxKeyboardGroupSection, InboxKeyboardNavEntry } from "./types";
import { getInboxWorkItemKey } from "./grouping";

export function buildInboxKeyboardNavEntries(
  groupedSections: ReadonlyArray<InboxKeyboardGroupSection>,
  collapsedGroupKeys: ReadonlySet<string>,
  collapsedInboxParents: ReadonlySet<string>,
): InboxKeyboardNavEntry[] {
  const entries: InboxKeyboardNavEntry[] = [];

  for (const group of groupedSections) {
    const isCollapsed = collapsedGroupKeys.has(group.key);
    if (group.label) {
      entries.push({
        type: "group",
        groupKey: group.key,
        label: group.label,
        collapsed: isCollapsed,
      });
    }
    if (isCollapsed) continue;

    const addIssueChildren = (issueId: string, seen: ReadonlySet<string>) => {
      const children = group.childrenByIssueId.get(issueId);
      if (!children?.length || collapsedInboxParents.has(issueId)) return;

      for (const child of children) {
        if (seen.has(child.id)) continue;
        const nextSeen = new Set(seen);
        nextSeen.add(child.id);
        entries.push({
          type: "child",
          issueId: child.id,
          issue: child,
        });
        addIssueChildren(child.id, nextSeen);
      }
    };

    for (const item of group.displayItems) {
      entries.push({
        type: "top",
        itemKey: `${group.key}:${getInboxWorkItemKey(item)}`,
        item,
      });

      if (item.kind !== "issue") continue;
      addIssueChildren(item.issue.id, new Set([item.issue.id]));
    }
  }

  return entries;
}
