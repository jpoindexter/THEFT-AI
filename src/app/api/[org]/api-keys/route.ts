import { NextResponse } from "next/server";
import { z } from "zod";
import { createHash, randomBytes } from "node:crypto";
import { db } from "@/lib/db/store";

const Body = z.object({
  name: z.string().min(1).max(80),
  scope: z.enum(["read", "write", "admin"]),
});

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const keys = (await db.listApiKeys(o.id)).map((k) => ({
    id: k.id,
    name: k.name,
    scope: k.scope,
    prefix: k.prefix,
    created_at: k.created_at,
    last_used_at: k.last_used_at,
    revoked_at: k.revoked_at,
  }));
  return NextResponse.json({ keys });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const input = Body.parse(await req.json());

  const secret = `tk_live_${randomBytes(20).toString("hex")}`;
  const hash = createHash("sha256").update(secret).digest("hex");
  const prefix = secret.slice(0, 12);

  const key = await db.createApiKey({
    organization_id: o.id,
    name: input.name,
    scope: input.scope,
    prefix,
    hash,
  });

  return NextResponse.json({
    key: {
      id: key.id,
      name: key.name,
      scope: key.scope,
      prefix: key.prefix,
      created_at: key.created_at,
      last_used_at: null,
    },
    secret,
  });
}
