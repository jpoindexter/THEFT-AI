import { NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db/store";

const Body = z.object({
  name: z.string().min(1).max(80),
  url: z.string().url().startsWith("https://"),
  events: z.array(z.string().min(1)).min(1),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const items = (await db.listWebhooks(o.id)).map((w) => ({
    ...w,
    secret: undefined,
  }));
  return NextResponse.json({ items });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const input = Body.parse(await req.json());
  const wh = await db.createWebhook({
    organization_id: o.id,
    name: input.name,
    url: input.url,
    events: input.events,
    status: "ok",
    secret: `whsec_${randomBytes(20).toString("hex")}`,
  });
  return NextResponse.json({
    item: { ...wh, secret: undefined },
    secret: wh.secret,
  });
}
