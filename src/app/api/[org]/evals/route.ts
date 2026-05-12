import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const PostBody = z.object({
  name: z.string().min(1).max(120),
  agent: z.string().min(1),
  ran_against: z.string().min(1),
  cases: z.number().int().min(0).default(0),
  pass: z.number().int().min(0).default(0),
  fail: z.number().int().min(0).default(0),
  pending: z.number().int().min(0).default(0),
  last_run_at: z.string().nullable().default(null),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const suites = await db.listEvalSuites(o.id);
  return NextResponse.json({ suites });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const input = PostBody.parse(await req.json());
  const suite = await db.createEvalSuite({ ...input, organization_id: o.id });
  return NextResponse.json({ suite }, { status: 201 });
}
