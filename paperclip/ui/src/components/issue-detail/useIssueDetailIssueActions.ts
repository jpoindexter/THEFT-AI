import { useCallback, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { issuesApi } from "@/api/issues";
import { useToastActions } from "@/context/ToastContext";
import { matchesIssueRef } from "@/lib/optimistic-issue-comments";
import { queryKeys } from "@/lib/queryKeys";
import type { Issue } from "@paperclipai/shared";

type NavigateFn = (to: string, options?: { replace?: boolean }) => void;

type UseIssueDetailIssueActionsInput = {
  applyOptimisticIssueCacheUpdate: (refs: Iterable<string>, data: Record<string, unknown>) => void;
  invalidateIssueCollections: () => void;
  invalidateIssueDetail: () => void;
  invalidateIssueRunState: () => void;
  issue: Issue | null | undefined;
  issueId: string | undefined;
  mergeIssueResponseIntoCaches: (refs: Iterable<string>, issue: Issue) => void;
  navigate: NavigateFn;
  resolvedCompanyId: string | null | undefined;
  selectedCompanyId: string | null | undefined;
  sourceBreadcrumbHref: string;
};

export function useIssueDetailIssueActions({
  applyOptimisticIssueCacheUpdate,
  invalidateIssueCollections,
  invalidateIssueDetail,
  invalidateIssueRunState,
  issue,
  issueId,
  mergeIssueResponseIntoCaches,
  navigate,
  resolvedCompanyId,
  selectedCompanyId,
  sourceBreadcrumbHref,
}: UseIssueDetailIssueActionsInput) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const lastMarkedReadIssueIdRef = useRef<string | null>(null);

  const markIssueRead = useMutation({
    mutationFn: (id: string) => issuesApi.markRead(id),
    onSuccess: () => {
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId) });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId) });
      }
    },
  });

  useEffect(() => {
    if (!issue?.id) return;
    if (lastMarkedReadIssueIdRef.current === issue.id) return;
    lastMarkedReadIssueIdRef.current = issue.id;
    markIssueRead.mutate(issue.id);
  }, [issue?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateIssue = useMutation({
    mutationFn: (data: Record<string, unknown>) => issuesApi.update(issueId!, data),
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.issues.detail(issueId!) });
      if (selectedCompanyId) {
        await queryClient.cancelQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
      }

      const previousIssue = queryClient.getQueryData<Issue>(queryKeys.issues.detail(issueId!));
      const issueRefs = new Set<string>([issueId!]);
      if (previousIssue?.id) issueRefs.add(previousIssue.id);
      if (previousIssue?.identifier) issueRefs.add(previousIssue.identifier);

      const previousDetailQueries = queryClient
        .getQueriesData<Issue>({ queryKey: ["issues", "detail"] })
        .filter(([, cachedIssue]) => cachedIssue && matchesIssueRef(cachedIssue, issueRefs));
      const previousList = selectedCompanyId
        ? queryClient.getQueryData<Issue[]>(queryKeys.issues.list(selectedCompanyId))
        : undefined;

      applyOptimisticIssueCacheUpdate(issueRefs, data);

      return { previousDetailQueries, previousList, selectedCompanyId };
    },
    onSuccess: ({ comment: _comment, ...nextIssue }) => {
      const issueRefs = new Set<string>([issueId!, nextIssue.id]);
      if (nextIssue.identifier) issueRefs.add(nextIssue.identifier);
      mergeIssueResponseIntoCaches(issueRefs, nextIssue);
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(issueId!) });
      invalidateIssueCollections();
    },
    onError: (err, _variables, context) => {
      for (const [queryKey, previousIssue] of context?.previousDetailQueries ?? []) {
        queryClient.setQueryData(queryKey, previousIssue);
      }
      if (context?.selectedCompanyId) {
        queryClient.setQueryData(queryKeys.issues.list(context.selectedCompanyId), context.previousList);
      }
      pushToast({
        title: "Issue update failed",
        body: err instanceof Error ? err.message : "Unable to save issue changes",
        tone: "error",
      });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId!) });
      if (selectedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
      }
    },
  });

  const handleIssuePropertiesUpdate = useCallback((data: Record<string, unknown>) => {
    updateIssue.mutate(data);
  }, [updateIssue]);

  const updateChildIssue = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => issuesApi.update(id, data),
    onSuccess: () => {
      if (resolvedCompanyId) {
        queryClient.invalidateQueries({ queryKey: ["issues", resolvedCompanyId] });
        queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(resolvedCompanyId) });
      }
    },
    onError: (err) => {
      pushToast({
        title: "Issue update failed",
        body: err instanceof Error ? err.message : "Unable to save sub-issue changes",
        tone: "error",
      });
    },
  });

  const handleChildIssueUpdate = useCallback((id: string, data: Record<string, unknown>) => {
    updateChildIssue.mutate({ id, data });
  }, [updateChildIssue]);

  const checkIssueMonitorNow = useMutation({
    mutationFn: () => issuesApi.checkMonitorNow(issueId!),
    onSuccess: () => {
      invalidateIssueDetail();
      invalidateIssueRunState();
      invalidateIssueCollections();
      pushToast({
        title: "Monitor check queued",
        tone: "success",
      });
    },
    onError: (err) => {
      pushToast({
        title: "Monitor check failed",
        body: err instanceof Error ? err.message : "Unable to trigger the monitor right now",
        tone: "error",
      });
    },
  });

  const archiveFromInbox = useMutation({
    mutationFn: (id: string) => issuesApi.archiveFromInbox(id),
    onSuccess: () => {
      invalidateIssueCollections();
      navigate(sourceBreadcrumbHref.startsWith("/inbox") ? sourceBreadcrumbHref : "/inbox", { replace: true });
      pushToast({ title: "Issue archived from inbox", tone: "success" });
    },
    onError: (err) => {
      pushToast({
        title: "Archive failed",
        body: err instanceof Error ? err.message : "Unable to archive this issue from the inbox",
        tone: "error",
      });
    },
  });

  const archiveIssueFromInbox = useCallback((id: string) => {
    if (!archiveFromInbox.isPending) archiveFromInbox.mutate(id);
  }, [archiveFromInbox]);

  const hideIssue = useCallback(() => {
    updateIssue.mutate(
      { hiddenAt: new Date().toISOString() },
      { onSuccess: () => navigate("/issues/all") },
    );
  }, [navigate, updateIssue]);

  return {
    archiveIssueFromInbox,
    archivePending: archiveFromInbox.isPending,
    checkIssueMonitorNow,
    handleChildIssueUpdate,
    handleIssuePropertiesUpdate,
    hideIssue,
    issueHidden: !!issue?.hiddenAt,
    updateIssue,
  };
}
