import { describe, expect, it } from "vitest";
import {
  buildOnboardingContextBlock,
  getOnboardingStageTaskTemplate,
  mergeDescriptionWithOnboardingContext,
} from "./onboarding-context";

describe("onboarding context", () => {
  it("builds a structured onboarding context block", () => {
    const block = buildOnboardingContextBlock({
      stage: "idea",
      setupItems: [
        { key: "company_name", label: "Company name", status: "done", note: "Acme" },
        { key: "legal_entity", label: "Legal entity", status: "skipped", note: "Already incorporated" },
      ],
    });

    expect(block).toContain("[theft-onboarding]");
    expect(block).toContain("stage=idea");
    expect(block).toContain("- company_name:done (Acme)");
    expect(block).toContain("- legal_entity:skipped (Already incorporated)");
  });

  it("appends onboarding context to existing description", () => {
    const merged = mergeDescriptionWithOnboardingContext({
      description: "We build workflow tools.",
      stage: "validating",
      setupItems: [
        { key: "offer", label: "Offer", status: "done" },
      ],
    });

    expect(merged).toContain("We build workflow tools.");
    expect(merged).toContain("stage=validating");
    expect(merged).toContain("- offer:done");
  });

  it("returns stage-specific task templates", () => {
    const template = getOnboardingStageTaskTemplate("scaling");
    expect(template.taskTitle).toContain("scale");
    expect(template.interviewPrompt).toContain("volume");
  });
});
