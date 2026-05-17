import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import { useLocation, useNavigate, useParams } from "@/lib/router";
import { useDialog } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { companiesApi } from "../api/companies";
import { goalsApi } from "../api/goals";
import { agentsApi } from "../api/agents";
import { approvalsApi } from "../api/approvals";
import { issuesApi } from "../api/issues";
import { projectsApi } from "../api/projects";
import { queryKeys } from "../lib/queryKeys";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TheftSplitCanvasFormTemplate } from "@/components/theft/templates/TheftSplitCanvasFormTemplate";
import { getUIAdapter } from "../adapters";
import { useDisabledAdaptersSync } from "../adapters/use-disabled-adapters";
import { defaultCreateValues } from "./agent-config-defaults";
import { parseOnboardingGoalInput } from "../lib/onboarding-goal";
import {
  buildOnboardingIssuePayload,
  buildOnboardingProjectPayload,
  selectDefaultCompanyGoalId
} from "../lib/onboarding-launch";
import {
  type OnboardingStage,
  getOnboardingStageGoalTemplate,
  getOnboardingStageTaskTemplate,
  mergeDescriptionWithOnboardingContext,
} from "../lib/onboarding-context";
import { DEPARTMENT_SEED_SPECS } from "../lib/onboarding-seed";
import { buildNewAgentRuntimeConfig } from "../lib/new-agent-runtime-config";
import {
  DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX,
  DEFAULT_CODEX_LOCAL_MODEL
} from "@paperclipai/adapter-codex-local";
import { DEFAULT_CURSOR_LOCAL_MODEL } from "@paperclipai/adapter-cursor-local";
import { DEFAULT_GEMINI_LOCAL_MODEL } from "@paperclipai/adapter-gemini-local";
import { DEFAULT_OPENCODE_LOCAL_MODEL, isValidOpenCodeModelId } from "@paperclipai/adapter-opencode-local";
import { resolveRouteOnboardingOptions } from "../lib/onboarding-route";
import {
  DEFAULT_TASK_DESCRIPTION,
  buildOperatorLaunchIssueDescription,
} from "../lib/onboarding-copy";
import { AssemblyPreviewScreen } from "./onboarding/AssemblyPreviewScreen";
import { AssemblyStepForm } from "./onboarding/AssemblyStepForm";
import { CompanyStepForm } from "./onboarding/CompanyStepForm";
import { OnboardingCanvasPreview } from "./onboarding/OnboardingCanvasPreview";
import {
  OnboardingFormFooter,
  OnboardingFormHeader,
} from "./onboarding/OnboardingChrome";
import { PlanReviewForm } from "./onboarding/PlanReviewForm";
import { TaskStepForm } from "./onboarding/TaskStepForm";
import type { OnboardingStep as Step } from "./onboarding/types";
import { useOnboardingAdapterSelection } from "./onboarding/useOnboardingAdapterSelection";
import { useOnboardingPlanSections } from "./onboarding/useOnboardingPlanSections";
import {
  X,
  CircleDot,
} from "lucide-react";


type AdapterType = string;

export function OnboardingWizard() {
  const { onboardingOpen, onboardingOptions, closeOnboarding } = useDialog();
  const { companies, setSelectedCompanyId, loading: companiesLoading } = useCompany();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const { companyPrefix } = useParams<{ companyPrefix?: string }>();
  const [routeDismissed, setRouteDismissed] = useState(false);

  // Sync disabled adapter types from server so adapter grid filters them out
  const disabledTypes = useDisabledAdaptersSync();

  const routeOnboardingOptions =
    companyPrefix && companiesLoading
      ? null
      : resolveRouteOnboardingOptions({
          pathname: location.pathname,
          companyPrefix,
          companies,
        });
  const effectiveOnboardingOpen =
    onboardingOpen || (routeOnboardingOptions !== null && !routeDismissed);
  const effectiveOnboardingOptions = onboardingOpen
    ? onboardingOptions
    : routeOnboardingOptions ?? {};

  const initialStep = effectiveOnboardingOptions.initialStep ?? 1;
  const existingCompanyId = effectiveOnboardingOptions.companyId;

  const [step, setStep] = useState<Step>(initialStep);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState("");

  // Step 1
  const [companyName, setCompanyName] = useState("");
  const [companyGoal, setCompanyGoal] = useState("");
  const [companyStage, setCompanyStage] = useState<OnboardingStage>("idea");
  const [setupCompanyNameStatus, setSetupCompanyNameStatus] = useState<"done" | "skipped">("done");
  const [setupCompanyNameNote, setSetupCompanyNameNote] = useState("");
  const [setupLegalStatus, setSetupLegalStatus] = useState<"todo" | "done" | "skipped">("todo");
  const [setupLegalNote, setSetupLegalNote] = useState("");
  const [setupOfferStatus, setSetupOfferStatus] = useState<"todo" | "done" | "skipped">("todo");
  const [setupOfferNote, setSetupOfferNote] = useState("");

  // Step 2
  const [agentName, setAgentName] = useState("Operator");
  const [adapterType, setAdapterType] = useState<AdapterType>("codex_local");
  const [model, setModel] = useState(DEFAULT_CODEX_LOCAL_MODEL);
  const [command, setCommand] = useState("");
  const [args, setArgs] = useState("");
  const [url, setUrl] = useState("");
  const [adapterEnvResult, setAdapterEnvResult] =
    useState<AdapterEnvironmentTestResult | null>(null);
  const [adapterEnvError, setAdapterEnvError] = useState<string | null>(null);
  const [adapterEnvLoading, setAdapterEnvLoading] = useState(false);
  const [forceUnsetAnthropicApiKey, setForceUnsetAnthropicApiKey] =
    useState(false);
  const [unsetAnthropicLoading, setUnsetAnthropicLoading] = useState(false);
  const [showMoreAdapters, setShowMoreAdapters] = useState(false);
  const [showAdvancedRuntime, setShowAdvancedRuntime] = useState(false);

  // Step 3
  const [taskTitle, setTaskTitle] = useState(
    "Hire your first engineer and create a hiring plan"
  );
  const [taskDescription, setTaskDescription] = useState(
    DEFAULT_TASK_DESCRIPTION
  );
  const [taskTemplateCustomized, setTaskTemplateCustomized] = useState(false);
  const [stageInterviewAnswer, setStageInterviewAnswer] = useState("");

  // Auto-grow textarea for task description
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const autoResizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }, []);

  // Created entity IDs — pre-populate from existing company when skipping step 1
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(
    existingCompanyId ?? null
  );
  const [createdCompanyPrefix, setCreatedCompanyPrefix] = useState<
    string | null
  >(null);
  const [createdCompanyGoalId, setCreatedCompanyGoalId] = useState<string | null>(
    null
  );
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [createdIssueRef, setCreatedIssueRef] = useState<string | null>(null);
  const [seededDepartmentAgentIds, setSeededDepartmentAgentIds] = useState<Record<string, string>>({});
  const [seededDepartmentIssueKeys, setSeededDepartmentIssueKeys] = useState<Record<string, true>>({});

  useEffect(() => {
    setRouteDismissed(false);
  }, [location.pathname]);

  // Sync step and company when onboarding opens with options.
  // Keep this independent from company-list refreshes so Step 1 completion
  // doesn't get reset after creating a company.
  useEffect(() => {
    if (!effectiveOnboardingOpen) return;
    const cId = effectiveOnboardingOptions.companyId ?? null;
    setStep(effectiveOnboardingOptions.initialStep ?? 1);
    setCreatedCompanyId(cId);
    setCreatedCompanyPrefix(null);
    setCreatedCompanyGoalId(null);
    setCreatedProjectId(null);
    setCreatedAgentId(null);
    setCreatedIssueRef(null);
    setSeededDepartmentAgentIds({});
    setSeededDepartmentIssueKeys({});
  }, [
    effectiveOnboardingOpen,
    effectiveOnboardingOptions.companyId,
    effectiveOnboardingOptions.initialStep
  ]);

  // Backfill issue prefix for an existing company once companies are loaded.
  useEffect(() => {
    if (!effectiveOnboardingOpen || !createdCompanyId || createdCompanyPrefix) return;
    const company = companies.find((c) => c.id === createdCompanyId);
    if (company) setCreatedCompanyPrefix(company.issuePrefix);
  }, [effectiveOnboardingOpen, createdCompanyId, createdCompanyPrefix, companies]);

  // Resize textarea when step 3 is shown or description changes
  useEffect(() => {
    if (step === 3) autoResizeTextarea();
  }, [step, taskDescription, autoResizeTextarea]);

  const {
    selectedModel,
    filteredModels,
    groupedModels,
    recommendedAdapters,
    moreAdapters,
    isLocalAdapter,
  } = useOnboardingAdapterSelection({
    createdCompanyId,
    effectiveOnboardingOpen,
    step,
    adapterType,
    model,
    disabledTypes,
    modelSearch,
  });
  const COMMAND_PLACEHOLDERS: Record<string, string> = {
    claude_local: "claude",
    codex_local: "codex",
    gemini_local: "gemini",
    pi_local: "pi",
    cursor: "agent",
    opencode_local: "opencode",
  };
  const effectiveAdapterCommand =
    command.trim() ||
    (COMMAND_PLACEHOLDERS[adapterType] ?? adapterType.replace(/_local$/, ""));

  useEffect(() => {
    if (step !== 2) return;
    setAdapterEnvResult(null);
    setAdapterEnvError(null);
  }, [step, adapterType, model, command, args, url]);

  const hasAnthropicApiKeyOverrideCheck =
    adapterEnvResult?.checks.some(
      (check) =>
        check.code === "claude_anthropic_api_key_overrides_subscription"
    ) ?? false;
  const shouldSuggestUnsetAnthropicApiKey =
    adapterType === "claude_local" &&
    adapterEnvResult?.status === "fail" &&
    hasAnthropicApiKeyOverrideCheck;
  const stageTaskTemplate = useMemo(
    () => getOnboardingStageTaskTemplate(companyStage),
    [companyStage],
  );
  const { planObjective, planSections } = useOnboardingPlanSections({
    companyName,
    companyGoal,
    companyStage,
    taskTitle,
    stageTaskTemplate,
  });

  useEffect(() => {
    if (taskTemplateCustomized) return;
    setTaskTitle(stageTaskTemplate.taskTitle);
    setTaskDescription(stageTaskTemplate.taskDescription);
  }, [stageTaskTemplate, taskTemplateCustomized]);

  function reset() {
    setStep(1);
    setLoading(false);
    setError(null);
    setCompanyName("");
    setCompanyGoal("");
    setCompanyStage("idea");
    setSetupCompanyNameStatus("done");
    setSetupCompanyNameNote("");
    setSetupLegalStatus("todo");
    setSetupLegalNote("");
    setSetupOfferStatus("todo");
    setSetupOfferNote("");
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
    setTaskTitle("Hire your first engineer and create a hiring plan");
    setTaskDescription(DEFAULT_TASK_DESCRIPTION);
    setTaskTemplateCustomized(false);
    setStageInterviewAnswer("");
    setCreatedCompanyId(null);
    setCreatedCompanyPrefix(null);
    setCreatedCompanyGoalId(null);
    setCreatedAgentId(null);
    setCreatedProjectId(null);
    setCreatedIssueRef(null);
    setSeededDepartmentAgentIds({});
    setSeededDepartmentIssueKeys({});
  }

  function handleClose() {
    reset();
    closeOnboarding();
  }

  function buildAdapterConfig(): Record<string, unknown> {
    const adapter = getUIAdapter(adapterType);
    const config = adapter.buildAdapterConfig({
      ...defaultCreateValues,
      adapterType,
      model:
        adapterType === "codex_local"
          ? model || DEFAULT_CODEX_LOCAL_MODEL
          : adapterType === "gemini_local"
            ? model || DEFAULT_GEMINI_LOCAL_MODEL
          : adapterType === "cursor"
            ? model || DEFAULT_CURSOR_LOCAL_MODEL
            : adapterType === "opencode_local"
              ? model || DEFAULT_OPENCODE_LOCAL_MODEL
              : model,
      command,
      args,
      url,
      dangerouslySkipPermissions:
        adapterType === "claude_local" || adapterType === "opencode_local",
      dangerouslyBypassSandbox:
        adapterType === "codex_local"
          ? DEFAULT_CODEX_LOCAL_BYPASS_APPROVALS_AND_SANDBOX
          : defaultCreateValues.dangerouslyBypassSandbox
    });
    if (adapterType === "claude_local" && forceUnsetAnthropicApiKey) {
      const env =
        typeof config.env === "object" &&
        config.env !== null &&
        !Array.isArray(config.env)
          ? { ...(config.env as Record<string, unknown>) }
          : {};
      env.ANTHROPIC_API_KEY = { type: "plain", value: "" };
      config.env = env;
    }
    return config;
  }

  async function runAdapterEnvironmentTest(
    adapterConfigOverride?: Record<string, unknown>
  ): Promise<AdapterEnvironmentTestResult | null> {
    if (!createdCompanyId) {
      setAdapterEnvError(
        "Create or select a company before testing adapter environment."
      );
      return null;
    }
    setAdapterEnvLoading(true);
    setAdapterEnvError(null);
    try {
      const result = await agentsApi.testEnvironment(
        createdCompanyId,
        adapterType,
        {
          adapterConfig: adapterConfigOverride ?? buildAdapterConfig()
        }
      );
      setAdapterEnvResult(result);
      return result;
    } catch (err) {
      setAdapterEnvError(
        err instanceof Error ? err.message : "Adapter environment test failed"
      );
      return null;
    } finally {
      setAdapterEnvLoading(false);
    }
  }

  async function handleStep1Next() {
    setLoading(true);
    setError(null);
    try {
      const trimmedName = companyName.trim();
      const companyDescription = mergeDescriptionWithOnboardingContext({
        description: companyGoal.trim(),
        stage: companyStage,
        operatorName: agentName,
        setupItems: [
          {
            key: "company_name",
            label: "Company name",
            status: setupCompanyNameStatus,
            note: setupCompanyNameNote || trimmedName,
          },
          {
            key: "legal_entity",
            label: "Legal / operating readiness",
            status: setupLegalStatus,
            note: setupLegalNote,
          },
          {
            key: "offer",
            label: "Offer",
            status: setupOfferStatus,
            note: setupOfferNote,
          },
        ],
      });

      const company = await companiesApi.create({
        name: trimmedName,
        description: companyDescription,
      });
      setCreatedCompanyId(company.id);
      setCreatedCompanyPrefix(company.issuePrefix);
      setSelectedCompanyId(company.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });

      if (companyGoal.trim()) {
        const parsedGoal = parseOnboardingGoalInput(companyGoal);
        const goal = await goalsApi.create(company.id, {
          title: parsedGoal.title,
          ...(parsedGoal.description
            ? { description: parsedGoal.description }
            : {}),
          level: "company",
          status: "active"
        });
        setCreatedCompanyGoalId(goal.id);
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.list(company.id)
        });
      } else {
        const goalTemplate = getOnboardingStageGoalTemplate(companyStage, trimmedName);
        const goal = await goalsApi.create(company.id, {
          title: goalTemplate.title,
          description: goalTemplate.description,
          level: "company",
          status: "active"
        });
        setCreatedCompanyGoalId(goal.id);
        queryClient.invalidateQueries({
          queryKey: queryKeys.goals.list(company.id)
        });
      }

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      setLoading(false);
    }
  }

  async function handleStep2Next() {
    if (!createdCompanyId) return;
    setLoading(true);
    setError(null);
    try {
      if (adapterType === "opencode_local") {
        if (!isValidOpenCodeModelId(model)) {
          setError(
            "OpenCode requires an explicit model in provider/model format."
          );
          return;
        }
      }

      if (isLocalAdapter) {
        const result = adapterEnvResult ?? (await runAdapterEnvironmentTest());
        if (!result) return;
      }

      const hire = await agentsApi.hire(createdCompanyId, {
        name: agentName.trim(),
        role: "ceo",
        adapterType,
        adapterConfig: buildAdapterConfig(),
        runtimeConfig: buildNewAgentRuntimeConfig()
      });
      if (hire.approval) {
        await approvalsApi.approve(
          hire.approval.id,
          "Approved during onboarding first-agent setup."
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.approvals.list(createdCompanyId)
        });
      }
      const agent = hire.agent;
      setCreatedAgentId(agent.id);
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.list(createdCompanyId)
      });
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      setLoading(false);
    }
  }

  async function handleUnsetAnthropicApiKey() {
    if (!createdCompanyId || unsetAnthropicLoading) return;
    setUnsetAnthropicLoading(true);
    setError(null);
    setAdapterEnvError(null);
    setForceUnsetAnthropicApiKey(true);

    const configWithUnset = (() => {
      const config = buildAdapterConfig();
      const env =
        typeof config.env === "object" &&
        config.env !== null &&
        !Array.isArray(config.env)
          ? { ...(config.env as Record<string, unknown>) }
          : {};
      env.ANTHROPIC_API_KEY = { type: "plain", value: "" };
      config.env = env;
      return config;
    })();

    try {
      if (createdAgentId) {
        await agentsApi.update(
          createdAgentId,
          { adapterConfig: configWithUnset },
          createdCompanyId
        );
        queryClient.invalidateQueries({
          queryKey: queryKeys.agents.list(createdCompanyId)
        });
      }

      const result = await runAdapterEnvironmentTest(configWithUnset);
      if (result?.status === "fail") {
        setError(
          "Retried with ANTHROPIC_API_KEY unset in adapter config, but the environment test is still failing."
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Failed to unset ANTHROPIC_API_KEY and retry."
      );
    } finally {
      setUnsetAnthropicLoading(false);
    }
  }

  async function handleStep3Next() {
    if (!createdCompanyId || !createdAgentId) return;
    setError(null);
    setStep(4);
  }

  function handlePlanReviewNext() {
    setError(null);
    setStep(5);
  }

  async function handleLaunch() {
    if (!createdCompanyId || !createdAgentId) return;
    setLoading(true);
    setError(null);
    try {
      let goalId = createdCompanyGoalId;
      if (!goalId) {
        const goals = await goalsApi.list(createdCompanyId);
        goalId = selectDefaultCompanyGoalId(goals);
        setCreatedCompanyGoalId(goalId);
      }

      let projectId = createdProjectId;
      if (!projectId) {
        const project = await projectsApi.create(
          createdCompanyId,
          buildOnboardingProjectPayload(goalId)
        );
        projectId = project.id;
        setCreatedProjectId(projectId);
        queryClient.invalidateQueries({
          queryKey: queryKeys.projects.list(createdCompanyId)
        });
      }

      let issueRef = createdIssueRef;
      if (!issueRef) {
        const issue = await issuesApi.create(
          createdCompanyId,
          buildOnboardingIssuePayload({
            title: taskTitle,
            description: buildOperatorLaunchIssueDescription({
              taskDescription,
              stage: companyStage,
              prompt: stageTaskTemplate.interviewPrompt,
              answer: stageInterviewAnswer,
            }),
            assigneeAgentId: createdAgentId,
            projectId,
            goalId
          })
        );
        issueRef = issue.identifier ?? issue.id;
        setCreatedIssueRef(issueRef);
        queryClient.invalidateQueries({
          queryKey: queryKeys.issues.list(createdCompanyId)
        });
      }

      const nextSeededDepartmentAgentIds = { ...seededDepartmentAgentIds };
      for (const spec of DEPARTMENT_SEED_SPECS) {
        if (nextSeededDepartmentAgentIds[spec.key]) continue;
        const hire = await agentsApi.hire(createdCompanyId, {
          name: spec.agentName,
          role: spec.role,
          title: spec.title,
          reportsTo: createdAgentId,
          adapterType,
          adapterConfig: buildAdapterConfig(),
          desiredSkills: spec.desiredSkills,
          runtimeConfig: buildNewAgentRuntimeConfig(),
        });
        if (hire.approval) {
          await approvalsApi.approve(
            hire.approval.id,
            "Approved during onboarding department seed."
          );
        }
        nextSeededDepartmentAgentIds[spec.key] = hire.agent.id;
      }
      setSeededDepartmentAgentIds(nextSeededDepartmentAgentIds);
      queryClient.invalidateQueries({
        queryKey: queryKeys.agents.list(createdCompanyId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.approvals.list(createdCompanyId),
      });

      const nextSeededDepartmentIssueKeys = { ...seededDepartmentIssueKeys };
      for (const spec of DEPARTMENT_SEED_SPECS) {
        if (nextSeededDepartmentIssueKeys[spec.key]) continue;
        const assigneeAgentId = nextSeededDepartmentAgentIds[spec.key];
        if (!assigneeAgentId) continue;
        await issuesApi.create(
          createdCompanyId,
          buildOnboardingIssuePayload({
            title: spec.taskTitleByStage[companyStage],
            description: `${spec.taskDescriptionByStage[companyStage]}\n\nDepartment seed: ${spec.title}`,
            assigneeAgentId,
            projectId,
            goalId,
          })
        );
        nextSeededDepartmentIssueKeys[spec.key] = true;
      }
      setSeededDepartmentIssueKeys(nextSeededDepartmentIssueKeys);
      queryClient.invalidateQueries({
        queryKey: queryKeys.issues.list(createdCompanyId),
      });

      setSelectedCompanyId(createdCompanyId);
      reset();
      closeOnboarding();
      navigate(
        createdCompanyPrefix
          ? `/${createdCompanyPrefix}/dashboard`
          : "/"
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (step === 1 && companyName.trim()) handleStep1Next();
      else if (step === 2 && agentName.trim()) handleStep2Next();
      else if (step === 3 && taskTitle.trim()) handleStep3Next();
      else if (step === 4) handlePlanReviewNext();
      else if (step === 5) handleLaunch();
    }
  }

  if (!effectiveOnboardingOpen) return null;

  return (
    <Dialog
      open={effectiveOnboardingOpen}
      onOpenChange={(open) => {
        if (!open) {
          setRouteDismissed(true);
          handleClose();
        }
      }}
    >
      <DialogPortal>
        {/* Plain div instead of DialogOverlay — Radix's overlay wraps in
            RemoveScroll which blocks wheel events on our custom (non-DialogContent)
            scroll container. A plain div preserves the background without scroll-locking. */}
        <div className="fixed inset-0 z-50 bg-background" />
        <div
          className="theft-onboarding-shell fixed inset-0 z-50 grid overflow-hidden bg-background text-foreground"
          onKeyDown={handleKeyDown}
        >
          <aside className="hidden min-h-0 flex-col items-center justify-between border-r border-border bg-card py-5 md:flex">
            <div className="flex flex-col items-center gap-5">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                T
              </div>
              <div className="h-px w-8 bg-border" />
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
                <CircleDot className="size-5" />
              </div>
            </div>
            <div className="mb-1 flex size-2 rounded-full bg-signal" aria-hidden />
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col">
            <header className="theft-onboarding-header flex shrink-0 items-center justify-between border-b border-border">
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="truncate text-muted-foreground">Mission Control</span>
                <span className="text-muted-foreground">/</span>
                <span className="truncate text-foreground">
                  {step === 5 ? "Company Assembly" : step === 4 ? "Plan Review" : "Onboarding"}
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleClose}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </header>

            {step === 5 ? (
              <AssemblyPreviewScreen
                companyStage={companyStage}
                objective={planObjective}
                taskTitle={taskTitle}
                agentName={agentName}
                adapterLabel={getUIAdapter(adapterType).label}
                loading={loading}
                onBack={() => setStep(4)}
                onLaunch={handleLaunch}
              />
            ) : (
              <TheftSplitCanvasFormTemplate
                className="min-h-0 flex-1"
                header={false}
                canvas={
                  <OnboardingCanvasPreview
                    companyName={companyName}
                    companyStage={companyStage}
                    step={step}
                    agentName={agentName}
                  />
                }
                formHeader={
                  <OnboardingFormHeader
                    step={step}
                    companyName={companyName}
                    onStepChange={setStep}
                  />
                }
                form={
                  <div className="theft-onboarding-panel-inner mx-auto w-full min-w-0">
              {step === 1 && (
                <CompanyStepForm
                  companyName={companyName}
                  setCompanyName={setCompanyName}
                  companyGoal={companyGoal}
                  setCompanyGoal={setCompanyGoal}
                  companyStage={companyStage}
                  setCompanyStage={setCompanyStage}
                  setupCompanyNameStatus={setupCompanyNameStatus}
                  setSetupCompanyNameStatus={setSetupCompanyNameStatus}
                  setupCompanyNameNote={setupCompanyNameNote}
                  setSetupCompanyNameNote={setSetupCompanyNameNote}
                  setupLegalStatus={setupLegalStatus}
                  setSetupLegalStatus={setSetupLegalStatus}
                  setupLegalNote={setupLegalNote}
                  setSetupLegalNote={setSetupLegalNote}
                  setupOfferStatus={setupOfferStatus}
                  setSetupOfferStatus={setSetupOfferStatus}
                  setupOfferNote={setupOfferNote}
                  setSetupOfferNote={setSetupOfferNote}
                />
              )}

              {step === 2 && (
                <AssemblyStepForm
                  agentName={agentName}
                  setAgentName={setAgentName}
                  companyStage={companyStage}
                  adapterType={adapterType}
                  setAdapterType={setAdapterType}
                  adapterLabel={getUIAdapter(adapterType).label}
                  model={model}
                  setModel={setModel}
                  url={url}
                  setUrl={setUrl}
                  modelOpen={modelOpen}
                  setModelOpen={setModelOpen}
                  modelSearch={modelSearch}
                  setModelSearch={setModelSearch}
                  selectedModel={selectedModel}
                  groupedModels={groupedModels}
                  filteredModels={filteredModels}
                  recommendedAdapters={recommendedAdapters}
                  moreAdapters={moreAdapters}
                  showAdvancedRuntime={showAdvancedRuntime}
                  setShowAdvancedRuntime={setShowAdvancedRuntime}
                  showMoreAdapters={showMoreAdapters}
                  setShowMoreAdapters={setShowMoreAdapters}
                  isLocalAdapter={isLocalAdapter}
                  adapterEnvLoading={adapterEnvLoading}
                  adapterEnvError={adapterEnvError}
                  adapterEnvResult={adapterEnvResult}
                  shouldSuggestUnsetAnthropicApiKey={shouldSuggestUnsetAnthropicApiKey}
                  unsetAnthropicLoading={unsetAnthropicLoading}
                  effectiveAdapterCommand={effectiveAdapterCommand}
                  onTestEnvironment={() => void runAdapterEnvironmentTest()}
                  onUnsetAnthropicApiKey={() => void handleUnsetAnthropicApiKey()}
                />
              )}

              {step === 3 && (
                <TaskStepForm
                  taskTitle={taskTitle}
                  setTaskTitle={setTaskTitle}
                  taskDescription={taskDescription}
                  setTaskDescription={setTaskDescription}
                  setTaskTemplateCustomized={setTaskTemplateCustomized}
                  stageInterviewPrompt={stageTaskTemplate.interviewPrompt}
                  stageInterviewPlaceholder={stageTaskTemplate.interviewPlaceholder}
                  stageInterviewAnswer={stageInterviewAnswer}
                  setStageInterviewAnswer={setStageInterviewAnswer}
                  textareaRef={textareaRef}
                />
              )}

              {step === 4 && (
                <PlanReviewForm
                  planSections={planSections}
                  stageInterviewAnswer={stageInterviewAnswer}
                  setStageInterviewAnswer={setStageInterviewAnswer}
                  agentName={agentName}
                  adapterLabel={getUIAdapter(adapterType).label}
                />
              )}

              {/* Error */}
              {error && (
                <div className="mt-3">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
                  </div>
                }
                formFooter={
                  <OnboardingFormFooter
                    step={step}
                    minStep={(onboardingOptions.initialStep ?? 1) as Step}
                    loading={loading}
                    adapterEnvLoading={adapterEnvLoading}
                    canContinue={
                      step === 1
                        ? Boolean(companyName.trim())
                        : step === 2
                          ? Boolean(agentName.trim())
                          : step === 3
                            ? Boolean(taskTitle.trim())
                            : true
                    }
                    onBack={() => setStep((step - 1) as Step)}
                    onStep1Next={handleStep1Next}
                    onStep2Next={handleStep2Next}
                    onStep3Next={handleStep3Next}
                    onPlanReviewNext={handlePlanReviewNext}
                  />
                }
              />
            )}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}
