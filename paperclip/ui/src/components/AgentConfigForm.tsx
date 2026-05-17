import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  Agent,
  AdapterEnvironmentTestResult,
  CompanySecret,
  EnvBinding,
  Environment,
} from "@paperclipai/shared";
import { AGENT_DEFAULT_MAX_CONCURRENT_RUNS, supportedEnvironmentDriversForAdapter } from "@paperclipai/shared";
import type { AdapterModel } from "../api/agents";
import { agentsApi } from "../api/agents";
import { environmentsApi } from "../api/environments";
import { instanceSettingsApi } from "../api/instanceSettings";
import { secretsApi } from "../api/secrets";
import { assetsApi } from "../api/assets";
import {
  DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX,
  DEFAULT_CODEX_LOCAL_MODEL,
} from "@paperclipai/adapter-codex-local";
import { DEFAULT_CURSOR_LOCAL_MODEL } from "@paperclipai/adapter-cursor-local";
import { DEFAULT_GEMINI_LOCAL_MODEL } from "@paperclipai/adapter-gemini-local";
import { DEFAULT_OPENCODE_LOCAL_MODEL } from "@paperclipai/adapter-opencode-local";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FolderOpen, Heart } from "lucide-react";
import { asBoolean, asFiniteNumber, asObject, cn } from "../lib/utils";
import { queryKeys } from "../lib/queryKeys";
import { useCompany } from "../context/CompanyContext";
import {
  Field,
  ToggleField,
  ToggleWithNumber,
  CollapsibleSection,
  DraftInput,
  DraftNumberInput,
  help,
} from "./agent-config-primitives";
import { defaultCreateValues } from "./agent-config-defaults";
import { getUIAdapter } from "../adapters";
import { ClaudeLocalAdvancedFields } from "../adapters/claude-local/config-fields";
import { MarkdownEditor } from "./MarkdownEditor";
import { ChoosePathButton } from "./PathInstructionsModal";
import { EnvVarEditor } from "./EnvVarEditor";
import { shouldShowLegacyWorkingDirectoryField } from "../lib/legacy-agent-config";
import { useDisabledAdaptersSync } from "../adapters/use-disabled-adapters";
import { buildAgentUpdatePatch, type AgentConfigOverlay } from "../lib/agent-config-patch";
import { useAdapterCapabilities } from "../adapters/use-adapter-capabilities";
import { filterAcpxModelsByAgent } from "../lib/acpx-model-filter";
import {
  EMPTY_ENV,
  MAX_TURN_CONTINUATION_DEFAULT_DELAY_SEC,
  MAX_TURN_CONTINUATION_DEFAULT_MAX_ATTEMPTS,
  MAX_TURN_CONTINUATION_MAX_DELAY_SEC,
  MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP,
  clampDelayMsFromSeconds,
  clampInteger,
  claudeThinkingEffortOptions,
  codexThinkingEffortOptions,
  cursorModeOptions,
  emptyOverlay,
  formatArgList,
  inputClass,
  isOverlayDirty,
  openCodeThinkingEffortOptions,
  parseCommaArgs,
} from "./agent-config/constants";
import { AdapterEnvironmentResult } from "./agent-config/adapter-environment-result";
import { AdapterTypeDropdown } from "./agent-config/adapter-type-dropdown";
import {
  CheapModelSection,
  ModelDropdown,
  ThinkingEffortDropdown,
} from "./agent-config/model-dropdown";
import { AgentIdentitySection } from "./agent-config/identity-section";

export { AdapterEnvironmentResult } from "./agent-config/adapter-environment-result";

/* ---- Create mode values ---- */

// Canonical type lives in @paperclipai/adapter-utils; re-exported here
// so existing imports from this file keep working.
export type { CreateConfigValues } from "@paperclipai/adapter-utils";
import type { CreateConfigValues } from "@paperclipai/adapter-utils";

/* ---- Props ---- */

type AgentConfigFormProps = {
  adapterModels?: AdapterModel[];
  onDirtyChange?: (dirty: boolean) => void;
  onSaveActionChange?: (save: (() => void) | null) => void;
  onCancelActionChange?: (cancel: (() => void) | null) => void;
  onTestActionChange?: (test: (() => void) | null) => void;
  onTestActionStateChange?: (state: { disabled: boolean; pending: boolean }) => void;
  onTestFeedbackChange?: (feedback: {
    errorMessage: string | null;
    result: AdapterEnvironmentTestResult | null;
  }) => void;
  hideInlineSave?: boolean;
  showAdapterTypeField?: boolean;
  showAdapterTestEnvironmentButton?: boolean;
  showCreateRunPolicySection?: boolean;
  hideInstructionsFile?: boolean;
  /** Hide the prompt template field from the Identity section (used when it's shown in a separate Prompts tab). */
  hidePromptTemplate?: boolean;
  /** "cards" renders each section as heading + bordered card (for settings pages). Default: "inline" (border-b dividers). */
  sectionLayout?: "inline" | "cards";
} & (
  | {
      mode: "create";
      values: CreateConfigValues;
      onChange: (patch: Partial<CreateConfigValues>) => void;
    }
  | {
      mode: "edit";
      agent: Agent;
      onSave: (patch: Record<string, unknown>) => void;
      isSaving?: boolean;
    }
);

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
  const queryClient = useQueryClient();

  // Sync disabled adapter types from server so dropdown filters them out
  const disabledTypes = useDisabledAdaptersSync();

  const { data: availableSecrets = [] } = useQuery({
    queryKey: selectedCompanyId ? queryKeys.secrets.list(selectedCompanyId) : ["secrets", "none"],
    queryFn: () => secretsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId),
  });
  const { data: experimentalSettings } = useQuery({
    queryKey: queryKeys.instance.experimentalSettings,
    queryFn: () => instanceSettingsApi.getExperimental(),
    retry: false,
  });
  const environmentsEnabled = experimentalSettings?.enableEnvironments === true;

  const { data: environments = [] } = useQuery<Environment[]>({
    queryKey: selectedCompanyId ? queryKeys.environments.list(selectedCompanyId) : ["environments", "none"],
    queryFn: () => environmentsApi.list(selectedCompanyId!),
    enabled: Boolean(selectedCompanyId) && environmentsEnabled,
  });
  const createSecret = useMutation({
    mutationFn: (input: { name: string; value: string }) => {
      if (!selectedCompanyId) throw new Error("Select a company to create secrets");
      return secretsApi.create(selectedCompanyId, input);
    },
    onSuccess: () => {
      if (!selectedCompanyId) return;
      queryClient.invalidateQueries({ queryKey: queryKeys.secrets.list(selectedCompanyId) });
    },
  });

  const uploadMarkdownImage = useMutation({
    mutationFn: async ({ file, namespace }: { file: File; namespace: string }) => {
      if (!selectedCompanyId) throw new Error("Select a company to upload images");
      return assetsApi.uploadImage(selectedCompanyId, file, namespace);
    },
  });

  // ---- Edit mode: overlay for dirty tracking ----
  const [overlay, setOverlay] = useState<AgentConfigOverlay>(emptyOverlay);
  const agentRef = useRef<Agent | null>(null);

  // Clear overlay when agent data refreshes (after save)
  useEffect(() => {
    if (!isCreate) {
      if (agentRef.current !== null && props.agent !== agentRef.current) {
        setOverlay({ ...emptyOverlay });
      }
      agentRef.current = props.agent;
    }
  }, [isCreate, !isCreate ? props.agent : undefined]); // eslint-disable-line react-hooks/exhaustive-deps

  const isDirty = !isCreate && isOverlayDirty(overlay);

  type RecordOverlayGroup = "identity" | "adapterConfig" | "heartbeat" | "runtime";

  /** Read effective value: overlay if dirty, else original */
  function eff<T>(group: RecordOverlayGroup, field: string, original: T): T {
    const o = overlay[group];
    if (field in o) return o[field] as T;
    return original;
  }

  /** Mark field dirty in overlay */
  function mark(group: RecordOverlayGroup, field: string, value: unknown) {
    setOverlay((prev) => ({
      ...prev,
      [group]: { ...prev[group], [field]: value },
    }));
  }

  /** Build accumulated patch and send to parent */
  const handleCancel = useCallback(() => {
    setOverlay({ ...emptyOverlay });
  }, []);

  const handleSave = useCallback(() => {
    if (isCreate || !isDirty) return;
    props.onSave(buildAgentUpdatePatch(props.agent, overlay));
  }, [isCreate, isDirty, overlay, props]);

  useEffect(() => {
    if (!isCreate) {
      props.onDirtyChange?.(isDirty);
      props.onSaveActionChange?.(handleSave);
      props.onCancelActionChange?.(handleCancel);
    }
  }, [isCreate, isDirty, props.onDirtyChange, props.onSaveActionChange, props.onCancelActionChange, handleSave, handleCancel]);

  useEffect(() => {
    if (isCreate) return;
    return () => {
      props.onSaveActionChange?.(null);
      props.onCancelActionChange?.(null);
      props.onDirtyChange?.(false);
    };
  }, [isCreate, props.onDirtyChange, props.onSaveActionChange, props.onCancelActionChange]);

  // ---- Resolve values ----
  const config = !isCreate ? ((props.agent.adapterConfig ?? {}) as Record<string, unknown>) : {};
  const runtimeConfig = !isCreate ? ((props.agent.runtimeConfig ?? {}) as Record<string, unknown>) : {};
  const heartbeat = !isCreate ? ((runtimeConfig.heartbeat ?? {}) as Record<string, unknown>) : {};

  const adapterType = isCreate
    ? props.values.adapterType
    : overlay.adapterType ?? props.agent.adapterType;
  const getCapabilities = useAdapterCapabilities();
  const adapterCaps = getCapabilities(adapterType);
  const isLocal = adapterCaps.supportsInstructionsBundle || adapterCaps.supportsSkills || adapterCaps.supportsLocalAgentJwt;

  const showLegacyWorkingDirectoryField =
    isLocal && shouldShowLegacyWorkingDirectoryField({ isCreate, adapterConfig: config });
  const uiAdapter = useMemo(() => getUIAdapter(adapterType), [adapterType]);
  const supportedEnvironmentDrivers = useMemo(
    () => new Set(supportedEnvironmentDriversForAdapter(adapterType)),
    [adapterType],
  );
  const val = isCreate ? props.values : null;
  const set = isCreate
    ? (patch: Partial<CreateConfigValues>) => props.onChange(patch)
    : null;
  const currentDefaultEnvironmentId = isCreate
    ? val!.defaultEnvironmentId ?? ""
    : eff("identity", "defaultEnvironmentId", props.agent.defaultEnvironmentId ?? "");
  const currentDefaultEnvironment = useMemo(
    () => environments.find((environment) => environment.id === currentDefaultEnvironmentId) ?? null,
    [currentDefaultEnvironmentId, environments],
  );
  const runnableEnvironments = useMemo(
    () => environments.filter((environment) => {
      if (!supportedEnvironmentDrivers.has(environment.driver)) return false;
      if (environment.driver !== "sandbox") return true;
      const provider = typeof environment.config?.provider === "string" ? environment.config.provider : null;
      return provider !== null && provider !== "fake";
    }),
    [environments, supportedEnvironmentDrivers],
  );

  // Fetch adapter models for the effective adapter type
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
  const adapterCommandField =
    adapterType === "hermes_local" ? "hermesCommand" : "command";
  const acpxAgent =
    adapterType === "acpx_local"
      ? isCreate
        ? String(val!.adapterSchemaValues?.agent ?? "claude")
        : eff("adapterConfig", "agent", String(config.agent ?? "claude"))
      : "";
  const models = useMemo(
    () => adapterType === "acpx_local"
      ? filterAcpxModelsByAgent(rawModels, acpxAgent)
      : rawModels,
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
      if (!selectedCompanyId) {
        throw new Error("Select a company to detect the model");
      }
      return agentsApi.detectModel(selectedCompanyId, adapterType);
    },
    enabled: Boolean(selectedCompanyId && isLocal && adapterType !== "opencode_local"),
  });
  const detectedModel = detectedModelData?.model ?? null;
  const detectedModelCandidates = detectedModelData?.candidates ?? [];

  const { data: companyAgents = [] } = useQuery({
    queryKey: selectedCompanyId ? queryKeys.agents.list(selectedCompanyId) : ["agents", "none", "list"],
    queryFn: () => agentsApi.list(selectedCompanyId!),
    enabled: Boolean(!isCreate && selectedCompanyId),
  });

  /** Props passed to adapter-specific config field components */
  const adapterFieldProps = {
    mode,
    isCreate,
    adapterType,
    values: isCreate ? props.values : null,
    set: isCreate ? (patch: Partial<CreateConfigValues>) => props.onChange(patch) : null,
    config,
    eff: eff as <T>(group: "adapterConfig", field: string, original: T) => T,
    mark: mark as (group: "adapterConfig", field: string, value: unknown) => void,
    models,
    hideInstructionsFile,
  };

  // Section toggle state — advanced always starts collapsed
  const [runPolicyAdvancedOpen, setRunPolicyAdvancedOpen] = useState(false);
  // Popover states
  const [modelOpen, setModelOpen] = useState(false);
  const [cheapModelOpen, setCheapModelOpen] = useState(false);
  const [thinkingEffortOpen, setThinkingEffortOpen] = useState(false);

  // Cheap model profile state — only relevant when the adapter advertises
  // `supportsModelProfiles`. Defaults are sourced from the adapter's
  // /model-profiles endpoint so the UI does not encode adapter-specific
  // cheap defaults.
  const supportsModelProfiles = adapterCaps.supportsModelProfiles;
  const { data: adapterCheapProfileDefinitions } = useQuery({
    queryKey: selectedCompanyId
      ? queryKeys.agents.adapterModelProfiles(selectedCompanyId, adapterType)
      : ["agents", "none", "adapter-model-profiles", adapterType],
    queryFn: () => agentsApi.adapterModelProfiles(selectedCompanyId!, adapterType),
    enabled: Boolean(selectedCompanyId) && supportsModelProfiles,
  });
  const adapterCheapDefault = useMemo(() => {
    return (adapterCheapProfileDefinitions ?? []).find((profile) => profile.key === "cheap") ?? null;
  }, [adapterCheapProfileDefinitions]);
  const adapterCheapDefaultModel = useMemo(() => {
    const adapterConfig = adapterCheapDefault?.adapterConfig ?? {};
    const value = (adapterConfig as Record<string, unknown>).model;
    return typeof value === "string" ? value : "";
  }, [adapterCheapDefault]);

  function buildAdapterConfigForTest(): Record<string, unknown> {
    if (isCreate) {
      return uiAdapter.buildAdapterConfig(val!);
    }
    const base = config as Record<string, unknown>;
    const next = { ...base, ...overlay.adapterConfig };
    if (adapterType === "hermes_local") {
      const hermesCommand =
        typeof next.hermesCommand === "string" && next.hermesCommand.length > 0
          ? next.hermesCommand
          : typeof next.command === "string" && next.command.length > 0
            ? next.command
            : undefined;
      if (hermesCommand) {
        next.hermesCommand = hermesCommand;
      }
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
  const testEnvironmentDisabled = testEnvironment.isPending || !selectedCompanyId;
  const triggerTestEnvironment = useCallback(() => {
    if (testEnvironmentDisabled) return;
    testEnvironment.mutate();
  }, [testEnvironment.mutate, testEnvironmentDisabled]);

  useEffect(() => {
    if (!showAdapterTestEnvironmentButton || !props.onTestActionChange) return;
    props.onTestActionChange(triggerTestEnvironment);
    return () => {
      props.onTestActionChange?.(null);
    };
  }, [showAdapterTestEnvironmentButton, props.onTestActionChange, triggerTestEnvironment]);

  useEffect(() => {
    if (!showAdapterTestEnvironmentButton || !props.onTestActionStateChange) return;
    props.onTestActionStateChange({
      disabled: testEnvironmentDisabled,
      pending: testEnvironment.isPending,
    });
    return () => {
      props.onTestActionStateChange?.({ disabled: true, pending: false });
    };
  }, [
    showAdapterTestEnvironmentButton,
    props.onTestActionStateChange,
    testEnvironmentDisabled,
    testEnvironment.isPending,
  ]);

  useEffect(() => {
    if (!props.onTestFeedbackChange) return;
    props.onTestFeedbackChange({
      errorMessage: testEnvironment.error instanceof Error
        ? testEnvironment.error.message
        : testEnvironment.error
          ? "Environment test failed"
          : null,
      result: testEnvironment.data ?? null,
    });
    return () => {
      props.onTestFeedbackChange?.({ errorMessage: null, result: null });
    };
  }, [props.onTestFeedbackChange, testEnvironment.data, testEnvironment.error]);

  // Current model for display
  const currentModelId = isCreate
    ? val!.model
    : eff("adapterConfig", "model", String(config.model ?? ""));

  async function handleRefreshModels() {
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
    ? val!.thinkingEffort
    : adapterType === "codex_local"
      ? eff(
          "adapterConfig",
          "modelReasoningEffort",
          String(config.modelReasoningEffort ?? config.reasoningEffort ?? ""),
        )
      : adapterType === "acpx_local" && acpxAgent === "codex"
        ? eff(
            "adapterConfig",
            "modelReasoningEffort",
            String(config.modelReasoningEffort ?? config.reasoningEffort ?? config.effort ?? ""),
          )
        : adapterType === "cursor"
          ? eff("adapterConfig", "mode", String(config.mode ?? ""))
          : adapterType === "opencode_local"
            ? eff("adapterConfig", "variant", String(config.variant ?? ""))
            : eff("adapterConfig", "effort", String(config.effort ?? ""));
  const showThinkingEffort = adapterType !== "gemini_local";
  const codexSearchEnabled = adapterType === "codex_local"
    ? (isCreate ? Boolean(val!.search) : eff("adapterConfig", "search", Boolean(config.search)))
    : false;
  // Cheap profile read/write helpers. Edit-mode values come from
  // runtimeConfig.modelProfiles.cheap with overlay overrides on top; create-mode
  // values come straight from CreateConfigValues (cheapModel + cheapModelEnabled).
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
    ? val!.cheapModelEnabled ?? false
    : cheapOverlay?.enabled ?? cheapProfileFromAgent.enabled;
  const currentCheapModel = isCreate
    ? val!.cheapModel ?? ""
    : (() => {
        const overlayModel = (cheapOverlay?.adapterConfig as Record<string, unknown> | undefined)?.model;
        if (typeof overlayModel === "string") return overlayModel;
        return cheapProfileFromAgent.model;
      })();

  function setCheapEnabled(next: boolean) {
    if (isCreate) {
      set!({ cheapModelEnabled: next });
      return;
    }
    setOverlay((prev) => ({
      ...prev,
      modelProfiles: {
        cheap: {
          ...(prev.modelProfiles?.cheap ?? {}),
          enabled: next,
        },
      },
    }));
  }

  function setCheapModel(next: string) {
    if (isCreate) {
      set!({ cheapModel: next });
      return;
    }
    setOverlay((prev) => {
      const existing = prev.modelProfiles?.cheap ?? {};
      const nextAdapterConfig = {
        ...((existing.adapterConfig ?? {}) as Record<string, unknown>),
        model: next || undefined,
      };
      return {
        ...prev,
        modelProfiles: {
          cheap: {
            ...existing,
            adapterConfig: nextAdapterConfig,
          },
        },
      };
    });
  }

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
      {/* ---- Floating Save button (edit mode, when dirty) ---- */}
      {isDirty && !props.hideInlineSave && (
        <div className="sticky top-0 z-10 flex items-center justify-end px-4 py-2 bg-background/90 backdrop-blur-sm border-b border-primary/20">
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">Unsaved changes</span>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!isCreate && props.isSaving}
            >
              {!isCreate && props.isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>
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
          uploadImage={async (file, namespace) => {
            const asset = await uploadMarkdownImage.mutateAsync({ file, namespace });
            return asset.contentPath;
          }}
        />
      )}

      {/* ---- Execution ---- */}
      {environmentsEnabled ? (
        <div className={cn(!cards && (isCreate ? "border-t border-border" : "border-b border-border"))}>
          {cards
            ? <h3 className="text-sm font-medium mb-3">Execution</h3>
            : <div className="px-4 py-2 text-xs font-medium text-muted-foreground">Execution</div>
          }
          <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
            <Field
              label="Default environment"
              hint="Agent-level default execution target. Project and issue settings can still override this."
            >
              <Select
                value={currentDefaultEnvironmentId || "__company_default__"}
                onValueChange={(nextValue) => {
                  const environmentId = nextValue === "__company_default__" ? "" : nextValue;
                  if (isCreate) {
                    set!({ defaultEnvironmentId: environmentId });
                    return;
                  }
                  mark("identity", "defaultEnvironmentId", environmentId || null);
                }}
              >
                <SelectTrigger className={inputClass}>
                  <SelectValue placeholder="Company default (Local)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__company_default__">Company default (Local)</SelectItem>
                  {runnableEnvironments.map((environment) => (
                    <SelectItem key={environment.id} value={environment.id}>
                      {environment.name} · {environment.driver}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>
        </div>
      ) : null}

      {/* ---- Adapter ---- */}
      <div className={cn(!cards && (isCreate ? "border-t border-border" : "border-b border-border"))}>
        <div className={cn(cards ? "flex items-center justify-between mb-3" : "px-4 py-2 flex items-center justify-between gap-2")}>
          {cards
            ? <h3 className="text-sm font-medium">Adapter</h3>
            : <span className="text-xs font-medium text-muted-foreground">Adapter</span>
          }
          {showInlineAdapterTestEnvironmentButton && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-7 px-2.5 text-xs"
              onClick={triggerTestEnvironment}
              disabled={testEnvironmentDisabled}
            >
              {testEnvironment.isPending ? "Testing..." : "Test"}
            </Button>
          )}
        </div>
        <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
          {showAdapterTypeField && (
            <Field label="Adapter type" hint={help.adapterType}>
              <AdapterTypeDropdown
                value={adapterType}
                disabledTypes={disabledTypes}
                onChange={(t) => {
                  if (isCreate) {
                    // Reset all adapter-specific fields to defaults when switching adapter type
                    const { adapterType: _at, ...defaults } = defaultCreateValues;
                    const nextValues: CreateConfigValues = { ...defaults, adapterType: t };
                    if (t === "codex_local") {
                      nextValues.model = DEFAULT_CODEX_LOCAL_MODEL;
                      nextValues.dangerouslyBypassSandbox =
                        DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX;
                    } else if (t === "gemini_local") {
                      nextValues.model = DEFAULT_GEMINI_LOCAL_MODEL;
                    } else if (t === "cursor") {
                      nextValues.model = DEFAULT_CURSOR_LOCAL_MODEL;
                    } else if (t === "opencode_local") {
                      nextValues.model = DEFAULT_OPENCODE_LOCAL_MODEL;
                    }
                    set!(nextValues);
                  } else {
                    // Clear all adapter config and explicitly blank out model + effort/mode keys
                    // so the old adapter's values don't bleed through via eff()
                    setOverlay((prev) => ({
                      ...prev,
                      adapterType: t,
                      modelProfiles: { cheap: { cleared: true } },
                      adapterConfig: {
                        model:
                          t === "codex_local"
                            ? DEFAULT_CODEX_LOCAL_MODEL
                            : t === "gemini_local"
                              ? DEFAULT_GEMINI_LOCAL_MODEL
                            : t === "opencode_local"
                              ? DEFAULT_OPENCODE_LOCAL_MODEL
                            : t === "cursor"
                              ? DEFAULT_CURSOR_LOCAL_MODEL
                              : "",
                        effort: "",
                        modelReasoningEffort: "",
                        variant: "",
                        mode: "",
                        ...(t === "codex_local"
                          ? {
                              dangerouslyBypassApprovalsAndSandbox:
                                DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX,
                            }
                          : {}),
                      },
                    }));
                  }
                }}
              />
            </Field>
          )}

          {showInlineAdapterTestEnvironmentFeedback && testEnvironment.error && (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">
              {testEnvironment.error instanceof Error
                ? testEnvironment.error.message
                : "Environment test failed"}
            </div>
          )}

          {showInlineAdapterTestEnvironmentFeedback && testEnvironment.data && (
            <AdapterEnvironmentResult result={testEnvironment.data} />
          )}

          {/* Working directory */}
          {showLegacyWorkingDirectoryField && (
            <Field label="Working directory (deprecated)" hint={help.cwd}>
              <div className="flex items-center gap-2 rounded-md border border-border px-2.5 py-1.5">
                <FolderOpen className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <DraftInput
                  value={
                    isCreate
                      ? val!.cwd
                      : eff("adapterConfig", "cwd", String(config.cwd ?? ""))
                  }
                  onCommit={(v) =>
                    isCreate
                      ? set!({ cwd: v })
                      : mark("adapterConfig", "cwd", v || undefined)
                  }
                  immediate
                  className="w-full bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40"
                  placeholder="/path/to/project"
                />
                <ChoosePathButton />
              </div>
            </Field>
          )}

          {/* Adapter-specific fields are rendered inside Permissions & Configuration */}
        </div>

      </div>

      {/* ---- Permissions & Configuration ---- */}
      {isLocal && (
        <div className={cn(!cards && "border-b border-border")}>
          {cards
            ? <h3 className="text-sm font-medium mb-3">Permissions &amp; Configuration</h3>
            : <div className="px-4 py-2 text-xs font-medium text-muted-foreground">Permissions &amp; Configuration</div>
          }
          <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
              <Field label="Command" hint={help.localCommand}>
                <DraftInput
                  value={
                    isCreate
                      ? val!.command
                      : eff(
                          "adapterConfig",
                          adapterCommandField,
                          String(
                            (adapterType === "hermes_local"
                              ? config.hermesCommand ?? config.command
                              : config.command) ?? "",
                          ),
                        )
                  }
                  onCommit={(v) =>
                    isCreate
                      ? set!({ command: v })
                      : mark("adapterConfig", adapterCommandField, v || null)
                  }
                  immediate
                  className={inputClass}
                  placeholder={
                    ({
                      claude_local: "claude",
                      codex_local: "codex",
                      gemini_local: "gemini",
                      pi_local: "pi",
                      cursor: "agent",
                      opencode_local: "opencode",
                    } as Record<string, string>)[adapterType] ?? adapterType.replace(/_local$/, "")
                  }
                />
              </Field>

              {supportsModelProfiles && (
                <div className="text-micro uppercase tracking-wide text-muted-foreground">Primary model</div>
              )}
              <ModelDropdown
                models={models}
                value={currentModelId}
                onChange={(v) =>
                  isCreate
                    ? set!({ model: v })
                    : mark("adapterConfig", "model", v || undefined)
                }
                open={modelOpen}
                onOpenChange={setModelOpen}
                allowDefault={adapterType !== "opencode_local"}
                required={adapterType === "opencode_local"}
                groupByProvider={adapterType === "opencode_local"}
                creatable
                detectedModel={detectedModel}
                detectedModelCandidates={[]}
                onDetectModel={adapterType === "opencode_local"
                  ? undefined
                  : async () => {
                      const result = await refetchDetectedModel();
                      return result.data?.model ?? null;
                    }}
                onRefreshModels={
                  adapterType === "codex_local" || adapterType === "acpx_local"
                    ? handleRefreshModels
                    : undefined
                }
                refreshingModels={refreshingModels}
                detectModelLabel="Detect model"
                emptyDetectHint="No model detected. Select or enter one manually."
              />
              {(refreshModelsError || fetchedModelsError) && (
                <p className="text-xs text-destructive">
                  {refreshModelsError
                    ?? (fetchedModelsError instanceof Error
                      ? fetchedModelsError.message
                      : "Failed to load adapter models.")}
                </p>
              )}
              {adapterType === "opencode_local"
                && currentDefaultEnvironment
                && currentDefaultEnvironment.driver !== "local" && (
                <p className="text-xs text-muted-foreground">
                  Live OpenCode model discovery only runs for Local environments. Using the curated list and manual entry for {currentDefaultEnvironment.name}.
                </p>
              )}

              {supportsModelProfiles && (
                <CheapModelSection
                  enabled={currentCheapEnabled}
                  model={currentCheapModel}
                  models={models}
                  adapterType={adapterType}
                  adapterDefaultModel={adapterCheapDefaultModel}
                  onEnabledChange={setCheapEnabled}
                  onModelChange={setCheapModel}
                  open={cheapModelOpen}
                  onOpenChange={setCheapModelOpen}
                />
              )}

              {showThinkingEffort && (
                <>
                  <ThinkingEffortDropdown
                    value={currentThinkingEffort}
                    options={thinkingEffortOptions}
                    onChange={(v) =>
                      isCreate
                        ? set!({ thinkingEffort: v })
                        : mark("adapterConfig", thinkingEffortKey, v || undefined)
                    }
                    open={thinkingEffortOpen}
                    onOpenChange={setThinkingEffortOpen}
                  />
                  {adapterType === "codex_local" &&
                    codexSearchEnabled &&
                    currentThinkingEffort === "minimal" && (
                      <p className="text-xs text-amber-400">
                        Codex may reject `minimal` thinking when search is enabled.
                      </p>
                    )}
                </>
              )}
              {!isCreate && typeof config.bootstrapPromptTemplate === "string" && config.bootstrapPromptTemplate && (
                <>
                  <Field label="Bootstrap prompt (legacy)" hint={help.bootstrapPrompt}>
                    <MarkdownEditor
                      value={eff(
                        "adapterConfig",
                        "bootstrapPromptTemplate",
                        String(config.bootstrapPromptTemplate ?? ""),
                      )}
                      onChange={(v) =>
                        mark("adapterConfig", "bootstrapPromptTemplate", v || undefined)
                      }
                      placeholder="Optional initial setup prompt for the first run"
                      contentClassName="min-h-11 text-sm font-mono"
                      imageUploadHandler={async (file) => {
                        const namespace = `agents/${props.agent.id}/bootstrap-prompt`;
                        const asset = await uploadMarkdownImage.mutateAsync({ file, namespace });
                        return asset.contentPath;
                      }}
                    />
                  </Field>
                  <div className="rounded-md border border-amber-500/25 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                    Bootstrap prompt is legacy and will be removed in a future release. Consider moving this content into the agent&apos;s prompt template or instructions file instead.
                  </div>
                </>
              )}
              {adapterType === "claude_local" && (
                <ClaudeLocalAdvancedFields {...adapterFieldProps} />
              )}
              <uiAdapter.ConfigFields {...adapterFieldProps} />

              <Field label="Extra args (comma-separated)" hint={help.extraArgs}>
                <DraftInput
                  value={
                    isCreate
                      ? val!.extraArgs
                      : eff("adapterConfig", "extraArgs", formatArgList(config.extraArgs))
                  }
                  onCommit={(v) =>
                    isCreate
                      ? set!({ extraArgs: v })
                      : mark("adapterConfig", "extraArgs", v?.trim() ? parseCommaArgs(v) : null)
                  }
                  immediate
                  className={inputClass}
                  placeholder="e.g. --verbose, --foo=bar"
                />
              </Field>

              <Field label="Environment variables" hint={help.envVars}>
                <EnvVarEditor
                  value={
                    isCreate
                      ? ((val!.envBindings ?? EMPTY_ENV) as Record<string, EnvBinding>)
                      : ((eff("adapterConfig", "env", (config.env ?? EMPTY_ENV) as Record<string, EnvBinding>))
                      )
                  }
                  secrets={availableSecrets}
                  onCreateSecret={async (name, value) => {
                    const created = await createSecret.mutateAsync({ name, value });
                    return created;
                  }}
                  onChange={(env) =>
                    isCreate
                      ? set!({ envBindings: env ?? {}, envVars: "" })
                      : mark("adapterConfig", "env", env)
                  }
                />
              </Field>

              {/* Edit-only: timeout + grace period */}
              {!isCreate && (
                <>
                  <Field label="Timeout (sec)" hint={help.timeoutSec}>
                    <DraftNumberInput
                      value={eff(
                        "adapterConfig",
                        "timeoutSec",
                        Number(config.timeoutSec ?? 0),
                      )}
                      onCommit={(v) => mark("adapterConfig", "timeoutSec", v)}
                      immediate
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Interrupt grace period (sec)" hint={help.graceSec}>
                    <DraftNumberInput
                      value={eff(
                        "adapterConfig",
                        "graceSec",
                        Number(config.graceSec ?? 15),
                      )}
                      onCommit={(v) => mark("adapterConfig", "graceSec", v)}
                      immediate
                      className={inputClass}
                    />
                  </Field>
                </>
              )}
          </div>
        </div>
      )}

      {/* ---- Run Policy ---- */}
      {isCreate && showCreateRunPolicySection ? (
        <div className={cn(!cards && "border-b border-border")}>
          {cards
            ? <h3 className="text-sm font-medium flex items-center gap-2 mb-3"><Heart className="h-3 w-3" /> Run Policy</h3>
            : <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2"><Heart className="h-3 w-3" /> Run Policy</div>
          }
          <div className={cn(cards ? "border border-border rounded-lg p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
            <ToggleWithNumber
              label="Heartbeat on interval"
              hint={help.heartbeatInterval}
              checked={val!.heartbeatEnabled}
              onCheckedChange={(v) => set!({ heartbeatEnabled: v })}
              number={val!.intervalSec}
              onNumberChange={(v) => set!({ intervalSec: v })}
              numberLabel="sec"
              numberPrefix="Run heartbeat every"
              numberHint={help.intervalSec}
              showNumber={val!.heartbeatEnabled}
            />
          </div>
        </div>
      ) : !isCreate ? (
        <div className={cn(!cards && "border-b border-border")}>
          {cards
            ? <h3 className="text-sm font-medium flex items-center gap-2 mb-3"><Heart className="h-3 w-3" /> Run Policy</h3>
            : <div className="px-4 py-2 text-xs font-medium text-muted-foreground flex items-center gap-2"><Heart className="h-3 w-3" /> Run Policy</div>
          }
          <div className={cn(cards ? "border border-border rounded-lg overflow-hidden" : "")}>
            <div className={cn(cards ? "p-4 space-y-3" : "px-4 pb-3 space-y-3")}>
              <ToggleWithNumber
                label="Heartbeat on interval"
                hint={help.heartbeatInterval}
                checked={eff("heartbeat", "enabled", heartbeat.enabled === true)}
                onCheckedChange={(v) => mark("heartbeat", "enabled", v)}
                number={eff("heartbeat", "intervalSec", Number(heartbeat.intervalSec ?? 300))}
                onNumberChange={(v) => mark("heartbeat", "intervalSec", v)}
                numberLabel="sec"
                numberPrefix="Run heartbeat every"
                numberHint={help.intervalSec}
                showNumber={eff("heartbeat", "enabled", heartbeat.enabled === true)}
              />
            </div>
            <CollapsibleSection
              title="Advanced Run Policy"
              bordered={cards}
              open={runPolicyAdvancedOpen}
              onToggle={() => setRunPolicyAdvancedOpen(!runPolicyAdvancedOpen)}
            >
            <div className="space-y-3">
              <ToggleField
                label="Wake on demand"
                hint={help.wakeOnDemand}
                checked={eff(
                  "heartbeat",
                  "wakeOnDemand",
                  heartbeat.wakeOnDemand !== false,
                )}
                onChange={(v) => mark("heartbeat", "wakeOnDemand", v)}
              />
              <Field label="Cooldown (sec)" hint={help.cooldownSec}>
                <DraftNumberInput
                  value={eff(
                    "heartbeat",
                    "cooldownSec",
                    Number(heartbeat.cooldownSec ?? 10),
                  )}
                  onCommit={(v) => mark("heartbeat", "cooldownSec", v)}
                  immediate
                  className={inputClass}
                />
              </Field>
              <Field label="Max concurrent runs" hint={help.maxConcurrentRuns}>
                <DraftNumberInput
                  value={eff(
                    "heartbeat",
                    "maxConcurrentRuns",
                    Number(heartbeat.maxConcurrentRuns ?? AGENT_DEFAULT_MAX_CONCURRENT_RUNS),
                  )}
                  onCommit={(v) => mark("heartbeat", "maxConcurrentRuns", v)}
                  immediate
                  className={inputClass}
                />
              </Field>
              <div className="rounded-md border border-border/70 px-3 py-2">
                <ToggleField
                  label="Continue after max-turn stop"
                  hint={help.maxTurnContinuationEnabled}
                  checked={maxTurnContinuationEnabled}
                  onChange={(v) => updateMaxTurnContinuation({ enabled: v })}
                />
                {maxTurnContinuationEnabled ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    <Field label="Continuation attempts" hint={help.maxTurnContinuationMaxAttempts}>
                      <DraftNumberInput
                        value={maxTurnContinuationMaxAttempts}
                        onCommit={(v) =>
                          updateMaxTurnContinuation({
                            maxAttempts: clampInteger(v, 0, MAX_TURN_CONTINUATION_MAX_ATTEMPTS_CAP),
                          })}
                        immediate
                        className={inputClass}
                      />
                    </Field>
                    <Field label="Continuation delay (sec)" hint={help.maxTurnContinuationDelaySec}>
                      <DraftNumberInput
                        value={maxTurnContinuationDelaySec}
                        onCommit={(v) =>
                          updateMaxTurnContinuation({
                            delayMs: clampDelayMsFromSeconds(v),
                          })}
                        immediate
                        className={inputClass}
                      />
                    </Field>
                  </div>
                ) : null}
              </div>
            </div>
          </CollapsibleSection>
          </div>
        </div>
      ) : null}

    </div>
  );
}
