import type { InboxTab } from "./types";

export function resolveInboxNestingEnabled(preferenceEnabled: boolean, isMobile: boolean): boolean {
  return preferenceEnabled && !isMobile;
}

export function isMineInboxTab(tab: InboxTab): boolean {
  return tab === "mine";
}

export function shouldShowCompanyAlerts(tab: InboxTab): boolean {
  return tab === "all";
}

export function resolveInboxSelectionIndex(
  previousIndex: number,
  itemCount: number,
): number {
  if (itemCount === 0) return -1;
  if (previousIndex < 0) return -1;
  return Math.min(previousIndex, itemCount - 1);
}

export function getInboxKeyboardSelectionIndex(
  previousIndex: number,
  itemCount: number,
  direction: "next" | "previous",
): number {
  if (itemCount === 0) return -1;
  if (previousIndex < 0) return 0;
  return direction === "next"
    ? Math.min(previousIndex + 1, itemCount - 1)
    : Math.max(previousIndex - 1, 0);
}

export function shouldShowInboxSection({
  tab,
  hasItems,
  showOnMine,
  showOnRecent,
  showOnUnread,
  showOnAll,
}: {
  tab: InboxTab;
  hasItems: boolean;
  showOnMine: boolean;
  showOnRecent: boolean;
  showOnUnread: boolean;
  showOnAll: boolean;
}): boolean {
  if (!hasItems) return false;
  if (tab === "mine") return showOnMine;
  if (tab === "recent") return showOnRecent;
  if (tab === "unread") return showOnUnread;
  return showOnAll;
}
