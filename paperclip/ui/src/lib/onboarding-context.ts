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
