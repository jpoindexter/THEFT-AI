import { useMemo, useState } from "react";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import type {
  CompanyPortabilityAdapterOverride,
  CompanyPortabilityPreviewResult,
} from "@paperclipai/shared";
import { getUIAdapter } from "../../adapters";
import { defaultCreateValues } from "../../components/agent-config-defaults";
import type { AdapterPickerItem } from "./ImportReviewSetup";

interface UseImportAdapterOverridesOptions {
  importPreview: CompanyPortabilityPreviewResult | null;
}

export function useImportAdapterOverrides({
  importPreview,
}: UseImportAdapterOverridesOptions) {
  const [adapterOverrides, setAdapterOverrides] = useState<Record<string, string>>({});
  const [adapterExpandedSlugs, setAdapterExpandedSlugs] = useState<Set<string>>(new Set());
  const [adapterConfigValues, setAdapterConfigValues] = useState<Record<string, CreateConfigValues>>({});

  const adapterAgents = useMemo<AdapterPickerItem[]>(() => {
    if (!importPreview) return [];
    return importPreview.manifest.agents.map((agent) => ({
      slug: agent.slug,
      name: agent.name,
      adapterType: agent.adapterType,
    }));
  }, [importPreview]);

  function initializeAdapterOverrides(
    result: CompanyPortabilityPreviewResult,
    defaultAdapterType: string,
  ) {
    const defaultAdapters: Record<string, string> = {};
    for (const agent of result.manifest.agents) {
      defaultAdapters[agent.slug] = defaultAdapterType;
    }
    setAdapterOverrides(defaultAdapters);
    setAdapterExpandedSlugs(new Set());
    setAdapterConfigValues({});
  }

  function handleAdapterChange(slug: string, adapterType: string) {
    setAdapterOverrides((prev) => ({ ...prev, [slug]: adapterType }));
    setAdapterConfigValues((prev) => {
      const next = { ...prev };
      delete next[slug];
      return next;
    });
  }

  function handleAdapterToggleExpand(slug: string) {
    setAdapterExpandedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleAdapterConfigChange(slug: string, patch: Partial<CreateConfigValues>) {
    setAdapterConfigValues((prev) => ({
      ...prev,
      [slug]: {
        ...(prev[slug] ?? {
          ...defaultCreateValues,
          adapterType: adapterOverrides[slug] ?? "claude_local",
        }),
        ...patch,
      },
    }));
  }

  function buildFinalAdapterOverrides(): Record<string, CompanyPortabilityAdapterOverride> | undefined {
    if (adapterAgents.length === 0) return undefined;
    const overrides: Record<string, CompanyPortabilityAdapterOverride> = {};
    for (const agent of adapterAgents) {
      const selectedType = adapterOverrides[agent.slug] ?? agent.adapterType;
      const configVals = adapterConfigValues[agent.slug];
      const override: CompanyPortabilityAdapterOverride = { adapterType: selectedType };
      if (configVals) {
        const uiAdapter = getUIAdapter(selectedType);
        override.adapterConfig = uiAdapter.buildAdapterConfig(configVals);
      }
      overrides[agent.slug] = override;
    }
    return Object.keys(overrides).length > 0 ? overrides : undefined;
  }

  return {
    adapterAgents,
    adapterConfigValues,
    adapterExpandedSlugs,
    adapterOverrides,
    buildFinalAdapterOverrides,
    handleAdapterChange,
    handleAdapterConfigChange,
    handleAdapterToggleExpand,
    initializeAdapterOverrides,
  };
}
