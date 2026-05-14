import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { generate } from "@/lib/agent/anthropic";
import { composeAgentPromptForDept } from "@/lib/agent/compose-prompt";

const Body = z.object({
  vibe_id: z.string().min(1).max(80),
  vibe_name: z.string().min(1).max(120),
  vibe_description: z.string().max(400).optional(),
  custom_brief: z.string().max(2000).optional(),
});

const KitSchema = z.object({
  brand_name: z.string().min(1),
  tagline: z.string().default(""),
  mission_line: z.string().default(""),
  palette: z.array(z.string()).min(3),
  display_font: z.string().default("Inter"),
  body_font: z.string().default("Inter"),
  mono_font: z.string().optional(),
  voice_keywords: z.array(z.string()).default([]),
  industry: z.string().default(""),
  mockups: z
    .array(z.object({ label: z.string(), description: z.string().default("") }))
    .default([]),
});

const DEFAULT_PALETTE = ["#1c1c1a", "#3a3a38", "#9a9a98", "#d4d4d2", "#ffffff", "#e8c87a"];
const DEFAULT_MOCKUPS = [
  { label: "Hero", description: "Landing surface" },
  { label: "Pricing", description: "Plan card" },
  { label: "Email", description: "Transactional" },
];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  try {
  const { org: orgSlug } = await params;
  const o = await db.getOrgBySlug(orgSlug);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const businessPlan = (o.business_plan ?? {}) as Record<string, unknown>;
  const planText = Object.entries(businessPlan)
    .map(([k, v]) => `${k}: ${String(v)}`)
    .join("\n");

  const taskDirective = `Generate the initial brand kit for ${o.name}.

${planText ? `Business plan:\n${planText}\n` : ""}
Vibe direction: ${parsed.data.vibe_name} — ${parsed.data.vibe_description ?? ""}
${parsed.data.custom_brief ? `Founder's custom brief: ${parsed.data.custom_brief}\n` : ""}
Use your design judgement and the skills available to you. Treat the vibe as a starting direction, not a paint-by-number — adapt every choice to the company.
Explicitly apply the huashu-design skill heuristics for visual hierarchy, spacing rhythm, color contrast, and component consistency.

Output JSON only — no prose, no code fences. Schema:
{
  "brand_name": "string",
  "tagline": "short tagline",
  "mission_line": "one sentence mission",
  "palette": ["#hex","#hex","#hex","#hex","#hex","#hex"],
  "display_font": "Google Font name",
  "body_font": "Google Font name",
  "mono_font": "Google Font name",
  "voice_keywords": ["word1","word2","word3"],
  "industry": "string",
  "mockups": [{"label":"Hero","description":"short"},{"label":"Pricing","description":"short"},{"label":"Email","description":"short"}]
}`;

  const composed = await composeAgentPromptForDept(o.id, "design", taskDirective);
  if (!composed) {
    return NextResponse.json({ error: "Design agent not configured" }, { status: 500 });
  }

  const text = await generate({
    system: composed.system,
    messages: [{ role: "user", text: "Output the brand kit JSON now." }],
    model: o.ai_model ?? undefined,
    backend: o.llm_backend,
    baseUrl: o.llm_base_url,
    maxTokens: 4000,
  });

  const raw = parseJsonLoose(text);
  const validated = raw ? KitSchema.safeParse(raw) : null;
  if (!validated || !validated.success) {
    return NextResponse.json(
      { error: "Brand kit generation failed", raw: text, issues: validated?.error?.issues },
      { status: 502 },
    );
  }

  // Normalize: pad palette to 6, hex-validate, defaults
  const cleanPalette = validated.data.palette
    .map((c) => (/^#[0-9a-fA-F]{6}$/.test(c) ? c : null))
    .filter((c): c is string => !!c);
  while (cleanPalette.length < 6) cleanPalette.push(DEFAULT_PALETTE[cleanPalette.length]);

  const kit = {
    ...validated.data,
    palette: cleanPalette.slice(0, 6),
    mockups: validated.data.mockups.length > 0 ? validated.data.mockups : DEFAULT_MOCKUPS,
  };

  await db.createArtifact({
    organization_id: o.id,
    department_id: null,
    task_id: null,
    name: "Brand Kit",
    kind: "brand_kit",
    content: JSON.stringify(kit, null, 2),
    metadata: {
      vibe_id: parsed.data.vibe_id,
      vibe_name: parsed.data.vibe_name,
      agent_id: composed.agent.id,
      agent_name: composed.agent.name,
      skills_used: composed.skillsLoaded,
      skills_missing: composed.skillsMissing,
    },
    pinned: true,
  });

  return NextResponse.json({ kit });
  } catch (e) {
    console.error("[brand-kit] route error:", e);
    return NextResponse.json(
      { error: "internal", message: e instanceof Error ? e.message : String(e), stack: e instanceof Error ? e.stack : undefined },
      { status: 500 },
    );
  }
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
