import { z } from "zod";
import { db } from "@/lib/db/store";
import { generate } from "@/lib/agent/anthropic";
import { composeAgentPromptForDept } from "@/lib/agent/compose-prompt";
import { err, invalidInput, notFound, ok } from "@/lib/api/responses";

const Body = z.object({ text: z.string().min(1).max(8000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success) return invalidInput(parsed.error);

  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) return notFound("organization");

  await db.appendMessage({
    organization_id: organization.id,
    role: "user",
    text: parsed.data.text,
  });

  const history = await db.listMessages(organization.id, 40);

  // Operator is the meta-agent at the org level. We compose through the
  // sales agent (closest to GTM/orchestration) and override the directive so
  // it speaks as Operator rather than as a sales operator.
  const planJson = organization.business_plan
    ? `\nCurrent business plan:\n${JSON.stringify(organization.business_plan, null, 2)}`
    : `\nNo business plan yet. Help the founder shape one through guided questions.`;

  const taskDirective = `Speak as "Operator" — the meta-agent that helps the founder run "${organization.name}" with a team of AI agents.

You delegate work to department agents (Engineering, Design, Marketing, Sales, Operations, Finance, Legal, Support) instead of doing it yourself. Be brief. State assumptions, propose the next concrete step, ask only when ambiguity is high.${planJson}`;

  const composed = await composeAgentPromptForDept(organization.id, "sales", taskDirective);
  if (!composed) return err(500, "agent_unavailable", "Operator agent not configured");

  let replyText: string;
  try {
    replyText = await generate({
      system: composed.system,
      messages: history.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        text: m.text,
      })),
      model: organization.ai_model ?? undefined,
      backend: organization.llm_backend,
      baseUrl: organization.llm_base_url,
    });
  } catch (e) {
    replyText = `[Operator error] ${e instanceof Error ? e.message : "unknown"}`;
  }

  await db.appendMessage({
    organization_id: organization.id,
    role: "assistant",
    text: replyText,
  });

  return ok({ reply: replyText });
}
