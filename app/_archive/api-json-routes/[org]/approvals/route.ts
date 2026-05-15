import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const PostBody = z.object({
  agent: z.string().min(1),
  title: z.string().min(1).max(200),
  body: z.string(),
  impact: z.enum(["low", "medium", "high"]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const approvals = await db.listApprovals(o.id);
  return NextResponse.json({ approvals });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const input = PostBody.parse(await req.json());
  const approval = await db.createApproval({ ...input, organization_id: o.id, status: "pending" });
  return NextResponse.json({ approval }, { status: 201 });
}
