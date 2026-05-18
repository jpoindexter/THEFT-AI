import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { PatchInstanceGeneralSettings, BackupRetentionPolicy } from "@paperclipai/shared";
import { DEFAULT_BACKUP_RETENTION } from "@paperclipai/shared";
import { SlidersHorizontal } from "lucide-react";
import { authApi } from "@/api/auth";
import { healthApi } from "@/api/health";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { useBreadcrumbs } from "../context/BreadcrumbContext";
import { queryKeys } from "../lib/queryKeys";
import { BackupRetentionSection } from "./instance-general-settings/BackupRetentionSection";
import { DeploymentAuthSection } from "./instance-general-settings/DeploymentAuthSection";
import { FeedbackSharingSection } from "./instance-general-settings/FeedbackSharingSection";
import { GeneralToggleSection } from "./instance-general-settings/GeneralToggleSection";
import { SignOutSection } from "./instance-general-settings/SignOutSection";

const FEEDBACK_TERMS_URL = import.meta.env.VITE_FEEDBACK_TERMS_URL?.trim() || "https://paperclip.ing/tos";

export function InstanceGeneralSettings() {
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const signOutMutation = useMutation({
    mutationFn: () => authApi.signOut(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.session });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to sign out.");
    },
  });

  useEffect(() => {
    setBreadcrumbs([
      { label: "Instance Settings" },
      { label: "General" },
    ]);
  }, [setBreadcrumbs]);

  const generalQuery = useQuery({
    queryKey: queryKeys.instance.generalSettings,
    queryFn: () => instanceSettingsApi.getGeneral(),
  });
  const healthQuery = useQuery({
    queryKey: queryKeys.health,
    queryFn: () => healthApi.get(),
    retry: false,
  });

  const updateGeneralMutation = useMutation({
    mutationFn: instanceSettingsApi.updateGeneral,
    onSuccess: async () => {
      setActionError(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.instance.generalSettings });
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Failed to update general settings.");
    },
  });

  if (generalQuery.isLoading) {
    return <div className="text-sm text-muted-foreground">Loading general settings...</div>;
  }

  if (generalQuery.error) {
    return (
      <div className="text-sm text-destructive">
        {generalQuery.error instanceof Error
          ? generalQuery.error.message
          : "Failed to load general settings."}
      </div>
    );
  }

  const censorUsernameInLogs = generalQuery.data?.censorUsernameInLogs === true;
  const keyboardShortcuts = generalQuery.data?.keyboardShortcuts === true;
  const feedbackDataSharingPreference = generalQuery.data?.feedbackDataSharingPreference ?? "prompt";
  const backupRetention: BackupRetentionPolicy = generalQuery.data?.backupRetention ?? DEFAULT_BACKUP_RETENTION;

  return (
    <div className="max-w-4xl space-y-6">
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
          <h1 className="text-lg font-semibold">General</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure instance-wide preferences including log display, keyboard shortcuts, backup
          retention, and data sharing.
        </p>
      </div>

      {actionError && (
        <div className="rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {actionError}
        </div>
      )}

      <DeploymentAuthSection health={healthQuery.data} />

      <GeneralToggleSection
        title="Censor username in logs"
        description="Hide the username segment in home-directory paths and similar operator-visible log output. Standalone username mentions outside of paths are not yet masked in the live transcript view. This is off by default."
        checked={censorUsernameInLogs}
        onCheckedChange={() => updateGeneralMutation.mutate({ censorUsernameInLogs: !censorUsernameInLogs })}
        disabled={updateGeneralMutation.isPending}
        ariaLabel="Toggle username log censoring"
      />

      <GeneralToggleSection
        title="Keyboard shortcuts"
        description="Enable app keyboard shortcuts, including inbox navigation and global shortcuts like creating issues or toggling panels. This is off by default."
        checked={keyboardShortcuts}
        onCheckedChange={() => updateGeneralMutation.mutate({ keyboardShortcuts: !keyboardShortcuts })}
        disabled={updateGeneralMutation.isPending}
        ariaLabel="Toggle keyboard shortcuts"
      />

      <BackupRetentionSection
        backupRetention={backupRetention}
        disabled={updateGeneralMutation.isPending}
        onUpdate={(patch: PatchInstanceGeneralSettings) => updateGeneralMutation.mutate(patch)}
      />

      <FeedbackSharingSection
        preference={feedbackDataSharingPreference}
        termsUrl={FEEDBACK_TERMS_URL}
        disabled={updateGeneralMutation.isPending}
        onUpdate={(patch: PatchInstanceGeneralSettings) => updateGeneralMutation.mutate(patch)}
      />

      <SignOutSection isPending={signOutMutation.isPending} onSignOut={() => signOutMutation.mutate()} />
    </div>
  );
}
