import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { generate } from "@/lib/agent/anthropic";

const Body = z.object({ idea: z.string().min(1).max(2000) });

const QuestionSchema = z.object({
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

  const system = [
    "You are Cofounder, an AI cofounder helping a founder shape a brief.",
    "Given the founder's idea, generate exactly 4 multiple-choice questions that progressively narrow the brief:",
    "Q1: ICP — who specifically is the primary user/buyer?",
    "Q2: Input format — what is the primary input the tool will work from?",
    "Q3: Pricing — how do they plan to charge?",
    "Q4: Differentiator — what is the main reason a user picks this over alternatives?",
    "Each question must have 4 options. Each option needs key (kebab-case), label, description (1 sentence), and one option per question marked recommended:true.",
    "Tailor every option to the SPECIFIC business — no generic placeholders. Use the founder's domain language.",
    'Output JSON only matching: {"questions":[{"id":"icp","prompt":"…","options":[{"key":"…","label":"…","description":"…","recommended":true}, …]}, …]} — no prose, no code fences.',
  ].join("\n");

  const text = await generate({
    system,
    messages: [
      {
        role: "user",
        text: `Idea: ${parsed.data.idea.trim()}\n\nReturn the 4-question brief as JSON.`,
      },
    ],
    maxTokens: 2000,
  });

  const raw = parseJsonLoose(text);
  const validated = raw ? QuestionSchema.safeParse(raw) : null;
  if (!validated || !validated.success) {
    return NextResponse.json(
      { error: "Brief generation failed", raw: text },
      { status: 502 },
    );
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
