import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import {
  DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX,
  DEFAULT_CODEX_LOCAL_MODEL,
} from "@paperclipai/adapter-codex-local";
import { DEFAULT_CURSOR_LOCAL_MODEL } from "@paperclipai/adapter-cursor-local";
import { DEFAULT_GEMINI_LOCAL_MODEL } from "@paperclipai/adapter-gemini-local";
import { DEFAULT_OPENCODE_LOCAL_MODEL } from "@paperclipai/adapter-opencode-local";

import { getUIAdapter } from "../../adapters";
import { agentsApi } from "../../api/agents";
import { queryKeys } from "../../lib/queryKeys";
import { defaultCreateValues } from "../agent-config-defaults";
import type { OnboardingStep } from "./types";

const COMMAND_PLACEHOLDERS: Record<string, string> = {
  claude_local: "claude",
  codex_local: "codex",
  gemini_local: "gemini",
  pi_local: "pi",
  cursor: "agent",
  opencode_local: "opencode",
};

export function useOnboardingAdapterRuntime({
  createdAgentId,
  createdCompanyId,
  step,
}: {
  createdAgentId: string | null;
  createdCompanyId: string | null;
  step: OnboardingStep;
}) {
  const queryClient = useQueryClient();
  const [agentName, setAgentName] = useState("Operator");
  const [adapterType, setAdapterType] = useState("codex_local");
  const [model, setModel] = useState(DEFAULT_CODEX_LOCAL_MODEL);
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");
  const [adapterEnvResult, setAdapterEnvResult] = useState<AdapterEnvironmentTestResult | null>(null);
  const [adapterEnvError, setAdapterEnvError] = useState<string | null>(null);
  const [adapterEnvLoading, setAdapterEnvLoading] = useState(false);
  const [forceUnsetAnthropicApiKey, setForceUnsetAnthropicApiKey] = useState(false);
  const [unsetAnthropicLoading, setUnsetAnthropicLoading] = useState(false);
  const [showMoreAdapters, setShowMoreAdapters] = useState(false);
  const [showAdvancedRuntime, setShowAdvancedRuntime] = useState(false);

  const effectiveAdapterCommand =
    command.trim() ||
    (COMMAND_PLACEHOLDERS[adapterType] ?? adapterType.replace(/_local$/, ""));

  const hasAnthropicApiKeyOverrideCheck =
    adapterEnvResult?.checks.some((check) => check.code === "claude_anthropic_api_key_overrides_subscription") ?? false;
  const shouldSuggestUnsetAnthropicApiKey =
    adapterType === "claude_local" &&
    adapterEnvResult?.status === "fail" &&
    hasAnthropicApiKeyOverrideCheck;

  useEffect(() => {
    if (step !== 2) return;
    setAdapterEnvResult(null);
    setAdapterEnvError(null);
  }, [step, adapterType, model, command, args, url]);

  const resetAdapterRuntime = useCallback(() => {
    setAgentName("Operator");
    setAdapterType("codex_local");
    setModel(DEFAULT_CODEX_LOCAL_MODEL);
    setCommand("");
    setArgs("");
    setUrl("");
    setAdapterEnvResult(null);
    setAdapterEnvError(null);
    setAdapterEnvLoading(false);
    setForceUnsetAnthropicApiKey(false);
    setUnsetAnthropicLoading(false);
    setShowAdvancedRuntime(false);
  }, []);

  const buildAdapterConfig = useCallback((): Record<string, unknown> => {
    const adapter = getUIAdapter(adapterType);
    const config = adapter.buildAdapterConfig({
      ...defaultCreateValues,
      adapterType,
      model: resolveAdapterModel(adapterType, model),
      command,
      args,
      url,
      dangerouslySkipPermissions: adapterType === "claude_local" || adapterType === "opencode_local",
      dangerouslyBypassSandbox:
        adapterType === "codex_local"
          ? DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX
          : defaultCreateValues.dangerouslyBypassSandbox,
    });
    if (adapterType === "claude_local" && forceUnsetAnthropicApiKey) {
      config.env = withUnsetAnthropicApiKey(config);
    }
    return config;
  }, [adapterType, args, command, forceUnsetAnthropicApiKey, model, url]);

  const runAdapterEnvironmentTest = useCallback(async (
    adapterConfigOverride?: Record<string, unknown>,
  ): Promise<AdapterEnvironmentTestResult | null> => {
    if (!createdCompanyId) {
      setAdapterEnvError("Create or select a company before testing adapter environment.");
      return null;
    }
    setAdapterEnvLoading(true);
    setAdapterEnvError(null);
    try {
      const result = await agentsApi.testEnvironment(createdCompanyId, adapterType, {
        adapterConfig: adapterConfigOverride ?? buildAdapterConfig(),
      });
      setAdapterEnvResult(result);
      return result;
    } catch (err) {
      setAdapterEnvError(err instanceof Error ? err.message : "Adapter environment test failed");
      return null;
    } finally {
      setAdapterEnvLoading(false);
    }
  }, [adapterType, buildAdapterConfig, createdCompanyId]);

  const handleUnsetAnthropicApiKey = useCallback(async () => {
    if (!createdCompanyId || unsetAnthropicLoading) return;
    setUnsetAnthropicLoading(true);
    setAdapterEnvError(null);
    setForceUnsetAnthropicApiKey(true);

    const baseConfig = buildAdapterConfig();
    const configWithUnset = {
      ...baseConfig,
      env: withUnsetAnthropicApiKey(baseConfig),
    };

    try {
      if (createdAgentId) {
        await agentsApi.update(createdAgentId, { adapterConfig: configWithUnset }, createdCompanyId);
        queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(createdCompanyId) });
      }
      const result = await runAdapterEnvironmentTest(configWithUnset);
      return result?.status;
    } finally {
      setUnsetAnthropicLoading(false);
    }
  }, [buildAdapterConfig, createdAgentId, createdCompanyId, queryClient, runAdapterEnvironmentTest, unsetAnthropicLoading]);

  return {
    adapterEnvError,
    adapterEnvLoading,
    adapterEnvResult,
    adapterType,
    agentName,
    buildAdapterConfig,
    effectiveAdapterCommand,
    handleUnsetAnthropicApiKey,
    model,
    modelOpen,
    modelSearch,
    resetAdapterRuntime,
    runAdapterEnvironmentTest,
    setAdapterEnvError,
    setAdapterType,
    setAgentName,
    setModel,
    setModelOpen,
    setModelSearch,
    setShowAdvancedRuntime,
    setShowMoreAdapters,
    setUrl,
    shouldSuggestUnsetAnthropicApiKey,
    showAdvancedRuntime,
    showMoreAdapters,
    unsetAnthropicLoading,
    url,
  };
}

function resolveAdapterModel(adapterType: string, model: string) {
  if (adapterType === "codex_local") return model || DEFAULT_CODEX_LOCAL_MODEL;
  if (adapterType === "gemini_local") return model || DEFAULT_GEMINI_LOCAL_MODEL;
  if (adapterType === "cursor") return model || DEFAULT_CURSOR_LOCAL_MODEL;
  if (adapterType === "opencode_local") return model || DEFAULT_OPENCODE_LOCAL_MODEL;
  return model;
}

function withUnsetAnthropicApiKey(config: Record<string, unknown>) {
  const env =
    typeof config.env === "object" &&
    config.env !== null &&
    !Array.isArray(config.env)
      ? { ...(config.env as Record<string, unknown>) }
      : {};
  env.ANTHROPIC_API_KEY = { type: "plain", value: "" };
  return env;
}
