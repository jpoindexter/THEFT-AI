import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Environment, EnvironmentProbeResult } from "@paperclipai/shared";

import { environmentsApi } from "@/api/environments";
import { instanceSettingsApi } from "@/api/instanceSettings";
import { secretsApi } from "@/api/secrets";
import { getDefaultValues, validateJsonSchemaForm } from "@/components/JsonSchemaForm";
import { useBreadcrumbs } from "@/context/BreadcrumbContext";
import { useCompany } from "@/context/CompanyContext";
import { useToast } from "@/context/ToastContext";
import { queryKeys } from "@/lib/queryKeys";

import {
  buildEnvironmentPayload,
  createEmptyEnvironmentForm,
  normalizeJsonSchema,
  readEnvironmentForm,
  type EnvironmentFormState,
} from "./environment-model";

export function useCompanyEnvironmentsModel() {
  const { selectedCompany, selectedCompanyId } = useCompany();
  const { setBreadcrumbs } = useBreadcrumbs();
  const { pushToast } = useToast();
  const queryClient = useQueryClient();
  const [editingEnvironmentId, setEditingEnvironmentId] = useState<string | null>(null);
  const [environmentForm, setEnvironmentForm] = useState<EnvironmentFormState>(createEmptyEnvironmentForm);
  const [probeResults, setProbeResults] = useState<Record<string, EnvironmentProbeResult | null>>({});

  useEffect(() => {
    setBreadcrumbs([
      { label: selectedCompany?.name ?? "Company", href: "/dashboard" },
      { label: "Settings", href: "/company/settings" },
      { label: "Environments" },
    ]);
  }, [selectedCompany?.name, setBreadcrumbs]);

  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const environmentsEnabled = experimentalSettings?.enableEnvironments === true;
  const { data: environments } = useQuery({
    queryKey: selectedCompanyId ? queryKeys.environments.list(selectedCompanyId) : ["environments", "none"],
    queryFn: () => environmentsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId) && environmentsEnabled,
  });
  const { data: environmentCapabilities } = useQuery({
    queryKey: selectedCompanyId ? ["environment-capabilities", selectedCompanyId] : ["environment-capabilities", "none"],
    queryFn: () => environmentsApi.capabilities(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId) && environmentsEnabled,
  });
  const { data: secrets } = useQuery({
    queryKey: selectedCompanyId ? ["company-secrets", selectedCompanyId] : ["company-secrets", "none"],
    queryFn: () => secretsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });

  const environmentMutation = useMutation({
    mutationFn: async (form: EnvironmentFormState) => {
      const body = buildEnvironmentPayload(form);
      return editingEnvironmentId
        ? await environmentsApi.update(editingEnvironmentId, body)
        : await environmentsApi.create(selectedCompanyId!, body);
    },
    onSuccess: async (environment) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.environments.list(selectedCompanyId!) });
      setEditingEnvironmentId(null);
      setEnvironmentForm(createEmptyEnvironmentForm());
      pushToast({
        title: editingEnvironmentId ? "Environment updated" : "Environment created",
        body: `${environment.name} is ready.`,
        tone: "success",
      });
    },
    onError: (error) => pushToast({
      title: "Failed to save environment",
      body: error instanceof Error ? error.message : "Environment save failed.",
      tone: "error",
    }),
  });
  const environmentProbeMutation = useMutation({
    mutationFn: async (environmentId: string) => await environmentsApi.probe(environmentId),
    onSuccess: (probe, environmentId) => {
      setProbeResults((current) => ({ ...current, [environmentId]: probe }));
      pushToast({ title: probe.ok ? "Environment probe passed" : "Environment probe failed", body: probe.summary, tone: probe.ok ? "success" : "error" });
    },
    onError: (error, environmentId) => {
      const failedEnvironment = (environments ?? []).find((environment) => environment.id === environmentId);
      setProbeResults((current) => ({ ...current, [environmentId]: failedProbe(error, failedEnvironment) }));
      pushToast({ title: "Environment probe failed", body: error instanceof Error ? error.message : "Environment probe failed.", tone: "error" });
    },
  });
  const draftEnvironmentProbeMutation = useMutation({
    mutationFn: async (form: EnvironmentFormState) => await environmentsApi.probeConfig(selectedCompanyId!, buildEnvironmentPayload(form)),
    onSuccess: (probe) => pushToast({ title: probe.ok ? "Draft probe passed" : "Draft probe failed", body: probe.summary, tone: probe.ok ? "success" : "error" }),
    onError: (error) => pushToast({ title: "Draft probe failed", body: error instanceof Error ? error.message : "Environment probe failed.", tone: "error" }),
  });

  useEffect(() => {
    setEditingEnvironmentId(null);
    setEnvironmentForm(createEmptyEnvironmentForm());
    setProbeResults({});
  }, [selectedCompanyId]);

  const discoveredPluginSandboxProviders = useMemo(() => Object.entries(environmentCapabilities?.sandboxProviders ?? {})
    .filter(([provider, capability]) => provider !== "fake" && capability.supportsRunExecution)
    .map(([provider, capability]) => ({
      provider,
      displayName: capability.displayName || provider,
      description: capability.description,
      configSchema: normalizeJsonSchema(capability.configSchema),
    }))
    .sort((left, right) => left.displayName.localeCompare(right.displayName)), [environmentCapabilities?.sandboxProviders]);
  const pluginSandboxProviders = useMemo(() => {
    const currentProvider = environmentForm.sandboxProvider;
    if (!currentProvider.trim() || currentProvider === "fake" || discoveredPluginSandboxProviders.some((provider) => provider.provider === currentProvider)) {
      return discoveredPluginSandboxProviders;
    }
    return [...discoveredPluginSandboxProviders, { provider: currentProvider, displayName: currentProvider, description: undefined, configSchema: null }];
  }, [discoveredPluginSandboxProviders, environmentForm.sandboxProvider]);
  const selectedSandboxProvider = pluginSandboxProviders.find((provider) => provider.provider === environmentForm.sandboxProvider) ?? null;
  const selectedSandboxSchema = selectedSandboxProvider?.configSchema ?? null;
  const sandboxConfigErrors =
    environmentForm.driver === "sandbox" && selectedSandboxSchema
      ? validateJsonSchemaForm(selectedSandboxSchema as any, environmentForm.sandboxConfig)
      : {};

  useEffect(() => {
    if (environmentForm.driver !== "sandbox") return;
    if (environmentForm.sandboxProvider.trim().length > 0 && environmentForm.sandboxProvider !== "fake") return;
    const firstProvider = discoveredPluginSandboxProviders[0];
    if (!firstProvider) return;
    setEnvironmentForm((current) => current.driver !== "sandbox" ? current : {
      ...current,
      sandboxProvider: firstProvider.provider,
      sandboxConfig: firstProvider.configSchema ? getDefaultValues(firstProvider.configSchema as any) : {},
    });
  }, [discoveredPluginSandboxProviders, environmentForm.driver, environmentForm.sandboxProvider]);

  const environmentFormValid = isEnvironmentFormValid(environmentForm, sandboxConfigErrors);
  return {
    discoveredPluginSandboxProviders,
    draftEnvironmentProbeMutation,
    editingEnvironmentId,
    environmentCapabilities,
    environmentForm,
    environmentFormValid,
    environmentMutation,
    environments,
    environmentsEnabled,
    handleCancelEnvironmentEdit: () => {
      setEditingEnvironmentId(null);
      setEnvironmentForm(createEmptyEnvironmentForm());
    },
    handleEditEnvironment: (environment: Environment) => {
      setEditingEnvironmentId(environment.id);
      setEnvironmentForm(readEnvironmentForm(environment));
    },
    pluginSandboxProviders,
    probeResults,
    sandboxConfigErrors,
    sandboxCreationEnabled: discoveredPluginSandboxProviders.length > 0,
    secrets,
    selectedCompanyId,
    selectedSandboxProvider,
    selectedSandboxSchema,
    setEnvironmentForm,
    testEnvironment: (environmentId: string) => environmentProbeMutation.mutate(environmentId),
    testEnvironmentPending: environmentProbeMutation.isPending,
  };
}

function failedProbe(error: unknown, environment?: Environment): EnvironmentProbeResult {
  return {
    ok: false,
    driver: environment?.driver ?? "local",
    summary: error instanceof Error ? error.message : "Environment probe failed.",
    details: null,
  };
}

function isEnvironmentFormValid(form: EnvironmentFormState, sandboxConfigErrors: Record<string, string>) {
  return form.name.trim().length > 0 &&
    (form.driver !== "ssh" || (form.sshHost.trim().length > 0 && form.sshUsername.trim().length > 0 && form.sshRemoteWorkspacePath.trim().length > 0)) &&
    (form.driver !== "sandbox" || (form.sandboxProvider.trim().length > 0 && form.sandboxProvider !== "fake" && Object.keys(sandboxConfigErrors).length === 0));
}
