import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({
    memory: null,
    stack: {
      github: { repo: null, status: "missing" },
      vercel: { project: null, status: "missing" },
      supabase: { project: null, status: "missing" },
      postmark: { server: null, status: "missing" },
    },
  });
}
