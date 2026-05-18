import { useQueries, useQuery } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";
import { accessApi } from "../../api/access";
import { authApi } from "../../api/auth";
import { executionWorkspacesApi } from "../../api/execution-workspaces";
import { instanceSettingsApi } from "../../api/instanceSettings";
import { issuesApi } from "../../api/issues";
import { queryKeys } from "../../lib/queryKeys";
import {
  ISSUE_BOARD_COLUMN_RESULT_LIMIT,
  ISSUE_SEARCH_RESULT_LIMIT,
  boardIssueStatuses,
} from "./constants";
import type { IssuesListProps, IssueViewState } from "./types";

export function useIssuesListRemoteData({
  selectedCompanyId,
  normalizedIssueSearch,
  projectId,
  searchFilters,
  searchWithinLoadedIssues,
  enableRoutineVisibilityFilter,
  viewMode,
}: {
  selectedCompanyId?: string | null;
  normalizedIssueSearch: string;
  projectId?: string;
  searchFilters?: IssuesListProps["searchFilters"];
  searchWithinLoadedIssues: boolean;
  enableRoutineVisibilityFilter: boolean;
  viewMode: IssueViewState["viewMode"];
}) {
  const { data: session } = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const { data: companyMembers } = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const currentUserId = session?.user?.id ?? session?.session?.userId ?? null;
  const isolatedWorkspacesEnabled = experimentalSettings?.enableIsolatedWorkspaces === true;

  const { data: searchedIssues = [] } = useQuery({
    queryKey: [
      ...queryKeys.issues.search(selectedCompanyId!, normalizedIssueSearch, projectId),
      searchFilters ?? {},
      ISSUE_SEARCH_RESULT_LIMIT,
      enableRoutineVisibilityFilter ? "with-routine-executions" : "without-routine-executions",
    ],
    queryFn: () =>
      issuesApi.list(selectedCompanyId!, {
        q: normalizedIssueSearch,
        projectId,
        limit: ISSUE_SEARCH_RESULT_LIMIT,
        ...searchFilters,
        ...(enableRoutineVisibilityFilter ? { includeRoutineExecutions: true } : {}),
      }),
    enabled: !!selectedCompanyId && normalizedIssueSearch.length > 0 && !searchWithinLoadedIssues,
    placeholderData: (previousData) => previousData,
  });

  const boardIssueQueries = useQueries({
    queries: boardIssueStatuses.map((status) => ({
      queryKey: [
        ...queryKeys.issues.list(selectedCompanyId ?? "__no-company__"),
        "board-column",
        status,
        normalizedIssueSearch,
        projectId ?? "__all-projects__",
        searchFilters ?? {},
        ISSUE_BOARD_COLUMN_RESULT_LIMIT,
        enableRoutineVisibilityFilter ? "with-routine-executions" : "without-routine-executions",
      ],
      queryFn: () =>
        issuesApi.list(selectedCompanyId!, {
          ...searchFilters,
          ...(normalizedIssueSearch.length > 0 ? { q: normalizedIssueSearch } : {}),
          projectId,
          status,
          limit: ISSUE_BOARD_COLUMN_RESULT_LIMIT,
          ...(enableRoutineVisibilityFilter ? { includeRoutineExecutions: true } : {}),
        }),
      enabled: !!selectedCompanyId && viewMode === "board" && !searchWithinLoadedIssues,
      placeholderData: (previousData: Issue[] | undefined) => previousData,
    })),
  });

  const { data: executionWorkspaces = [] } = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.executionWorkspaces.summaryList(selectedCompanyId)
      : ["execution-workspaces", "__disabled__"],
    queryFn: () => executionWorkspacesApi.listSummaries(selectedCompanyId!),
    enabled: !!selectedCompanyId && isolatedWorkspacesEnabled,
  });

  const { data: labels } = useQuery({
    queryKey: queryKeys.issues.labels(selectedCompanyId!),
    queryFn: () => issuesApi.listLabels(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  return {
    currentUserId,
    isolatedWorkspacesEnabled,
    companyMembers,
    searchedIssues,
    boardIssueQueries,
    executionWorkspaces,
    labels,
  };
}
