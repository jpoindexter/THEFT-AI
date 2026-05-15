import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const PatchBody = z.object({
  name: z.string().min(1).max(80).optional(),
  title: z.string().nullable().optional(),
  capabilities: z.string().nullable().optional(),
  model: z.enum(["claude-sonnet-4-6", "claude-opus-4-7", "claude-haiku-4-5"]).optional(),
  instructions: z.string().nullable().optional(),
  attached_skills: z.array(z.string()).optional(),
  status: z.enum(["idle", "running", "error", "paused", "terminated"]).optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { org, id } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const patch = PatchBody.parse(await req.json());
  await db.updateAgent(id, patch);
  return NextResponse.json({ ok: true });
}
