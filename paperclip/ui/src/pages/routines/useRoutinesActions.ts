import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { RoutineListItem } from "@paperclipai/shared";
import { routinesApi } from "@/api/routines";
import { issuesApi } from "@/api/issues";
import { nextRoutineStatus } from "@/components/RoutineList";
import type { RoutineRunDialogSubmitData } from "@/components/RoutineRunVariablesDialog";
import { queryKeys } from "@/lib/queryKeys";
import {
  buildRoutineMutationPayload,
  defaultRoutineDraft,
  type RoutineDraft,
} from "./routinesModel";

export function useRoutinesActions({
  draft,
  navigate,
  pushToast,
  selectedCompanyId,
  setAdvancedOpen,
  setComposerOpen,
  setDraft,
}: {
  draft: RoutineDraft;
  navigate: (to: string) => void;
  pushToast: (toast: { title: string; body?: string; tone?: "success" | "error" | "warn" | "info" }) => void;
  selectedCompanyId: string;
  setAdvancedOpen: (open: boolean) => void;
  setComposerOpen: (open: boolean) => void;
  setDraft: (draft: RoutineDraft) => void;
}) {
  const queryClient = useQueryClient();
  const [runningRoutineId, setRunningRoutineId] = useState<string | null>(null);
  const [statusMutationRoutineId, setStatusMutationRoutineId] = useState<string | null>(null);
  const [runDialogRoutine, setRunDialogRoutine] = useState<RoutineListItem | null>(null);

  const createRoutine = useMutation({
    mutationFn: () => routinesApi.create(selectedCompanyId, buildRoutineMutationPayload(draft)),
    onSuccess: async (routine) => {
      setDraft({ ...defaultRoutineDraft });
      setComposerOpen(false);
      setAdvancedOpen(false);
      await queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(selectedCompanyId) });
      pushToast({
        title: "Routine created",
        body: routine.assigneeAgentId
          ? "Add the first trigger to turn it into a live workflow."
          : "Draft saved. Add a default agent before enabling automation.",
        tone: "success",
      });
      navigate(`/routines/${routine.id}?tab=triggers`);
    },
  });

  const updateIssue = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => issuesApi.update(id, data),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [...queryKeys.issues.list(selectedCompanyId), "routine-executions"] });
    },
  });

  const updateRoutineStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => routinesApi.update(id, { status }),
    onMutate: ({ id }) => setStatusMutationRoutineId(id),
    onSuccess: async (_, variables) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(variables.id) }),
      ]);
    },
    onSettled: () => setStatusMutationRoutineId(null),
    onError: (mutationError) => {
      pushToast({
        title: "Failed to update routine",
        body: mutationError instanceof Error ? mutationError.message : "Paperclip could not update the routine.",
        tone: "error",
      });
    },
  });

  const runRoutine = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: RoutineRunDialogSubmitData }) => routinesApi.run(id, buildRunPayload(data)),
    onMutate: ({ id }) => setRunningRoutineId(id),
    onSuccess: async (_, { id }) => {
      setRunDialogRoutine(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(id) }),
      ]);
    },
    onSettled: () => setRunningRoutineId(null),
    onError: (mutationError) => {
      pushToast({
        title: "Routine run failed",
        body: mutationError instanceof Error ? mutationError.message : "Paperclip could not start the routine run.",
        tone: "error",
      });
    },
  });

  function handleToggleEnabled(routine: RoutineListItem, enabled: boolean) {
    if (!enabled && !routine.assigneeAgentId) {
      pushToast({
        title: "Default agent required",
        body: "Set a default agent before enabling routine automation.",
        tone: "warn",
      });
      return;
    }
    updateRoutineStatus.mutate({ id: routine.id, status: nextRoutineStatus(routine.status, !enabled) });
  }

  function handleToggleArchived(routine: RoutineListItem) {
    updateRoutineStatus.mutate({
      id: routine.id,
      status: routine.status === "archived" ? "active" : "archived",
    });
  }

  return {
    createRoutine,
    updateIssue,
    runRoutine,
    runningRoutineId,
    statusMutationRoutineId,
    runDialogRoutine,
    setRunDialogRoutine,
    handleRunNow: setRunDialogRoutine,
    handleToggleEnabled,
    handleToggleArchived,
  };
}

function buildRunPayload(data?: RoutineRunDialogSubmitData) {
  return {
    ...(data?.variables && Object.keys(data.variables).length > 0 ? { variables: data.variables } : {}),
    ...(data?.assigneeAgentId !== undefined ? { assigneeAgentId: data.assigneeAgentId } : {}),
    ...(data?.projectId !== undefined ? { projectId: data.projectId } : {}),
    ...(data?.executionWorkspaceId !== undefined ? { executionWorkspaceId: data.executionWorkspaceId } : {}),
    ...(data?.executionWorkspacePreference !== undefined ? { executionWorkspacePreference: data.executionWorkspacePreference } : {}),
    ...(data?.executionWorkspaceSettings !== undefined ? { executionWorkspaceSettings: data.executionWorkspaceSettings } : {}),
  };
}
