import { useMemo } from "react";
import type { Issue } from "@paperclipai/shared";
import { applyIssueFilters, type IssueFilterState } from "../../lib/issue-filters";
import {
  getRecentTouchedIssues,
  type InboxTab,
} from "../../lib/inbox";

export function useInboxVisibleIssues({
  currentUserId,
  issueFilters,
  liveIssueIds,
  mineIssuesRaw,
  tab,
  touchedIssuesRaw,
}: {
  currentUserId: string | null;
  issueFilters: IssueFilterState;
  liveIssueIds: Set<string>;
  mineIssuesRaw: Issue[];
  tab: InboxTab;
  touchedIssuesRaw: Issue[];
}) {
  const mineIssues = useMemo(() => getRecentTouchedIssues(mineIssuesRaw), [mineIssuesRaw]);
  const touchedIssues = useMemo(() => getRecentTouchedIssues(touchedIssuesRaw), [touchedIssuesRaw]);
  const visibleMineIssues = useMemo(
    () => applyIssueFilters(mineIssues, issueFilters, currentUserId, true, liveIssueIds),
    [mineIssues, issueFilters, currentUserId, liveIssueIds],
  );
  const visibleTouchedIssues = useMemo(
    () => applyIssueFilters(touchedIssues, issueFilters, currentUserId, true, liveIssueIds),
    [touchedIssues, issueFilters, currentUserId, liveIssueIds],
  );
  const unreadTouchedIssues = useMemo(
    () => visibleTouchedIssues.filter((issue) => issue.isUnreadForMe),
    [visibleTouchedIssues],
  );
  const issuesToRender = useMemo(() => {
    if (tab === "mine") return visibleMineIssues;
    if (tab === "unread") return unreadTouchedIssues;
    return visibleTouchedIssues;
  }, [tab, unreadTouchedIssues, visibleMineIssues, visibleTouchedIssues]);

  return {
    issuesToRender,
    mineIssues,
    touchedIssues,
    unreadTouchedIssues,
    visibleMineIssues,
    visibleTouchedIssues,
  };
}
