import type { Dispatch, SetStateAction } from "react";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import type { AdapterModel } from "../../api/agents";
import { agentsApi } from "../../api/agents";
import type { AdapterConfigFieldsProps } from "../../adapters/types";
import type { AgentConfigOverlay } from "../../lib/agent-config-patch";
import { filterAcpxModelsByAgent } from "../../lib/acpx-model-filter";
import { queryKeys } from "../../lib/queryKeys";
import {
  claudeThinkingEffortOptions,
  codexThinkingEffortOptions,
  cursorModeOptions,
  openCodeThinkingEffortOptions,
} from "./constants";
import type { AgentConfigFormProps } from "./types";

type EffectiveAdapterValue = <T>(group: "adapterConfig", field: string, original: T) => T;
type MarkAdapterValue = (group: "adapterConfig", field: string, value: unknown) => void;

export function useAgentModelControls({
  adapterType,
  config,
  currentDefaultEnvironmentId,
  eff,
  externalModels,
  hideInstructionsFile,
  isCreate,
  mark,
  mode,
  onChange,
  overlay,
  runtimeConfig,
  selectedCompanyId,
  setOverlay,
  supportsModelProfiles,
  values,
}: {
  adapterType: string;
  config: Record<string, unknown>;
  currentDefaultEnvironmentId: string;
  eff: EffectiveAdapterValue;
  externalModels?: AdapterModel[];
  hideInstructionsFile: boolean;
  isCreate: boolean;
  mark: MarkAdapterValue;
  mode: AgentConfigFormProps["mode"];
  onChange: ((patch: Partial<CreateConfigValues>) => void) | null;
  overlay: AgentConfigOverlay;
  runtimeConfig: Record<string, unknown>;
  selectedCompanyId: string | null | undefined;
  setOverlay: Dispatch<SetStateAction<AgentConfigOverlay>>;
  supportsModelProfiles: boolean;
  values: CreateConfigValues | null;
}) {
  const queryClient = useQueryClient();
  const modelQueryKey = selectedCompanyId
    ? queryKeys.agents.adapterModels(selectedCompanyId, adapterType, currentDefaultEnvironmentId || null)
    : ["agents", "none", "adapter-models", adapterType];
  const {
    data: fetchedModels,
    error: fetchedModelsError,
  } = useQuery({
    queryKey: modelQueryKey,
    queryFn: () => agentsApi.adapterModels(selectedCompanyId!, adapterType, {
      environmentId: currentDefaultEnvironmentId || null,
    }),
    enabled: Boolean(selectedCompanyId),
  });
  const [refreshModelsError, setRefreshModelsError] = useState<string | null>(null);
  const [refreshingModels, setRefreshingModels] = useState(false);
  const rawModels = fetchedModels ?? externalModels ?? [];
  const adapterCommandField = adapterType === "hermes_local" ? "hermesCommand" : "command";
  const acpxAgent =
    adapterType === "acpx_local"
      ? isCreate
        ? String(values!.adapterSchemaValues?.agent ?? "claude")
        : eff("adapterConfig", "agent", String(config.agent ?? "claude"))
      : "";
  const models = useMemo(
    () => adapterType === "acpx_local" ? filterAcpxModelsByAgent(rawModels, acpxAgent) : rawModels,
    [adapterType, rawModels, acpxAgent],
  );
  const {
    data: detectedModelData,
    refetch: refetchDetectedModel,
  } = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.agents.detectModel(selectedCompanyId, adapterType)
      : ["agents", "none", "detect-model", adapterType],
    queryFn: () => {
      if (!selectedCompanyId) throw new Error("Select a company to detect the model");
      return agentsApi.detectModel(selectedCompanyId, adapterType);
    },
    enabled: Boolean(selectedCompanyId && adapterType !== "opencode_local"),
  });

  const adapterFieldProps: AdapterConfigFieldsProps = {
    mode,
    isCreate,
    adapterType,
    values: isCreate ? values : null,
    set: isCreate ? onChange : null,
    config,
    eff,
    mark,
    models,
    hideInstructionsFile,
  };

  const [modelOpen, setModelOpen] = useState(false);
  const [cheapModelOpen, setCheapModelOpen] = useState(false);
  const [thinkingEffortOpen, setThinkingEffortOpen] = useState(false);

  const { data: adapterCheapProfileDefinitions } = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.agents.adapterModelProfiles(selectedCompanyId, adapterType)
      : ["agents", "none", "adapter-model-profiles", adapterType],
    queryFn: () => agentsApi.adapterModelProfiles(selectedCompanyId!, adapterType),
    enabled: Boolean(selectedCompanyId) && supportsModelProfiles,
  });
  const adapterCheapDefault = useMemo(
    () => (adapterCheapProfileDefinitions ?? []).find((profile) => profile.key === "cheap") ?? null,
    [adapterCheapProfileDefinitions],
  );
  const adapterCheapDefaultModel = useMemo(() => {
    const adapterConfig = adapterCheapDefault?.adapterConfig ?? {};
    const value = (adapterConfig as Record<string, unknown>).model;
    return typeof value === "string" ? value : "";
  }, [adapterCheapDefault]);

  const currentModelId = isCreate
    ? values!.model
    : eff("adapterConfig", "model", String(config.model ?? ""));
  async function refreshModels() {
    if (!selectedCompanyId) return;
    setRefreshingModels(true);
    setRefreshModelsError(null);
    try {
      const refreshed = await agentsApi.adapterModels(selectedCompanyId, adapterType, { refresh: true });
      queryClient.setQueryData(modelQueryKey, refreshed);
    } catch (error) {
      setRefreshModelsError(error instanceof Error ? error.message : "Failed to refresh adapter models.");
    } finally {
      setRefreshingModels(false);
    }
  }

  const thinkingEffortKey =
    adapterType === "codex_local"
      ? "modelReasoningEffort"
      : adapterType === "acpx_local" && acpxAgent === "codex"
        ? "modelReasoningEffort"
        : adapterType === "cursor"
          ? "mode"
          : adapterType === "opencode_local"
            ? "variant"
            : "effort";
  const thinkingEffortOptions =
    adapterType === "codex_local"
      ? codexThinkingEffortOptions
      : adapterType === "acpx_local" && acpxAgent === "codex"
        ? codexThinkingEffortOptions
        : adapterType === "cursor"
          ? cursorModeOptions
          : adapterType === "opencode_local"
            ? openCodeThinkingEffortOptions
            : claudeThinkingEffortOptions;
  const currentThinkingEffort = isCreate
    ? values!.thinkingEffort
    : adapterType === "codex_local"
      ? eff("adapterConfig", "modelReasoningEffort", String(config.modelReasoningEffort ?? config.reasoningEffort ?? ""))
      : adapterType === "acpx_local" && acpxAgent === "codex"
        ? eff("adapterConfig", "modelReasoningEffort", String(config.modelReasoningEffort ?? config.reasoningEffort ?? config.effort ?? ""))
        : adapterType === "cursor"
          ? eff("adapterConfig", "mode", String(config.mode ?? ""))
          : adapterType === "opencode_local"
            ? eff("adapterConfig", "variant", String(config.variant ?? ""))
            : eff("adapterConfig", "effort", String(config.effort ?? ""));
  const showThinkingEffort = adapterType !== "gemini_local";
  const codexSearchEnabled = adapterType === "codex_local"
    ? (isCreate ? Boolean(values!.search) : eff("adapterConfig", "search", Boolean(config.search)))
    : false;
  const cheapProfileFromAgent = useMemo(() => {
    const profiles = (runtimeConfig.modelProfiles ?? {}) as Record<string, unknown>;
    const cheap = (profiles.cheap ?? {}) as Record<string, unknown>;
    const cheapAdapterConfig = (cheap.adapterConfig ?? {}) as Record<string, unknown>;
    return {
      enabled: cheap.enabled !== false,
      model: typeof cheapAdapterConfig.model === "string" ? cheapAdapterConfig.model : "",
    };
  }, [runtimeConfig]);
  const cheapOverlay = !isCreate ? overlay.modelProfiles?.cheap : undefined;
  const currentCheapEnabled = isCreate
    ? values!.cheapModelEnabled ?? false
    : cheapOverlay?.enabled ?? cheapProfileFromAgent.enabled;
  const currentCheapModel = isCreate
    ? values!.cheapModel ?? ""
    : ((cheapOverlay?.adapterConfig as Record<string, unknown> | undefined)?.model as string | undefined)
      ?? cheapProfileFromAgent.model;

  function setCheapEnabled(next: boolean) {
    if (isCreate) {
      onChange!({ cheapModelEnabled: next });
      return;
    }
    setOverlay((prev) => ({
      ...prev,
      modelProfiles: { cheap: { ...(prev.modelProfiles?.cheap ?? {}), enabled: next } },
    }));
  }

  function setCheapModel(next: string) {
    if (isCreate) {
      onChange!({ cheapModel: next });
      return;
    }
    setOverlay((prev) => {
      const existing = prev.modelProfiles?.cheap ?? {};
      return {
        ...prev,
        modelProfiles: {
          cheap: {
            ...existing,
            adapterConfig: {
              ...((existing.adapterConfig ?? {}) as Record<string, unknown>),
              model: next || undefined,
            },
          },
        },
      };
    });
  }

  return {
    adapterCommandField,
    adapterDefaultModel: adapterCheapDefaultModel,
    adapterFieldProps,
    cheapModelOpen,
    codexSearchEnabled,
    currentCheapEnabled,
    currentCheapModel,
    currentModelId,
    currentThinkingEffort,
    detectedModel: detectedModelData?.model ?? null,
    detectModel: adapterType === "opencode_local"
      ? undefined
      : async () => {
          const result = await refetchDetectedModel();
          return result.data?.model ?? null;
        },
    fetchedModelsError,
    modelOpen,
    models,
    refreshModels: adapterType === "codex_local" || adapterType === "acpx_local" ? refreshModels : undefined,
    refreshModelsError,
    refreshingModels,
    setCheapEnabled,
    setCheapModel,
    setCheapModelOpen,
    setModelOpen,
    setThinkingEffortOpen,
    showThinkingEffort,
    thinkingEffortKey,
    thinkingEffortOpen,
    thinkingEffortOptions,
  };
}
