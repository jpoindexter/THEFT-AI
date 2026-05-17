import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { approvalsApi } from "@/api/approvals";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

type ApprovalAction = "approve" | "reject";

type UseIssueDetailApprovalsInput = {
  invalidateIssueCollections: () => void;
  invalidateIssueDetail: () => void;
  issueId?: string;
  resolvedCompanyId: string | null | undefined;
};

export function useIssueDetailApprovals({
  invalidateIssueCollections,
  invalidateIssueDetail,
  issueId,
  resolvedCompanyId,
}: UseIssueDetailApprovalsInput) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [pendingApprovalAction, setPendingApprovalAction] = useState<{
    approvalId: string;
    action: ApprovalAction;
  } | null>(null);

  const approvalDecision = useMutation({
    mutationFn: async ({ approvalId, action }: { approvalId: string; action: ApprovalAction }) => {
      if (action === "approve") {
        return approvalsApi.approve(approvalId);
      }
      return approvalsApi.reject(approvalId);
    },
    onMutate: ({ approvalId, action }) => {
      setPendingApprovalAction({ approvalId, action });
    },
    onSuccess: (_approval, variables) => {
      invalidateIssueDetail();
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.approvals(issueId!) });
      invalidateIssueCollections();
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.detail(variables.approvalId) });
      if (resolvedCompanyId) {
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(resolvedCompanyId) });
      }
      pushToast({
        title: variables.action === "approve" ? "Approval approved" : "Approval rejected",
        tone: "success",
      });
    },
    onError: (err, variables) => {
      pushToast({
        title: variables.action === "approve" ? "Approval failed" : "Rejection failed",
        body: err instanceof Error ? err.message : "Unable to update approval",
        tone: "error",
      });
    },
    onSettled: () => {
      setPendingApprovalAction(null);
    },
  });

  return {
    handleApprovalAction: (approvalId: string, action: ApprovalAction) => {
      approvalDecision.mutate({ approvalId, action });
    },
    pendingApprovalAction,
  };
}
