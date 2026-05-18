import { useEffect, useRef, type Dispatch, type SetStateAction } from "react";
import type { QueryClient } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";
import type { useNavigate } from "../../lib/router";
import {
  armIssueDetailInboxQuickArchive,
  createIssueDetailPath,
  rememberIssueDetailLocationState,
  withIssueDetailHeaderSeed,
} from "../../lib/issueDetailBreadcrumb";
import { prefetchIssueDetail } from "../../lib/issueDetailCache";
import {
  hasBlockingShortcutDialog,
  isKeyboardShortcutTextInputTarget,
  resolveInboxUndoArchiveKeyAction,
} from "../../lib/keyboardShortcuts";
import {
  getInboxKeyboardSelectionIndex,
  getInboxWorkItemKey,
  type InboxKeyboardNavEntry,
  type InboxWorkItem,
} from "../../lib/inbox";

export function useInboxKeyboardShortcuts({
  archivingIssueIds,
  archivingNonIssueIds,
  canArchive,
  enabled,
  fadingOutIssues,
  flatNavItems,
  issueLinkState,
  navigate,
  nonInboxSearchIssueIds,
  queryClient,
  readItems,
  selectedIndex,
  setGroupCollapsed,
  setSelectedIndex,
  undoableArchiveIssueIds,
  unarchivingIssueIds,
  archiveIssue,
  archiveNonIssue,
  markNonIssueRead,
  markNonIssueUnread,
  markRead,
  markUnreadIssue,
  undoArchiveIssue,
}: {
  archivingIssueIds: Set<string>;
  archivingNonIssueIds: Set<string>;
  canArchive: boolean;
  enabled: boolean;
  fadingOutIssues: Set<string>;
  flatNavItems: InboxKeyboardNavEntry[];
  issueLinkState: unknown;
  navigate: ReturnType<typeof useNavigate>;
  nonInboxSearchIssueIds: Set<string>;
  queryClient: QueryClient;
  readItems: Set<string>;
  selectedIndex: number;
  setGroupCollapsed: (groupKey: string, collapsed: boolean) => void;
  setSelectedIndex: Dispatch<SetStateAction<number>>;
  undoableArchiveIssueIds: string[];
  unarchivingIssueIds: Set<string>;
  archiveIssue: (id: string) => void;
  archiveNonIssue: (key: string) => void;
  markNonIssueRead: (key: string) => void;
  markNonIssueUnread: (key: string) => void;
  markRead: (id: string) => void;
  markUnreadIssue: (id: string) => void;
  undoArchiveIssue: (id: string) => void;
}) {
  const stateRef = useRef({
    flatNavItems,
    selectedIndex,
    canArchive,
    nonInboxSearchIssueIds,
    archivingIssueIds,
    undoableArchiveIssueIds,
    unarchivingIssueIds,
    archivingNonIssueIds,
    fadingOutIssues,
    readItems,
  });
  stateRef.current = {
    flatNavItems,
    selectedIndex,
    canArchive,
    nonInboxSearchIssueIds,
    archivingIssueIds,
    undoableArchiveIssueIds,
    unarchivingIssueIds,
    archivingNonIssueIds,
    fadingOutIssues,
    readItems,
  };

  const actionsRef = useRef({
    archiveIssue,
    undoArchiveIssue,
    archiveNonIssue,
    markRead,
    markUnreadIssue,
    markNonIssueRead,
    markNonIssueUnread,
    setGroupCollapsed,
    navigate,
  });
  actionsRef.current = {
    archiveIssue,
    undoArchiveIssue,
    archiveNonIssue,
    markRead,
    markUnreadIssue,
    markNonIssueRead,
    markNonIssueUnread,
    setGroupCollapsed,
    navigate,
  };

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) return;
      const target = event.target;
      if (
        !(target instanceof HTMLElement) ||
        isKeyboardShortcutTextInputTarget(target) ||
        hasBlockingShortcutDialog(document) ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey
      ) {
        return;
      }

      const state = stateRef.current;
      const actions = actionsRef.current;
      if (!state.canArchive) return;

      if (handleUndoArchiveShortcut(event, target, state, actions)) return;

      const navItems = state.flatNavItems;
      const navCount = navItems.length;
      if (navCount === 0) return;

      switch (event.key) {
        case "j":
        case "ArrowDown":
          event.preventDefault();
          setSelectedIndex((prev) => getInboxKeyboardSelectionIndex(prev, navCount, "next"));
          return;
        case "k":
        case "ArrowUp":
          event.preventDefault();
          setSelectedIndex((prev) => getInboxKeyboardSelectionIndex(prev, navCount, "previous"));
          return;
        case "ArrowLeft":
        case "ArrowRight":
          handleGroupCollapseShortcut(event, state, actions, navCount);
          return;
        case "a":
        case "y":
          handleArchiveShortcut(event, state, actions, navCount);
          return;
        case "U":
          handleMarkUnreadShortcut(event, state, actions, navCount);
          return;
        case "r":
          handleMarkReadShortcut(event, state, actions, navCount);
          return;
        case "Enter":
          handleEnterShortcut(event, state, actions, navCount, issueLinkState, queryClient);
          return;
        default:
          return;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, issueLinkState, queryClient, setSelectedIndex]);
}

type KeyboardState = {
  flatNavItems: InboxKeyboardNavEntry[];
  selectedIndex: number;
  nonInboxSearchIssueIds: Set<string>;
  archivingIssueIds: Set<string>;
  undoableArchiveIssueIds: string[];
  unarchivingIssueIds: Set<string>;
  archivingNonIssueIds: Set<string>;
  fadingOutIssues: Set<string>;
  readItems: Set<string>;
};
type KeyboardActions = {
  archiveIssue: (id: string) => void;
  undoArchiveIssue: (id: string) => void;
  archiveNonIssue: (key: string) => void;
  markRead: (id: string) => void;
  markUnreadIssue: (id: string) => void;
  markNonIssueRead: (key: string) => void;
  markNonIssueUnread: (key: string) => void;
  setGroupCollapsed: (groupKey: string, collapsed: boolean) => void;
  navigate: ReturnType<typeof useNavigate>;
};
function resolveNavEntry(navItems: InboxKeyboardNavEntry[], index: number): { issue?: Issue; item?: InboxWorkItem } {
  const entry = navItems[index];
  if (!entry) return {};
  if (entry.type === "child") return { issue: entry.issue };
  if (entry.type === "top") return { item: entry.item };
  return {};
}
function handleUndoArchiveShortcut(event: KeyboardEvent, target: HTMLElement, state: KeyboardState, actions: KeyboardActions) {
  const action = resolveInboxUndoArchiveKeyAction({
    hasUndoableArchive: state.undoableArchiveIssueIds.length > 0,
    defaultPrevented: event.defaultPrevented,
    key: event.key,
    metaKey: event.metaKey,
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    target,
    hasOpenDialog: hasBlockingShortcutDialog(document),
  });
  if (action !== "undo_archive") return false;
  const issueId = state.undoableArchiveIssueIds[state.undoableArchiveIssueIds.length - 1];
  if (!issueId || state.unarchivingIssueIds.has(issueId)) return true;
  event.preventDefault();
  actions.undoArchiveIssue(issueId);
  return true;
}

function handleGroupCollapseShortcut(event: KeyboardEvent, state: KeyboardState, actions: KeyboardActions, navCount: number) {
  if (state.selectedIndex < 0 || state.selectedIndex >= navCount) return;
  const entry = state.flatNavItems[state.selectedIndex];
  if (!entry || entry.type !== "group") return;
  event.preventDefault();
  actions.setGroupCollapsed(entry.groupKey, event.key === "ArrowLeft");
}

function handleArchiveShortcut(event: KeyboardEvent, state: KeyboardState, actions: KeyboardActions, navCount: number) {
  if (state.selectedIndex < 0 || state.selectedIndex >= navCount) return;
  event.preventDefault();
  const { issue, item } = resolveNavEntry(state.flatNavItems, state.selectedIndex);
  if (issue) {
    if (!state.nonInboxSearchIssueIds.has(issue.id) && !state.archivingIssueIds.has(issue.id)) actions.archiveIssue(issue.id);
    return;
  }
  if (!item) return;
  if (item.kind === "issue") {
    if (!state.nonInboxSearchIssueIds.has(item.issue.id) && !state.archivingIssueIds.has(item.issue.id)) actions.archiveIssue(item.issue.id);
    return;
  }
  const key = getInboxWorkItemKey(item);
  if (!state.archivingNonIssueIds.has(key)) actions.archiveNonIssue(key);
}

function handleMarkUnreadShortcut(event: KeyboardEvent, state: KeyboardState, actions: KeyboardActions, navCount: number) {
  if (state.selectedIndex < 0 || state.selectedIndex >= navCount) return;
  event.preventDefault();
  const { issue, item } = resolveNavEntry(state.flatNavItems, state.selectedIndex);
  if (issue) actions.markUnreadIssue(issue.id);
  else if (item?.kind === "issue") actions.markUnreadIssue(item.issue.id);
  else if (item) actions.markNonIssueUnread(getInboxWorkItemKey(item));
}

function handleMarkReadShortcut(event: KeyboardEvent, state: KeyboardState, actions: KeyboardActions, navCount: number) {
  if (state.selectedIndex < 0 || state.selectedIndex >= navCount) return;
  event.preventDefault();
  const { issue, item } = resolveNavEntry(state.flatNavItems, state.selectedIndex);
  if (issue) {
    if (issue.isUnreadForMe && !state.fadingOutIssues.has(issue.id)) actions.markRead(issue.id);
  } else if (item?.kind === "issue") {
    if (item.issue.isUnreadForMe && !state.fadingOutIssues.has(item.issue.id)) actions.markRead(item.issue.id);
  } else if (item) {
    const key = getInboxWorkItemKey(item);
    if (!state.readItems.has(key)) actions.markNonIssueRead(key);
  }
}

function handleEnterShortcut(event: KeyboardEvent, state: KeyboardState, actions: KeyboardActions, navCount: number, issueLinkState: unknown, queryClient: QueryClient) {
  if (state.selectedIndex < 0 || state.selectedIndex >= navCount) return;
  event.preventDefault();
  const { issue, item } = resolveNavEntry(state.flatNavItems, state.selectedIndex);
  const targetIssue = issue ?? (item?.kind === "issue" ? item.issue : null);
  if (targetIssue) {
    const pathId = targetIssue.identifier ?? targetIssue.id;
    const detailState = armIssueDetailInboxQuickArchive(withIssueDetailHeaderSeed(issueLinkState, targetIssue));
    rememberIssueDetailLocationState(pathId, detailState);
    void prefetchIssueDetail(queryClient, pathId, { issue: targetIssue });
    actions.navigate(createIssueDetailPath(pathId), { state: detailState });
  } else if (item?.kind === "approval") {
    actions.navigate(`/approvals/${item.approval.id}`);
  } else if (item?.kind === "failed_run") {
    actions.navigate(`/agents/${item.run.agentId}/runs/${item.run.id}`);
  }
}
