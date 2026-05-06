import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { ArrowLeft } from "lucide-react";

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
        <div className="flex items-center justify-between text-[12px] text-stone-500">
          <Link
            href={`/${orgSlug}`}
            className="inline-flex items-center gap-1 hover:text-stone-900"
          >
            <ArrowLeft className="size-3" /> Back
          </Link>
          <Link
            href={`/${orgSlug}/agents/${agentSlug}/edit`}
            className="text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400"
          >
            Edit
          </Link>
        </div>

        <header className="space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Agent · {agent.role}
          </div>
          <h1 className="text-xl tracking-tight">{agent.name}</h1>
          {agent.title && (
            <p className="text-[13px] text-stone-500">{agent.title}</p>
          )}
        </header>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Capabilities
          </div>
          <p className="text-[13px] text-stone-700 leading-snug">
            {agent.capabilities ?? "No capabilities described yet."}
          </p>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Skills attached ({agent.attached_skills.length})
          </div>
          <div className="flex flex-wrap gap-1">
            {agent.attached_skills.map((s) => (
              <Link
                key={s}
                href={`/${orgSlug}/skills`}
                className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-stone-100 text-stone-700 hover:bg-stone-200"
              >
                {s}
              </Link>
            ))}
            {agent.attached_skills.length === 0 && (
              <span className="text-[12px] text-stone-500">
                No skills attached.
              </span>
            )}
          </div>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-stone-400">
            Configuration
          </div>
          <div className="grid grid-cols-3 gap-3 text-[12px]">
            <div>
              <div className="text-stone-500">Model</div>
              <div className="font-mono text-[11px]">{agent.model}</div>
            </div>
            <div>
              <div className="text-stone-500">Status</div>
              <div>{agent.status}</div>
            </div>
            <div>
              <div className="text-stone-500">Budget</div>
              <div>—</div>
            </div>
          </div>
        </section>

        <section>
          <div className="text-[10px] uppercase tracking-wider text-stone-400 mb-2">
            Tasks ({agentTasks.length})
          </div>
          {agentTasks.length === 0 ? (
            <div className="rounded-lg border border-stone-200/70 bg-white p-3 text-[12px] text-stone-500">
              No tasks assigned to this agent yet.
            </div>
          ) : (
            <ul className="rounded-lg border border-stone-200/70 bg-white divide-y divide-stone-100">
              {agentTasks.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/${orgSlug}/tasks/${t.id}`}
                    className="flex items-center justify-between px-3 py-2 text-[13px] hover:bg-stone-50"
                  >
                    <span className="truncate">{t.title}</span>
                    <span className="text-[10px] text-stone-500 uppercase">
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
