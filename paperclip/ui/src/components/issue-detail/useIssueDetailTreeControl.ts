import { useCallback, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Agent, Issue, IssueTreeControlMode } from "@paperclipai/shared";
import { issuesApi } from "@/api/issues";
import { useIssueDetailTreeControlMutations } from "./useIssueDetailTreeControlMutations";
type TreeControlScope = "leaf" | "subtree";

type UseIssueDetailTreeControlInput = {
  issueId?: string;
  issue: Issue | null | undefined;
  selectedCompanyId: string | null | undefined;
  childIssues: Issue[];
  canManageTreeControl: boolean;
  agentMap: Map<string, Agent>;
};
export function useIssueDetailTreeControl({
  issueId,
  issue,
  selectedCompanyId,
  childIssues,
  canManageTreeControl,
  agentMap,
}: UseIssueDetailTreeControlInput) {
  const [treeControlOpen, setTreeControlOpen] = useState(false);
  const [treeControlMode, setTreeControlMode] = useState<IssueTreeControlMode>("pause");
  const [treeControlReason, setTreeControlReason] = useState("");
  const [treeControlWakeAgentsOnResume, setTreeControlWakeAgentsOnResume] = useState(false);
  const [treeControlCancelConfirmed, setTreeControlCancelConfirmed] = useState(false);
  const treeControlScope: TreeControlScope = childIssues.length === 0 ? "leaf" : "subtree";

  const {
    data: treeControlPreview,
    isFetching: treeControlPreviewLoading,
    error: treeControlPreviewError,
    refetch: refetchTreeControlPreview,
  } = useQuery({
    queryKey: ["issues", "tree-control-preview", issueId ?? "pending", treeControlMode],
    queryFn: () =>
      issuesApi.previewTreeControl(issueId!, {
        mode: treeControlMode,
        releasePolicy: {
          strategy: "manual",
        },
      }),
    enabled: treeControlOpen && !!issueId && canManageTreeControl,
    staleTime: 0,
    retry: false,
  });
  const { data: treeControlState } = useQuery({
    queryKey: ["issues", "tree-control-state", issueId ?? "pending"],
    queryFn: () => issuesApi.getTreeControlState(issueId!),
    enabled: !!issueId && canManageTreeControl,
    retry: false,
  });
  const { data: activeRootPauseHolds = [] } = useQuery({
    queryKey: ["issues", "tree-holds", issueId ?? "pending", "active-pause-with-members"],
    queryFn: () =>
      issuesApi.listTreeHolds(issueId!, {
        status: "active",
        mode: "pause",
        includeMembers: true,
      }),
    enabled: !!issueId && treeControlState?.activePauseHold?.isRoot === true,
  });
  const { data: activeCancelHolds = [] } = useQuery({
    queryKey: ["issues", "tree-holds", issueId ?? "pending", "active-cancel"],
    queryFn: () =>
      issuesApi.listTreeHolds(issueId!, {
        status: "active",
        mode: "cancel",
      }),
    enabled: !!issueId && canManageTreeControl,
  });

  const activePauseHold = treeControlState?.activePauseHold ?? null;
  const activeRootPauseHoldsForDisplay = useMemo(
    () => activePauseHold?.isRoot === true ? activeRootPauseHolds : [],
    [activePauseHold?.isRoot, activeRootPauseHolds],
  );
  const heldIssueIds = useMemo(() => {
    const ids = new Set<string>();
    for (const hold of activeRootPauseHoldsForDisplay) {
      for (const member of hold.members ?? []) {
        if (member.skipped) continue;
        ids.add(member.issueId);
      }
    }
    return ids;
  }, [activeRootPauseHoldsForDisplay]);
  const mutedChildIssueIds = useMemo(() => {
    const ids = new Set<string>();
    for (const child of childIssues) {
      if (heldIssueIds.has(child.id)) ids.add(child.id);
    }
    return ids;
  }, [childIssues, heldIssueIds]);
  const childPauseBadgeById = useMemo(() => {
    const badges = new Map<string, string>();
    for (const child of childIssues) {
      if (!heldIssueIds.has(child.id)) continue;
      badges.set(child.id, "Paused");
    }
    return badges;
  }, [childIssues, heldIssueIds]);
  const activePauseHoldRoot = useMemo(() => {
    if (!activePauseHold || !issue) return null;
    if (activePauseHold.rootIssueId === issue.id) return issue;
    return issue.ancestors?.find((ancestor) => ancestor.id === activePauseHold.rootIssueId) ?? null;
  }, [activePauseHold, issue]);
  const activeRootPauseHold = useMemo(
    () => activeRootPauseHoldsForDisplay.find((hold) => hold.id === activePauseHold?.holdId) ?? null,
    [activePauseHold?.holdId, activeRootPauseHoldsForDisplay],
  );

  const treePreviewAffectedIssues = useMemo(
    () => (treeControlPreview?.issues ?? []).filter((candidate) => !candidate.skipped),
    [treeControlPreview],
  );
  const treePreviewDisplayIssues = useMemo(() => {
    const previewIssues = treeControlPreview?.issues ?? [];
    if (treeControlMode !== "pause") {
      return previewIssues.filter((candidate) => !candidate.skipped);
    }
    return previewIssues.filter((candidate) => !candidate.skipped || candidate.skipReason === "terminal_status");
  }, [treeControlMode, treeControlPreview]);

  const treePreviewAffectedIssueRows = useMemo(() => {
    if (!issue) return [];
    return treePreviewDisplayIssues.map((candidate) => ({
      candidate,
      issue: {
        ...issue,
        id: candidate.id,
        identifier: candidate.identifier,
        title: candidate.title,
        status: candidate.status,
        parentId: candidate.parentId,
        assigneeAgentId: candidate.assigneeAgentId,
        assigneeUserId: candidate.assigneeUserId,
        executionRunId: candidate.activeRun?.id ?? null,
      } satisfies Issue,
    }));
  }, [issue, treePreviewDisplayIssues]);
  const treePreviewAffectedAgentRows = useMemo(
    () => (treeControlPreview?.affectedAgents ?? [])
      .map((previewAgent) => ({
        ...previewAgent,
        agent: agentMap.get(previewAgent.agentId) ?? null,
      }))
      .sort((a, b) => (a.agent?.name ?? a.agentId).localeCompare(b.agent?.name ?? b.agentId)),
    [agentMap, treeControlPreview?.affectedAgents],
  );

  const treePreviewWarnings = treeControlPreview?.warnings ?? [];
  const heldDescendantCount = activeRootPauseHold?.members?.filter((member) => member.depth > 0 && !member.skipped).length
    ?? Math.max(heldIssueIds.size - 1, 0);
  const canShowSubtreeControls = canManageTreeControl && childIssues.length > 0;
  const canResumeSubtree = canShowSubtreeControls && activePauseHold?.isRoot === true;
  const canRestoreSubtree = canShowSubtreeControls && activeCancelHolds.length > 0;
  const isTerminalIssue = issue?.status === "done" || issue?.status === "cancelled";
  const isAgentOwnedNonTerminalIssue = Boolean(issue?.assigneeAgentId) && !isTerminalIssue;
  const canPauseLeafWork = canManageTreeControl && !!issue && childIssues.length === 0 && !activePauseHold && !isTerminalIssue;
  const canResumeLeafWork = canManageTreeControl && childIssues.length === 0 && activePauseHold?.isRoot === true;
  const previewAffectedIssueCount = treePreviewAffectedIssues.length;
  const previewAffectedAgentCount = treeControlPreview?.totals.affectedAgents ?? 0;
  const treeControlPrimaryButtonLabel =
    treeControlMode === "pause"
      ? treeControlScope === "leaf"
        ? "Pause work"
        : "Pause and stop work"
      : treeControlMode === "cancel"
        ? `Cancel ${previewAffectedIssueCount} issues`
      : treeControlMode === "restore"
          ? `Restore ${previewAffectedIssueCount} issues`
          : treeControlScope === "leaf"
            ? "Resume work"
            : "Resume subtree";
  const composerHint = activePauseHold && issue
    ? (
      issue.assigneeAgentId
        ? `Sending this comment will wake ${agentMap.get(issue.assigneeAgentId)?.name ?? "the assignee"} for triage while the subtree remains paused.`
        : "Assign an agent to wake them for triage while the subtree remains paused."
    )
    : null;
  const queuedCommentReason: "hold" | "active_run" | "other" = activePauseHold ? "hold" : "active_run";
  const canApplyTreeControl =
    Boolean(treeControlPreview)
    && !treeControlPreviewLoading
    && (treeControlMode !== "cancel" || treeControlCancelConfirmed);

  const resetTreeControlDialog = useCallback(() => {
    setTreeControlOpen(false);
    setTreeControlReason("");
    setTreeControlWakeAgentsOnResume(false);
    setTreeControlCancelConfirmed(false);
  }, []);
  const { executeTreeControl, pauseIssueWorkRun } = useIssueDetailTreeControlMutations({
    issueId,
    issue,
    selectedCompanyId,
    treeControlMode,
    treeControlScope,
    treeControlReason,
    treeControlWakeAgentsOnResume,
    activePauseHold,
    resetTreeControlDialog,
  });

  const openResumeControl = useCallback(() => {
    setTreeControlMode("resume");
    setTreeControlWakeAgentsOnResume(isAgentOwnedNonTerminalIssue || canShowSubtreeControls);
    setTreeControlOpen(true);
  }, [canShowSubtreeControls, isAgentOwnedNonTerminalIssue]);
  const openCancelSubtreeControl = useCallback(() => {
    setTreeControlMode("cancel");
    setTreeControlCancelConfirmed(false);
    setTreeControlOpen(true);
  }, []);
  const openPauseLeafControl = useCallback(() => {
    setTreeControlMode("pause");
    setTreeControlCancelConfirmed(false);
    setTreeControlOpen(true);
  }, []);
  const openResumeLeafControl = useCallback(() => {
    setTreeControlMode("resume");
    setTreeControlWakeAgentsOnResume(isAgentOwnedNonTerminalIssue);
    setTreeControlOpen(true);
  }, [isAgentOwnedNonTerminalIssue]);
  const openPauseSubtreeControl = useCallback(() => {
    setTreeControlMode("pause");
    setTreeControlCancelConfirmed(false);
    setTreeControlOpen(true);
  }, []);
  const openResumeSubtreeControl = useCallback(() => {
    setTreeControlMode("resume");
    setTreeControlWakeAgentsOnResume(true);
    setTreeControlOpen(true);
  }, []);
  const openRestoreSubtreeControl = useCallback(() => {
    setTreeControlMode("restore");
    setTreeControlWakeAgentsOnResume(false);
    setTreeControlCancelConfirmed(false);
    setTreeControlOpen(true);
  }, []);

  const treeControlDialogProps = {
    open: treeControlOpen,
    mode: treeControlMode,
    scope: treeControlScope,
    reason: treeControlReason,
    wakeAgentsOnResume: treeControlWakeAgentsOnResume,
    cancelConfirmed: treeControlCancelConfirmed,
    previewLoading: treeControlPreviewLoading,
    previewError: treeControlPreviewError,
    preview: treeControlPreview,
    warnings: treePreviewWarnings,
    affectedIssueRows: treePreviewAffectedIssueRows,
    affectedAgentRows: treePreviewAffectedAgentRows,
    affectedIssueCount: previewAffectedIssueCount,
    affectedAgentCount: previewAffectedAgentCount,
    primaryButtonLabel: treeControlPrimaryButtonLabel,
    canApply: canApplyTreeControl,
    applying: executeTreeControl.isPending,
    onOpenChange: setTreeControlOpen,
    onReasonChange: setTreeControlReason,
    onWakeAgentsOnResumeChange: setTreeControlWakeAgentsOnResume,
    onCancelConfirmedChange: setTreeControlCancelConfirmed,
    onRetryPreview: () => {
      void refetchTreeControlPreview();
    },
    onApply: () => executeTreeControl.mutate(),
  };

  return {
    activePauseHold,
    activePauseHoldRoot,
    activeRootPauseHold,
    childPauseBadgeById,
    composerHint,
    heldDescendantCount,
    mutedChildIssueIds,
    queuedCommentReason,
    canPauseLeafWork,
    canResumeLeafWork,
    canResumeSubtree,
    canRestoreSubtree,
    canShowSubtreeControls,
    pauseIssueWorkRun,
    treeControlDialogProps,
    treeControlScope,
    openCancelSubtreeControl,
    openPauseLeafControl,
    openPauseSubtreeControl,
    openRestoreSubtreeControl,
    openResumeControl,
    openResumeLeafControl,
    openResumeSubtreeControl,
  };
}
