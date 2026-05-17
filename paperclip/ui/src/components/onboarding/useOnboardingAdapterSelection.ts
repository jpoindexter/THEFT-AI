import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { agentsApi } from "../../api/agents";
import { listUIAdapters } from "../../adapters";
import { getAdapterDisplay } from "../../adapters/adapter-display-registry";
import { isVisualAdapterChoice } from "../../adapters/metadata";
import { useAdapterCapabilities } from "../../adapters/use-adapter-capabilities";
import { extractProviderIdWithFallback } from "../../lib/model-utils";
import { queryKeys } from "../../lib/queryKeys";
import type { AdapterChoice, OnboardingStep } from "./types";

interface UseOnboardingAdapterSelectionArgs {
  createdCompanyId: string | null;
  effectiveOnboardingOpen: boolean;
  step: OnboardingStep;
  adapterType: string;
  model: string;
  disabledTypes: ReadonlySet<string>;
  modelSearch: string;
}

export function useOnboardingAdapterSelection({
  createdCompanyId,
  effectiveOnboardingOpen,
  step,
  adapterType,
  model,
  disabledTypes,
  modelSearch,
}: UseOnboardingAdapterSelectionArgs) {
  const { data: adapterModels } = useQuery({
    // The wizard doesn't expose an environment selector, so models always
    // resolve against the local Paperclip host (environmentId = null).
    queryKey: createdCompanyId
      ? queryKeys.agents.adapterModels(createdCompanyId, adapterType, null)
      : ["agents", "none", "adapter-models", adapterType, null],
    queryFn: () => agentsApi.adapterModels(createdCompanyId!, adapterType, { environmentId: null }),
    enabled: Boolean(createdCompanyId) && effectiveOnboardingOpen && step === 2,
  });
  const getCapabilities = useAdapterCapabilities();
  const adapterCaps = getCapabilities(adapterType);
  const isLocalAdapter =
    adapterCaps.supportsInstructionsBundle ||
    adapterCaps.supportsSkills ||
    adapterCaps.supportsLocalAgentJwt;

  const { recommendedAdapters, moreAdapters } = useMemo((): {
    recommendedAdapters: AdapterChoice[];
    moreAdapters: AdapterChoice[];
  } => {
    const systemAdapterTypes = new Set(["process", "http"]);
    const all = listUIAdapters()
      .filter((adapter) =>
        !systemAdapterTypes.has(adapter.type) &&
        !disabledTypes.has(adapter.type) &&
        isVisualAdapterChoice(adapter.type)
      )
      .map((adapter) => ({ ...getAdapterDisplay(adapter.type), type: adapter.type }));

    return {
      recommendedAdapters: all.filter((adapter) => adapter.recommended),
      moreAdapters: all.filter((adapter) => !adapter.recommended),
    };
  }, [disabledTypes]);

  const filteredModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();
    return (adapterModels ?? []).filter((entry) => {
      if (!query) return true;
      const provider = extractProviderIdWithFallback(entry.id, "");
      return (
        entry.id.toLowerCase().includes(query) ||
        entry.label.toLowerCase().includes(query) ||
        provider.toLowerCase().includes(query)
      );
    });
  }, [adapterModels, modelSearch]);

  const groupedModels = useMemo(() => {
    if (adapterType !== "opencode_local") {
      return [
        {
          provider: "models",
          entries: [...filteredModels].sort((a, b) => a.id.localeCompare(b.id)),
        },
      ];
    }
    const groups = new Map<string, Array<{ id: string; label: string }>>();
    for (const entry of filteredModels) {
      const provider = extractProviderIdWithFallback(entry.id);
      const bucket = groups.get(provider) ?? [];
      bucket.push(entry);
      groups.set(provider, bucket);
    }
    return Array.from(groups.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([provider, entries]) => ({
        provider,
        entries: [...entries].sort((a, b) => a.id.localeCompare(b.id)),
      }));
  }, [filteredModels, adapterType]);

  return {
    adapterModels,
    selectedModel: (adapterModels ?? []).find((entry) => entry.id === model),
    filteredModels,
    groupedModels,
    recommendedAdapters,
    moreAdapters,
    adapterCaps,
    isLocalAdapter,
  };
}
