import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { generate } from "@/lib/agent/anthropic";
import { composeAgentPromptForDept } from "@/lib/agent/compose-prompt";
import { fallbackSetupQuestions } from "@/lib/onboarding/engine";

const Body = z.object({ idea: z.string().min(1).max(2000) });

const QuestionSchema = z.object({
  analysis: z.string().min(10).max(500),
  questions: z
    .array(
      z.object({
        id: z.string(),
        prompt: z.string(),
        options: z
          .array(
            z.object({
              key: z.string(),
              label: z.string(),
              description: z.string().optional(),
              recommended: z.boolean().optional(),
            }),
          )
          .min(3)
          .max(6),
      }),
    )
    .length(4),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const o = await db.getOrgBySlug(orgSlug);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });

  // As soon as the founder submits the idea in onboarding, mark the first two
  // setup nodes complete so roadmap state reflects real user progress.
  try {
    await db.seedTechTreeStatus(o.id);
    await db.upsertTechTreeNodeStatus(o.id, "initial-idea", "complete");
    await db.upsertTechTreeNodeStatus(o.id, "pick-company-name", "complete");
  } catch {
    // Do not block onboarding if roadmap status updates fail.
  }

  // Workspace setup must have a guaranteed happy path. The local engine gives
  // the UI immediate, tailored-enough questions; LLM refinement can be enabled
  // explicitly once the model backend is healthy.
  if (process.env.THEFT_ONBOARDING_LLM !== "1") {
    return NextResponse.json(fallbackSetupQuestions(parsed.data.idea));
  }

  const taskDirective = `Help the founder sharpen their brief into a 4-question multiple-choice survey.

Founder's idea: "${parsed.data.idea.trim()}"

Return JSON only — no prose, no code fences:
{
  "analysis": "2–3 sentences: what's interesting about this idea, the core wedge, why it has legs. Be direct and specific to THEIR business — not generic encouragement.",
  "questions": [
    { "id": "icp", "prompt": "Who specifically is the primary buyer?", "options": [...] },
    { "id": "format", "prompt": "What is the primary input the service works from?", "options": [...] },
    { "id": "pricing", "prompt": "How do they plan to charge?", "options": [...] },
    { "id": "differentiator", "prompt": "Why does a buyer pick this over alternatives?", "options": [...] }
  ]
}

Rules:
- Exactly 4 questions, exactly 4 options each
- Each option: { key (kebab-case), label, description (one sentence), recommended (boolean — exactly one true per question) }
- Tailor every option to THIS specific business — no generic placeholders
- Use the founder's domain language`;

  const composed = await composeAgentPromptForDept(o.id, "sales", taskDirective);
  if (!composed) {
    return NextResponse.json(fallbackSetupQuestions(parsed.data.idea));
  }

  let text: string;
  try {
    text = await generate({
      system: composed.system,
      messages: [{ role: "user", text: "Output the 4-question brief JSON now." }],
      model: o.ai_model ?? undefined,
      backend: o.llm_backend,
      baseUrl: o.llm_base_url,
      maxTokens: 2000,
    });
  } catch {
    return NextResponse.json(fallbackSetupQuestions(parsed.data.idea));
  }

  const raw = parseJsonLoose(text);
  const validated = raw ? QuestionSchema.safeParse(raw) : null;
  if (!validated || !validated.success) {
    return NextResponse.json(fallbackSetupQuestions(parsed.data.idea));
  }

  return NextResponse.json(validated.data);
}

function parseJsonLoose(s: string): unknown {
  const t = s.trim();
  const fenced = t.match(/```(?:json)?\n([\s\S]+?)\n```/);
  const inner = fenced ? fenced[1] : t;
  try {
    return JSON.parse(inner);
  } catch {
    const first = inner.indexOf("{");
    const last = inner.lastIndexOf("}");
    if (first >= 0 && last > first) {
      try {
        return JSON.parse(inner.slice(first, last + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}
