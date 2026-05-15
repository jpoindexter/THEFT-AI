import { z } from "zod";
import { db } from "@/lib/db/store";
import { err, invalidInput, notFound, ok } from "@/lib/api/responses";

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  goal: z.string().nullable().optional(),
  ai_model: z.string().nullable().optional(),
  engineer_model: z.string().nullable().optional(),
  llm_backend: z.string().nullable().optional(),
  llm_base_url: z.string().nullable().optional(),
  global_prompt: z.string().nullable().optional(),
  review_bot_mode: z.string().nullable().optional(),
  budget_monthly_usd: z.number().nullable().optional(),
  budget_hard_limit: z.boolean().nullable().optional(),
  budget_warn_pct: z.number().nullable().optional(),
  budget_per_agent: z.record(z.string(), z.number()).nullable().optional(),
  business_plan: z.record(z.string(), z.unknown()).nullable().optional(),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return notFound("organization");
  return ok({ org: o });
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return notFound("organization");
  const parsed = PatchBody.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);
  await db.updateOrg(o.id, parsed.data);
  if (parsed.data.business_plan && Object.keys(parsed.data.business_plan).length > 0) {
    await db.completeOnboardingRoadmap(o.id);
  }
  return ok({ ok: true });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return notFound("organization");
  if (typeof db.deleteOrg !== "function") {
    return err(500, "not_implemented", "delete not implemented");
  }
  await db.deleteOrg(o.id);
  return ok({ ok: true });
}
