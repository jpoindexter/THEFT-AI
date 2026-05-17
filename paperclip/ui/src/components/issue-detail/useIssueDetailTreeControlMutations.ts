import { useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Issue, IssueTreeControlMode } from "@paperclipai/shared";

import { issuesApi } from "@/api/issues";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

import { issueTreeControlLabel } from "./IssueTreeControlDialog";

type TreeControlScope = "leaf" | "subtree";
type ActivePauseHold = Awaited<ReturnType<typeof issuesApi.getTreeControlState>>["activePauseHold"];

type UseIssueDetailTreeControlMutationsInput = {
  issueId?: string;
  issue: Issue | null | undefined;
  selectedCompanyId: string | null | undefined;
  treeControlMode: IssueTreeControlMode;
  treeControlScope: TreeControlScope;
  treeControlReason: string;
  treeControlWakeAgentsOnResume: boolean;
  activePauseHold: ActivePauseHold;
  resetTreeControlDialog: () => void;
};

export function useIssueDetailTreeControlMutations({
  issueId,
  issue,
  selectedCompanyId,
  treeControlMode,
  treeControlScope,
  treeControlReason,
  treeControlWakeAgentsOnResume,
  activePauseHold,
  resetTreeControlDialog,
}: UseIssueDetailTreeControlMutationsInput) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const invalidateIssueCollections = useCallback(() => {
    if (!selectedCompanyId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listMineByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listTouchedByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.listUnreadTouchedByMe(selectedCompanyId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.sidebarBadges(selectedCompanyId) });
  }, [queryClient, selectedCompanyId]);

  const invalidateTreeControlCaches = useCallback(async () => {
    if (!issueId) return;
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.detail(issueId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activity(issueId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.liveRuns(issueId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.activeRun(issueId) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.issues.runs(issueId) }),
      queryClient.invalidateQueries({ queryKey: ["issues", "tree-control-state", issueId] }),
      queryClient.invalidateQueries({ queryKey: ["issues", "tree-holds", issueId] }),
      queryClient.invalidateQueries({ queryKey: ["issues", "tree-control-preview", issueId] }),
    ]);
  }, [issueId, queryClient]);

  const executeTreeControl = useMutation({
    mutationFn: async () => {
      if (!issueId) throw new Error("No issue selected.");
      if (treeControlMode === "resume") {
        const pauseHoldId = activePauseHold?.holdId;
        if (!pauseHoldId) {
          throw new Error("No active subtree pause hold is available to resume.");
        }
        const releasedHold = await issuesApi.releaseTreeHold(issueId, pauseHoldId, {
          reason: treeControlReason.trim() || null,
          metadata: {
            wakeAgents: treeControlWakeAgentsOnResume,
          },
        });
        return { kind: "release" as const, hold: releasedHold };
      }
      const created = await issuesApi.createTreeHold(issueId, {
        mode: treeControlMode,
        reason: treeControlReason.trim() || null,
        releasePolicy: {
          strategy: "manual",
          ...(treeControlMode === "pause" ? { note: treeControlScope === "leaf" ? "leaf_pause" : "full_pause" } : {}),
        },
        ...(treeControlMode === "restore"
          ? { metadata: { wakeAgents: treeControlWakeAgentsOnResume } }
          : {}),
      });
      return { kind: "create" as const, hold: created.hold, preview: created.preview };
    },
    onSuccess: async (result) => {
      const modeLabel = issueTreeControlLabel(result.hold.mode, treeControlScope);
      const cancelCount = result.preview?.totals.activeRuns ?? 0;
      pushToast({
        title: result.kind === "release"
          ? treeControlScope === "leaf" ? "Work resumed" : "Subtree resumed"
          : result.hold.mode === "pause"
            ? treeControlScope === "leaf" ? "Work paused" : "Subtree paused"
            : `${modeLabel} applied`,
        body: result.kind === "release"
          ? (result.hold.releaseReason?.trim() || (treeControlScope === "leaf" ? "Active issue pause released." : "Active subtree pause released."))
          : result.hold.mode === "pause"
            ? treeControlScope === "leaf"
              ? `Work paused. ${cancelCount} run${cancelCount === 1 ? "" : "s"} cancelled.`
              : `Subtree paused. ${cancelCount} run${cancelCount === 1 ? "" : "s"} cancelled.`
            : result.hold.reason?.trim()
              ? result.hold.reason
              : "Subtree control applied.",
      });
      resetTreeControlDialog();
      await invalidateTreeControlCaches();
      if (selectedCompanyId) {
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(selectedCompanyId) }),
          ...(issue?.id
            ? [
                queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByParent(selectedCompanyId, issue.id) }),
                queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByDescendantRoot(selectedCompanyId, issue.id) }),
              ]
            : []),
        ]);
      }
    },
    onError: (err) => {
      pushToast({
        title: "Unable to apply subtree control",
        body: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    },
  });

  const pauseIssueWorkRun = useMutation({
    mutationFn: async (runId: string) => {
      if (!issueId) throw new Error("No issue selected.");
      return issuesApi.createTreeHold(issueId, {
        mode: "pause",
        reason: "Paused from active run controls.",
        releasePolicy: { strategy: "manual", note: treeControlScope === "leaf" ? "leaf_pause" : "full_pause" },
        metadata: { source: "issue_active_run_control", runId },
      });
    },
    onSuccess: async (result) => {
      const cancelCount = result.preview?.totals.activeRuns ?? 0;
      pushToast({
        title: "Work paused",
        body: cancelCount > 0
          ? `Work paused. ${cancelCount} run${cancelCount === 1 ? "" : "s"} cancelled.`
          : "Work paused. This issue is held until resume.",
        tone: "success",
      });
      await invalidateTreeControlCaches();
      invalidateIssueCollections();
    },
    onError: (err) => {
      pushToast({
        title: "Unable to pause work",
        body: err instanceof Error ? err.message : "Please try again.",
        tone: "error",
      });
    },
  });

  return {
    executeTreeControl,
    pauseIssueWorkRun,
  };
}
