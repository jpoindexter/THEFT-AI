import type { Approval } from "@paperclipai/shared";
import { Button } from "@/components/ui/button";
import { Link } from "@/lib/router";

type ApprovalActionsProps = {
  approval: Approval;
  linkedAgentId: string | null;
  isActionable: boolean;
  isBudgetApproval: boolean;
  pending: {
    approve: boolean;
    reject: boolean;
    revision: boolean;
    resubmit: boolean;
    deleteAgent: boolean;
  };
  onApprove: () => void;
  onReject: () => void;
  onRequestRevision: () => void;
  onResubmit: () => void;
  onDeleteAgent: () => void;
};

export function ApprovalActions({
  approval,
  linkedAgentId,
  isActionable,
  isBudgetApproval,
  pending,
  onApprove,
  onReject,
  onRequestRevision,
  onResubmit,
  onDeleteAgent,
}: ApprovalActionsProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {isActionable && !isBudgetApproval ? (
        <>
          <Button size="sm" onClick={onApprove} disabled={pending.approve}>
            Approve
          </Button>
          <Button variant="destructive" size="sm" onClick={onReject} disabled={pending.reject}>
            Reject
          </Button>
        </>
      ) : null}
      {isBudgetApproval && approval.status === "pending" ? (
        <p className="text-sm text-muted-foreground">
          Resolve this budget stop from the budget controls on{" "}
          <Link to="/costs" className="underline underline-offset-2">/costs</Link>.
        </p>
      ) : null}
      {approval.status === "pending" ? (
        <Button size="sm" variant="outline" onClick={onRequestRevision} disabled={pending.revision}>
          Request revision
        </Button>
      ) : null}
      {approval.status === "revision_requested" ? (
        <Button size="sm" variant="outline" onClick={onResubmit} disabled={pending.resubmit}>
          Mark resubmitted
        </Button>
      ) : null}
      {approval.status === "rejected" && approval.type === "hire_agent" && linkedAgentId ? (
        <Button
          size="sm"
          variant="outline"
          className="text-destructive hover:text-destructive"
          onClick={onDeleteAgent}
          disabled={pending.deleteAgent}
        >
          Delete disapproved agent
        </Button>
      ) : null}
    </div>
  );
}
