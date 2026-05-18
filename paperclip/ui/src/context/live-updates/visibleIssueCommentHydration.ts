import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { IssueComment } from "@paperclipai/shared";
import { issuesApi } from "../../api/issues";
import { upsertIssueCommentInPages } from "../../lib/optimistic-issue-comments";
import { queryKeys } from "../../lib/queryKeys";
import { readRecord, readString } from "./liveUpdateModel";
import {
  buildIssueRefsForPayload,
  overlaps,
  resolveVisibleIssueRouteContext,
  type VisibleRouteOptions,
} from "./visibleIssueRoute";

export async function hydrateVisibleIssueComment(
  queryClient: QueryClient,
  pathname: string,
  payload: Record<string, unknown>,
  options?: VisibleRouteOptions,
) {
  const entityType = readString(payload.entityType);
  const action = readString(payload.action);
  const details = readRecord(payload.details);
  const commentId = readString(details?.commentId);

  if (entityType !== "issue" || action !== "issue.comment_added" || !commentId) return false;

  const context = resolveVisibleIssueRouteContext(queryClient, pathname, options);
  if (!context) return false;

  const entityId = readString(payload.entityId);
  if (!entityId || !overlaps(context.issueRefs, buildIssueRefsForPayload(entityId, details))) {
    return false;
  }

  try {
    const comment = await issuesApi.getComment(context.routeIssueRef, commentId);
    queryClient.setQueryData<InfiniteData<IssueComment[], string | null> | undefined>(
      queryKeys.issues.comments(context.routeIssueRef),
      (current) => {
        if (!current) {
          return {
            pages: [[comment]],
            pageParams: [null],
          };
        }

        return {
          ...current,
          pages: upsertIssueCommentInPages(current.pages, comment),
        };
      },
    );
    return true;
  } catch {
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.comments(context.routeIssueRef) });
    return false;
  }
}
