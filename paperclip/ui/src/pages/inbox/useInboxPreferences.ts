import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  countActiveIssueFilters,
  type IssueFilterState,
} from "../../lib/issue-filters";
import {
  DEFAULT_INBOX_ISSUE_COLUMNS,
  getAvailableInboxIssueColumns,
  loadInboxFilterPreferences,
  loadInboxIssueColumns,
  loadInboxWorkItemGroupBy,
  normalizeInboxIssueColumns,
  saveInboxFilterPreferences,
  saveInboxIssueColumns,
  saveInboxWorkItemGroupBy,
  type InboxApprovalFilter,
  type InboxCategoryFilter,
  type InboxFilterPreferences,
  type InboxIssueColumn,
  type InboxWorkItemGroupBy,
} from "../../lib/inbox";

export function useInboxPreferences(selectedCompanyId: string | null, isolatedWorkspacesEnabled: boolean) {
  const [searchQuery, setSearchQuery] = useState("");
  const normalizedSearchQuery = searchQuery.trim();
  const [filterPreferences, setFilterPreferences] = useState<InboxFilterPreferences>(
    () => loadInboxFilterPreferences(selectedCompanyId),
  );
  const [groupBy, setGroupBy] = useState<InboxWorkItemGroupBy>(() => loadInboxWorkItemGroupBy());
  const [visibleIssueColumns, setVisibleIssueColumns] = useState<InboxIssueColumn[]>(loadInboxIssueColumns);
  const { allCategoryFilter, allApprovalFilter, issueFilters } = filterPreferences;

  const previousSelectedCompanyIdRef = useRef<string | null>(selectedCompanyId);
  useEffect(() => {
    if (previousSelectedCompanyIdRef.current === selectedCompanyId) return;
    previousSelectedCompanyIdRef.current = selectedCompanyId;
    setFilterPreferences(loadInboxFilterPreferences(selectedCompanyId));
  }, [selectedCompanyId]);

  const setIssueColumns = useCallback((next: InboxIssueColumn[]) => {
    const normalized = normalizeInboxIssueColumns(next);
    setVisibleIssueColumns(normalized);
    saveInboxIssueColumns(normalized);
  }, []);
  const toggleIssueColumn = useCallback((column: InboxIssueColumn, enabled: boolean) => {
    if (enabled) {
      setIssueColumns([...visibleIssueColumns, column]);
      return;
    }
    setIssueColumns(visibleIssueColumns.filter((value) => value !== column));
  }, [setIssueColumns, visibleIssueColumns]);
  const resetIssueColumns = useCallback(() => setIssueColumns(DEFAULT_INBOX_ISSUE_COLUMNS), [setIssueColumns]);

  const updateFilterPreferences = useCallback(
    (updater: (previous: InboxFilterPreferences) => InboxFilterPreferences) => {
      setFilterPreferences((previous) => {
        const next = updater(previous);
        saveInboxFilterPreferences(selectedCompanyId, next);
        return next;
      });
    },
    [selectedCompanyId],
  );
  const updateIssueFilters = useCallback((patch: Partial<IssueFilterState>) => {
    updateFilterPreferences((previous) => ({
      ...previous,
      issueFilters: { ...previous.issueFilters, ...patch },
    }));
  }, [updateFilterPreferences]);
  const updateAllCategoryFilter = useCallback((value: InboxCategoryFilter) => {
    updateFilterPreferences((previous) => ({ ...previous, allCategoryFilter: value }));
  }, [updateFilterPreferences]);
  const updateAllApprovalFilter = useCallback((value: InboxApprovalFilter) => {
    updateFilterPreferences((previous) => ({ ...previous, allApprovalFilter: value }));
  }, [updateFilterPreferences]);
  const updateGroupBy = useCallback((nextGroupBy: InboxWorkItemGroupBy) => {
    setGroupBy(nextGroupBy);
    saveInboxWorkItemGroupBy(nextGroupBy);
  }, []);

  const visibleIssueColumnSet = useMemo(() => new Set(visibleIssueColumns), [visibleIssueColumns]);
  const availableIssueColumns = useMemo(
    () => getAvailableInboxIssueColumns(isolatedWorkspacesEnabled),
    [isolatedWorkspacesEnabled],
  );
  const availableIssueColumnSet = useMemo(() => new Set(availableIssueColumns), [availableIssueColumns]);
  const activeIssueFilterCount = useMemo(() => countActiveIssueFilters(issueFilters, true), [issueFilters]);

  return {
    activeIssueFilterCount,
    allApprovalFilter,
    allCategoryFilter,
    availableIssueColumns,
    availableIssueColumnSet,
    groupBy,
    issueFilters,
    normalizedSearchQuery,
    resetIssueColumns,
    searchQuery,
    setGroupBy,
    setSearchQuery,
    toggleIssueColumn,
    updateAllApprovalFilter,
    updateAllCategoryFilter,
    updateGroupBy,
    updateIssueFilters,
    visibleIssueColumnSet,
  };
}
