/**
 * @fileoverview Adapter Manager page — install, view, and manage external adapters.
 *
 * Adapters are simpler than plugins: no workers, no events, no manifests.
 * They just register a ServerAdapterModule that provides model discovery and execution.
 */
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cpu } from "lucide-react";
import type { AdapterInfo } from "@/api/adapters";
import { adaptersApi } from "@/api/adapters";
import { invalidateDynamicParser } from "@/adapters/dynamic-loader";
import { invalidateConfigSchemaCache } from "@/adapters/schema-config-fields";
import { Badge } from "@/components/ui/badge";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToastActions } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";
import { RemoveAdapterDialog, ReinstallDialog } from "./adapter-manager/AdapterDialogs";
import { AdapterAlphaNotice, BuiltinAdaptersSection, ExternalAdaptersSection } from "./adapter-manager/AdapterSections";
import { getAdapterGroups } from "./adapter-manager/adapterManagerModel";
import { InstallAdapterDialog } from "./adapter-manager/InstallAdapterDialog";

export function AdapterManager() {
  const { selectedCompany } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const queryClient = useQueryClient();
  const { pushToast } = useToastActions();

  const [installPackage, setInstallPackage] = useState("");
  const [installVersion, setInstallVersion] = useState("");
  const [isLocalPath, setIsLocalPath] = useState(false);
  const [installDialogOpen, setInstallDialogOpen] = useState(false);
  const [removeType, setRemoveType] = useState<string | null>(null);
  const [reinstallTarget, setReinstallTarget] = useState<AdapterInfo | null>(null);

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: "Settings", href: "/instance/settings/general" },
      { label: "Adapters" },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs]);

  const { data: adapters, isLoading } = useQuery({
    queryKey: queryKeys.adapters.all,
    queryFn: () => adaptersApi.list(),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: queryKeys.adapters.all });
  };

  const installMutation = useMutation({
    mutationFn: (params: { packageName: string; version?: string; isLocalPath?: boolean }) =>
      adaptersApi.install(params),
    onSuccess: (result) => {
      invalidate();
      setInstallDialogOpen(false);
      setInstallPackage("");
      setInstallVersion("");
      setIsLocalPath(false);
      pushToast({
        title: "Adapter installed",
        body: `Type "${result.type}" registered successfully.${result.version ? ` (v${result.version})` : ""}`,
        tone: "success",
      });
    },
    onError: (err: Error) => {
      pushToast({ title: "Install failed", body: err.message, tone: "error" });
    },
  });

  const removeMutation = useMutation({
    mutationFn: (type: string) => adaptersApi.remove(type),
    onSuccess: () => {
      invalidate();
      pushToast({ title: "Adapter removed", tone: "success" });
    },
    onError: (err: Error) => {
      pushToast({ title: "Removal failed", body: err.message, tone: "error" });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ type, disabled }: { type: string; disabled: boolean }) =>
      adaptersApi.setDisabled(type, disabled),
    onSuccess: invalidate,
    onError: (err: Error) => {
      pushToast({ title: "Toggle failed", body: err.message, tone: "error" });
    },
  });

  const overrideMutation = useMutation({
    mutationFn: ({ type, paused }: { type: string; paused: boolean }) =>
      adaptersApi.setOverridePaused(type, paused),
    onSuccess: invalidate,
    onError: (err: Error) => {
      pushToast({ title: "Override toggle failed", body: err.message, tone: "error" });
    },
  });

  const reloadMutation = useMutation({
    mutationFn: (type: string) => adaptersApi.reload(type),
    onSuccess: (result) => {
      invalidate();
      invalidateDynamicParser(result.type);
      invalidateConfigSchemaCache(result.type);
      pushToast({
        title: "Adapter reloaded",
        body: `Type "${result.type}" reloaded.${result.version ? ` (v${result.version})` : ""}`,
        tone: "success",
      });
    },
    onError: (err: Error) => {
      pushToast({ title: "Reload failed", body: err.message, tone: "error" });
    },
  });

  const reinstallMutation = useMutation({
    mutationFn: (type: string) => adaptersApi.reinstall(type),
    onSuccess: (result) => {
      invalidate();
      invalidateDynamicParser(result.type);
      invalidateConfigSchemaCache(result.type);
      pushToast({
        title: "Adapter reinstalled",
        body: `Type "${result.type}" updated from npm.${result.version ? ` (v${result.version})` : ""}`,
        tone: "success",
      });
    },
    onError: (err: Error) => {
      pushToast({ title: "Reinstall failed", body: err.message, tone: "error" });
    },
  });

  if (isLoading) {
    return <div className="p-4 text-sm text-muted-foreground">Loading adapters...</div>;
  }

  const { builtinAdapters, externalAdapters, overriddenBuiltins } = getAdapterGroups(adapters);
  const isMutating =
    installMutation.isPending ||
    removeMutation.isPending ||
    toggleMutation.isPending ||
    overrideMutation.isPending ||
    reloadMutation.isPending ||
    reinstallMutation.isPending;

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Cpu className="h-6 w-6 text-muted-foreground" />
          <h1 className="text-xl font-semibold">Adapters</h1>
          <Badge variant="outline">Alpha</Badge>
        </div>

        <InstallAdapterDialog
          open={installDialogOpen}
          onOpenChange={setInstallDialogOpen}
          installPackage={installPackage}
          installVersion={installVersion}
          isLocalPath={isLocalPath}
          isInstalling={installMutation.isPending}
          onPackageChange={setInstallPackage}
          onVersionChange={setInstallVersion}
          onSourceChange={setIsLocalPath}
          onInstall={() =>
            installMutation.mutate({
              packageName: installPackage,
              version: installVersion || undefined,
              isLocalPath,
            })
          }
        />
      </div>

      <AdapterAlphaNotice />
      <ExternalAdaptersSection
        adapters={externalAdapters}
        onToggle={(type, disabled) => toggleMutation.mutate({ type, disabled })}
        onOverrideToggle={(type, paused) => overrideMutation.mutate({ type, paused })}
        onRemove={setRemoveType}
        onReload={(type) => reloadMutation.mutate(type)}
        onReinstall={setReinstallTarget}
        isToggling={toggleMutation.isPending}
        isOverrideToggling={overrideMutation.isPending}
        isReloading={reloadMutation.isPending}
        isReinstalling={reinstallMutation.isPending}
      />
      <BuiltinAdaptersSection
        adapters={builtinAdapters}
        overriddenBuiltins={overriddenBuiltins}
        isMutating={isMutating}
        onToggle={(type, disabled) => toggleMutation.mutate({ type, disabled })}
      />

      <RemoveAdapterDialog
        removeType={removeType}
        hasPackage={!!removeType && !!adapters?.find((adapter) => adapter.type === removeType)?.packageName}
        isRemoving={removeMutation.isPending}
        onCancel={() => setRemoveType(null)}
        onConfirm={() => {
          if (!removeType) return;
          removeMutation.mutate(removeType, {
            onSettled: () => setRemoveType(null),
          });
        }}
      />
      <ReinstallDialog
        adapter={reinstallTarget}
        open={reinstallTarget !== null}
        isReinstalling={reinstallMutation.isPending}
        onConfirm={() => {
          if (!reinstallTarget) return;
          reinstallMutation.mutate(reinstallTarget.type, {
            onSettled: () => setReinstallTarget(null),
          });
        }}
        onCancel={() => setReinstallTarget(null)}
      />
    </div>
  );
}
