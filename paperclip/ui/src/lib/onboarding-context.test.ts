import { describe, expect, it } from "vitest";
import {
  buildOnboardingContextBlock,
  getOnboardingStageGoalTemplate,
  getOnboardingStageTaskTemplate,
  mergeDescriptionWithOnboardingContext,
  parseOnboardingContextBlock,
} from "./onboarding-context";

describe("onboarding context", () => {
  it("builds a parseable structured onboarding context block", () => {
    const block = buildOnboardingContextBlock({
      stage: "idea",
      initialBrief: "We build workflow tools.",
      operatorName: "Operator",
      setupItems: [
        { key: "company_name", label: "Company name", status: "done", note: "Acme" },
        { key: "legal_entity", label: "Legal entity", status: "skipped", note: "Already incorporated" },
      ],
    });

    expect(block).toContain("[theft-onboarding]");
    expect(block).toContain("[/theft-onboarding]");

    expect(parseOnboardingContextBlock(block)).toEqual({
      version: 1,
      source: "theft-onboarding",
      stage: "idea",
      initialBrief: "We build workflow tools.",
      operatorName: "Operator",
      setupItems: [
        { key: "company_name", label: "Company name", status: "done", note: "Acme" },
        { key: "legal_entity", label: "Legal entity", status: "skipped", note: "Already incorporated" },
      ],
    });
  });

  it("appends onboarding context to existing description", () => {
    const merged = mergeDescriptionWithOnboardingContext({
      description: "We build workflow tools.",
      stage: "validating",
      operatorName: "Operator",
      setupItems: [
        { key: "offer", label: "Offer", status: "done" },
      ],
    });

    expect(merged).toContain("We build workflow tools.");
    expect(parseOnboardingContextBlock(merged)).toMatchObject({
      stage: "validating",
      initialBrief: "We build workflow tools.",
      setupItems: [{ key: "offer", label: "Offer", status: "done" }],
    });
  });

  it("returns stage-specific task templates", () => {
    const template = getOnboardingStageTaskTemplate("scaling");
    expect(template.taskTitle).toContain("scale");
    expect(template.interviewPrompt).toContain("volume");
  });

  it("returns a default company roadmap goal when no brief was entered", () => {
    expect(getOnboardingStageGoalTemplate("existing-business", "Acme")).toEqual({
      title: "Move Acme through the next existing business milestone",
      description:
        "Use onboarding context to turn the company stage into coordinated roadmap work across Operator and departments.",
    });
  });
});
