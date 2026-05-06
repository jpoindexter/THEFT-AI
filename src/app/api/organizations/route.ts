import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { bootstrapOrganization } from "@/lib/orgs/bootstrap";

const Body = z.object({
  name: z.string().min(1).max(80),
  experience: z.enum(["writes_code", "manages_engineers", "non_technical"]),
  primaryRole: z.enum([
    "product",
    "engineering",
    "design",
    "marketing",
    "sales",
    "operations",
    "founder",
    "other",
  ]),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid input", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const org = await db.createOrg({ name: parsed.data.name });
  await bootstrapOrganization(org.id);
  return NextResponse.json({ slug: org.slug });
}
