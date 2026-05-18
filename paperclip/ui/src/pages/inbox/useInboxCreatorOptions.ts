import { useMemo } from "react";
import type { Agent, Issue } from "@paperclipai/shared";
import { formatAssigneeUserLabel } from "../../lib/assignees";

export type CreatorOption = {
  id: string;
  label: string;
  kind: "agent" | "user";
  searchText?: string;
};

export function useInboxCreatorOptions({
  agents,
  currentUserId,
  mineIssues,
  touchedIssues,
}: {
  agents: Agent[] | undefined;
  currentUserId: string | null;
  mineIssues: Issue[];
  touchedIssues: Issue[];
}) {
  return useMemo<CreatorOption[]>(() => {
    const options = new Map<string, CreatorOption>();
    const sourceIssues = [...mineIssues, ...touchedIssues];

    if (currentUserId) {
      options.set(`user:${currentUserId}`, {
        id: `user:${currentUserId}`,
        label: currentUserId === "local-board" ? "Board" : "Me",
        kind: "user",
        searchText: currentUserId === "local-board" ? "board me human local-board" : `me board human ${currentUserId}`,
      });
    }

    for (const issue of sourceIssues) {
      if (!issue.createdByUserId) continue;
      const id = `user:${issue.createdByUserId}`;
      if (options.has(id)) continue;
      options.set(id, {
        id,
        label: formatAssigneeUserLabel(issue.createdByUserId, currentUserId) ?? issue.createdByUserId.slice(0, 5),
        kind: "user",
        searchText: `${issue.createdByUserId} board user human`,
      });
    }

    const knownAgentIds = new Set<string>();
    for (const agent of agents ?? []) {
      knownAgentIds.add(agent.id);
      const id = `agent:${agent.id}`;
      if (!options.has(id)) {
        options.set(id, {
          id,
          label: agent.name,
          kind: "agent",
          searchText: `${agent.name} ${agent.id} agent`,
        });
      }
    }

    for (const issue of sourceIssues) {
      if (!issue.createdByAgentId || knownAgentIds.has(issue.createdByAgentId)) continue;
      const id = `agent:${issue.createdByAgentId}`;
      if (options.has(id)) continue;
      options.set(id, {
        id,
        label: issue.createdByAgentId.slice(0, 8),
        kind: "agent",
        searchText: `${issue.createdByAgentId} agent`,
      });
    }

    return [...options.values()].sort((a, b) => {
      if (a.kind !== b.kind) return a.kind === "user" ? -1 : 1;
      return a.label.localeCompare(b.label);
    });
  }, [agents, currentUserId, mineIssues, touchedIssues]);
}
