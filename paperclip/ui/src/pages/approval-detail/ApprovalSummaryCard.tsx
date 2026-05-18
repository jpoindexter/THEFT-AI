import type { Approval, Issue } from "@paperclipai/shared";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Identity } from "@/components/Identity";
import { ApprovalPayloadRenderer, approvalLabel, defaultTypeIcon, typeIcon } from "@/components/ApprovalPayload";
import { StatusBadge } from "@/components/StatusBadge";
import { ApprovalActions } from "./ApprovalActions";
import { ApprovalLinkedIssues } from "./ApprovalLinkedIssues";

type ApprovalSummaryCardProps = {
  approval: Approval;
  payload: Record<string, unknown>;
  linkedIssues: Issue[];
  linkedAgentId: string | null;
  agentNameById: Map<string, string>;
  showRawPayload: boolean;
  error: string | null;
  isActionable: boolean;
  isBudgetApproval: boolean;
  pending: {
    approve: boolean;
    reject: boolean;
    revision: boolean;
    resubmit: boolean;
    deleteAgent: boolean;
  };
  onToggleRawPayload: () => void;
  onApprove: () => void;
  onReject: () => void;
  onRequestRevision: () => void;
  onResubmit: () => void;
  onDeleteAgent: () => void;
};

export function ApprovalSummaryCard({
  approval,
  payload,
  linkedIssues,
  linkedAgentId,
  agentNameById,
  showRawPayload,
  error,
  isActionable,
  isBudgetApproval,
  pending,
  onToggleRawPayload,
  onApprove,
  onReject,
  onRequestRevision,
  onResubmit,
  onDeleteAgent,
}: ApprovalSummaryCardProps) {
  const TypeIcon = typeIcon[approval.type] ?? defaultTypeIcon;

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TypeIcon className="h-5 w-5 shrink-0 text-muted-foreground" />
          <div>
            <h2 className="text-lg font-semibold">{approvalLabel(approval.type, payload)}</h2>
            <p className="font-mono text-xs text-muted-foreground">{approval.id}</p>
          </div>
        </div>
        <StatusBadge status={approval.status} />
      </div>

      <div className="space-y-1 text-sm">
        {approval.requestedByAgentId ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Requested by</span>
            <Identity
              name={agentNameById.get(approval.requestedByAgentId) ?? approval.requestedByAgentId.slice(0, 8)}
              size="sm"
            />
          </div>
        ) : null}
        <ApprovalPayloadRenderer type={approval.type} payload={payload} />
        <Button type="button" variant="ghost" size="sm" className="mt-2 px-0" onClick={onToggleRawPayload}>
          <ChevronRight className={`h-3 w-3 transition-transform ${showRawPayload ? "rotate-90" : ""}`} />
          See full request
        </Button>
        {showRawPayload ? (
          <pre className="overflow-x-auto rounded-md bg-muted/40 p-3 text-xs">
            {JSON.stringify(payload, null, 2)}
          </pre>
        ) : null}
        {approval.decisionNote ? (
          <p className="text-xs text-muted-foreground">Decision note: {approval.decisionNote}</p>
        ) : null}
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      {linkedIssues.length > 0 ? <ApprovalLinkedIssues issues={linkedIssues} /> : null}
      <ApprovalActions
        approval={approval}
        linkedAgentId={linkedAgentId}
        isActionable={isActionable}
        isBudgetApproval={isBudgetApproval}
        pending={pending}
        onApprove={onApprove}
        onReject={onReject}
        onRequestRevision={onRequestRevision}
        onResubmit={onResubmit}
        onDeleteAgent={onDeleteAgent}
      />
    </div>
  );
}
