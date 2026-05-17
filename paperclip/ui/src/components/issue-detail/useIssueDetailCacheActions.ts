import { useCallback, useMemo } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import type { Issue, IssueComment, IssueThreadInteraction } from "@paperclipai/shared";

import {
  applyOptimisticIssueFieldUpdate,
  applyOptimisticIssueFieldUpdateToCollection,
  matchesIssueRef,
  removeIssueCommentFromPages,
} from "@/lib/optimistic-issue-comments";
import { queryKeys } from "@/lib/queryKeys";

type UseIssueDetailCacheActionsInput = {
  issue: Issue | null | undefined;
  issueId?: string;
  selectedCompanyId: string | null | undefined;
};

export function useIssueDetailCacheActions({
  issue,
  issueId,
  selectedCompanyId,
}: UseIssueDetailCacheActionsInput) {
  const queryClient = useQueryClient();
  const issueCacheRefs = useMemo(() => {
    const refs = new Set<string>();
    if (issueId) refs.add(issueId);
    if (issue?.id) refs.add(issue.id);
    if (issue?.identifier) refs.add(issue.identifier);
    return [...refs];
  }, [issue?.id, issue?.identifier, issueId]);

  const invalidateIssueDetail = useCallback(() => {
    for (const ref of issueCacheRefs) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.interactions(ref) });
    }
  }, [issueCacheRefs, queryClient]);

  const invalidateIssueThreadLazily = useCallback(() => {
    for (const ref of issueCacheRefs) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(ref), refetchType: "inactive" });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(ref), refetchType: "inactive" });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.interactions(ref), refetchType: "inactive" });
    }
  }, [issueCacheRefs, queryClient]);

  const invalidateIssueRunState = useCallback(() => {
    for (const ref of issueCacheRefs) {
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.runs(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.liveRuns(ref) });
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activeRun(ref) });
    }
  }, [issueCacheRefs, queryClient]);

  const invalidateIssueCollections = useCallback(() => {
    if (!selectedCompanyId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId) });
  }, [queryClient, selectedCompanyId]);

  const removeCommentFromCache = useCallback((commentId: string) => {
    queryClient.setQueryData<InfiniteData<IssueComment[], string | null> | undefined>(
      queryKeys.issues.comments(issueId!),
      (current) => {
        if (!current) return current;
        return {
          ...current,
          pages: removeIssueCommentFromPages(current.pages, commentId),
        };
      },
    );
  }, [issueId, queryClient]);

  const upsertInteractionInCache = useCallback((interaction: IssueThreadInteraction) => {
    queryClient.setQueryData<IssueThreadInteraction[] | undefined>(
      queryKeys.issues.interactions(issueId!),
      (current) => {
        const existing = current ?? [];
        const next = existing.filter((entry) => entry.id !== interaction.id);
        next.push(interaction);
        next.sort((left, right) => {
          const createdAtDelta =
            new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
          return createdAtDelta === 0 ? left.id.localeCompare(right.id) : createdAtDelta;
        });
        return next;
      },
    );
  }, [issueId, queryClient]);

  const applyOptimisticIssueCacheUpdate = useCallback((refs: Iterable<string>, data: Record<string, unknown>) => {
    queryClient.setQueriesData<Issue>(
      { queryKey: ["issues", "detail"] },
      (cached) => (cached && matchesIssueRef(cached, refs) ? applyOptimisticIssueFieldUpdate(cached, data) : cached),
    );

    if (!selectedCompanyId) return;
    queryClient.setQueryData<Issue[] | undefined>(
      queryKeys.issues.list(selectedCompanyId),
      (cached) => applyOptimisticIssueFieldUpdateToCollection(cached, refs, data),
    );
  }, [queryClient, selectedCompanyId]);

  const mergeIssueResponseIntoCaches = useCallback((refs: Iterable<string>, nextIssue: Issue) => {
    queryClient.setQueriesData<Issue>(
      { queryKey: ["issues", "detail"] },
      (cached) => (cached && matchesIssueRef(cached, refs) ? { ...cached, ...nextIssue } : cached),
    );

    if (!selectedCompanyId) return;
    queryClient.setQueryData<Issue[] | undefined>(
      queryKeys.issues.list(selectedCompanyId),
      (cached) => cached?.map((item) => (matchesIssueRef(item, refs) ? { ...item, ...nextIssue } : item)),
    );
  }, [queryClient, selectedCompanyId]);

  return {
    applyOptimisticIssueCacheUpdate,
    invalidateIssueCollections,
    invalidateIssueDetail,
    invalidateIssueRunState,
    invalidateIssueThreadLazily,
    issueCacheRefs,
    mergeIssueResponseIntoCaches,
    removeCommentFromCache,
    upsertInteractionInCache,
  };
}
