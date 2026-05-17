import type { Issue } from "@paperclipai/shared";
import { formatAssigneeUserLabel } from "../../lib/assignees";
import type { Agent, CreatorOption } from "./types";

export function buildCreatorOptions({
  issues,
  agents,
  currentUserId,
}: {
  issues: Issue[];
  agents?: Agent[];
  currentUserId: string | null;
}): CreatorOption[] {
  const options = new Map<string, CreatorOption>();
  const knownAgentIds = new Set<string>();

  if (currentUserId) {
    options.set(`user:${currentUserId}`, {
      id: `user:${currentUserId}`,
      label: currentUserId === "local-board" ? "Board" : "Me",
      kind: "user",
      searchText: currentUserId === "local-board" ? "board me human local-board" : `me board human ${currentUserId}`,
    });
  }

  for (const issue of issues) {
    if (issue.createdByUserId) {
      const id = `user:${issue.createdByUserId}`;
      if (!options.has(id)) {
        options.set(id, {
          id,
          label: formatAssigneeUserLabel(issue.createdByUserId, currentUserId) ?? issue.createdByUserId.slice(0, 5),
          kind: "user",
          searchText: `${issue.createdByUserId} board user human`,
        });
      }
    }
  }

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

  for (const issue of issues) {
    if (issue.createdByAgentId && !knownAgentIds.has(issue.createdByAgentId)) {
      const id = `agent:${issue.createdByAgentId}`;
      if (!options.has(id)) {
        options.set(id, {
          id,
          label: issue.createdByAgentId.slice(0, 8),
          kind: "agent",
          searchText: `${issue.createdByAgentId} agent`,
        });
      }
    }
  }

  return [...options.values()].sort((left, right) => {
    if (left.kind !== right.kind) return left.kind === "user" ? -1 : 1;
    return left.label.localeCompare(right.label);
  });
}
