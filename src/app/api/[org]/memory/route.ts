import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

const Source = z.enum(["task", "import", "manual", "integration"]);

const Body = z.object({
  id: z.string().optional(),
  topic: z.string().min(1).max(120),
  body: z.string().min(1).max(8000),
  source: Source.default("manual"),
  pinned: z.boolean().default(false),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const items = await db.listMemory(o.id);
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
  const item = await db.upsertMemory(
    input.id
      ? {
          id: input.id,
          organization_id: o.id,
          topic: input.topic,
          body: input.body,
          source: input.source,
          pinned: input.pinned,
        }
      : {
          organization_id: o.id,
          topic: input.topic,
          body: input.body,
          source: input.source,
          pinned: input.pinned,
        },
  );
  return NextResponse.json({ item });
}
