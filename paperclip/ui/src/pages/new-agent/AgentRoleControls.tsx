import { useState } from "react";
import type { Agent, AgentRole } from "@paperclipai/shared";
import { AGENT_ROLES } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Shield } from "lucide-react";
import { ReportsToPicker } from "../../components/ReportsToPicker";
import { roleLabels } from "../../components/agent-config-primitives";
import { cn } from "../../lib/utils";

export function AgentRoleControls({
  agents,
  role,
  effectiveRole,
  isFirstAgent,
  reportsTo,
  onRoleChange,
  onReportsToChange,
}: {
  agents: Agent[];
  role: AgentRole;
  effectiveRole: AgentRole;
  isFirstAgent: boolean;
  reportsTo: string | null;
  onRoleChange: (role: AgentRole) => void;
  onReportsToChange: (agentId: string | null) => void;
}) {
  const [roleOpen, setRoleOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-t border-border px-4 py-2">
      <Popover open={roleOpen} onOpenChange={setRoleOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            size="xs"
            className={cn("gap-1.5 border-border px-2 font-normal hover:bg-accent/50", isFirstAgent && "opacity-60")}
            disabled={isFirstAgent}
          >
            <Shield className="h-3 w-3 text-muted-foreground" />
            {roleLabels[effectiveRole] ?? effectiveRole}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-36 p-1" align="start">
          {AGENT_ROLES.map((nextRole) => (
            <Button
              key={nextRole}
              type="button"
              variant="ghost"
              size="xs"
              className={cn("h-auto w-full justify-start px-2 py-1.5 font-normal hover:bg-accent/50", nextRole === role && "bg-accent")}
              onClick={() => {
                onRoleChange(nextRole);
                setRoleOpen(false);
              }}
            >
              {roleLabels[nextRole] ?? nextRole}
            </Button>
          ))}
        </PopoverContent>
      </Popover>

      <ReportsToPicker
        agents={agents}
        value={reportsTo}
        onChange={onReportsToChange}
        disabled={isFirstAgent}
      />
    </div>
  );
}
