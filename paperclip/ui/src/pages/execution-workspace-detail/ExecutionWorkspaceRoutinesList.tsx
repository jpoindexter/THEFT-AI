import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ExecutionWorkspace, Project, RoutineListItem } from "@paperclipai/shared";
import { Loader2, Play, Repeat } from "lucide-react";
import { agentsApi } from "@/api/agents";
import { routinesApi } from "@/api/routines";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  RoutineRunVariablesDialog,
  type RoutineRunDialogSubmitData,
} from "@/components/RoutineRunVariablesDialog";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";
import {
  getWorkspaceSpecificRoutineVariableNames,
  routineHasWorkspaceSpecificVariables,
} from "@/lib/workspace-routines";
import { Link } from "@/lib/router";
import { formatOptionalDateTime } from "./workspaceForm";

function WorkspaceRoutineRow({
  routine,
  variableNames,
  runningRoutineId,
  onRunNow,
}: {
  routine: RoutineListItem;
  variableNames: string[];
  runningRoutineId: string | null;
  onRunNow: (routine: RoutineListItem) => void;
}) {
  const isArchived = routine.status === "archived";
  const isRunning = runningRoutineId === routine.id;

  return (
    <div className="flex flex-col gap-3 border-b border-border px-3 py-3 last:border-b-0 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1 space-y-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <Link to={`/routines/${routine.id}`} className="truncate text-sm font-medium hover:underline">
            {routine.title}
          </Link>
          {routine.status !== "active" ? (
            <span className="text-xs text-muted-foreground">{routine.status}</span>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>{routine.assigneeAgentId ? "Default agent set" : "Choose agent when running"}</span>
          <span>Last run {formatOptionalDateTime(routine.lastRun?.triggeredAt ?? routine.lastTriggeredAt)}</span>
          <span className="flex flex-wrap gap-1">
            {variableNames.map((name) => (
              <span key={name} className="rounded-sm bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
                {name}
              </span>
            ))}
          </span>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="w-full sm:w-auto"
        disabled={isArchived || isRunning}
        onClick={() => onRunNow(routine)}
      >
        {isRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
        {isRunning ? "Running..." : "Run now"}
      </Button>
    </div>
  );
}

export function ExecutionWorkspaceRoutinesList({
  workspace,
  project,
}: {
  workspace: ExecutionWorkspace;
  project: Project | null;
}) {
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();
  const [runDialogRoutine, setRunDialogRoutine] = useState<RoutineListItem | null>(null);
  const [runningRoutineId, setRunningRoutineId] = useState<string | null>(null);

  const { data: routines, isLoading, error } = useQuery({
    queryKey: queryKeys.routines.list(workspace.companyId, { projectId: workspace.projectId }),
    queryFn: () => routinesApi.list(workspace.companyId, { projectId: workspace.projectId }),
  });

  const { data: agents } = useQuery({
    queryKey: queryKeys.agents.list(workspace.companyId),
    queryFn: () => agentsApi.list(workspace.companyId),
  });

  const workspaceRoutines = useMemo(
    () => (routines ?? []).filter(routineHasWorkspaceSpecificVariables),
    [routines],
  );

  const runRoutine = useMutation({
    mutationFn: ({ id, data }: { id: string; data?: RoutineRunDialogSubmitData }) => routinesApi.run(id, {
      ...(data?.variables && Object.keys(data.variables).length > 0 ? { variables: data.variables } : {}),
      ...(data?.assigneeAgentId !== undefined ? { assigneeAgentId: data.assigneeAgentId } : {}),
      ...(data?.projectId !== undefined ? { projectId: data.projectId } : {}),
      ...(data?.executionWorkspaceId !== undefined ? { executionWorkspaceId: data.executionWorkspaceId } : {}),
      ...(data?.executionWorkspacePreference !== undefined
        ? { executionWorkspacePreference: data.executionWorkspacePreference }
        : {}),
      ...(data?.executionWorkspaceSettings !== undefined
        ? { executionWorkspaceSettings: data.executionWorkspaceSettings }
        : {}),
    }),
    onMutate: ({ id }) => {
      setRunningRoutineId(id);
    },
    onSuccess: async (_, { id }) => {
      setRunDialogRoutine(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["routines", workspace.companyId] }),
        queryClient.invalidateQueries({ queryKey: queryKeys.routines.detail(id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.listByExecutionWorkspace(workspace.companyId, workspace.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(workspace.companyId) }),
      ]);
      pushToast({
        title: "Routine started",
        body: "Paperclip created a run using this execution workspace.",
        tone: "success",
      });
    },
    onSettled: () => {
      setRunningRoutineId(null);
    },
    onError: (mutationError) => {
      pushToast({
        title: "Routine run failed",
        body: mutationError instanceof Error ? mutationError.message : "Paperclip could not start the routine run.",
        tone: "error",
      });
    },
  });

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Workspace routines</CardTitle>
          <CardDescription>
            Routines that use workspace-specific variables can be run against this execution workspace.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground">Loading routines...</p>
          ) : error ? (
            <p className="text-sm text-destructive">
              {error instanceof Error ? error.message : "Failed to load routines."}
            </p>
          ) : workspaceRoutines.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <Repeat className="h-5 w-5 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                No routines use workspace-specific variables yet.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border">
              {workspaceRoutines.map((routine) => (
                <WorkspaceRoutineRow
                  key={routine.id}
                  routine={routine}
                  variableNames={getWorkspaceSpecificRoutineVariableNames(routine)}
                  runningRoutineId={runningRoutineId}
                  onRunNow={setRunDialogRoutine}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <RoutineRunVariablesDialog
        open={runDialogRoutine !== null}
        onOpenChange={(next) => {
          if (!next) setRunDialogRoutine(null);
        }}
        companyId={workspace.companyId}
        routineName={runDialogRoutine?.title ?? null}
        agents={agents ?? []}
        projects={project ? [project] : []}
        defaultProjectId={workspace.projectId}
        defaultAssigneeAgentId={runDialogRoutine?.assigneeAgentId ?? null}
        defaultExecutionWorkspace={workspace}
        variables={runDialogRoutine?.variables ?? []}
        isPending={runRoutine.isPending}
        onSubmit={(data) => {
          if (!runDialogRoutine) return;
          runRoutine.mutate({ id: runDialogRoutine.id, data });
        }}
      />
    </>
  );
}
