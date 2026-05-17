import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { agentsApi } from "../api/agents";
import { asBoolean, asFiniteNumber, asObject, cn } from "../lib/utils";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "../context/CompanyContext";
import { getUIAdapter } from "../adapters";
import { shouldShowLegacyWorkingDirectoryField } from "../lib/legacy-agent-config";
import { useDisabledAdaptersSync } from "../adapters/use-disabled-adapters";
import { useAdapterCapabilities } from "../adapters/use-adapter-capabilities";
import {
  MAX_TURN_CONTINUATION_DEFAULT_DELAY_SEC,
  MAX_TURN_CONTINUATION_DEFAULT_MAX_ATTEMPTS,
  MAX_TURN_CONTINUATION_MAX_DELAY_SEC,
  MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP,
  clampInteger,
  inputClass,
} from "./agent-config/constants";
import { AgentIdentitySection } from "./agent-config/identity-section";
import { AgentRunPolicySection } from "./agent-config/run-policy-section";
import { AdapterConfigurationSection } from "./agent-config/adapter-configuration-section";
import { AgentAdapterSection } from "./agent-config/adapter-section";
import { AgentExecutionSection } from "./agent-config/execution-section";
import type { AgentConfigFormProps } from "./agent-config/types";
import { useAgentConfigOverlay } from "./agent-config/use-agent-config-overlay";
import { useAgentConfigAssets } from "./agent-config/use-agent-config-assets";
import { useAgentExecutionOptions } from "./agent-config/use-agent-execution-options";
import { useAgentModelControls } from "./agent-config/use-agent-model-controls";
import { useAdapterEnvironmentTest } from "./agent-config/use-adapter-environment-test";
import { UnsavedChangesBar } from "./agent-config/unsaved-changes-bar";

export { AdapterEnvironmentResult } from "./agent-config/adapter-environment-result";

/* ---- Create mode values ---- */

// Canonical type lives in @paperclipai/adapter-utils; re-exported here
// so existing imports from this file keep working.
export type { CreateConfigValues } from "@paperclipai/adapter-utils";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";

/* ---- Form ---- */

export function AgentConfigForm(props: AgentConfigFormProps) {
  const { mode, adapterModels: externalModels } = props;
  const isCreate = mode === "create";
  const cards = props.sectionLayout === "cards";
  const showAdapterTypeField = props.showAdapterTypeField ?? true;
  const showAdapterTestEnvironmentButton = props.showAdapterTestEnvironmentButton ?? true;
  const showInlineAdapterTestEnvironmentButton =
    showAdapterTestEnvironmentButton && !props.onTestActionChange;
  const showInlineAdapterTestEnvironmentFeedback = !props.onTestFeedbackChange;
  const showCreateRunPolicySection = props.showCreateRunPolicySection ?? true;
  const hideInstructionsFile = props.hideInstructionsFile ?? false;
  const { selectedCompanyId } = useCompany();
  const { availableSecrets, createSecret, uploadImage } = useAgentConfigAssets(selectedCompanyId);

  // Sync disabled adapter types from server so dropdown filters them out
  const disabledTypes = useDisabledAdaptersSync();

  const {
    adapterType,
    config,
    eff,
    handleSave,
    heartbeat,
    isDirty,
    mark,
    overlay,
    runtimeConfig,
    setOverlay,
  } = useAgentConfigOverlay(props);
  const getCapabilities = useAdapterCapabilities();
  const adapterCaps = getCapabilities(adapterType);
  const isLocal = adapterCaps.supportsInstructionsBundle || adapterCaps.supportsSkills || adapterCaps.supportsLocalAgentJwt;
  const val = isCreate ? props.values : null;
  const set = isCreate
    ? (patch: Partial<CreateConfigValues>) => props.onChange(patch)
    : null;

  const showLegacyWorkingDirectoryField =
    isLocal && shouldShowLegacyWorkingDirectoryField({ isCreate, adapterConfig: config });
  const uiAdapter = useMemo(() => getUIAdapter(adapterType), [adapterType]);
  const {
    currentDefaultEnvironment,
    currentDefaultEnvironmentId,
    environmentsEnabled,
    runnableEnvironments,
  } = useAgentExecutionOptions({
    adapterType,
    agentDefaultEnvironmentId: isCreate ? "" : props.agent.defaultEnvironmentId ?? "",
    eff,
    isCreate,
    selectedCompanyId,
    values: val,
  });

  const supportsModelProfiles = adapterCaps.supportsModelProfiles;
  const modelControls = useAgentModelControls({
    adapterType,
    config,
    currentDefaultEnvironmentId,
    eff: eff as <T>(group: "adapterConfig", field: string, original: T) => T,
    externalModels,
    hideInstructionsFile,
    isCreate,
    mark: mark as (group: "adapterConfig", field: string, value: unknown) => void,
    mode,
    onChange: set,
    overlay,
    runtimeConfig,
    selectedCompanyId,
    setOverlay,
    supportsModelProfiles,
    values: val,
  });
  const adapterEnvironmentTest = useAdapterEnvironmentTest({
    adapterType,
    config,
    currentDefaultEnvironmentId,
    isCreate,
    onTestActionChange: props.onTestActionChange,
    onTestActionStateChange: props.onTestActionStateChange,
    onTestFeedbackChange: props.onTestFeedbackChange,
    overlay,
    selectedCompanyId,
    showAdapterTestEnvironmentButton,
    uiAdapter,
    values: val,
  });

  const { data: companyAgents = [] } = useQuery({
    queryKey: selectedCompanyId ? queryKeys.agents.list(selectedCompanyId) : ["agents", "none", "list"],
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: Boolean(!isCreate && selectedCompanyId),
  });

  // Section toggle state — advanced always starts collapsed
  const [runPolicyAdvancedOpen, setRunPolicyAdvancedOpen] = useState(false);

  const effectiveRuntimeConfig = useMemo(() => {
    if (isCreate) {
      return {
        heartbeat: {
          enabled: val!.heartbeatEnabled,
          intervalSec: val!.intervalSec,
        },
      };
    }
    const mergedHeartbeat = {
      ...(runtimeConfig.heartbeat && typeof runtimeConfig.heartbeat === "object"
        ? runtimeConfig.heartbeat as Record<string, unknown>
        : {}),
      ...overlay.heartbeat,
    };
    return {
      ...runtimeConfig,
      heartbeat: mergedHeartbeat,
    };
  }, [isCreate, overlay.heartbeat, runtimeConfig, val]);
  const effectiveHeartbeat = asObject(effectiveRuntimeConfig.heartbeat);
  const maxTurnContinuation = asObject(effectiveHeartbeat.maxTurnContinuation);
  const maxTurnContinuationEnabled = asBoolean(maxTurnContinuation.enabled, true);
  const maxTurnContinuationMaxAttempts = clampInteger(
    asFiniteNumber(maxTurnContinuation.maxAttempts, MAX_TURN_CONTINUATION_DEFAULT_MAX_ATTEMPTS),
    0,
    MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP,
  );
  const maxTurnContinuationDelaySec = clampInteger(
    asFiniteNumber(maxTurnContinuation.delayMs, MAX_TURN_CONTINUATION_DEFAULT_DELAY_SEC * 1000) / 1000,
    0,
    MAX_TURN_CONTINUATION_MAX_DELAY_SEC,
  );

  function updateMaxTurnContinuation(patch: Record<string, unknown>) {
    mark("heartbeat", "maxTurnContinuation", {
      ...maxTurnContinuation,
      ...patch,
    });
  }

  return (
    <div className={cn("relative", cards && "space-y-6")}>
      {isDirty && !props.hideInlineSave && (
        <UnsavedChangesBar disabled={!isCreate && props.isSaving === true} onSave={handleSave} />
      )}

      {/* ---- Identity (edit only) ---- */}
      {!isCreate && (
        <AgentIdentitySection
          agent={props.agent}
          cards={cards}
          companyAgents={companyAgents}
          config={config}
          eff={eff}
          hidePromptTemplate={props.hidePromptTemplate ?? false}
          inputClass={inputClass}
          isLocal={isLocal}
          mark={mark}
          uploadImage={uploadImage}
        />
      )}

      {environmentsEnabled ? (
        <AgentExecutionSection
          cards={cards}
          currentDefaultEnvironmentId={currentDefaultEnvironmentId}
          inputClass={inputClass}
          isCreate={isCreate}
          mark={mark}
          onCreateChange={set}
          runnableEnvironments={runnableEnvironments}
        />
      ) : null}

      <AgentAdapterSection
        adapterType={adapterType}
        cards={cards}
        config={config}
        disabledTypes={disabledTypes}
        eff={eff}
        isCreate={isCreate}
        mark={mark}
        onCreateChange={set}
        onTestEnvironment={adapterEnvironmentTest.trigger}
        setOverlay={setOverlay}
        showAdapterTypeField={showAdapterTypeField}
        showInlineTestButton={showInlineAdapterTestEnvironmentButton}
        showInlineTestFeedback={showInlineAdapterTestEnvironmentFeedback}
        showLegacyWorkingDirectoryField={showLegacyWorkingDirectoryField}
        testDisabled={adapterEnvironmentTest.disabled}
        testError={adapterEnvironmentTest.error}
        testPending={adapterEnvironmentTest.pending}
        testResult={adapterEnvironmentTest.result}
        values={val}
      />

      {/* ---- Permissions & Configuration ---- */}
      {isLocal && (
        <AdapterConfigurationSection
          adapterCommandField={modelControls.adapterCommandField}
          adapterDefaultModel={modelControls.adapterDefaultModel}
          adapterFieldProps={modelControls.adapterFieldProps}
          agentId={isCreate ? null : props.agent.id}
          availableSecrets={availableSecrets}
          cards={cards}
          cheapModelOpen={modelControls.cheapModelOpen}
          codexSearchEnabled={modelControls.codexSearchEnabled}
          ConfigFields={uiAdapter.ConfigFields}
          currentCheapEnabled={modelControls.currentCheapEnabled}
          currentCheapModel={modelControls.currentCheapModel}
          currentDefaultEnvironment={currentDefaultEnvironment}
          currentModelId={modelControls.currentModelId}
          currentThinkingEffort={modelControls.currentThinkingEffort}
          detectedModel={modelControls.detectedModel}
          fetchedModelsError={modelControls.fetchedModelsError}
          inputClass={inputClass}
          modelOpen={modelControls.modelOpen}
          models={modelControls.models}
          onCheapEnabledChange={modelControls.setCheapEnabled}
          onCheapModelChange={modelControls.setCheapModel}
          onCheapModelOpenChange={modelControls.setCheapModelOpen}
          onCreateSecret={createSecret}
          onDetectModel={modelControls.detectModel}
          onModelOpenChange={modelControls.setModelOpen}
          onRefreshModels={modelControls.refreshModels}
          onThinkingEffortOpenChange={modelControls.setThinkingEffortOpen}
          refreshModelsError={modelControls.refreshModelsError}
          refreshingModels={modelControls.refreshingModels}
          showThinkingEffort={modelControls.showThinkingEffort}
          supportsModelProfiles={supportsModelProfiles}
          thinkingEffortKey={modelControls.thinkingEffortKey}
          thinkingEffortOpen={modelControls.thinkingEffortOpen}
          thinkingEffortOptions={modelControls.thinkingEffortOptions}
          uploadImage={uploadImage}
        />
      )}

      <AgentRunPolicySection
        advancedOpen={runPolicyAdvancedOpen}
        cards={cards}
        eff={eff}
        heartbeat={heartbeat}
        inputClass={inputClass}
        isCreate={isCreate}
        mark={mark}
        maxTurnContinuationDelaySec={maxTurnContinuationDelaySec}
        maxTurnContinuationEnabled={maxTurnContinuationEnabled}
        maxTurnContinuationMaxAttempts={maxTurnContinuationMaxAttempts}
        onAdvancedOpenChange={setRunPolicyAdvancedOpen}
        onCreateChange={set}
        showCreateRunPolicySection={showCreateRunPolicySection}
        updateMaxTurnContinuation={updateMaxTurnContinuation}
        values={val}
      />

    </div>
  );
}
