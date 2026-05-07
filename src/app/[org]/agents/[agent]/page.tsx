import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { ArrowLeft } from "lucide-react";
import AgentControls from "@/components/agent-controls";

export default async function AgentDetailPage({
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
  const tasks = await db.listTasks(organization.id);
  const agentTasks = tasks.filter((t) => t.agent_id === agent.id);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center justify-between text-sm text-ink-muted">
          <Link
            href={`/${orgSlug}`}
            className="inline-flex items-center gap-1 hover:text-ink"
          >
            <ArrowLeft className="size-3" /> Back
          </Link>
          <div className="flex items-center gap-1">
            <Link
              href={`/${orgSlug}/agents/${agentSlug}/runs`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Run history
            </Link>
            <Link
              href={`/${orgSlug}/agents/${agentSlug}/edit`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              Edit
            </Link>
          </div>
        </div>

        <header className="space-y-1">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Agent · {agent.role}
          </div>
          <h1 className="text-xl tracking-tight">{agent.name}</h1>
          {agent.title && (
            <p className="text-base text-ink-muted">{agent.title}</p>
          )}
        </header>

        <AgentControls
          initial={
            agent.status === "running"
              ? "running"
              : agent.status === "paused"
                ? "paused"
                : agent.status === "error"
                  ? "error"
                  : agent.status === "terminated"
                    ? "terminated"
                    : "idle"
          }
          agentName={agent.name}
        />

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Capabilities
          </div>
          <p className="text-base text-ink leading-snug">
            {agent.capabilities ?? "No capabilities described yet."}
          </p>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Skills attached ({agent.attached_skills.length})
            </div>
            <Link
              href={`/${orgSlug}/agents/${agentSlug}/edit`}
              className="text-xs rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong"
            >
              Manage
            </Link>
          </div>
          <div className="flex flex-wrap gap-1">
            {agent.attached_skills.map((s) => (
              <Link
                key={s}
                href={`/${orgSlug}/skills/${s}`}
                className="text-xs font-mono px-1.5 py-0.5 rounded bg-cream text-ink hover:bg-line"
              >
                {s}
              </Link>
            ))}
            {agent.attached_skills.length === 0 && (
              <span className="text-sm text-ink-muted">
                No skills attached.
              </span>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Configuration
          </div>
          <div className="grid grid-cols-3 gap-3 text-sm">
            <div>
              <div className="text-ink-muted">Model</div>
              <div className="font-mono text-xs">{agent.model}</div>
            </div>
            <div>
              <div className="text-ink-muted">Status</div>
              <div>{agent.status}</div>
            </div>
            <div>
              <div className="text-ink-muted">Budget</div>
              <div>—</div>
            </div>
          </div>
        </section>

        <section>
          <div className="text-2xs uppercase tracking-wider text-ink-soft mb-2">
            Tasks ({agentTasks.length})
          </div>
          {agentTasks.length === 0 ? (
            <div className="rounded-lg border border-line/70 bg-paper p-3 text-sm text-ink-muted">
              No tasks assigned to this agent yet.
            </div>
          ) : (
            <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
              {agentTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${orgSlug}/tasks/${t.id}`}
                    className="flex items-center justify-between px-3 py-2 text-base hover:bg-canvas"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-2xs text-ink-muted uppercase">
                      {t.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
