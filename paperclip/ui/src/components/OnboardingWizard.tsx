import { useEffect, useState, useRef, useCallback, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "../lib/utils";
import {
  extractModelName,
  extractProviderIdWithFallback
} from "../lib/model-utils";
import { getUIAdapter } from "../adapters";
import { listUIAdapters } from "../adapters";
import { isVisualAdapterChoice } from "../adapters/metadata";
import { useDisabledAdaptersSync } from "../adapters/use-disabled-adapters";
import { useAdapterCapabilities } from "../adapters/use-adapter-capabilities";
import { getAdapterDisplay } from "../adapters/adapter-display-registry";
import { defaultCreateValues } from "./agent-config-defaults";
import { parseOnboardingGoalInput } from "../lib/onboarding-goal";
import {
  buildOnboardingIssuePayload,
  buildOnboardingProjectPayload,
  selectDefaultCompanyGoalId
} from "../lib/onboarding-launch";
import {
  ONBOARDING_STAGES,
  ONBOARDING_STAGE_LABELS,
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
  Building2,
  Bot,
  ListTodo,
  Rocket,
  ArrowLeft,
  ArrowRight,
  Check,
  Loader2,
  ChevronDown,
  X,
  Settings2,
  Users,
  Flag,
  Package,
  BarChart3,
  Database,
  Monitor,
  CircleDot,
  Plus,
  Target,
  LockKeyhole,
  Trophy,
  Code2,
  Palette,
  Megaphone,
  Headphones,
  Scale,
  DollarSign
} from "lucide-react";


type Step = 1 | 2 | 3 | 4 | 5;
type AdapterType = string;

const OPERATOR_TASK_CONTEXT = "You are the Operator. You set the direction for the company.";

const DEFAULT_TASK_DESCRIPTION = `${OPERATOR_TASK_CONTEXT}

- hire a founding engineer
- write a hiring plan
- break the roadmap into concrete tasks and start delegating work`;

function buildOperatorLaunchIssueDescription(input: {
  taskDescription: string;
  stage: OnboardingStage;
  prompt: string;
  answer: string;
}) {
  const taskDescription = input.taskDescription.trim();
  const withOperatorContext = taskDescription.includes(OPERATOR_TASK_CONTEXT)
    ? taskDescription
    : [OPERATOR_TASK_CONTEXT, taskDescription].filter(Boolean).join("\n\n");

  return `${withOperatorContext}${buildInterviewContextSection({
    stage: input.stage,
    prompt: input.prompt,
    answer: input.answer,
  })}`.trim();
}

function buildInterviewContextSection(input: {
  stage: OnboardingStage;
  prompt: string;
  answer: string;
}) {
  const answer = input.answer.trim();
  if (!answer) return "";
  return [
    "",
    "Onboarding context",
    `- stage: ${input.stage}`,
    `- ${input.prompt}`,
    `  ${answer}`,
  ].join("\n");
}

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

  const { data: adapterModels } = useQuery({
    // The wizard doesn't expose an environment selector, so models always
    // resolve against the local Paperclip host (environmentId = null).
    queryKey: createdCompanyId
      ? queryKeys.agents.adapterModels(createdCompanyId, adapterType, null)
      : ["agents", "none", "adapter-models", adapterType, null],
    queryFn: () => agentsApi.adapterModels(createdCompanyId!, adapterType, { environmentId: null }),
    enabled: Boolean(createdCompanyId) && effectiveOnboardingOpen && step === 2
  });
  const getCapabilities = useAdapterCapabilities();
  const adapterCaps = getCapabilities(adapterType);
  const isLocalAdapter = adapterCaps.supportsInstructionsBundle || adapterCaps.supportsSkills || adapterCaps.supportsLocalAgentJwt;

  // Build adapter grids dynamically from the UI registry + display metadata.
  // External/plugin adapters automatically appear with generic defaults.
  const { recommendedAdapters, moreAdapters } = useMemo(() => {
    const SYSTEM_ADAPTER_TYPES = new Set(["process", "http"]);
    const all = listUIAdapters()
      .filter((a) =>
        !SYSTEM_ADAPTER_TYPES.has(a.type) &&
        !disabledTypes.has(a.type) &&
        isVisualAdapterChoice(a.type)
      )
      .map((a) => ({ ...getAdapterDisplay(a.type), type: a.type }));

    return {
      recommendedAdapters: all.filter((a) => a.recommended),
      moreAdapters: all.filter((a) => !a.recommended),
    };
  }, [disabledTypes]);
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

  const selectedModel = (adapterModels ?? []).find((m) => m.id === model);
  const hasAnthropicApiKeyOverrideCheck =
    adapterEnvResult?.checks.some(
      (check) =>
        check.code === "claude_anthropic_api_key_overrides_subscription"
    ) ?? false;
  const shouldSuggestUnsetAnthropicApiKey =
    adapterType === "claude_local" &&
    adapterEnvResult?.status === "fail" &&
    hasAnthropicApiKeyOverrideCheck;
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
          entries: [...filteredModels].sort((a, b) => a.id.localeCompare(b.id))
        }
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
        entries: [...entries].sort((a, b) => a.id.localeCompare(b.id))
      }));
  }, [filteredModels, adapterType]);
  const stageTaskTemplate = useMemo(
    () => getOnboardingStageTaskTemplate(companyStage),
    [companyStage],
  );
  const planReviewTitle = companyName.trim() || "New company";
  const planObjective =
    companyGoal.trim() ||
    `Turn ${planReviewTitle} into a focused ${ONBOARDING_STAGE_LABELS[companyStage].toLowerCase()} company with a clear first task, department ownership, and Library output.`;
  const planSections = [
    {
      title: "Objective",
      icon: Target,
      body: planObjective,
    },
    {
      title: "Customer",
      icon: Users,
      bullets: [
        "Primary: founders, operators, or teams building with local-first AI.",
        "Secondary: technical teams that need control, speed, and durable artifacts.",
        "Keep the first audience narrow enough for the Operator to route real work.",
      ],
    },
    {
      title: "Constraints",
      icon: LockKeyhole,
      bullets: [
        "Local runtime remains the default control plane.",
        "Founder approval stays in the loop before important decisions.",
        `${DEPARTMENT_SEED_SPECS.length} departments activate with starter work and shared context.`,
      ],
    },
    {
      title: "Go-to-market",
      icon: Rocket,
      bullets: [
        stageTaskTemplate.taskTitle,
        "Route execution through departments, not a generic agent dashboard.",
        "Promote useful results into the Library as company memory.",
      ],
    },
    {
      title: "First outcomes",
      icon: Trophy,
      bullets: [
        taskTitle || stageTaskTemplate.taskTitle,
        "Operator, roadmap, and departments ready in Mission Control.",
        "First task queued with review, output, and next-move tracking.",
      ],
    },
  ];

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
              <button
                onClick={handleClose}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </button>
            </header>

            {step === 5 ? (
              <AssemblyPreviewScreen
                companyName={companyName}
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
            <div className="theft-onboarding-body grid min-h-0 flex-1 overflow-hidden">
              <OnboardingCanvasPreview
                companyName={companyName}
                companyStage={companyStage}
                step={step}
                agentName={agentName}
              />

              <section className="flex h-full min-h-0 flex-col overflow-hidden border-l border-border bg-card">
                <div className="theft-onboarding-panel-inner mx-auto flex h-full min-h-0 w-full flex-col">
                  <div className="mb-4 flex shrink-0 items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="theft-label">
                        {step === 4 ? "Plan Review" : "Onboarding"}
                      </p>
                      <h2 className="mt-1.5 truncate text-xl font-medium">
                        {companyName.trim() || "New company"}
                      </h2>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {step} / 5
                    </span>
                  </div>
              {/* Progress tabs */}
              <div className="mb-4 flex shrink-0 items-center gap-0 overflow-x-auto border-b border-border">
                {(
                  [
                    { step: 1 as Step, label: "Company", icon: Building2 },
                    { step: 2 as Step, label: "Assembly", icon: Users },
                    { step: 3 as Step, label: "Task", icon: ListTodo },
                    { step: 4 as Step, label: "Plan", icon: Rocket },
                    { step: 5 as Step, label: "Preview", icon: Monitor }
                  ] as const
                ).map(({ step: s, label, icon: Icon }) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStep(s)}
                    className={cn(
                      "flex shrink-0 items-center gap-1.5 px-3 py-2 text-xs font-medium border-b-2 -mb-px transition-colors cursor-pointer",
                      s === step
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground/70 hover:border-border"
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {label}
                  </button>
                ))}
              </div>

              {/* Step content */}
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
              {step === 1 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-muted/50 p-2">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Name your company</h3>
                      <p className="text-xs text-muted-foreground">
                        This is the operating company THEFT will assemble.
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 group">
                    <label
                      className={cn(
                        "text-xs mb-1 block transition-colors",
                        companyName.trim()
                          ? "text-foreground"
                          : "text-muted-foreground group-focus-within:text-foreground"
                      )}
                    >
                      Company name
                    </label>
                    <input
                      className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                      placeholder="Company name"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-2 block">
                      Company stage
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {ONBOARDING_STAGES.map((stage) => (
                        <button
                          key={stage}
                          type="button"
                          onClick={() => setCompanyStage(stage)}
                          className={cn(
                            "rounded-md border px-2 py-1.5 text-xs text-left",
                            companyStage === stage
                              ? "border-foreground bg-accent text-foreground"
                              : "border-border text-muted-foreground hover:text-foreground hover:bg-accent/40"
                          )}
                        >
                          {ONBOARDING_STAGE_LABELS[stage]}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="text-xs text-muted-foreground">Setup status</div>
                    <div className="grid gap-2">
                      <div className="rounded-md border border-border p-2">
                        <div className="text-xs mb-1">Company name</div>
                        <div className="flex gap-2 mb-2">
                          {(["done", "skipped"] as const).map((status) => (
                            <button
                              key={`name-${status}`}
                              type="button"
                              onClick={() => setSetupCompanyNameStatus(status)}
                              className={cn(
                                "rounded border px-2 py-1 text-xs",
                                setupCompanyNameStatus === status ? "border-foreground bg-accent" : "border-border"
                              )}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        <input
                          className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Name note (optional)"
                          value={setupCompanyNameNote}
                          onChange={(e) => setSetupCompanyNameNote(e.target.value)}
                        />
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <div className="text-xs mb-1">Legal / operating readiness</div>
                        <div className="flex gap-2 mb-2">
                          {(["todo", "done", "skipped"] as const).map((status) => (
                            <button
                              key={`legal-${status}`}
                              type="button"
                              onClick={() => setSetupLegalStatus(status)}
                              className={cn(
                                "rounded border px-2 py-1 text-xs",
                                setupLegalStatus === status ? "border-foreground bg-accent" : "border-border"
                              )}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        <input
                          className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Legal, compliance, or operating note (optional)"
                          value={setupLegalNote}
                          onChange={(e) => setSetupLegalNote(e.target.value)}
                        />
                      </div>
                      <div className="rounded-md border border-border p-2">
                        <div className="text-xs mb-1">Offer / product</div>
                        <div className="flex gap-2 mb-2">
                          {(["todo", "done", "skipped"] as const).map((status) => (
                            <button
                              key={`offer-${status}`}
                              type="button"
                              onClick={() => setSetupOfferStatus(status)}
                              className={cn(
                                "rounded border px-2 py-1 text-xs",
                                setupOfferStatus === status ? "border-foreground bg-accent" : "border-border"
                              )}
                            >
                              {status}
                            </button>
                          ))}
                        </div>
                        <input
                          className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
                          placeholder="Offer note (optional)"
                          value={setupOfferNote}
                          onChange={(e) => setSetupOfferNote(e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="group">
                    <label
                      className={cn(
                        "text-xs mb-1 block transition-colors",
                        companyGoal.trim()
                          ? "text-foreground"
                          : "text-muted-foreground group-focus-within:text-foreground"
                      )}
                    >
                      Mission / goal (optional)
                    </label>
                    <textarea
                      className="w-full rounded-md border border-border bg-transparent px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 resize-none min-h-16"
                      placeholder="What is this company trying to achieve?"
                      value={companyGoal}
                      onChange={(e) => setCompanyGoal(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-muted/50 p-2">
                      <Bot className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Assemble your company</h3>
                      <p className="text-xs text-muted-foreground">
                        THEFT will create an Operator, departments, starter work,
                        and Library-ready outputs.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Operator name
                    </label>
                    <input
                      className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                      placeholder="Operator"
                      value={agentName}
                      onChange={(e) => setAgentName(e.target.value)}
                      autoFocus
                    />
                  </div>

                  <div className="rounded-md border border-border bg-muted/15 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium">Company assembly preview</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                          Launch creates one company workspace with Operator-led
                          departments and starter tasks.
                        </p>
                      </div>
                      <span className="rounded border border-border px-2 py-1 text-micro text-muted-foreground">
                        {ONBOARDING_STAGE_LABELS[companyStage]}
                      </span>
                    </div>

                    <div className="mt-3 grid gap-2">
                      <div className="flex items-center gap-2 rounded border border-border bg-background/60 px-2.5 py-2">
                        <Bot className="h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-medium">{agentName || "Operator"}</p>
                          <p className="text-micro text-muted-foreground">
                            Routes work, keeps the founder oriented, and owns the first task.
                          </p>
                        </div>
                      </div>

                      <div>
                        <div className="mb-1.5 flex items-center justify-between">
                          <p className="text-xs font-medium">Departments</p>
                          <p className="text-micro text-muted-foreground">
                            {DEPARTMENT_SEED_SPECS.length} business lanes
                          </p>
                        </div>
                        <div className="grid grid-cols-2 gap-1.5">
                          {DEPARTMENT_SEED_SPECS.map((department) => (
                            <div
                              key={department.key}
                              className="rounded border border-border bg-background/60 px-2 py-1.5"
                            >
                              <p className="truncate text-micro font-medium">
                                {department.title}
                              </p>
                              <p className="truncate text-nano text-muted-foreground">
                                {department.taskTitleByStage[companyStage]}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md border border-border p-3">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between gap-3 text-left"
                      onClick={() => setShowAdvancedRuntime((value) => !value)}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Settings2 className="h-4 w-4 text-muted-foreground" />
                        <span className="min-w-0">
                          <span className="block text-xs font-medium">
                            Advanced runtime
                          </span>
                          <span className="block truncate text-micro text-muted-foreground">
                            Using {getUIAdapter(adapterType).label}
                            {model ? ` / ${model}` : ""}
                          </span>
                        </span>
                      </span>
                      <ChevronDown
                        className={cn(
                          "h-3.5 w-3.5 text-muted-foreground transition-transform",
                          showAdvancedRuntime ? "rotate-0" : "-rotate-90"
                        )}
                      />
                    </button>

                  {/* Adapter type radio cards */}
                  {showAdvancedRuntime && <div className="mt-4">
                    <label className="text-xs text-muted-foreground mb-2 block">
                      Adapter type
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {recommendedAdapters.map((opt) => (
                        <button
                          key={opt.type}
                          className={cn(
                            "flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors relative",
                            adapterType === opt.type
                              ? "border-foreground bg-accent"
                              : "border-border hover:bg-accent/50"
                          )}
                          onClick={() => {
                            const nextType = opt.type;
                            setAdapterType(nextType);
                            if (nextType === "codex_local") {
                              if (!model) {
                                setModel(DEFAULT_CODEX_LOCAL_MODEL);
                              }
                              return;
                            }
                            if (nextType === "opencode_local") {
                              setModel(DEFAULT_OPENCODE_LOCAL_MODEL);
                              return;
                            }
                            setModel("");
                          }}
                        >
                          {opt.recommended && (
                            <span className="absolute -top-1.5 right-1.5 bg-green-500 text-white text-badge font-semibold px-1.5 py-0.5 rounded-full leading-none">
                              Recommended
                            </span>
                          )}
                          <opt.icon className="h-4 w-4" />
                          <span className="font-medium">{opt.label}</span>
                          <span className="text-muted-foreground text-nano">
                            {opt.description}
                          </span>
                        </button>
                      ))}
                    </div>

                    <button
                      className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
                      onClick={() => setShowMoreAdapters((v) => !v)}
                    >
                      <ChevronDown
                        className={cn(
                          "h-3 w-3 transition-transform",
                          showMoreAdapters ? "rotate-0" : "-rotate-90"
                        )}
                      />
                      More Agent Adapter Types
                    </button>

                    {showMoreAdapters && (
                      <div className="grid grid-cols-2 gap-2 mt-2">
                        {moreAdapters.map((opt) => (
                           <button
                             key={opt.type}
                             disabled={!!opt.comingSoon}
                             className={cn(
                               "flex flex-col items-center gap-1.5 rounded-md border p-3 text-xs transition-colors relative",
                               opt.comingSoon
                                 ? "border-border opacity-40 cursor-not-allowed"
                                 : adapterType === opt.type
                                 ? "border-foreground bg-accent"
                                 : "border-border hover:bg-accent/50"
                             )}
                             onClick={() => {
                               if (opt.comingSoon) return;
                               const nextType = opt.type;
                              setAdapterType(nextType);
                              if (nextType === "gemini_local" && !model) {
                                setModel(DEFAULT_GEMINI_LOCAL_MODEL);
                                return;
                              }
                              if (nextType === "cursor" && !model) {
                                setModel(DEFAULT_CURSOR_LOCAL_MODEL);
                                return;
                              }
                              if (nextType === "opencode_local") {
                                setModel(DEFAULT_OPENCODE_LOCAL_MODEL);
                                return;
                              }
                              setModel("");
                            }}
                          >
                            <opt.icon className="h-4 w-4" />
                            <span className="font-medium">{opt.label}</span>
                            <span className="text-muted-foreground text-nano">
                              {opt.comingSoon
                                ? opt.disabledLabel ?? "Coming soon"
                                : opt.description}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>}

                  {/* Conditional adapter fields */}
                  {showAdvancedRuntime && isLocalAdapter && (
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground mb-1 block">
                          Model
                        </label>
                        <Popover
                          open={modelOpen}
                          onOpenChange={(next) => {
                            setModelOpen(next);
                            if (!next) setModelSearch("");
                          }}
                        >
                          <PopoverTrigger asChild>
                            <button className="inline-flex items-center gap-1.5 rounded-md border border-border px-2.5 py-1.5 text-sm hover:bg-accent/50 transition-colors w-full justify-between">
                              <span
                                className={cn(
                                  !model && "text-muted-foreground"
                                )}
                              >
                                {selectedModel
                                  ? selectedModel.label
                                  : model ||
                                    (adapterType === "opencode_local"
                                      ? "Select model (required)"
                                      : "Default")}
                              </span>
                              <ChevronDown className="h-3 w-3 text-muted-foreground" />
                            </button>
                          </PopoverTrigger>
                          <PopoverContent
                            className="w-[var(--radix-popover-trigger-width)] p-1"
                            align="start"
                          >
                            <input
                              className="w-full px-2 py-1.5 text-xs bg-transparent outline-none border-b border-border mb-1 placeholder:text-muted-foreground/50"
                              placeholder="Search models..."
                              value={modelSearch}
                              onChange={(e) => setModelSearch(e.target.value)}
                              autoFocus
                            />
                            {adapterType !== "opencode_local" && (
                              <button
                                className={cn(
                                  "flex items-center gap-2 w-full px-2 py-1.5 text-sm rounded hover:bg-accent/50",
                                  !model && "bg-accent"
                                )}
                                onClick={() => {
                                  setModel("");
                                  setModelOpen(false);
                                }}
                              >
                                Default
                              </button>
                            )}
                            <div className="max-h-60 overflow-y-auto">
                              {groupedModels.map((group) => (
                                <div
                                  key={group.provider}
                                  className="mb-1 last:mb-0"
                                >
                                  {adapterType === "opencode_local" && (
                                    <div className="px-2 py-1 text-nano uppercase tracking-wide text-muted-foreground">
                                      {group.provider} ({group.entries.length})
                                    </div>
                                  )}
                                  {group.entries.map((m) => (
                                    <button
                                      key={m.id}
                                      className={cn(
                                        "flex items-center w-full px-2 py-1.5 text-sm rounded hover:bg-accent/50",
                                        m.id === model && "bg-accent"
                                      )}
                                      onClick={() => {
                                        setModel(m.id);
                                        setModelOpen(false);
                                      }}
                                    >
                                      <span
                                        className="block w-full text-left truncate"
                                        title={m.id}
                                      >
                                        {adapterType === "opencode_local"
                                          ? extractModelName(m.id)
                                          : m.label}
                                      </span>
                                    </button>
                                  ))}
                                </div>
                              ))}
                            </div>
                            {filteredModels.length === 0 && (
                              <p className="px-2 py-1.5 text-xs text-muted-foreground">
                                No models discovered.
                              </p>
                            )}
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  )}

                  {showAdvancedRuntime && isLocalAdapter && (
                    <div className="space-y-2 rounded-md border border-border p-3">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-medium">
                            Adapter environment check
                          </p>
                          <p className="text-micro text-muted-foreground">
                            Runs a live probe that asks the adapter CLI to
                            respond with hello.
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-7 px-2.5 text-xs"
                          disabled={adapterEnvLoading}
                          onClick={() => void runAdapterEnvironmentTest()}
                        >
                          {adapterEnvLoading ? "Testing..." : "Test now"}
                        </Button>
                      </div>

                      {adapterEnvError && (
                        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-2.5 py-2 text-micro text-destructive">
                          {adapterEnvError}
                        </div>
                      )}

                      {adapterEnvResult &&
                      adapterEnvResult.status === "pass" ? (
                        <div className="flex items-center gap-2 rounded-md border border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10 px-3 py-2 text-xs text-green-700 dark:text-green-300 animate-in fade-in slide-in-from-bottom-1 duration-300">
                          <Check className="h-3.5 w-3.5 shrink-0" />
                          <span className="font-medium">Passed</span>
                        </div>
                      ) : adapterEnvResult ? (
                        <AdapterEnvironmentResult result={adapterEnvResult} />
                      ) : null}

                      {shouldSuggestUnsetAnthropicApiKey && (
                        <div className="rounded-md border border-amber-300/60 bg-amber-50/40 px-2.5 py-2 space-y-2">
                          <p className="text-micro text-amber-900/90 leading-relaxed">
                            Claude failed while{" "}
                            <span className="font-mono">ANTHROPIC_API_KEY</span>{" "}
                            is set. You can clear it in this Operator adapter config
                            and retry the probe.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-xs"
                            disabled={
                              adapterEnvLoading || unsetAnthropicLoading
                            }
                            onClick={() => void handleUnsetAnthropicApiKey()}
                          >
                            {unsetAnthropicLoading
                              ? "Retrying..."
                              : "Unset ANTHROPIC_API_KEY"}
                          </Button>
                        </div>
                      )}

                      {adapterEnvResult && adapterEnvResult.status === "fail" && (
                        <div className="rounded-md border border-border/70 bg-muted/20 px-2.5 py-2 text-micro space-y-1.5">
                          <p className="font-medium">Manual debug</p>
                          <p className="text-muted-foreground font-mono break-all">
                            {adapterType === "cursor"
                              ? `${effectiveAdapterCommand} -p --mode ask --output-format json \"Respond with hello.\"`
                              : adapterType === "codex_local"
                              ? `${effectiveAdapterCommand} exec --json -`
                              : adapterType === "gemini_local"
                                ? `${effectiveAdapterCommand} --output-format json "Respond with hello."`
                              : adapterType === "opencode_local"
                                ? `${effectiveAdapterCommand} run --format json "Respond with hello."`
                              : `${effectiveAdapterCommand} --print - --output-format stream-json --verbose`}
                          </p>
                          <p className="text-muted-foreground">
                            Prompt:{" "}
                            <span className="font-mono">Respond with hello.</span>
                          </p>
                          {adapterType === "cursor" ||
                          adapterType === "codex_local" ||
                          adapterType === "gemini_local" ||
                          adapterType === "opencode_local" ? (
                            <p className="text-muted-foreground">
                              If auth fails, set{" "}
                              <span className="font-mono">
                                {adapterType === "cursor"
                                  ? "CURSOR_API_KEY"
                                  : adapterType === "gemini_local"
                                    ? "GEMINI_API_KEY"
                                    : "OPENAI_API_KEY"}
                              </span>{" "}
                              in env or run{" "}
                              <span className="font-mono">
                                {adapterType === "cursor"
                                  ? "agent login"
                                  : adapterType === "codex_local"
                                    ? "codex login"
                                    : adapterType === "gemini_local"
                                      ? "gemini auth"
                                      : "opencode auth login"}
                              </span>
                              .
                            </p>
                          ) : (
                            <p className="text-muted-foreground">
                              If login is required, run{" "}
                              <span className="font-mono">claude login</span>{" "}
                              and retry.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {showAdvancedRuntime && (adapterType === "http" ||
                    adapterType === "openclaw_gateway") && (
                    <div>
                      <label className="text-xs text-muted-foreground mb-1 block">
                        {adapterType === "openclaw_gateway"
                          ? "Gateway URL"
                          : "Webhook URL"}
                      </label>
                      <input
                        className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm font-mono outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                        placeholder={
                          adapterType === "openclaw_gateway"
                            ? "ws://127.0.0.1:18789"
                            : "https://..."
                        }
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                      />
                    </div>
                  )}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-muted/50 p-2">
                      <ListTodo className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Set the first company task</h3>
                      <p className="text-xs text-muted-foreground">
                        Give the Operator a concrete business task to route,
                        review, and turn into Library output.
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Task title
                    </label>
                    <input
                      className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                      placeholder="e.g. Research competitor pricing"
                      value={taskTitle}
                      onChange={(e) => {
                        setTaskTemplateCustomized(true);
                        setTaskTitle(e.target.value);
                      }}
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Description (optional)
                    </label>
                    <textarea
                      ref={textareaRef}
                      className="w-full rounded-md border border-border bg-transparent px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 resize-none min-h-32 max-h-80 overflow-y-auto"
                      placeholder="Add more detail about what the agent should do..."
                      value={taskDescription}
                      onChange={(e) => {
                        setTaskTemplateCustomized(true);
                        setTaskDescription(e.target.value);
                      }}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1 block">
                      Stage interview: {stageTaskTemplate.interviewPrompt}
                    </label>
                    <textarea
                      className="w-full rounded-md border border-border bg-transparent px-4 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50 resize-none min-h-20"
                      placeholder={stageTaskTemplate.interviewPlaceholder}
                      value={stageInterviewAnswer}
                      onChange={(e) => setStageInterviewAnswer(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 mb-1">
                    <div className="bg-muted/50 p-2">
                      <ListTodo className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-medium">Review the business plan</h3>
                      <p className="text-xs text-muted-foreground">
                        Accept this plan to activate Operator, departments,
                        starter tasks, and Mission Control.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    {planSections.map((section) => (
                      <div key={section.title} className="border border-border p-3">
                        <div className="flex items-center gap-2">
                          <section.icon className="h-4 w-4 text-muted-foreground" />
                          <p className="theft-label">
                            {section.title}
                          </p>
                        </div>
                        {"body" in section ? (
                          <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            {section.body}
                          </p>
                        ) : (
                          <ul className="mt-3 space-y-1.5 text-sm leading-6 text-muted-foreground">
                            {section.bullets.map((bullet) => (
                              <li key={bullet} className="flex gap-2">
                                <span className="mt-2 size-1 rounded-full bg-foreground/40" />
                                <span>{bullet}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    ))}
                  </div>

                  <input
                    className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-ring placeholder:text-muted-foreground/50"
                    placeholder="I want to change the plan..."
                    value={stageInterviewAnswer}
                    onChange={(e) => setStageInterviewAnswer(e.target.value)}
                  />

                  <div className="grid grid-cols-2 gap-2 border border-border p-3 text-xs">
                    <div className="min-w-0">
                      <p className="text-muted-foreground">Operator</p>
                      <p className="mt-1 truncate font-medium">{agentName}</p>
                    </div>
                    <div className="min-w-0">
                      <p className="text-muted-foreground">Runtime</p>
                      <p className="mt-1 truncate font-medium">{getUIAdapter(adapterType).label}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="mt-3">
                  <p className="text-xs text-destructive">{error}</p>
                </div>
              )}
              </div>

              {/* Footer navigation */}
              <div className="-mx-4 mt-4 flex shrink-0 items-center justify-between border-t border-border bg-card px-4 pt-3 md:-mx-5 md:px-5">
                <div>
                  {step > 1 && step > (onboardingOptions.initialStep ?? 1) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep((step - 1) as Step)}
                      disabled={loading}
                    >
                      <ArrowLeft className="h-3.5 w-3.5 mr-1" />
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {step === 1 && (
                    <Button
                      size="sm"
                      disabled={!companyName.trim() || loading}
                      onClick={handleStep1Next}
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      )}
                      {loading ? "Creating..." : "Next"}
                    </Button>
                  )}
                  {step === 2 && (
                    <Button
                      size="sm"
                      disabled={
                        !agentName.trim() || loading || adapterEnvLoading
                      }
                      onClick={handleStep2Next}
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      )}
                      {loading ? "Creating..." : "Next"}
                    </Button>
                  )}
                  {step === 3 && (
                    <Button
                      size="sm"
                      disabled={!taskTitle.trim() || loading}
                      onClick={handleStep3Next}
                    >
                      {loading ? (
                        <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
                      ) : (
                        <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      )}
                      {loading ? "Creating..." : "Next"}
                    </Button>
                  )}
                  {step === 4 && (
                    <Button size="sm" disabled={loading} onClick={handlePlanReviewNext}>
                      <ArrowRight className="h-3.5 w-3.5 mr-1" />
                      Preview assembly
                    </Button>
                  )}
                </div>
              </div>
                </div>
              </section>
            </div>
            )}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

const DEPARTMENT_ASSEMBLY_META: Record<
  string,
  { icon: ReactNode; focus: string; outputs: string[]; capabilities: string[] }
> = {
  engineering: {
    icon: <Code2 className="size-4" />,
    focus: "Build robust, scalable products.",
    outputs: ["Architecture doc", "Tech stack decision", "Repo template"],
    capabilities: ["Software engineering", "System architecture", "Quality and testing"],
  },
  design: {
    icon: <Palette className="size-4" />,
    focus: "Create intuitive, memorable experiences.",
    outputs: ["Design system", "UI kit", "Brand guide"],
    capabilities: ["Product design", "Research synthesis", "Interaction design"],
  },
  marketing: {
    icon: <Megaphone className="size-4" />,
    focus: "Build awareness and demand.",
    outputs: ["Messaging guide", "Content calendar", "Campaign brief"],
    capabilities: ["Positioning", "Content engine", "Market research"],
  },
  sales: {
    icon: <BarChart3 className="size-4" />,
    focus: "Convert interest into revenue.",
    outputs: ["Sales playbook", "Pitch deck", "Objection guide"],
    capabilities: ["ICP definition", "Pipeline motion", "Revenue process"],
  },
  operations: {
    icon: <Settings2 className="size-4" />,
    focus: "Build systems that scale.",
    outputs: ["SOP library", "Tooling map", "Ops handbook"],
    capabilities: ["Process design", "Tooling stack", "Execution cadence"],
  },
  finance: {
    icon: <DollarSign className="size-4" />,
    focus: "Manage financial health and growth.",
    outputs: ["Budget model", "P&L template", "KPI dashboard spec"],
    capabilities: ["Unit economics", "Budgeting", "Reporting cadence"],
  },
  legal: {
    icon: <Scale className="size-4" />,
    focus: "Protect the company and reduce risk.",
    outputs: ["Term sheet", "NDA template", "IP assignment"],
    capabilities: ["Risk review", "Contract checklist", "Compliance triage"],
  },
  support: {
    icon: <Headphones className="size-4" />,
    focus: "Deliver value and retain customers.",
    outputs: ["FAQ template", "Ticket workflows", "CS playbook"],
    capabilities: ["Support process", "Knowledge base", "Customer feedback"],
  },
};

function AssemblyPreviewScreen({
  companyName,
  companyStage,
  objective,
  taskTitle,
  agentName,
  adapterLabel,
  loading,
  onBack,
  onLaunch,
}: {
  companyName: string;
  companyStage: OnboardingStage;
  objective: string;
  taskTitle: string;
  agentName: string;
  adapterLabel: string;
  loading: boolean;
  onBack: () => void;
  onLaunch: () => void;
}) {
  const selectedDepartment = DEPARTMENT_SEED_SPECS[0];
  const selectedMeta = DEPARTMENT_ASSEMBLY_META[selectedDepartment.key];

  return (
    <div className="theft-assembly-grid grid min-h-0 flex-1 overflow-y-auto">
      <aside className="hidden border-r border-border bg-card px-6 py-6 xl:block">
        <p className="theft-label">
          THEFT will assemble
        </p>
        <div className="mt-5 space-y-5 text-sm">
          <AssemblyStatGroup
            title="Structure"
            rows={["1 objective", "3 strategic tracks", `${DEPARTMENT_SEED_SPECS.length} departments`]}
          />
          <AssemblyStatGroup
            title="Work"
            rows={[`${DEPARTMENT_SEED_SPECS.length + 1} starter tasks`, "40+ subtasks"]}
          />
          <AssemblyStatGroup
            title="Library outputs"
            rows={["32+ artifacts", "120+ templates"]}
          />
          <AssemblyStatGroup
            title="Governance"
            rows={["Decision rights", "Approval flows", "Risk controls"]}
          />
        </div>
        <div className="mt-10 border border-border p-4 text-xs leading-5 text-muted-foreground">
          <Check className="mb-2 size-4 text-foreground" />
          All aligned to your answers and plan.
        </div>
      </aside>

      <main className="min-w-0 px-5 py-6 md:px-8">
        <div className="mb-7 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="theft-label">
              Company assembly
            </p>
            <h2 className="mt-2 text-2xl font-medium">Company Assembly Preview</h2>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Review the operating structure, starter work, and outputs THEFT will create.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="size-1.5 rounded-full bg-signal" />
            Local runtime ready
          </div>
        </div>

        <div className="mx-auto max-w-5xl">
          <div className="theft-elevation-soft mx-auto max-w-xl border border-border bg-card p-6 text-center">
            <p className="theft-label">
              Mission objective
            </p>
            <p className="mt-2 text-lg leading-7">{objective}</p>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Product Excellence", "Ship valuable, usable, delightful products."],
              ["Growth & Distribution", "Acquire, activate, and retain customers."],
              ["Operational Leverage", "Systematize and scale profitably."],
            ].map(([title, body]) => (
              <div key={title} className="border border-border bg-card p-4">
                <p className="text-sm font-medium">{title}</p>
                <p className="mt-1 text-xs leading-5 text-muted-foreground">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {DEPARTMENT_SEED_SPECS.map((department) => {
              const meta = DEPARTMENT_ASSEMBLY_META[department.key];
              const selected = department.key === selectedDepartment.key;
              return (
                <div
                  key={department.key}
                  className={cn(
                    "theft-elevation-soft border bg-card p-4",
                    selected ? "border-foreground" : "border-border"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center bg-secondary text-muted-foreground">
                      {meta.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{department.title}</p>
                      <p className="text-xs text-muted-foreground">{meta.focus}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <p className="theft-label">
                      Starter tasks
                    </p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                      <li>{department.taskTitleByStage[companyStage]}</li>
                      <li>{department.taskDescriptionByStage[companyStage]}</li>
                    </ul>
                  </div>
                  <div className="mt-4">
                    <p className="theft-label">
                      Library outputs
                    </p>
                    <ul className="mt-2 space-y-1 text-xs leading-5 text-muted-foreground">
                      {meta.outputs.slice(0, 3).map((output) => (
                        <li key={output}>{output}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 border border-border bg-card p-4">
            <p className="theft-label">
              Tech tree initial path
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-5">
              {["Company foundation", "Core systems & tooling", "First product MVP", "Market launch & feedback", "Scale systems & team"].map((node, index) => (
                <div key={node} className="border border-border p-4 text-center">
                  <p className="text-sm font-medium">{node}</p>
                  <p className="theft-label-compact mt-2">
                    {index === 0 ? "active" : index === 1 ? "next" : "available"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <aside className="border-t border-border bg-card p-5 xl:border-l xl:border-t-0">
        <p className="theft-label">
          Inspector
        </p>
        <div className="mt-5 space-y-4">
          <div className="border border-border p-4">
            <p className="text-xs text-muted-foreground">Selected</p>
            <div className="mt-2 flex items-center gap-2">
              <span className="flex size-9 items-center justify-center bg-secondary text-muted-foreground">
                {selectedMeta.icon}
              </span>
              <p className="font-medium">{selectedDepartment.title}</p>
            </div>
          </div>
          <InspectorBlock title="Mission" rows={[selectedMeta.focus]} />
          <InspectorBlock
            title="Starter task first"
            rows={[taskTitle || selectedDepartment.taskTitleByStage[companyStage]]}
          />
          <InspectorBlock title="Default capabilities" rows={selectedMeta.capabilities} />
          <InspectorBlock title="Expected outputs" rows={selectedMeta.outputs} />
          <InspectorBlock title="Runtime" rows={[agentName || "Operator", adapterLabel]} />
        </div>

        <div className="mt-5 grid gap-2">
          <Button className="h-12" disabled={loading} onClick={onLaunch}>
            {loading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            {loading ? "Launching..." : "Launch company"}
          </Button>
          <Button variant="outline" className="h-10" disabled={loading} onClick={onBack}>
            Edit plan
          </Button>
        </div>
      </aside>
    </div>
  );
}

function AssemblyStatGroup({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border-b border-border pb-4 last:border-b-0">
      <p className="theft-label">{title}</p>
      <div className="mt-2 space-y-1 text-muted-foreground">
        {rows.map((row) => (
          <p key={row}>{row}</p>
        ))}
      </div>
    </div>
  );
}

function InspectorBlock({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border border-border p-4">
      <p className="theft-label">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-5 text-muted-foreground">
        {rows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );
}

function OnboardingCanvasPreview({
  companyName,
  companyStage,
  step,
  agentName,
}: {
  companyName: string;
  companyStage: OnboardingStage;
  step: Step;
  agentName: string;
}) {
  const displayName = companyName.trim() || "New company";
  const reviewMode = step === 4;
  const mapNodes = reviewMode
    ? [
        { className: "theft-map-node-top", icon: <Code2 className="size-4" />, label: "Engineering" },
        { className: "theft-map-node-left-upper", icon: <Palette className="size-4" />, label: "Design" },
        { className: "theft-map-node-right-upper", icon: <Megaphone className="size-4" />, label: "Marketing" },
        { className: "theft-map-node-right-middle", icon: <BarChart3 className="size-4" />, label: "Sales" },
        { className: "theft-map-node-right-lower", icon: <DollarSign className="size-4" />, label: "Finance" },
        { className: "theft-map-node-bottom", icon: <Scale className="size-4" />, label: "Legal" },
        { className: "theft-map-node-left-lower", icon: <Headphones className="size-4" />, label: "Support" },
        { className: "theft-map-node-left-middle", icon: <Settings2 className="size-4" />, label: "Operations" },
      ]
    : [
        { className: "theft-map-node-top", icon: <Flag className="size-4" />, label: "Brand" },
        { className: "theft-map-node-default-left", icon: <Package className="size-4" />, label: "Product" },
        { className: "theft-map-node-default-right", icon: <BarChart3 className="size-4" />, label: "Revenue" },
        { className: "theft-map-node-default-left-lower", icon: <Settings2 className="size-4" />, label: "Operations" },
        { className: "theft-map-node-default-right-lower", icon: <Database className="size-4" />, label: "Library" },
      ];

  return (
    <section className="hidden min-h-0 overflow-hidden bg-background lg:block">
      <div className="theft-onboarding-canvas-frame relative h-full">
        <div className="theft-grid-bg absolute inset-0" />

        <div className="relative z-10 flex items-center justify-between">
          <div className="theft-elevation-soft border border-border bg-card px-4 py-2">
            <div className="theft-label flex items-center gap-2">
              <span className="size-1.5 rounded-full bg-signal" />
              {reviewMode ? "Workspace assembling" : "Canvas initializing"}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {reviewMode ? "Department graph preparing..." : "Company map forming..."}
            </p>
          </div>
          <div className="flex border border-border bg-card">
            {[Monitor, CircleDot, Plus].map((Icon, index) => (
              <button
                key={index}
                type="button"
                className="flex size-9 items-center justify-center border-l border-border first:border-l-0 text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <Icon className="size-4" />
              </button>
            ))}
          </div>
        </div>

        <div className="theft-onboarding-map absolute top-1/2 -translate-y-1/2">
          <div className="theft-map-ring-outer absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-border/80" />
          <div className="theft-map-ring-middle absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border" />
          <div className="theft-map-ring-inner absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-border/80" />

          <div className="theft-elevation-soft theft-map-center-card absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 border border-foreground bg-card p-4 text-center">
            <div className="mx-auto flex size-10 items-center justify-center rounded-md bg-secondary">
              <Building2 className="size-5" />
            </div>
            <h3 className="mt-3 truncate text-base font-medium">{displayName}</h3>
            <p className="theft-label-compact mt-1">
              {ONBOARDING_STAGE_LABELS[companyStage]}
            </p>
          </div>

          {mapNodes.map((node) => (
            <MapNode key={node.label} {...node} active={reviewMode} />
          ))}
        </div>

        <div className="theft-elevation-soft absolute bottom-4 left-4 z-10 w-56 border border-border bg-card px-4 py-2">
          <RuntimeLine label="Local runtime ready" />
          <RuntimeLine label="Embedded Postgres" />
          <RuntimeLine label="No cloud required" />
        </div>

        <div className="theft-elevation-soft absolute bottom-4 right-4 z-10 border border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{agentName || "Operator"}</span>
          <span className="mx-2 text-border">/</span>
          {reviewMode ? "Plan review ready" : `Step ${step} active`}
        </div>
      </div>
    </section>
  );
}

function MapNode({
  className,
  icon,
  label,
  active = false,
}: {
  className: string;
  icon: ReactNode;
  label: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        "theft-elevation-soft theft-map-node absolute z-10 flex flex-col items-center justify-center border bg-card text-center",
        active ? "border-foreground/35" : "border-border",
        className
      )}
    >
      <div className="mb-1.5 text-muted-foreground">{icon}</div>
      <div className="text-xs font-medium">{label}</div>
      {active ? <span className="mt-2 size-1.5 rounded-full bg-signal" /> : null}
    </div>
  );
}

function RuntimeLine({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 py-1 text-xs text-muted-foreground">
      <span className="size-1.5 rounded-full bg-signal" />
      {label}
    </div>
  );
}

function AdapterEnvironmentResult({
  result
}: {
  result: AdapterEnvironmentTestResult;
}) {
  const statusLabel =
    result.status === "pass"
      ? "Passed"
      : result.status === "warn"
      ? "Warnings"
      : "Failed";
  const statusClass =
    result.status === "pass"
      ? "text-green-700 dark:text-green-300 border-green-300 dark:border-green-500/40 bg-green-50 dark:bg-green-500/10"
      : result.status === "warn"
      ? "text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-500/10"
      : "text-red-700 dark:text-red-300 border-red-300 dark:border-red-500/40 bg-red-50 dark:bg-red-500/10";

  return (
    <div className={`rounded-md border px-2.5 py-2 text-micro ${statusClass}`}>
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">{statusLabel}</span>
        <span className="opacity-80">
          {new Date(result.testedAt).toLocaleTimeString()}
        </span>
      </div>
      <div className="mt-1.5 space-y-1">
        {result.checks.map((check, idx) => (
          <div
            key={`${check.code}-${idx}`}
            className="leading-relaxed break-words"
          >
            <span className="font-medium uppercase tracking-wide opacity-80">
              {check.level}
            </span>
            <span className="mx-1 opacity-60">·</span>
            <span>{check.message}</span>
            {check.detail && (
              <span className="block opacity-75 break-all">
                ({check.detail})
              </span>
            )}
            {check.hint && (
              <span className="block opacity-90 break-words">
                Hint: {check.hint}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
