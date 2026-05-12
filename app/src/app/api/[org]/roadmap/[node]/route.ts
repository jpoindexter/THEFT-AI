import { z } from "zod";
import { db } from "@/lib/db/store";
import { ok, notFound, invalidInput } from "@/lib/api/responses";

const Body = z.object({
  status: z.enum(["locked", "available", "in_progress", "complete"]),
});

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ org: string; node: string }> },
) {
  const { org: orgSlug, node: nodeSlug } = await params;
  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");

  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);

  await db.upsertTechTreeNodeStatus(org.id, nodeSlug, parsed.data.status);
  return ok({ ok: true });
}
