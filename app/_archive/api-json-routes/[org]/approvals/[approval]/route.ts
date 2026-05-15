import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const DecideBody = z.object({
  decision: z.enum(["approve", "decline", "discuss"]),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string; approval: string }> },
) {
  const { org, approval } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const { decision } = DecideBody.parse(await req.json());
  const statusMap = { approve: "approved", decline: "declined", discuss: "discussed" } as const;
  await db.updateApproval(approval, {
    status: statusMap[decision],
    decided_at: new Date().toISOString(),
  });
  return NextResponse.json({ ok: true, decision, at: new Date().toISOString() });
}
