import { z } from "zod";
import { db } from "@/lib/db/store";
import { generate } from "@/lib/agent/anthropic";
import { QUESTIONS } from "@/lib/business-brief/questions";
import { composeAgentPromptForDept } from "@/lib/agent/compose-prompt";
import { err, invalidInput, notFound, ok } from "@/lib/api/responses";

const Body = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      optionKey: z.string(),
      custom: z.string().optional(),
    }),
  ),
  idea: z.string().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);

  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");

  // build a structured answer payload
  const transcript = parsed.data.answers
    .map((a) => {
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      const opt = q?.options.find((o) => o.key === a.optionKey);
      const label = a.custom ?? opt?.label ?? a.optionKey;
      return `Q: ${q?.prompt ?? a.questionId}\nA: ${label}`;
    })
    .join("\n\n");

  const taskDirective = `Convert the founder's brief answers into a structured business plan JSON object. Output JSON only — no prose, no code fences.

${parsed.data.idea ? `Founder idea: ${parsed.data.idea}\n` : ""}
Brief answers:
${transcript}

Output schema: { "product_or_service": string, "icp": string, "mission": string, "key_features": string[], "pricing_thesis": string, "go_to_market_thesis": string }`;

  const composed = await composeAgentPromptForDept(org.id, "sales", taskDirective);
  if (!composed) return err(500, "agent_unavailable", "Sales agent not configured");

  let plan: Record<string, unknown> = {};
  try {
    const json = await generate({
      system: composed.system,
      messages: [{ role: "user", text: "Output the business plan JSON now." }],
      model: org.ai_model ?? undefined,
      backend: org.llm_backend,
      baseUrl: org.llm_base_url,
      maxTokens: 1200,
    });
    plan = parseJsonLoose(json) ?? {
      product_or_service: parsed.data.idea ?? "",
      raw: json,
    };
  } catch (e) {
    plan = {
      product_or_service: parsed.data.idea ?? "",
      error: e instanceof Error ? e.message : "agent failure",
    };
  }

  await db.updateOrg(org.id, { business_plan: plan });
  await db.createArtifact({
    organization_id: org.id,
    department_id: null,
    task_id: null,
    name: "Business Plan",
    kind: "business_plan",
    content: JSON.stringify(plan, null, 2),
    metadata: { answers: parsed.data.answers },
    pinned: true,
  });

  return ok({ plan });
}

function parseJsonLoose(s: string): Record<string, unknown> | null {
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
