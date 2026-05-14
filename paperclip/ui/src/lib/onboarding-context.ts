export const ONBOARDING_STAGES = [
  "pre-idea",
  "idea",
  "validating",
  "building",
  "launched",
  "revenue",
  "scaling",
  "existing-business",
] as const;

export type OnboardingStage = (typeof ONBOARDING_STAGES)[number];

export type OnboardingSetupStatus = "todo" | "done" | "skipped";

export const ONBOARDING_STAGE_LABELS: Record<OnboardingStage, string> = {
  "pre-idea": "Pre-idea",
  idea: "Idea",
  validating: "Validating",
  building: "Building",
  launched: "Launched",
  revenue: "Revenue",
  scaling: "Scaling",
  "existing-business": "Existing business",
};

export interface OnboardingSetupItemInput {
  key: string;
  label: string;
  status: OnboardingSetupStatus;
  note?: string;
}

export interface OnboardingContextProfile {
  version: 1;
  source: "theft-onboarding";
  stage: OnboardingStage;
  initialBrief: string;
  operatorName: string;
  setupItems: OnboardingSetupItemInput[];
}

export interface OnboardingStageTaskTemplate {
  taskTitle: string;
  taskDescription: string;
  interviewPrompt: string;
  interviewPlaceholder: string;
}

const ONBOARDING_STAGE_TASK_TEMPLATES: Record<OnboardingStage, OnboardingStageTaskTemplate> = {
  "pre-idea": {
    taskTitle: "Identify the first customer segment and problem statement",
    taskDescription:
      "Define a concrete ICP, the top pain they will pay to solve, and one narrow offer to test this week.",
    interviewPrompt: "What problem are you most confident people will pay to solve first?",
    interviewPlaceholder: "Describe the pain and who feels it most often.",
  },
  idea: {
    taskTitle: "Validate demand with five target customers",
    taskDescription:
      "Turn the idea into a test plan: outreach list, discovery script, success criteria, and a yes/no decision gate.",
    interviewPrompt: "How will you land the first 5 paying customers?",
    interviewPlaceholder: "Channels, offer, timeline, and proof points.",
  },
  validating: {
    taskTitle: "Convert validation signals into a repeatable offer",
    taskDescription:
      "Document what is working, tighten pricing/positioning, and define the first repeatable acquisition loop.",
    interviewPrompt: "What signal currently proves this is worth scaling?",
    interviewPlaceholder: "Revenue, retention, referrals, conversion, or another hard signal.",
  },
  building: {
    taskTitle: "Prioritize build roadmap for the next two weeks",
    taskDescription:
      "Break current roadmap into highest-leverage tasks, assign owners, and identify blockers to shipping.",
    interviewPrompt: "What shipping risk is most likely to stall momentum?",
    interviewPlaceholder: "Resourcing, scope, technical debt, or process bottleneck.",
  },
  launched: {
    taskTitle: "Stabilize launch operations and customer feedback loop",
    taskDescription:
      "Capture launch issues, prioritize fixes, and stand up a weekly customer feedback and follow-up rhythm.",
    interviewPrompt: "What launch bottleneck is hurting growth right now?",
    interviewPlaceholder: "Support load, reliability, onboarding, pricing, or messaging.",
  },
  revenue: {
    taskTitle: "Improve revenue quality and expansion plan",
    taskDescription:
      "Map current revenue drivers, reduce churn risk, and define the next expansion or upsell path.",
    interviewPrompt: "Where is revenue leaking today?",
    interviewPlaceholder: "Churn, discounting, weak pipeline, delayed collections, etc.",
  },
  scaling: {
    taskTitle: "Codify execution system for scale",
    taskDescription:
      "Document team operating cadence, handoffs, and scorecards needed to scale without quality loss.",
    interviewPrompt: "What process breaks first as volume increases?",
    interviewPlaceholder: "Hiring, onboarding, delivery quality, or coordination gaps.",
  },
  "existing-business": {
    taskTitle: "Map current operations and immediate modernization plan",
    taskDescription:
      "Capture existing business model, systems, and constraints, then prioritize upgrades with fastest payback.",
    interviewPrompt: "What part of the existing business most needs an overhaul?",
    interviewPlaceholder: "Sales process, delivery, systems, team structure, or finance ops.",
  },
};

function isOnboardingStage(value: unknown): value is OnboardingStage {
  return typeof value === "string" && ONBOARDING_STAGES.includes(value as OnboardingStage);
}

function isSetupStatus(value: unknown): value is OnboardingSetupStatus {
  return value === "todo" || value === "done" || value === "skipped";
}

function normalizeSetupItems(items: OnboardingSetupItemInput[]): OnboardingSetupItemInput[] {
  return items.map((item) => ({
    key: item.key.trim(),
    label: item.label.trim(),
    status: item.status,
    ...(item.note?.trim() ? { note: item.note.trim() } : {}),
  })).filter((item) => item.key && item.label);
}

export function buildOnboardingContextBlock(input: {
  stage: OnboardingStage;
  initialBrief?: string;
  operatorName?: string;
  setupItems: OnboardingSetupItemInput[];
}) {
  const profile: OnboardingContextProfile = {
    version: 1,
    source: "theft-onboarding",
    stage: input.stage,
    initialBrief: input.initialBrief?.trim() ?? "",
    operatorName: input.operatorName?.trim() || "Operator",
    setupItems: normalizeSetupItems(input.setupItems),
  };

  return [
    "[theft-onboarding]",
    JSON.stringify(profile, null, 2),
    "[/theft-onboarding]",
  ].join("\n");
}

export function mergeDescriptionWithOnboardingContext(input: {
  description: string;
  stage: OnboardingStage;
  operatorName?: string;
  setupItems: OnboardingSetupItemInput[];
}) {
  const body = input.description.trim();
  const context = buildOnboardingContextBlock({
    stage: input.stage,
    initialBrief: body,
    operatorName: input.operatorName,
    setupItems: input.setupItems,
  });
  if (!body) return context;
  return `${body}\n\n${context}`;
}

export function parseOnboardingContextBlock(description: string): OnboardingContextProfile | null {
  const match = description.match(/\[theft-onboarding\]\s*([\s\S]*?)\s*\[\/theft-onboarding\]/);
  if (!match) return null;

  try {
    const parsed = JSON.parse(match[1] ?? "") as Partial<OnboardingContextProfile>;
    if (
      parsed.version !== 1 ||
      parsed.source !== "theft-onboarding" ||
      !isOnboardingStage(parsed.stage) ||
      !Array.isArray(parsed.setupItems)
    ) {
      return null;
    }

    const setupItems = parsed.setupItems
      .map((item) => {
        if (
          typeof item?.key !== "string" ||
          typeof item.label !== "string" ||
          !isSetupStatus(item.status)
        ) {
          return null;
        }

        return {
          key: item.key,
          label: item.label,
          status: item.status,
          ...(typeof item.note === "string" && item.note.trim()
            ? { note: item.note }
            : {}),
        };
      })
      .filter((item): item is OnboardingSetupItemInput => item !== null);

    return {
      version: 1,
      source: "theft-onboarding",
      stage: parsed.stage,
      initialBrief: typeof parsed.initialBrief === "string" ? parsed.initialBrief : "",
      operatorName: typeof parsed.operatorName === "string" && parsed.operatorName.trim()
        ? parsed.operatorName
        : "Operator",
      setupItems,
    };
  } catch {
    return null;
  }
}

export function getOnboardingStageGoalTemplate(stage: OnboardingStage, companyName: string) {
  const label = ONBOARDING_STAGE_LABELS[stage].toLowerCase();
  const name = companyName.trim() || "the company";
  return {
    title: `Move ${name} through the next ${label} milestone`,
    description:
      "Use onboarding context to turn the company stage into coordinated roadmap work across Operator and departments.",
  };
}

export function getOnboardingStageTaskTemplate(stage: OnboardingStage): OnboardingStageTaskTemplate {
  return ONBOARDING_STAGE_TASK_TEMPLATES[stage];
}
