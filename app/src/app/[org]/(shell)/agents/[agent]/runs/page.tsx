import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { ArrowLeft, Cpu } from "lucide-react";
import {
  Card,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";

export default async function AgentRunsPage({
  params,
}: {
  params: Promise<{ org: string; agent: string }>;
}) {
  const { org: orgSlug, agent: agentSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const agents = await db.listAgents(organization.id);
  const agent = agents.find((a) => a.slug === agentSlug || a.id === agentSlug);
  if (!agent) notFound();

  const allUsage = await db.listUsage(organization.id, {});
  const runs = allUsage
    .filter((u) => u.agent_id === agent.id || u.agent_name === agent.name)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 50);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${orgSlug}/agents/${agentSlug}`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to {agent.name}
        </Link>

        <header>
          <Eyebrow>
            <Cpu className="size-3 inline-block mr-1" /> {agent.name}
          </Eyebrow>
          <PageTitle>Run history</PageTitle>
          <Hint>
            Local adapter run records for this agent.
          </Hint>
        </header>

        <Card>
          {runs.length === 0 ? (
            <div className="px-4 py-6 text-sm text-ink-muted text-center">
              No runs recorded yet for {agent.name}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-canvas border-b border-line/70">
                  <tr className="text-left text-2xs uppercase tracking-wider text-ink-soft">
                    <Th>Date</Th>
                    <Th>Model</Th>
                    <Th>Tokens (in / out)</Th>
                    <Th>Task</Th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {runs.map((r) => (
                    <tr key={r.id} className="hover:bg-canvas">
                      <td className="px-3 py-2 font-mono text-xs text-ink-muted">
                        {r.created_at.slice(0, 16).replace("T", " ")}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.model.replace("claude-", "")}
                      </td>
                      <td className="px-3 py-2 font-mono text-xs">
                        {r.input_tokens.toLocaleString()} / {r.output_tokens.toLocaleString()}
                      </td>
                      <td className="px-3 py-2 text-xs text-ink-muted truncate max-w-[180px]">
                        {r.task_id ? (
                          <Link href={`/${orgSlug}/tasks/${r.task_id}`} className="hover:underline">
                            {r.task_id.slice(0, 8)}…
                          </Link>
                        ) : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}
