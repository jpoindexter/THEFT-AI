import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ org: string; id: string }> },
) {
  const { id } = await params;
  await db.revokeApiKey(id);
  return NextResponse.json({ ok: true });
}
