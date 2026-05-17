import type { Agent } from "@paperclipai/shared";

import { AgentIcon } from "@/components/AgentIconPicker";
import { InlineEntitySelector, type InlineEntityOption } from "@/components/InlineEntitySelector";

export function IssueChatComposerAssigneeSelector({
  value,
  options,
  agentMap,
  onChange,
}: {
  value: string;
  options: InlineEntityOption[];
  agentMap?: Map<string, Agent>;
  onChange: (value: string) => void;
}) {
  return (
    <InlineEntitySelector
      value={value}
      options={options}
      placeholder="Assignee"
      noneLabel="No assignee"
      searchPlaceholder="Search assignees..."
      emptyMessage="No assignees found."
      onChange={onChange}
      className="h-8 text-xs"
      renderTriggerValue={(option) => {
        if (!option) return <span className="text-muted-foreground">Assignee</span>;
        return <AssigneeOptionLabel option={option} agentMap={agentMap} />;
      }}
      renderOption={(option) => {
        if (!option.id) return <span className="truncate">{option.label}</span>;
        return <AssigneeOptionLabel option={option} agentMap={agentMap} />;
      }}
    />
  );
}

function AssigneeOptionLabel({
  option,
  agentMap,
}: {
  option: InlineEntityOption;
  agentMap?: Map<string, Agent>;
}) {
  const agentId = option.id.startsWith("agent:") ? option.id.slice("agent:".length) : null;
  const agent = agentId ? agentMap?.get(agentId) : null;

  return (
    <>
      {agent ? (
        <AgentIcon icon={agent.icon} className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      ) : null}
      <span className="truncate">{option.label}</span>
    </>
  );
}
