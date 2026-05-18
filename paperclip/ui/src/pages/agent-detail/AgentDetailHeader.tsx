import { useState } from "react";
import { Link } from "@/lib/router";
import { Copy, MoreHorizontal, Plus, RotateCcw, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AgentIcon, AgentIconPicker } from "../../components/AgentIconPicker";
import { RunButton, PauseResumeButton } from "../../components/AgentActionButtons";
import { StatusBadge } from "../../components/StatusBadge";
import { roleLabels } from "../../components/agent-config-primitives";
import type { AgentDetail as AgentDetailRecord } from "@paperclipai/shared";

type HeaderAgentAction = "invoke" | "pause" | "resume" | "approve" | "terminate";

type AgentDetailHeaderProps = {
  agent: AgentDetailRecord;
  canonicalAgentRef: string;
  mobileLiveRun: { id: string } | null;
  isPendingApproval: boolean;
  onIconChange: (icon: string) => void;
  onOpenNewIssue: (defaults: { assigneeAgentId: string }) => void;
  agentAction: {
    mutate: (action: HeaderAgentAction) => void;
    isPending: boolean;
  };
  resetTaskSession: {
    mutate: (taskKey: string | null) => void;
  };
};

export function AgentDetailHeader({
  agent,
  canonicalAgentRef,
  mobileLiveRun,
  isPendingApproval,
  onIconChange,
  onOpenNewIssue,
  agentAction,
  resetTaskSession,
}: AgentDetailHeaderProps) {
  const [moreOpen, setMoreOpen] = useState(false);

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 items-center gap-3">
        <AgentIconPicker
          value={agent.icon}
          onChange={onIconChange}
        >
          <Button
            type="button"
            variant="ghost"
            className="size-12 shrink-0 rounded-lg bg-accent hover:bg-accent/80"
            aria-label="Change agent icon"
          >
            <AgentIcon icon={agent.icon} className="h-6 w-6" />
          </Button>
        </AgentIconPicker>
        <div className="min-w-0">
          <h2 className="truncate text-2xl font-bold">{agent.name}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {roleLabels[agent.role] ?? agent.role}
            {agent.title ? ` - ${agent.title}` : ""}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1 sm:gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenNewIssue({ assigneeAgentId: agent.id })}
        >
          <Plus className="h-3.5 w-3.5 sm:mr-1" />
          <span className="hidden sm:inline">Assign Task</span>
        </Button>
        <RunButton
          onClick={() => agentAction.mutate("invoke")}
          disabled={agentAction.isPending || isPendingApproval}
          label="Run Heartbeat"
        />
        <PauseResumeButton
          isPaused={agent.status === "paused"}
          onPause={() => agentAction.mutate("pause")}
          onResume={() => agentAction.mutate("resume")}
          disabled={agentAction.isPending || isPendingApproval}
        />
        <span className="hidden sm:inline"><StatusBadge status={agent.status} /></span>
        {mobileLiveRun && (
          <Link
            to={`/agents/${canonicalAgentRef}/runs/${mobileLiveRun.id}`}
            className="flex items-center gap-1.5 rounded-full bg-blue-500/10 px-2 py-0.5 no-underline transition-colors hover:bg-blue-500/20 sm:hidden"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-pulse rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            <span className="text-micro font-medium text-blue-600 dark:text-blue-400">Live</span>
          </Link>
        )}

        <Popover open={moreOpen} onOpenChange={setMoreOpen}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Agent actions">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-1.5 text-xs font-normal"
              onClick={() => {
                navigator.clipboard.writeText(agent.id);
                setMoreOpen(false);
              }}
            >
              <Copy className="h-3 w-3" />
              Copy Agent ID
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-1.5 text-xs font-normal"
              onClick={() => {
                resetTaskSession.mutate(null);
                setMoreOpen(false);
              }}
            >
              <RotateCcw className="h-3 w-3" />
              Reset Sessions
            </Button>
            <Button
              type="button"
              variant="ghost"
              className="h-auto w-full justify-start px-2 py-1.5 text-xs font-normal text-destructive"
              onClick={() => {
                agentAction.mutate("terminate");
                setMoreOpen(false);
              }}
            >
              <Trash2 className="h-3 w-3" />
              Terminate
            </Button>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
