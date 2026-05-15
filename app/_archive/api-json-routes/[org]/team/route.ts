import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const members = await db.listTeam(o.id);
  return NextResponse.json({ members });
}

const Body = z.object({
  email: z.string().email(),
  role: z.enum(["viewer", "editor", "admin"]).default("viewer"),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });
  const body = Body.parse(await req.json());
  const member = await db.inviteMember({ organization_id: o.id, email: body.email, role: body.role });
  return NextResponse.json({ member }, { status: 201 });
}
