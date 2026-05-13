import { describe, expect, it } from "vitest";
import { resolveTheftDefaultDesiredSkillsForRole } from "./theft-default-skills.js";

describe("resolveTheftDefaultDesiredSkillsForRole", () => {
  it("maps CEO role to Operator defaults with theft skill keys", () => {
    expect(resolveTheftDefaultDesiredSkillsForRole("ceo")).toEqual([
      "theft/skills/company-naming",
      "theft/skills/gic-skills",
      "theft/skills/last30days-research",
      "theft/skills/dev-workflow",
    ]);
  });

  it("maps engineering roles to THEFT engineering defaults", () => {
    expect(resolveTheftDefaultDesiredSkillsForRole("cto")).toContain("theft/skills/gic-coding-agent-skills");
    expect(resolveTheftDefaultDesiredSkillsForRole("engineer")).toContain("theft/skills/supabase");
  });

  it("returns an empty list for unknown roles", () => {
    expect(resolveTheftDefaultDesiredSkillsForRole("unknown-role")).toEqual([]);
  });
});
