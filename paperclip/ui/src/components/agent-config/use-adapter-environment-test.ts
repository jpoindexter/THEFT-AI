import { useCallback, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";
import { agentsApi } from "../../api/agents";
import type { UIAdapterModule } from "../../adapters/types";
import type { AgentConfigOverlay } from "../../lib/agent-config-patch";
import type { AgentConfigFormProps } from "./types";

export function useAdapterEnvironmentTest({
  adapterType,
  config,
  currentDefaultEnvironmentId,
  isCreate,
  onTestActionChange,
  onTestActionStateChange,
  onTestFeedbackChange,
  overlay,
  selectedCompanyId,
  showAdapterTestEnvironmentButton,
  uiAdapter,
  values,
}: {
  adapterType: string;
  config: Record<string, unknown>;
  currentDefaultEnvironmentId: string;
  isCreate: boolean;
  onTestActionChange: AgentConfigFormProps["onTestActionChange"];
  onTestActionStateChange: AgentConfigFormProps["onTestActionStateChange"];
  onTestFeedbackChange: AgentConfigFormProps["onTestFeedbackChange"];
  overlay: AgentConfigOverlay;
  selectedCompanyId: string | null | undefined;
  showAdapterTestEnvironmentButton: boolean;
  uiAdapter: UIAdapterModule;
  values: CreateConfigValues | null;
}) {
  function buildAdapterConfigForTest(): Record<string, unknown> {
    if (isCreate) {
      return uiAdapter.buildAdapterConfig(values!);
    }
    const next = { ...config, ...overlay.adapterConfig };
    if (adapterType === "hermes_local") {
      const hermesCommand =
        typeof next.hermesCommand === "string" && next.hermesCommand.length > 0
          ? next.hermesCommand
          : typeof next.command === "string" && next.command.length > 0
            ? next.command
            : undefined;
      if (hermesCommand) next.hermesCommand = hermesCommand;
    }
    return next;
  }

  const testEnvironment = useMutation({
    mutationFn: async () => {
      if (!selectedCompanyId) {
        throw new Error("Select a company to test adapter environment");
      }
      return agentsApi.testEnvironment(selectedCompanyId, adapterType, {
        adapterConfig: buildAdapterConfigForTest(),
        environmentId: currentDefaultEnvironmentId || null,
      });
    },
  });
  const disabled = testEnvironment.isPending || !selectedCompanyId;
  const trigger = useCallback(() => {
    if (disabled) return;
    testEnvironment.mutate();
  }, [testEnvironment.mutate, disabled]);

  useEffect(() => {
    if (!showAdapterTestEnvironmentButton || !onTestActionChange) return;
    onTestActionChange(trigger);
    return () => {
      onTestActionChange(null);
    };
  }, [showAdapterTestEnvironmentButton, onTestActionChange, trigger]);

  useEffect(() => {
    if (!showAdapterTestEnvironmentButton || !onTestActionStateChange) return;
    onTestActionStateChange({ disabled, pending: testEnvironment.isPending });
    return () => {
      onTestActionStateChange({ disabled: true, pending: false });
    };
  }, [showAdapterTestEnvironmentButton, onTestActionStateChange, disabled, testEnvironment.isPending]);

  useEffect(() => {
    if (!onTestFeedbackChange) return;
    onTestFeedbackChange({
      errorMessage: testEnvironment.error instanceof Error
        ? testEnvironment.error.message
        : testEnvironment.error
          ? "Environment test failed"
          : null,
      result: testEnvironment.data ?? null,
    });
    return () => {
      onTestFeedbackChange({ errorMessage: null, result: null });
    };
  }, [onTestFeedbackChange, testEnvironment.data, testEnvironment.error]);

  return {
    disabled,
    error: testEnvironment.error,
    pending: testEnvironment.isPending,
    result: testEnvironment.data ?? null,
    trigger,
  };
}
