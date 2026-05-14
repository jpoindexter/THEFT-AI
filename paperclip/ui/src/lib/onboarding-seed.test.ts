import { describe, expect, it } from "vitest";
import { ONBOARDING_STAGES } from "./onboarding-context";
import { DEPARTMENT_SEED_SPECS } from "./onboarding-seed";

describe("onboarding department seed specs", () => {
  it("seeds the required THEFT departments", () => {
    expect(DEPARTMENT_SEED_SPECS.map((spec) => spec.title)).toEqual([
      "Engineering",
      "Design",
      "Marketing",
      "Sales",
      "Operations",
      "Finance",
      "Legal",
      "Support",
    ]);
  });

  it("has a stage-specific starter issue and THEFT skills for every department", () => {
    for (const spec of DEPARTMENT_SEED_SPECS) {
      expect(spec.agentName).toMatch(/Lead$/);
      expect(spec.desiredSkills.length).toBeGreaterThan(0);
      expect(spec.desiredSkills.every((skill) => skill.startsWith("theft/skills/"))).toBe(true);

      for (const stage of ONBOARDING_STAGES) {
        expect(spec.taskTitleByStage[stage]).toBeTruthy();
        expect(spec.taskDescriptionByStage[stage]).toBeTruthy();
      }
    }
  });
});
