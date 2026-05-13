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

export interface OnboardingSetupItemInput {
  key: string;
  label: string;
  status: OnboardingSetupStatus;
  note?: string;
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

function sanitizeInline(value: string) {
  return value.replace(/\r?\n/g, " ").trim();
}

export function buildOnboardingContextBlock(input: {
  stage: OnboardingStage;
  setupItems: OnboardingSetupItemInput[];
}) {
  const lines = [
    "[theft-onboarding]",
    `stage=${input.stage}`,
    "setup=",
  ];
  for (const item of input.setupItems) {
    const note = sanitizeInline(item.note ?? "");
    const suffix = note ? ` (${note})` : "";
    lines.push(`- ${item.key}:${item.status}${suffix}`);
  }
  return lines.join("\n");
}

export function mergeDescriptionWithOnboardingContext(input: {
  description: string;
  stage: OnboardingStage;
  setupItems: OnboardingSetupItemInput[];
}) {
  const body = input.description.trim();
  const context = buildOnboardingContextBlock({
    stage: input.stage,
    setupItems: input.setupItems,
  });
  if (!body) return context;
  return `${body}\n\n${context}`;
}

export function getOnboardingStageTaskTemplate(stage: OnboardingStage): OnboardingStageTaskTemplate {
  return ONBOARDING_STAGE_TASK_TEMPLATES[stage];
}
