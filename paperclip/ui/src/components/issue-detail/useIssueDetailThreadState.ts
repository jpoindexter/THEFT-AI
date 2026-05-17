import { useMemo } from "react";

import { assigneeValueFromSelection, suggestedCommentAssigneeValue } from "@/lib/assignees";
import { buildCompanyUserInlineOptions } from "@/lib/company-members";
import {
  mergeIssueComments,
  type OptimisticIssueComment,
} from "@/lib/optimistic-issue-comments";
import type { CompanyMember, CompanyUserDirectoryEntry } from "@/api/access";
import type { Agent, Issue, IssueComment } from "@paperclipai/shared";

type CompanyUserRecord = Pick<CompanyMember, "principalId" | "status" | "user">
  | CompanyUserDirectoryEntry;

type UseIssueDetailThreadStateInput = {
  agents: Agent[] | null | undefined;
  comments: IssueComment[] | undefined;
  companyUsers: CompanyUserRecord[] | null | undefined;
  currentUserId: string | null;
  issue: Issue | null | undefined;
  optimisticComments: OptimisticIssueComment[];
};

export function useIssueDetailThreadState({
  agents,
  comments,
  companyUsers,
  currentUserId,
  issue,
  optimisticComments,
}: UseIssueDetailThreadStateInput) {
  const commentReassignOptions = useMemo(() => {
    const options: Array<{ id: string; label: string; searchText?: string }> = [];
    options.push(...buildCompanyUserInlineOptions(companyUsers, { excludeUserIds: [currentUserId] }));
    const activeAgents = [...(agents ?? [])]
      .filter((agent) => agent.status !== "terminated")
      .sort((a, b) => a.name.localeCompare(b.name));
    for (const agent of activeAgents) {
      options.push({ id: `agent:${agent.id}`, label: agent.name });
    }
    if (currentUserId) {
      options.push({ id: `user:${currentUserId}`, label: "Me" });
    }
    return options;
  }, [agents, companyUsers, currentUserId]);

  const actualAssigneeValue = useMemo(
    () => assigneeValueFromSelection(issue ?? {}),
    [issue],
  );

  const suggestedAssigneeValue = useMemo(
    () =>
      suggestedCommentAssigneeValue(
        issue ?? {},
        mergeIssueComments(comments ?? [], optimisticComments),
        currentUserId,
      ),
    [issue, comments, optimisticComments, currentUserId],
  );

  const threadComments = useMemo(
    () => mergeIssueComments(comments ?? [], optimisticComments),
    [comments, optimisticComments],
  );

  return {
    actualAssigneeValue,
    commentReassignOptions,
    suggestedAssigneeValue,
    threadComments,
  };
}
