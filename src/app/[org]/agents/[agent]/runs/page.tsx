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

type Run = {
  id: string;
  task: string;
  started: string;
  ended: string;
  status: "ok" | "paused" | "error";
  duration_ms: number;
  tokens_in: number;
  tokens_out: number;
  cost: number;
};

const RUNS_BY_AGENT: Record<string, Run[]> = {
  default: [
    {
      id: "run_a1",
      task: "Build product MVP",
      started: "12:42:01",
      ended: "12:48:33",
      status: "paused",
      duration_ms: 392_000,
      tokens_in: 18_400,
      tokens_out: 4_120,
      cost: 0.62,
    },
    {
      id: "run_a2",
      task: "Add Stripe checkout",
      started: "11:30:11",
      ended: "11:48:50",
      status: "ok",
      duration_ms: 1_120_000,
      tokens_in: 28_300,
      tokens_out: 7_410,
      cost: 1.04,
    },
    {
      id: "run_a3",
      task: "Diagnose CI flake",
      started: "10:01:00",
      ended: "10:08:11",
      status: "error",
      duration_ms: 431_000,
      tokens_in: 9_800,
      tokens_out: 1_240,
      cost: 0.21,
    },
  ],
};

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
  const runs = RUNS_BY_AGENT.default;

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
            Every run this agent has taken, with token + cost telemetry.
          </Hint>
        </header>

        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-canvas border-b border-line/70">
                <tr className="text-left text-2xs uppercase tracking-wider text-ink-soft">
                  <Th>Task</Th>
                  <Th>Started</Th>
                  <Th>Duration</Th>
                  <Th>Tokens (in / out)</Th>
                  <Th>Cost</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {runs.map((r) => (
                  <RunRow key={r.id} r={r} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-3 py-2 font-medium">{children}</th>;
}

function RunRow({ r }: { r: Run }) {
  return (
    <tr className="hover:bg-canvas">
      <td className="px-3 py-2">{r.task}</td>
      <td className="px-3 py-2 font-mono text-xs text-ink-muted">{r.started}</td>
      <td className="px-3 py-2 font-mono text-xs">
        {(r.duration_ms / 1000).toFixed(1)}s
      </td>
      <td className="px-3 py-2 font-mono text-xs">
        {r.tokens_in.toLocaleString()} / {r.tokens_out.toLocaleString()}
      </td>
      <td className="px-3 py-2 font-mono text-xs">${r.cost.toFixed(2)}</td>
      <td className="px-3 py-2">
        <Pill
          tone={r.status === "ok" ? "sage" : r.status === "paused" ? "mustard" : "brick"}
        >
          {r.status}
        </Pill>
      </td>
    </tr>
  );
}
