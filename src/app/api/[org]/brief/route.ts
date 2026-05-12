import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { generate } from "@/lib/agent/anthropic";
import { QUESTIONS } from "@/lib/business-brief/questions";

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
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const org = await db.getOrgBySlug(orgSlug);
  if (!org)
    return NextResponse.json({ error: "Org not found" }, { status: 404 });

  // build a structured answer payload
  const transcript = parsed.data.answers
    .map((a) => {
      const q = QUESTIONS.find((x) => x.id === a.questionId);
      const opt = q?.options.find((o) => o.key === a.optionKey);
      const label = a.custom ?? opt?.label ?? a.optionKey;
      return `Q: ${q?.prompt ?? a.questionId}\nA: ${label}`;
    })
    .join("\n\n");

  const prompt = [
    parsed.data.idea ? `Founder idea: ${parsed.data.idea}` : "",
    `Brief answers:\n${transcript}`,
    `Output a JSON object with these keys: product_or_service, icp, mission, key_features (array of strings), pricing_thesis, go_to_market_thesis. Be concise.`,
  ]
    .filter(Boolean)
    .join("\n\n");

  let plan: Record<string, unknown> = {};
  try {
    const json = await generate({
      system:
        "You are Cofounder. Convert the founder's brief answers into a structured business plan JSON object. Output JSON only — no prose, no code fences.",
      messages: [{ role: "user", text: prompt }],
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

  return NextResponse.json({ plan });
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
