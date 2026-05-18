import type { UseMutationResult } from "@tanstack/react-query";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function AgentPendingApprovalBanner({
  agentAction,
  visible,
}: {
  agentAction: UseMutationResult<unknown, Error, "invoke" | "pause" | "resume" | "approve" | "terminate">;
  visible: boolean;
}) {
  if (!visible) return null;

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-md border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900 dark:border-amber-400/40 dark:bg-amber-950/30 dark:text-amber-200">
      <span>This agent is pending board approval and cannot be invoked yet.</span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => agentAction.mutate("approve")}
        disabled={agentAction.isPending}
      >
        <CheckCircle2 className="h-3.5 w-3.5 sm:mr-1" />
        <span>Approve agent</span>
      </Button>
    </div>
  );
}
