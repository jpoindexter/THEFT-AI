import type { Issue } from "@paperclipai/shared";
import type { CompanyBottleneck, CompanyProfileSummary } from "@/lib/theft-canvas";
import { issuePath } from "@/lib/missionControl";

export type MissionControlNextStep = {
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  actionHref: string | null;
  secondaryLabel: string;
};

export function buildMissionControlNextStep(input: {
  bottleneck: CompanyBottleneck;
  setupItems: CompanyProfileSummary["setupItems"];
  nextTasks: Issue[];
  outcomeCount: number;
  objective: string;
}): MissionControlNextStep {
  if (input.bottleneck.tone === "setup") {
    const setupItem = input.setupItems.find((item) => item.status === "todo");
    return {
      eyebrow: "Setup gap",
      title: setupItem ? `Clarify ${setupItem.label}` : "Finish company context",
      description:
        "Operator can still route work, but this missing context will make the first department output weaker.",
      actionLabel: "Ask Operator to clarify",
      actionHref: null,
      secondaryLabel: "This becomes company memory before departments rely on it.",
    };
  }

  if (input.bottleneck.tone === "review") {
    return {
      eyebrow: "Founder decision",
      title: "Review the waiting decision",
      description:
        "A decision or question is waiting before work can keep moving. Clear it first, then departments can continue.",
      actionLabel: "Open review queue",
      actionHref: "/issues",
      secondaryLabel: "Review, approve, or answer the blocker.",
    };
  }

  if (input.bottleneck.issue) {
    return {
      eyebrow: input.bottleneck.tone === "attention" ? "Blocked work" : "Next work",
      title: input.bottleneck.detail,
      description:
        input.bottleneck.tone === "attention"
          ? "This task is blocking the company flow. Open it to unblock, revise, or ask Operator what changed."
          : "This is the next active task. Department work should become a Library artifact you can review.",
      actionLabel: "Open task",
      actionHref: issuePath(input.bottleneck.issue),
      secondaryLabel: "Task output should land in Library before approval.",
    };
  }

  if (input.outcomeCount === 0) {
    return {
      eyebrow: "First output",
      title: "Create the first Library artifact",
      description:
        "The company has an objective, but no durable output yet. Ask Operator to route one concrete task to a department.",
      actionLabel: "Ask Operator",
      actionHref: null,
      secondaryLabel: "Library is where finished work becomes reusable company memory.",
    };
  }

  return {
    eyebrow: "Ready",
    title: input.objective,
    description:
      "Mission Control is clear. Review recent Library output or ask Operator to create the next task.",
    actionLabel: "Open Library",
    actionHref: "/library",
    secondaryLabel: "Operator remains available for explain, route, review, and task creation.",
  };
}
