import { useState } from "react";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import type { HeartbeatRun, JoinRequest } from "@paperclipai/shared";
import type { useNavigate } from "../../lib/router";
import { accessApi } from "../../api/access";
import { agentsApi } from "../../api/agents";
import { approvalsApi } from "../../api/approvals";
import { queryKeys } from "../../lib/queryKeys";

export function useInboxRuntimeActions({
  navigate,
  queryClient,
  selectedCompanyId,
  setActionError,
}: {
  navigate: ReturnType<typeof useNavigate>;
  queryClient: QueryClient;
  selectedCompanyId: string | null;
  setActionError: (value: string | null) => void;
}) {
  const approveMutation = useMutation({
    mutationFn: (id: string) => approvalsApi.approve(id),
    onSuccess: (_approval, id) => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(selectedCompanyId!) });
      navigate(`/approvals/${id}?resolved=approved`);
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to approve"),
  });

  const rejectMutation = useMutation({
    mutationFn: (id: string) => approvalsApi.reject(id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(selectedCompanyId!) });
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to reject"),
  });

  const approveJoinMutation = useMutation({
    mutationFn: (joinRequest: JoinRequest) => accessApi.approveJoinRequest(selectedCompanyId!, joinRequest.id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(selectedCompanyId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to approve join request"),
  });

  const rejectJoinMutation = useMutation({
    mutationFn: (joinRequest: JoinRequest) => accessApi.rejectJoinRequest(selectedCompanyId!, joinRequest.id),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.access.joinRequests(selectedCompanyId!) });
      queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId!) });
    },
    onError: (err) => setActionError(err instanceof Error ? err.message : "Failed to reject join request"),
  });

  const [retryingRunIds, setRetryingRunIds] = useState<Set<string>>(new Set());
  const retryRunMutation = useMutation({
    mutationFn: async (run: HeartbeatRun) => {
      const payload = retryPayloadFromRun(run);
      const result = await agentsApi.wakeup(run.agentId, {
        source: "on_demand",
        triggerDetail: "manual",
        reason: "retry_failed_run",
        payload,
      });
      if (!("id" in result)) throw new Error(result.message ?? "Retry was skipped.");
      return { newRun: result, originalRun: run };
    },
    onMutate: (run) => setRetryingRunIds((prev) => new Set(prev).add(run.id)),
    onSuccess: ({ newRun, originalRun }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.heartbeats(originalRun.companyId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.heartbeats(originalRun.companyId, originalRun.agentId) });
      navigate(`/agents/${originalRun.agentId}/runs/${newRun.id}`);
    },
    onSettled: (_data, _error, run) => {
      if (!run) return;
      setRetryingRunIds((prev) => {
        const next = new Set(prev);
        next.delete(run.id);
        return next;
      });
    },
  });

  return {
    approveJoinMutation,
    approveMutation,
    rejectJoinMutation,
    rejectMutation,
    retryingRunIds,
    retryRunMutation,
  };
}

function retryPayloadFromRun(run: HeartbeatRun) {
  const payload: Record<string, unknown> = {};
  const context = run.contextSnapshot as Record<string, unknown> | null;
  if (!context) return payload;
  if (typeof context.issueId === "string" && context.issueId) payload.issueId = context.issueId;
  if (typeof context.taskId === "string" && context.taskId) payload.taskId = context.taskId;
  if (typeof context.taskKey === "string" && context.taskKey) payload.taskKey = context.taskKey;
  return payload;
}
