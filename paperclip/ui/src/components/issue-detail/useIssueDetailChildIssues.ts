import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Issue } from "@paperclipai/shared";

import { heartbeatsApi, type LiveRunForIssue } from "@/api/heartbeats";
import { issuesApi } from "@/api/issues";
import { collectLiveIssueIds } from "@/lib/liveIssueIds";
import { keepPreviousDataForSameQueryTail } from "@/lib/query-placeholder-data";
import { queryKeys } from "@/lib/queryKeys";
import { buildIssuePropertiesPanelKey } from "@/lib/issue-properties-panel-key";
import { shouldRenderRichSubIssuesSection } from "@/lib/issue-detail-subissues";
import { filterIssueDescendants } from "@/lib/issue-tree";
import { buildSubIssueDefaultsForViewer } from "@/lib/subIssueDefaults";

type UseIssueDetailChildIssuesInput = {
  issue: Issue | null | undefined;
  resolvedCompanyId: string | null | undefined;
  currentUserId: string | null;
  openNewIssue: (defaults?: Record<string, unknown>) => void;
};

export function useIssueDetailChildIssues({
  issue,
  resolvedCompanyId,
  currentUserId,
  openNewIssue,
}: UseIssueDetailChildIssuesInput) {
  const { data: rawChildIssues = [], isLoading: childIssuesLoading } = useQuery({
    queryKey:
      issue?.id && resolvedCompanyId
        ? queryKeys.issues.listByDescendantRoot(resolvedCompanyId, issue.id)
        : ["issues", "parent", "pending"],
    queryFn: () => issuesApi.list(resolvedCompanyId!, { descendantOf: issue!.id, includeBlockedBy: true }),
    enabled: !!resolvedCompanyId && !!issue?.id,
    placeholderData: keepPreviousDataForSameQueryTail<Issue[]>(issue?.id ?? "pending"),
  });
  const { data: companyLiveRuns } = useQuery({
    queryKey: resolvedCompanyId ? queryKeys.liveRuns(resolvedCompanyId) : ["live-runs", "pending"],
    queryFn: () => heartbeatsApi.liveRunsForCompany(resolvedCompanyId!),
    enabled: !!resolvedCompanyId,
    refetchInterval: 5000,
    placeholderData: keepPreviousDataForSameQueryTail<LiveRunForIssue[]>(resolvedCompanyId ?? "pending"),
  });

  const childIssues = useMemo(
    () => {
      const descendants = issue?.id ? filterIssueDescendants(issue.id, rawChildIssues) : rawChildIssues;
      return [...descendants].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    [issue?.id, rawChildIssues],
  );
  const liveIssueIds = useMemo(() => collectLiveIssueIds(companyLiveRuns), [companyLiveRuns]);
  const issuePanelKey = useMemo(
    () => buildIssuePropertiesPanelKey(issue ?? null, childIssues),
    [childIssues, issue],
  );
  const panelIssue = useMemo(
    () => issue ?? null,
    [issue?.id, issuePanelKey],
  );
  const panelChildIssues = useMemo(
    () => childIssues,
    [issuePanelKey],
  );
  const showRichSubIssuesSection = shouldRenderRichSubIssuesSection(childIssuesLoading, childIssues.length);
  const openNewSubIssue = useCallback(() => {
    if (!issue) return;
    openNewIssue(buildSubIssueDefaultsForViewer(issue, currentUserId));
  }, [
    currentUserId,
    issue,
    openNewIssue,
  ]);

  return {
    childIssues,
    childIssuesLoading,
    liveIssueIds,
    issuePanelKey,
    panelIssue,
    panelChildIssues,
    showRichSubIssuesSection,
    openNewSubIssue,
  };
}
