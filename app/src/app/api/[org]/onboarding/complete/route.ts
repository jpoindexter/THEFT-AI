import { z } from "zod";
import { db } from "@/lib/db/store";
import { completeWorkspaceSetup } from "@/lib/onboarding/engine";
import { invalidInput, notFound, ok } from "@/lib/api/responses";

const Body = z.object({
  idea: z.string().min(1).max(4000),
  questions: z.array(
    z.object({
      id: z.string().min(1),
      prompt: z.string().min(1),
      options: z.array(
        z.object({
          key: z.string().min(1),
          label: z.string().min(1),
          description: z.string().optional(),
          recommended: z.boolean().optional(),
        }),
      ),
    }),
  ),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      prompt: z.string().optional(),
      answer: z.string().min(1),
    }),
  ),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);

  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");

  const result = await completeWorkspaceSetup(org, parsed.data);
  return ok(result);
}
