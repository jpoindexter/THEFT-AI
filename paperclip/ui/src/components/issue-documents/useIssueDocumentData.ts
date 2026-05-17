import { useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  DocumentRevision,
  FeedbackVote,
  FeedbackVoteValue,
  Issue,
  IssueDocument,
} from "@paperclipai/shared";
import { isSystemIssueDocumentKey } from "@paperclipai/shared";

import { issuesApi } from "../../api/issues";
import { queryKeys } from "../../lib/queryKeys";
import { toDocumentSummary } from "./IssueDocumentUtils";

export function useIssueDocumentData({
  issue,
  feedbackVotes,
  revisionMenuOpenKey,
}: {
  issue: Issue;
  feedbackVotes: FeedbackVote[];
  revisionMenuOpenKey: string | null;
}) {
  const queryClient = useQueryClient();

  const { data: documents } = useQuery({
    queryKey: queryKeys.issues.documents(issue.id),
    queryFn: () => issuesApi.listDocuments(issue.id),
  });

  const { data: activeDocumentRevisions, isFetching: isFetchingDocumentRevisions } = useQuery({
    queryKey: revisionMenuOpenKey
      ? queryKeys.issues.documentRevisions(issue.id, revisionMenuOpenKey)
      : ["issues", "document-revisions", issue.id, "__idle__"],
    queryFn: async () => {
      if (!revisionMenuOpenKey) return [];
      return issuesApi.listDocumentRevisions(issue.id, revisionMenuOpenKey);
    },
    enabled: Boolean(revisionMenuOpenKey),
  });

  const invalidateIssueDocuments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issue.id) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.documents(issue.id) });
    queryClient.invalidateQueries({
      predicate: (query) =>
        Array.isArray(query.queryKey)
        && query.queryKey[0] === "issues"
        && query.queryKey[1] === "document-revisions"
        && query.queryKey[2] === issue.id,
    });
  }, [issue.id, queryClient]);

  const syncDocumentCaches = useCallback((document: IssueDocument) => {
    if (isSystemIssueDocumentKey(document.key)) return;
    queryClient.setQueryData<IssueDocument[] | undefined>(
      queryKeys.issues.documents(issue.id),
      (current) => {
        if (!current) return [document];
        const existingIndex = current.findIndex((entry) => entry.key === document.key);
        if (existingIndex === -1) return [...current, document];
        return current.map((entry, index) => index === existingIndex ? document : entry);
      },
    );
    queryClient.setQueryData<Issue | undefined>(
      queryKeys.issues.detail(issue.id),
      (current) => {
        if (!current) return current;
        const summary = toDocumentSummary(document);
        const summaries = current.documentSummaries ?? [];
        const existingIndex = summaries.findIndex((entry) => entry.key === document.key);
        const nextSummaries = existingIndex === -1
          ? [...summaries, summary]
          : summaries.map((entry, index) => index === existingIndex ? summary : entry);
        return {
          ...current,
          planDocument: document.key === "plan" ? document : current.planDocument ?? null,
          documentSummaries: nextSummaries,
          legacyPlanDocument: document.key === "plan" ? null : current.legacyPlanDocument ?? null,
        };
      },
    );
  }, [issue.id, queryClient]);

  const sortedDocuments = useMemo(() => {
    return (documents ?? []).filter((doc) => !isSystemIssueDocumentKey(doc.key)).sort((a, b) => {
      if (a.key === "plan" && b.key !== "plan") return -1;
      if (a.key !== "plan" && b.key === "plan") return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  }, [documents]);

  const feedbackVoteByTargetId = useMemo(() => {
    const map = new Map<string, FeedbackVoteValue>();
    for (const feedbackVote of feedbackVotes) {
      if (feedbackVote.targetType !== "issue_document_revision") continue;
      map.set(feedbackVote.targetId, feedbackVote.vote);
    }
    return map;
  }, [feedbackVotes]);

  const getDocumentRevisions = useCallback((key: string) => {
    const cached = queryClient.getQueryData<DocumentRevision[]>(queryKeys.issues.documentRevisions(issue.id, key));
    if (cached) return cached;
    if (revisionMenuOpenKey === key) return activeDocumentRevisions ?? [];
    return [];
  }, [activeDocumentRevisions, issue.id, queryClient, revisionMenuOpenKey]);

  return {
    sortedDocuments,
    feedbackVoteByTargetId,
    activeDocumentRevisions,
    isFetchingDocumentRevisions,
    invalidateIssueDocuments,
    syncDocumentCaches,
    getDocumentRevisions,
  };
}
