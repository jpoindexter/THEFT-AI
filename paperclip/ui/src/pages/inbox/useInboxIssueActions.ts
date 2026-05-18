import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import { issuesApi } from "../../api/issues";
import { queryKeys } from "../../lib/queryKeys";
import { resolveInboxSelectionIndex, type InboxKeyboardNavEntry } from "../../lib/inbox";
import type { NonIssueUnreadState } from "./InboxDecisionRows";

export function useInboxIssueActions({
  canArchiveFromTab,
  dismissAlert,
  dismissInboxItem,
  flatNavItems,
  markItemRead,
  queryClient,
  readItems,
  selectedCompanyId,
  setActionError,
}: {
  canArchiveFromTab: boolean;
  dismissAlert: (key: string) => void;
  dismissInboxItem: (key: string) => void;
  flatNavItems: InboxKeyboardNavEntry[];
  markItemRead: (key: string) => void;
  queryClient: QueryClient;
  readItems: Set<string>;
  selectedCompanyId: string | null;
  setActionError: (value: string | null) => void;
}) {
  const [fadingOutIssues, setFadingOutIssues] = useState<Set<string>>(new Set());
  const [showMarkAllReadConfirm, setShowMarkAllReadConfirm] = useState(false);
  const [archivingIssueIds, setArchivingIssueIds] = useState<Set<string>>(new Set());
  const [undoableArchiveIssueIds, setUndoableArchiveIssueIds] = useState<string[]>([]);
  const [unarchivingIssueIds, setUnarchivingIssueIds] = useState<Set<string>>(new Set());
  const [fadingNonIssueItems, setFadingNonIssueItems] = useState<Set<string>>(new Set());
  const [archivingNonIssueIds, setArchivingNonIssueIds] = useState<Set<string>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const listRef = useRef<HTMLDivElement>(null);

  const invalidateInboxIssueQueries = () => {
    if (!selectedCompanyId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId) });
  };

  const archiveIssueMutation = useMutation({
    mutationFn: (id: string) => issuesApi.archiveFromInbox(id),
    onMutate: async (id) => {
      setActionError(null);
      setArchivingIssueIds((prev) => new Set(prev).add(id));
      const queryKeysToUpdate = [
        [...queryKeys.issues.listMineByMe(selectedCompanyId!), "with-routine-executions"],
        [...queryKeys.issues.listTouchedByMe(selectedCompanyId!), "with-routine-executions"],
        queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId!),
      ];
      await Promise.all(queryKeysToUpdate.map((queryKey) => queryClient.cancelQueries({ queryKey })));
      const previousData = queryKeysToUpdate.map((queryKey) => [queryKey, queryClient.getQueryData(queryKey)] as const);
      for (const queryKey of queryKeysToUpdate) {
        queryClient.setQueryData(queryKey, (old: unknown) => {
          if (!Array.isArray(old)) return old;
          return old.filter((issue: { id: string }) => issue.id !== id);
        });
      }
      return { previousData };
    },
    onError: (err, id, context) => {
      setActionError(err instanceof Error ? err.message : "Failed to archive issue");
      setArchivingIssueIds((prev) => removeFromSet(prev, id));
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) queryClient.setQueryData(queryKey, data);
      }
    },
    onSettled: (_data, _error, id) => {
      setArchivingIssueIds((prev) => removeFromSet(prev, id));
      invalidateInboxIssueQueries();
    },
    onSuccess: (_data, id) => {
      setUndoableArchiveIssueIds((prev) => [...prev.filter((issueId) => issueId !== id), id]);
    },
  });

  const unarchiveIssueMutation = useMutation({
    mutationFn: (id: string) => issuesApi.unarchiveFromInbox(id),
    onMutate: (id) => {
      setActionError(null);
      setUnarchivingIssueIds((prev) => new Set(prev).add(id));
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to undo inbox archive"),
    onSuccess: (_data, id) => setUndoableArchiveIssueIds((prev) => prev.filter((issueId) => issueId !== id)),
    onSettled: (_data, _error, id) => {
      setUnarchivingIssueIds((prev) => removeFromSet(prev, id));
      invalidateInboxIssueQueries();
    },
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => issuesApi.markRead(id),
    onMutate: (id) => setFadingOutIssues((prev) => new Set(prev).add(id)),
    onSuccess: invalidateInboxIssueQueries,
    onSettled: (_data, _error, id) => removeFadingIssueLater(id, setFadingOutIssues),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async (issueIds: string[]) => {
      await Promise.all(issueIds.map((issueId) => issuesApi.markRead(issueId)));
    },
    onMutate: (issueIds) => {
      setFadingOutIssues((prev) => {
        const next = new Set(prev);
        for (const issueId of issueIds) next.add(issueId);
        return next;
      });
    },
    onSuccess: invalidateInboxIssueQueries,
    onSettled: (_data, _error, issueIds) => {
      setTimeout(() => {
        setFadingOutIssues((prev) => {
          const next = new Set(prev);
          for (const issueId of issueIds) next.delete(issueId);
          return next;
        });
      }, 300);
    },
  });

  const markUnreadMutation = useMutation({
    mutationFn: (id: string) => issuesApi.markUnread(id),
    onSuccess: invalidateInboxIssueQueries,
  });

  const handleMarkNonIssueRead = useCallback((key: string) => {
    setFadingNonIssueItems((prev) => new Set(prev).add(key));
    markItemRead(key);
    setTimeout(() => setFadingNonIssueItems((prev) => removeFromSet(prev, key)), 300);
  }, [markItemRead]);

  const handleArchiveNonIssue = useCallback((key: string) => {
    setArchivingNonIssueIds((prev) => new Set(prev).add(key));
    setTimeout(() => {
      if (key.startsWith("alert:")) dismissAlert(key);
      else dismissInboxItem(key);
      setArchivingNonIssueIds((prev) => removeFromSet(prev, key));
    }, 200);
  }, [dismissAlert, dismissInboxItem]);

  const nonIssueUnreadState = (key: string): NonIssueUnreadState => {
    if (!canArchiveFromTab) return null;
    if (fadingNonIssueItems.has(key)) return "fading";
    if (!readItems.has(key)) return "visible";
    return "hidden";
  };

  useEffect(() => {
    setSelectedIndex((prev) => resolveInboxSelectionIndex(prev, flatNavItems.length));
  }, [flatNavItems.length]);

  useEffect(() => {
    setUndoableArchiveIssueIds([]);
    setUnarchivingIssueIds(new Set());
  }, [selectedCompanyId]);

  useEffect(() => {
    if (selectedIndex < 0 || !listRef.current) return;
    const rows = listRef.current.querySelectorAll("[data-inbox-item]");
    const row = rows[selectedIndex];
    if (row) row.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  return {
    archiveIssueMutation,
    archivingIssueIds,
    archivingNonIssueIds,
    fadingOutIssues,
    handleArchiveNonIssue,
    handleMarkNonIssueRead,
    listRef,
    markAllReadMutation,
    markReadMutation,
    markUnreadMutation,
    nonIssueUnreadState,
    selectedIndex,
    setSelectedIndex,
    setShowMarkAllReadConfirm,
    showMarkAllReadConfirm,
    unarchiveIssueMutation,
    undoableArchiveIssueIds,
    unarchivingIssueIds,
  };
}

function removeFromSet<T>(values: Set<T>, value: T) {
  const next = new Set(values);
  next.delete(value);
  return next;
}

function removeFadingIssueLater(id: string, setFadingOutIssues: (updater: (prev: Set<string>) => Set<string>) => void) {
  setTimeout(() => setFadingOutIssues((prev) => removeFromSet(prev, id)), 300);
}
