import type { ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";

import { issuesApi } from "@/api/issues";
import { Link } from "@/lib/router";
import { queryKeys } from "@/lib/queryKeys";
import { StatusIcon } from "../StatusIcon";

type MarkdownIssueLinkProps = {
  issuePathId: string;
  children: ReactNode;
};

export function MarkdownIssueLink({
  issuePathId,
  children,
}: MarkdownIssueLinkProps) {
  const { data } = useQuery({
    queryKey: queryKeys.issues.detail(issuePathId),
    queryFn: () => issuesApi.get(issuePathId),
    staleTime: 60_000,
  });

  const identifier = data?.identifier ?? issuePathId;
  const title = data?.title ?? identifier;
  const status = data?.status;
  const issueLabel = title !== identifier ? `Issue ${identifier}: ${title}` : `Issue ${identifier}`;

  return (
    <Link
      to={`/issues/${identifier}`}
      data-mention-kind="issue"
      className="paperclip-markdown-issue-ref"
      title={title}
      aria-label={issueLabel}
    >
      {status ? (
        <StatusIcon status={status} className="mr-1 h-3 w-3 align-middle" />
      ) : null}
      {children}
    </Link>
  );
}
