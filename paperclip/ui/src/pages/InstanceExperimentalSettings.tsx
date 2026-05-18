import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FlaskConical } from "lucide-react";
import type { IssueGraphLivenessAutoRecoveryPreview, PatchInstanceExperimentalSettings } from "@paperclipai/shared";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { ExperimentalToggleSection } from "./instance-experimental-settings/ExperimentalToggleSection";
import { IssueRecoverySection } from "./instance-experimental-settings/IssueRecoverySection";
import { RecoveryPreviewDialog } from "./instance-experimental-settings/RecoveryPreviewDialog";

export function InstanceExperimentalSettings() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [lookbackHoursDraft, setLookbackHoursDraft] = useState("24");
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [pendingPreview, setPendingPreview] = useState<IssueGraphLivenessAutoRecoveryPreview | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: "Instance Settings" },
      { label: "Experimental" },
    ]);
  }, [setBreadcrumbs]);

  const experimentalQuery = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
  });

  const toggleMutation = useMutation({
    mutationFn: async (patch: PatchInstanceExperimentalSettings) =>
      instanceSettingsApi.updateExperimental(patch),
    onSuccess: async () => {
      setActionError(null);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      ]);
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to update experimental settings.");
    },
  });

  const previewMutation = useMutation({
    mutationFn: async (lookbackHours: number) =>
      instanceSettingsApi.previewIssueGraphLivenessAutoRecovery({ lookbackHours }),
    onSuccess: (preview) => {
      setActionError(null);
      setPendingPreview(preview);
      setPreviewDialogOpen(true);
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to preview recovery tasks.");
    },
  });

  const runRecoveryMutation = useMutation({
    mutationFn: async (lookbackHours: number) =>
      instanceSettingsApi.runIssueGraphLivenessAutoRecovery({ lookbackHours }),
    onSuccess: async () => {
      setActionError(null);
      setPreviewDialogOpen(false);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.instance.experimentalSettings }),
        queryClient.invalidateQueries({ queryKey: queryKeys.health }),
      ]);
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to create recovery tasks.");
    },
  });

  useEffect(() => {
    const next = experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours;
    if (typeof next === "number") {
      setLookbackHoursDraft(String(next));
    }
  }, [experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours]);

  if (experimentalQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading experimental settings...</div>;
  }

  if (experimentalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {experimentalQuery.error instanceof Error
          ? experimentalQuery.error.message
          : "Failed to load experimental settings."}
      </div>
    );
  }

  const enableEnvironments = experimentalQuery.data?.enableEnvironments === true;
  const enableIsolatedWorkspaces = experimentalQuery.data?.enableIsolatedWorkspaces === true;
  const autoRestartDevServerWhenIdle = experimentalQuery.data?.autoRestartDevServerWhenIdle === true;
  const enableIssueGraphLivenessAutoRecovery =
    experimentalQuery.data?.enableIssueGraphLivenessAutoRecovery === true;
  const lookbackHours =
    experimentalQuery.data?.issueGraphLivenessAutoRecoveryLookbackHours ?? 24;
  const parsedLookbackHours = Number.parseInt(lookbackHoursDraft, 10);
  const lookbackHoursIsValid =
    Number.isInteger(parsedLookbackHours) && parsedLookbackHours >= 1 && parsedLookbackHours <= 720;
  const recoveryActionPending =
    toggleMutation.isPending || previewMutation.isPending || runRecoveryMutation.isPending;

  function previewForEnable() {
    if (!lookbackHoursIsValid) {
      setActionError("Lookback hours must be a whole number from 1 to 720.");
      return;
    }
    previewMutation.mutate(parsedLookbackHours);
  }

  function enableOnly() {
    if (!lookbackHoursIsValid) return;
    toggleMutation.mutate({
      enableIssueGraphLivenessAutoRecovery: true,
      issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
    }, {
      onSuccess: () => setPreviewDialogOpen(false),
    });
  }

  function enableAndRun() {
    if (!lookbackHoursIsValid) return;
    toggleMutation.mutate({
      enableIssueGraphLivenessAutoRecovery: true,
      issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
    }, {
      onSuccess: () => runRecoveryMutation.mutate(parsedLookbackHours),
    });
  }

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">Experimental</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Opt into features that are still being evaluated before they become default behavior.
        </p>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <ExperimentalToggleSection
        title="Enable Environments"
        description="Show environment management in company settings and allow project and agent environment assignment controls."
        checked={enableEnvironments}
        onCheckedChange={() => toggleMutation.mutate({ enableEnvironments: !enableEnvironments })}
        disabled={toggleMutation.isPending}
        ariaLabel="Toggle environments experimental setting"
      />

      <ExperimentalToggleSection
        title="Enable Isolated Workspaces"
        description="Show execution workspace controls in project configuration and allow isolated workspace behavior for new and existing issue runs."
        checked={enableIsolatedWorkspaces}
        onCheckedChange={() => toggleMutation.mutate({ enableIsolatedWorkspaces: !enableIsolatedWorkspaces })}
        disabled={toggleMutation.isPending}
        ariaLabel="Toggle isolated workspaces experimental setting"
      />

      <ExperimentalToggleSection
        title="Auto-Restart Dev Server When Idle"
        description="In `pnpm dev:once`, wait for all queued and running local agent runs to finish, then restart the server automatically when backend changes or migrations make the current boot stale."
        checked={autoRestartDevServerWhenIdle}
        onCheckedChange={() => toggleMutation.mutate({ autoRestartDevServerWhenIdle: !autoRestartDevServerWhenIdle })}
        disabled={toggleMutation.isPending}
        ariaLabel="Toggle guarded dev-server auto-restart"
      />

      <IssueRecoverySection
        enabled={enableIssueGraphLivenessAutoRecovery}
        lookbackHours={lookbackHours}
        lookbackHoursDraft={lookbackHoursDraft}
        lookbackHoursIsValid={lookbackHoursIsValid}
        parsedLookbackHours={parsedLookbackHours}
        isPending={recoveryActionPending}
        onDraftChange={setLookbackHoursDraft}
        onToggle={() => {
          if (enableIssueGraphLivenessAutoRecovery) {
            toggleMutation.mutate({ enableIssueGraphLivenessAutoRecovery: false });
            return;
          }
          previewForEnable();
        }}
        onSaveHours={() => {
          if (!lookbackHoursIsValid) {
            setActionError("Lookback hours must be a whole number from 1 to 720.");
            return;
          }
          toggleMutation.mutate({
            issueGraphLivenessAutoRecoveryLookbackHours: parsedLookbackHours,
          });
        }}
        onPreview={previewForEnable}
        onRunNow={() => {
          if (!lookbackHoursIsValid) {
            setActionError("Lookback hours must be a whole number from 1 to 720.");
            return;
          }
          runRecoveryMutation.mutate(parsedLookbackHours);
        }}
      />

      <RecoveryPreviewDialog
        open={previewDialogOpen}
        onOpenChange={setPreviewDialogOpen}
        preview={pendingPreview}
        onEnableOnly={enableOnly}
        onEnableAndRun={enableAndRun}
        isPending={recoveryActionPending}
      />
    </div>
  );
}
