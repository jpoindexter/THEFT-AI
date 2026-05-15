import { z } from "zod";
import { db } from "@/lib/db/store";
import { runAgent } from "@/lib/agent/run";
import { composeAgentPromptForDept } from "@/lib/agent/compose-prompt";
import { invalidInput, notFound, ok } from "@/lib/api/responses";

const Body = z.object({ message: z.string().min(1).max(4000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string; slug: string }> },
) {
  const { org: orgSlug, slug: deptSlug } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);

  const org = await db.getOrgBySlug(orgSlug);
  if (!org) return notFound("organization");

  const composed = await composeAgentPromptForDept(
    org.id,
    deptSlug,
    "Execute the task given by the user. Use available tools as needed. Save results to the Library using write_artifact.",
  );
  if (!composed) return notFound("department or agent");

  const result = await runAgent({
    org,
    systemPrompt: composed.system,
    history: [],
    userMessage: parsed.data.message,
    model: composed.agent.model,
  });

  return ok({ turns: result.turns, agent: composed.agent });
}
