import { afterEach, describe, expect, it } from "vitest";
import { generate } from "./anthropic";

const ORIGINAL_ENV = {
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  LLM_ALLOW_OFFLINE_FALLBACK: process.env.LLM_ALLOW_OFFLINE_FALLBACK,
  LLM_BACKEND: process.env.LLM_BACKEND,
};

afterEach(() => {
  for (const [key, value] of Object.entries(ORIGINAL_ENV)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }
});

describe("generate offline mode", () => {
  it("returns valid onboarding question JSON without a configured LLM backend", async () => {
    delete process.env.ANTHROPIC_API_KEY;
    process.env.LLM_BACKEND = "offline";

    const text = await generate({
      system: `Agent instructions

---

# Current task

Help the founder sharpen their brief into a 4-question multiple-choice survey.

Founder's idea: "Dark factory AI agent company"

Return JSON only.`,
      messages: [{ role: "user", text: "Output the 4-question brief JSON now." }],
    });

    const parsed = JSON.parse(text) as {
      analysis: string;
      questions: Array<{ options: Array<{ recommended?: boolean }> }>;
    };

    expect(parsed.analysis).toContain("Dark factory AI agent company");
    expect(parsed.questions).toHaveLength(4);
    for (const question of parsed.questions) {
      expect(question.options).toHaveLength(4);
      expect(question.options.filter((option) => option.recommended)).toHaveLength(1);
    }
  });

  it("falls back to deterministic JSON when Ollama is unavailable", async () => {
    process.env.LLM_BACKEND = "ollama";
    process.env.LLM_ALLOW_OFFLINE_FALLBACK = "true";

    const text = await generate({
      system: `Convert the founder's brief answers into a structured business plan JSON object.

Founder idea: AI agent company

Brief answers:
Q: Who is the primary buyer?
A: Solo founders

Output schema: { "product_or_service": string }`,
      messages: [{ role: "user", text: "Output the business plan JSON now." }],
      // Force an immediate connection failure so this test is deterministic.
      baseUrl: "http://127.0.0.1:1",
    });

    const parsed = JSON.parse(text) as { mode: string; backend_note: string };

    expect(parsed.mode).toBe("offline");
    expect(parsed.backend_note).toBeTruthy();
  });

  it("can disable offline fallback for explicitly configured backends", async () => {
    process.env.LLM_BACKEND = "anthropic";
    process.env.LLM_ALLOW_OFFLINE_FALLBACK = "false";
    delete process.env.ANTHROPIC_API_KEY;

    await expect(
      generate({
        system: "Say hello.",
        messages: [{ role: "user", text: "Hello" }],
      }),
    ).rejects.toThrow("ANTHROPIC_API_KEY is unset");
  });
});
