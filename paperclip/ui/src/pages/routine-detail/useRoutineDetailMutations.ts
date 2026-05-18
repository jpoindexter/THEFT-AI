import type { MutableRefObject } from "react";
import { useMutation, type QueryClient } from "@tanstack/react-query";
import type { RoutineDetail as RoutineDetailType } from "@paperclipai/shared";
import type { ToastInput } from "../../context/ToastContext";
import { ApiError } from "../../api/client";
import {
  routinesApi,
  type RestoreRoutineRevisionResponse,
  type RotateRoutineTriggerResponse,
  type RoutineTriggerResponse,
} from "../../api/routines";
import type { RoutineRunDialogSubmitData } from "../../components/RoutineRunVariablesDialog";
import { queryKeys } from "../../lib/queryKeys";
import {
  buildRoutineMutationPayload,
  getLocalTimezone,
  type NewRoutineTriggerDraft,
  type RoutineEditDraft,
  type SecretMessage,
} from "./routineDetailModel";

type PushToast = (input: ToastInput) => string | null;

export function useRoutineDetailMutations({
  routineId,
  selectedCompanyId,
  routine,
  editDraft,
  newTrigger,
  queryClient,
  pushToast,
  setActiveTab,
  setEditDraft,
  setSaveConflict,
  setSecretMessage,
  setRunVariablesOpen,
  hydratedRoutineIdRef,
}: {
  routineId: string | undefined;
  selectedCompanyId: string | null | undefined;
  routine: RoutineDetailType | undefined;
  editDraft: RoutineEditDraft;
  newTrigger: NewRoutineTriggerDraft;
  queryClient: QueryClient;
  pushToast: PushToast;
  setActiveTab: (value: string) => void;
  setEditDraft: (value: RoutineEditDraft) => void;
  setSaveConflict: (value: boolean) => void;
  setSecretMessage: (value: SecretMessage | null) => void;
  setRunVariablesOpen: (value: boolean) => void;
  hydratedRoutineIdRef: MutableRefObject<string | null>;
}) {
  function invalidateRoutineLists() {
    return Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(routineId!) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(selectedCompanyId!) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.routines.activity(selectedCompanyId!, routineId!) }),
    ]);
  }

  const saveRoutine = useMutation({
    mutationFn: () => routinesApi.update(routineId!, {
      ...buildRoutineMutationPayload(editDraft),
      ...(routine?.latestRevisionId ? { baseRevisionId: routine.latestRevisionId } : {}),
    }),
    onSuccess: async () => {
      setSaveConflict(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(routineId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(selectedCompanyId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.activity(selectedCompanyId!, routineId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.revisions(routineId!) }),
      ]);
    },
    onError: (error) => {
      if (error instanceof ApiError && error.status === 409) {
        setSaveConflict(true);
        pushToast({ title: "Routine changed", body: "Someone else updated this routine. Reload to see the latest revision.", tone: "warn" });
        return;
      }
      pushToast({ title: "Failed to save routine", body: error instanceof Error ? error.message : "Paperclip could not save the routine.", tone: "error" });
    },
  });

  const runRoutine = useMutation({
    mutationFn: (data?: RoutineRunDialogSubmitData) => routinesApi.run(routineId!, {
      ...(data?.variables && Object.keys(data.variables).length > 0 ? { variables: data.variables } : {}),
      ...(data?.assigneeAgentId !== undefined ? { assigneeAgentId: data.assigneeAgentId } : {}),
      ...(data?.projectId !== undefined ? { projectId: data.projectId } : {}),
      ...(data?.executionWorkspaceId !== undefined ? { executionWorkspaceId: data.executionWorkspaceId } : {}),
      ...(data?.executionWorkspacePreference !== undefined ? { executionWorkspacePreference: data.executionWorkspacePreference } : {}),
      ...(data?.executionWorkspaceSettings !== undefined ? { executionWorkspaceSettings: data.executionWorkspaceSettings } : {}),
    }),
    onSuccess: async () => {
      pushToast({ title: "Routine run started", tone: "success" });
      setRunVariablesOpen(false);
      setActiveTab("runs");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(routineId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.runs(routineId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(selectedCompanyId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.activity(selectedCompanyId!, routineId!) }),
      ]);
    },
    onError: (error) => pushToast({ title: "Routine run failed", body: error instanceof Error ? error.message : "Paperclip could not start the routine run.", tone: "error" }),
  });

  const updateRoutineStatus = useMutation({
    mutationFn: (status: string) => routinesApi.update(routineId!, { status }),
    onSuccess: async (_data, status) => {
      pushToast({ title: "Routine saved", body: status === "paused" ? "Automation paused." : "Automation enabled.", tone: "success" });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(routineId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.list(selectedCompanyId!) }),
      ]);
    },
    onError: (error) => pushToast({ title: "Failed to update routine", body: error instanceof Error ? error.message : "Paperclip could not update the routine.", tone: "error" }),
  });

  const createTrigger = useMutation({
    mutationFn: async (): Promise<RoutineTriggerResponse> => {
      const existingOfKind = (routine?.triggers ?? []).filter((trigger) => trigger.kind === newTrigger.kind).length;
      const autoLabel = existingOfKind > 0 ? `${newTrigger.kind}-${existingOfKind + 1}` : newTrigger.kind;
      return routinesApi.createTrigger(routineId!, {
        kind: newTrigger.kind,
        label: autoLabel,
        ...(newTrigger.kind === "schedule" ? { cronExpression: newTrigger.cronExpression.trim(), timezone: getLocalTimezone() } : {}),
        ...(newTrigger.kind === "webhook" ? { signingMode: newTrigger.signingMode, replayWindowSec: Number(newTrigger.replayWindowSec || "300") } : {}),
      });
    },
    onSuccess: async (result) => {
      if (result.secretMaterial) {
        setSecretMessage({ title: "Webhook trigger created", entries: [{ webhookUrl: result.secretMaterial.webhookUrl, webhookSecret: result.secretMaterial.webhookSecret }] });
      } else {
        pushToast({ title: "Trigger added", body: "The routine schedule was saved.", tone: "success" });
      }
      await invalidateRoutineLists();
    },
    onError: (error) => pushToast({ title: "Failed to add trigger", body: error instanceof Error ? error.message : "Paperclip could not create the trigger.", tone: "error" }),
  });

  const updateTrigger = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) => routinesApi.updateTrigger(id, patch),
    onSuccess: async () => {
      pushToast({ title: "Trigger saved", body: "The routine cadence update was saved.", tone: "success" });
      await invalidateRoutineLists();
    },
    onError: (error) => pushToast({ title: "Failed to update trigger", body: error instanceof Error ? error.message : "Paperclip could not update the trigger.", tone: "error" }),
  });

  const deleteTrigger = useMutation({
    mutationFn: (id: string) => routinesApi.deleteTrigger(id),
    onSuccess: async () => {
      pushToast({ title: "Trigger deleted", tone: "success" });
      await invalidateRoutineLists();
    },
    onError: (error) => pushToast({ title: "Failed to delete trigger", body: error instanceof Error ? error.message : "Paperclip could not delete the trigger.", tone: "error" }),
  });

  const rotateTrigger = useMutation({
    mutationFn: (id: string): Promise<RotateRoutineTriggerResponse> => routinesApi.rotateTriggerSecret(id),
    onSuccess: async (result) => {
      setSecretMessage({
        title: "Webhook secret rotated",
        entries: [{ webhookUrl: result.secretMaterial.webhookUrl, webhookSecret: result.secretMaterial.webhookSecret }],
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(routineId!) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.activity(selectedCompanyId!, routineId!) }),
      ]);
    },
    onError: (error) => pushToast({ title: "Failed to rotate webhook secret", body: error instanceof Error ? error.message : "Paperclip could not rotate the webhook secret.", tone: "error" }),
  });

  const onToggleAutomation = () => {
    if (!routine) return;
    if (routine.status !== "active" && !routine.assigneeAgentId) {
      pushToast({ title: "Default agent required", body: "Set a default agent before enabling routine automation.", tone: "warn" });
      return;
    }
    updateRoutineStatus.mutate(routine.status === "active" ? "paused" : "active");
  };

  const restoreSecretMaterials = (response: RestoreRoutineRevisionResponse) => {
    if (response.secretMaterials.length === 0) return;
    setSecretMessage({
      title: response.secretMaterials.length === 1
        ? "Webhook trigger restored"
        : `${response.secretMaterials.length} webhook triggers restored`,
      entries: response.secretMaterials.map((recreated) => ({
        webhookUrl: recreated.webhookUrl,
        webhookSecret: recreated.webhookSecret,
      })),
    });
  };

  const onRestored = (response: RestoreRoutineRevisionResponse) => {
    setSaveConflict(false);
    queryClient.setQueryData<RoutineDetailType | undefined>(
      queryKeys.routines.detail(routineId!),
      (prev) =>
        prev
          ? {
              ...prev,
              ...response.routine,
              latestRevisionId: response.revision.id,
              latestRevisionNumber: response.revision.revisionNumber,
            }
          : prev,
    );
    setEditDraft({
      title: response.routine.title,
      description: response.routine.description ?? "",
      projectId: response.routine.projectId ?? "",
      assigneeAgentId: response.routine.assigneeAgentId ?? "",
      priority: response.routine.priority,
      concurrencyPolicy: response.routine.concurrencyPolicy,
      catchUpPolicy: response.routine.catchUpPolicy,
      variables: response.routine.variables,
    });
    hydratedRoutineIdRef.current = response.routine.id;
  };

  return {
    mutations: {
      saveRoutine,
      runRoutine,
      updateRoutineStatus,
      createTrigger,
      updateTrigger,
      deleteTrigger,
      rotateTrigger,
    },
    actions: {
      onToggleAutomation,
      restoreSecretMaterials,
      onRestored,
    },
  };
}
