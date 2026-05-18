import { useQuery } from "@tanstack/react-query";
import { INBOX_MINE_ISSUE_STATUS_FILTER } from "@paperclipai/shared";
import { approvalsApi } from "../../api/approvals";
import { accessApi } from "../../api/access";
import { authApi } from "../../api/auth";
import { ApiError } from "../../api/client";
import { dashboardApi } from "../../api/dashboard";
import { executionWorkspacesApi } from "../../api/execution-workspaces";
import { issuesApi } from "../../api/issues";
import { agentsApi } from "../../api/agents";
import { heartbeatsApi } from "../../api/heartbeats";
import { instanceSettingsApi } from "../../api/instanceSettings";
import { projectsApi } from "../../api/projects";
import { queryKeys } from "../../lib/queryKeys";

const INBOX_HEARTBEAT_RUN_LIMIT = 200;
const INBOX_ISSUE_LIST_LIMIT = 500;

export function useInboxDataQueries(selectedCompanyId: string | null) {
  const experimentalSettingsQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const isolatedWorkspacesEnabled = experimentalSettingsQuery.data?.enableIsolatedWorkspaces === true;

  const sessionQuery = useQuery({
    queryKey: queryKeys.auth.session,
    queryFn: () => authApi.getSession(),
  });
  const agentsQuery = useQuery({
    queryKey: queryKeys.agents.list(selectedCompanyId!),
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const projectsQuery = useQuery({
    queryKey: queryKeys.projects.list(selectedCompanyId!),
    queryFn: () => projectsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const labelsQuery = useQuery({
    queryKey: queryKeys.issues.labels(selectedCompanyId!),
    queryFn: () => issuesApi.listLabels(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const executionWorkspacesQuery = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.executionWorkspaces.summaryList(selectedCompanyId)
      : ["execution-workspaces", "__disabled__"],
    queryFn: () => executionWorkspacesApi.listSummaries(selectedCompanyId!),
    enabled: !!selectedCompanyId && isolatedWorkspacesEnabled,
  });
  const approvalsQuery = useQuery({
    queryKey: queryKeys.approvals.list(selectedCompanyId!),
    queryFn: () => approvalsApi.list(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const joinRequestsQuery = useQuery({
    queryKey: queryKeys.access.joinRequests(selectedCompanyId!),
    queryFn: async () => {
      try {
        return await accessApi.listJoinRequests(selectedCompanyId!, "pending_approval");
      } catch (err) {
        if (err instanceof ApiError && (err.status === 403 || err.status === 401)) return [];
        throw err;
      }
    },
    enabled: !!selectedCompanyId,
    retry: false,
  });
  const dashboardQuery = useQuery({
    queryKey: queryKeys.dashboard(selectedCompanyId!),
    queryFn: () => dashboardApi.summary(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });
  const issuesQuery = useQuery({
    queryKey: [...queryKeys.issues.list(selectedCompanyId!), "with-routine-executions"],
    queryFn: () => issuesApi.list(selectedCompanyId!, { includeRoutineExecutions: true, limit: INBOX_ISSUE_LIST_LIMIT }),
    enabled: !!selectedCompanyId,
  });
  const mineIssuesQuery = useQuery({
    queryKey: [...queryKeys.issues.listMineByMe(selectedCompanyId!), "with-routine-executions"],
    queryFn: () =>
      issuesApi.list(selectedCompanyId!, {
        touchedByUserId: "me",
        inboxArchivedByUserId: "me",
        status: INBOX_MINE_ISSUE_STATUS_FILTER,
        includeRoutineExecutions: true,
        limit: INBOX_ISSUE_LIST_LIMIT,
      }),
    enabled: !!selectedCompanyId,
  });
  const touchedIssuesQuery = useQuery({
    queryKey: [...queryKeys.issues.listTouchedByMe(selectedCompanyId!), "with-routine-executions"],
    queryFn: () =>
      issuesApi.list(selectedCompanyId!, {
        touchedByUserId: "me",
        status: INBOX_MINE_ISSUE_STATUS_FILTER,
        includeRoutineExecutions: true,
        limit: INBOX_ISSUE_LIST_LIMIT,
      }),
    enabled: !!selectedCompanyId,
  });
  const heartbeatRunsQuery = useQuery({
    queryKey: [...queryKeys.heartbeats(selectedCompanyId!), "limit", INBOX_HEARTBEAT_RUN_LIMIT],
    queryFn: () => heartbeatsApi.list(selectedCompanyId!, undefined, INBOX_HEARTBEAT_RUN_LIMIT),
    enabled: !!selectedCompanyId,
  });
  const liveRunsQuery = useQuery({
    queryKey: queryKeys.liveRuns(selectedCompanyId!),
    queryFn: () => heartbeatsApi.liveRunsForCompany(selectedCompanyId!),
    enabled: !!selectedCompanyId,
    refetchInterval: 5000,
  });
  const companyMembersQuery = useQuery({
    queryKey: queryKeys.access.companyUserDirectory(selectedCompanyId!),
    queryFn: () => accessApi.listUserDirectory(selectedCompanyId!),
    enabled: !!selectedCompanyId,
  });

  return {
    agents: agentsQuery.data,
    approvals: approvalsQuery.data,
    approvalsError: approvalsQuery.error,
    companyMembers: companyMembersQuery.data,
    dashboard: dashboardQuery.data,
    executionWorkspaces: executionWorkspacesQuery.data ?? [],
    experimentalSettingsLoaded: experimentalSettingsQuery.data !== undefined,
    heartbeatRuns: heartbeatRunsQuery.data,
    isApprovalsLoading: approvalsQuery.isLoading,
    isDashboardLoading: dashboardQuery.isLoading,
    isIssuesLoading: issuesQuery.isLoading,
    isJoinRequestsLoading: joinRequestsQuery.isLoading,
    isMineIssuesLoading: mineIssuesQuery.isLoading,
    isRunsLoading: heartbeatRunsQuery.isLoading,
    isTouchedIssuesLoading: touchedIssuesQuery.isLoading,
    isolatedWorkspacesEnabled,
    issues: issuesQuery.data,
    joinRequests: joinRequestsQuery.data ?? [],
    labels: labelsQuery.data,
    liveRuns: liveRunsQuery.data,
    mineIssuesRaw: mineIssuesQuery.data ?? [],
    projects: projectsQuery.data,
    session: sessionQuery.data,
    touchedIssuesRaw: touchedIssuesQuery.data ?? [],
  };
}
