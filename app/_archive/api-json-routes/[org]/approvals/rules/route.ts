import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const Body = z.object({
  id: z.string().optional(),
  name: z.string().min(1).max(120),
  scope: z.enum(["engineer", "marketing", "finance", "any"]),
  pattern: z.string().max(500),
  cap_per_day: z.number().int().min(0).max(10000),
  action: z.enum(["auto-approve", "auto-decline", "require-human"]),
  enabled: z.boolean(),
  position: z.number().int().min(0).max(10000),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const rules = await db.listApprovalRules(o.id);
  return NextResponse.json({ rules });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const input = Body.parse(await req.json());
  const rule = await db.upsertApprovalRule({
    ...input,
    organization_id: o.id,
  });
  return NextResponse.json({ rule });
}
