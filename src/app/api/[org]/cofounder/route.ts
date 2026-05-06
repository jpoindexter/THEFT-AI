import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db/store";
import { generate } from "@/lib/agent/anthropic";

const Body = z.object({ text: z.string().min(1).max(8000) });

export async function POST(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org: orgSlug } = await params;
  const parsed = Body.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization)
    return NextResponse.json({ error: "Org not found" }, { status: 404 });

  await db.appendMessage({
    organization_id: organization.id,
    role: "user",
    text: parsed.data.text,
  });

  const history = await db.listMessages(organization.id, 40);

  let replyText: string;
  try {
    replyText = await generate({
      system: cofounderSystemPrompt(organization.name, organization.business_plan),
      messages: history.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        text: m.text,
      })),
    });
  } catch (e) {
    replyText = `[Cofounder error] ${e instanceof Error ? e.message : "unknown"}`;
  }

  await db.appendMessage({
    organization_id: organization.id,
    role: "assistant",
    text: replyText,
  });

  return NextResponse.json({ reply: replyText });
}

function cofounderSystemPrompt(orgName: string, businessPlan: unknown): string {
  return [
    `You are Cofounder — the meta-agent that helps the founder run "${orgName}" with a team of AI agents.`,
    `You delegate work to department agents (Engineering, Design, Marketing, Sales, Operations, Finance) instead of doing it yourself.`,
    `Be brief. State assumptions, propose the next concrete step, ask only when ambiguity is high.`,
    businessPlan
      ? `\nCurrent business plan:\n${JSON.stringify(businessPlan, null, 2)}`
      : `\nNo business plan yet. Help the founder shape one through guided questions.`,
  ].join("\n");
}
