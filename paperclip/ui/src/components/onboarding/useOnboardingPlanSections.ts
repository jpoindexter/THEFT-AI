import { useMemo } from "react";
import { LockKeyhole, Rocket, Target, Trophy, Users } from "lucide-react";

import {
  ONBOARDING_STAGE_LABELS,
  type OnboardingStage,
} from "../../lib/onboarding-context";
import { DEPARTMENT_SEED_SPECS } from "../../lib/onboarding-seed";

interface StageTaskTemplate {
  taskTitle: string;
}

interface UseOnboardingPlanSectionsArgs {
  companyName: string;
  companyGoal: string;
  companyStage: OnboardingStage;
  taskTitle: string;
  stageTaskTemplate: StageTaskTemplate;
}

export function useOnboardingPlanSections({
  companyName,
  companyGoal,
  companyStage,
  taskTitle,
  stageTaskTemplate,
}: UseOnboardingPlanSectionsArgs) {
  return useMemo(() => {
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

    return { planObjective, planSections };
  }, [companyGoal, companyName, companyStage, stageTaskTemplate, taskTitle]);
}
