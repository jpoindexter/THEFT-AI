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
      github: { repo: `https://github.com/theft-studio/${o.slug}-app`, status: "ready" },
      vercel: { project: `https://vercel.com/theft-studio/${o.slug}-app`, status: "ready" },
      supabase: { project: null, status: "missing" },
      postmark: { server: null, status: "missing" },
      production_url: `https://app.${o.slug}.theft.app`,
      staging_url: `https://staging.${o.slug}.theft.app`,
    },
  });
}
