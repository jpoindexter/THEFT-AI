import { useCallback, useEffect } from "react";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { issuesApi } from "@/api/issues";
import { loadRemainingIssueCommentPages } from "@/lib/optimistic-issue-comments";
import { queryKeys } from "@/lib/queryKeys";
import type { IssueComment } from "@paperclipai/shared";
import {
  ISSUE_COMMENT_PAGE_SIZE,
  JUMP_TO_LATEST_MAX_COMMENT_PAGES,
} from "./useIssueDetailComments";

type UseIssueDetailCommentPaginationInput = {
  fetchOlderComments: () => Promise<unknown>;
  issueId: string | undefined;
  refetchComments: () => Promise<{
    data?: {
      pages?: IssueComment[][];
      pageParams?: unknown[];
    };
  }>;
  shouldPrefetchOlderComments: boolean;
};

export function useIssueDetailCommentPagination({
  fetchOlderComments,
  issueId,
  refetchComments,
  shouldPrefetchOlderComments,
}: UseIssueDetailCommentPaginationInput) {
  const queryClient = useQueryClient();

  const loadOlderComments = useCallback(() => {
    void fetchOlderComments();
  }, [fetchOlderComments]);

  const refetchLatestComments = useCallback(async () => {
    // Refetch page 0 first so comments that arrived after initial load are
    // visible, then load every remaining older page. The chat thread is
    // paginated and virtualized, so "latest" must be resolved against the
    // complete comment set rather than the current loaded window.
    const refreshed = await refetchComments();
    const loaded = await loadRemainingIssueCommentPages<IssueComment>({
      pages: refreshed.data?.pages,
      pageParams: refreshed.data?.pageParams as Array<string | null> | undefined,
      pageSize: ISSUE_COMMENT_PAGE_SIZE,
      maxPages: JUMP_TO_LATEST_MAX_COMMENT_PAGES,
      fetchPage: (afterCommentId) =>
        issuesApi.listComments(issueId!, {
          order: "desc",
          limit: ISSUE_COMMENT_PAGE_SIZE,
          after: afterCommentId,
        }),
    });
    queryClient.setQueryData<InfiniteData<IssueComment[], string | null>>(
      queryKeys.issues.comments(issueId!),
      loaded,
    );
    await new Promise<void>((resolve) => {
      if (typeof window === "undefined") {
        resolve();
        return;
      }
      window.requestAnimationFrame(() => resolve());
    });
  }, [issueId, queryClient, refetchComments]);

  useEffect(() => {
    if (!shouldPrefetchOlderComments) return;
    void fetchOlderComments();
  }, [fetchOlderComments, shouldPrefetchOlderComments]);

  return {
    loadOlderComments,
    refetchLatestComments,
  };
}
