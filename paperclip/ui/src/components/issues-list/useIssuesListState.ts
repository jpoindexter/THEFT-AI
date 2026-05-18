import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import type { Issue } from "@paperclipai/shared";
import type { InboxIssueColumn } from "../../lib/inbox";
import {
  normalizeInboxIssueColumns,
} from "../../lib/inbox";
import type { IssueSortField, IssueViewState } from "./types";
import {
  getInitialWorkspaceViewState,
  loadIssueColumns,
  saveIssueColumns,
  saveViewState,
} from "./view-state";

export function useIssuesListState({
  issues,
  selectedCompanyId,
  viewStateKey,
  initialAssignees,
  initialWorkspaces,
  initialSearch,
  defaultSortField,
  onSearchChange,
}: {
  issues: Issue[];
  selectedCompanyId?: string | null;
  viewStateKey: string;
  initialAssignees?: string[];
  initialWorkspaces?: string[];
  initialSearch?: string;
  defaultSortField?: IssueSortField;
  onSearchChange?: (search: string) => void;
}) {
  const scopedKey = selectedCompanyId ? `${viewStateKey}:${selectedCompanyId}` : viewStateKey;
  const initialAssigneesKey = initialAssignees?.join("|") ?? "";
  const initialWorkspacesKey = initialWorkspaces?.join("|") ?? "";

  const [viewState, setViewState] = useState<IssueViewState>(() =>
    getInitialWorkspaceViewState(scopedKey, initialAssignees, initialWorkspaces, defaultSortField),
  );
  const [assigneePickerIssueId, setAssigneePickerIssueId] = useState<string | null>(null);
  const [assigneeSearch, setAssigneeSearch] = useState("");
  const [issueSearch, setIssueSearch] = useState(initialSearch ?? "");
  const [visibleIssueColumns, setVisibleIssueColumns] = useState<InboxIssueColumn[]>(() => loadIssueColumns(scopedKey));
  const deferredIssueSearch = useDeferredValue(issueSearch);
  const normalizedIssueSearch = deferredIssueSearch.trim().toLowerCase();

  useEffect(() => {
    setIssueSearch(initialSearch ?? "");
  }, [initialSearch]);

  const prevViewStateContextKey = useRef(`${scopedKey}::${initialAssigneesKey}::${initialWorkspacesKey}`);
  useEffect(() => {
    const nextContextKey = `${scopedKey}::${initialAssigneesKey}::${initialWorkspacesKey}`;
    if (prevViewStateContextKey.current !== nextContextKey) {
      prevViewStateContextKey.current = nextContextKey;
      setViewState(getInitialWorkspaceViewState(scopedKey, initialAssignees, initialWorkspaces, defaultSortField));
    }
  }, [scopedKey, initialAssignees, initialAssigneesKey, initialWorkspaces, initialWorkspacesKey, defaultSortField]);

  const prevColumnsScopedKey = useRef(scopedKey);
  useEffect(() => {
    if (prevColumnsScopedKey.current !== scopedKey) {
      prevColumnsScopedKey.current = scopedKey;
      setVisibleIssueColumns(loadIssueColumns(scopedKey));
    }
  }, [scopedKey]);

  const updateView = useCallback((patch: Partial<IssueViewState>) => {
    setViewState((prev) => {
      const next = { ...prev, ...patch };
      saveViewState(scopedKey, next);
      return next;
    });
  }, [scopedKey]);

  useEffect(() => {
    const parentIds = new Set(issues.map((issue) => issue.parentId).filter(Boolean) as string[]);
    const pruned = viewState.collapsedParents.filter((id) => parentIds.has(id));
    if (pruned.length !== viewState.collapsedParents.length) {
      updateView({ collapsedParents: pruned });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [issues]);

  const setIssueColumns = useCallback((next: InboxIssueColumn[]) => {
    const normalized = normalizeInboxIssueColumns(next);
    setVisibleIssueColumns(normalized);
    saveIssueColumns(scopedKey, normalized);
  }, [scopedKey]);

  const toggleIssueColumn = useCallback((column: InboxIssueColumn, enabled: boolean) => {
    if (enabled) {
      setIssueColumns([...visibleIssueColumns, column]);
      return;
    }
    setIssueColumns(visibleIssueColumns.filter((value) => value !== column));
  }, [setIssueColumns, visibleIssueColumns]);

  const visibleIssueColumnSet = useMemo(() => new Set(visibleIssueColumns), [visibleIssueColumns]);

  const handleIssueSearchChange = useCallback((nextSearch: string) => {
    setIssueSearch(nextSearch);
    onSearchChange?.(nextSearch);
  }, [onSearchChange]);

  return {
    scopedKey,
    viewState,
    updateView,
    issueSearch,
    handleIssueSearchChange,
    normalizedIssueSearch,
    visibleIssueColumns,
    visibleIssueColumnSet,
    setIssueColumns,
    toggleIssueColumn,
    assigneePickerIssueId,
    setAssigneePickerIssueId,
    assigneeSearch,
    setAssigneeSearch,
  };
}
