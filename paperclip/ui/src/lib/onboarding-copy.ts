import type { OnboardingStage } from "./onboarding-context";

export const OPERATOR_TASK_CONTEXT =
  "You are the Operator. You set the direction for the company.";

export const DEFAULT_TASK_DESCRIPTION = `${OPERATOR_TASK_CONTEXT}

- hire a founding engineer
- write a hiring plan
- break the roadmap into concrete tasks and start delegating work`;

export function buildOperatorLaunchIssueDescription(input: {
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
