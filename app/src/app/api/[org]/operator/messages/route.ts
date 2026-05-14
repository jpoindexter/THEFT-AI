import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization)
    return NextResponse.json({ error: "Org not found" }, { status: 404 });
  const messages = await db.listMessages(organization.id, 100);
  return NextResponse.json({ messages });
}
