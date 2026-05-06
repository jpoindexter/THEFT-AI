import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { ArrowLeft, Lock, CheckCircle2, Sparkles } from "lucide-react";

const STAGE_TONE: Record<string, string> = {
  idea: "bg-stone-100 text-stone-700",
  initial: "bg-amber-100 text-amber-800",
  identity: "bg-rose-100 text-rose-800",
  build: "bg-sky-100 text-sky-800",
  live: "bg-emerald-100 text-emerald-800",
  launch: "bg-violet-100 text-violet-800",
  scale: "bg-stone-200 text-stone-700",
};

const STATUS_TONE: Record<string, string> = {
  locked: "bg-stone-100 text-stone-500",
  available: "bg-amber-100 text-amber-800",
  in_progress: "bg-sky-100 text-sky-800",
  done: "bg-emerald-100 text-emerald-700",
};

export default async function TechTreeNodePage({
  params,
}: {
  params: Promise<{ org: string; node: string }>;
}) {
  const { org: orgSlug, node: nodeSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  await db.seedTechTreeStatus(organization.id);
  const nodes = await db.listTechTreeNodes();
  const node = nodes.find((n) => n.slug === nodeSlug || n.id === nodeSlug);
  if (!node) notFound();
  const status = await db.listTechTreeStatus(organization.id);
  const statusFor = (id: string) =>
    status.find((s) => s.node_id === id)?.status ?? "locked";
  const myStatus = statusFor(node.id);
  const dependsOn = nodes.filter((n) => node.dependencies.includes(n.id));
  const unlocks = nodes.filter((n) => n.dependencies.includes(node.id));

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link
          href={`/${orgSlug}/roadmap`}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="size-3" /> Back to roadmap
        </Link>

        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 ${
                STAGE_TONE[node.stage] ?? "bg-stone-100 text-stone-700"
              }`}
            >
              {node.stage}
            </span>
            <span
              className={`text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 ${
                STATUS_TONE[myStatus] ?? "bg-stone-100 text-stone-500"
              }`}
            >
              {myStatus.replace("_", " ")}
            </span>
            {node.agent_can_do_this && (
              <span className="text-[10px] inline-flex items-center gap-1 text-stone-500">
                <Sparkles className="size-3" /> agent can do this
              </span>
            )}
          </div>
          <h1 className="text-xl tracking-tight">{node.title}</h1>
          {node.description && (
            <p className="text-[13px] text-stone-600 leading-relaxed pt-1 max-w-prose">
              {node.description}
            </p>
          )}
        </header>

        {node.what_becomes_true && (
          <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              What becomes true
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              {node.what_becomes_true}
            </p>
          </section>
        )}

        {node.how_to_move_forward && (
          <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              How to move forward
            </div>
            <p className="text-[13px] text-stone-700 leading-relaxed">
              {node.how_to_move_forward}
            </p>
          </section>
        )}

        {dependsOn.length > 0 && (
          <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              Depends on
            </div>
            <ul className="space-y-1">
              {dependsOn.map((d) => {
                const s = statusFor(d.id);
                return (
                  <li key={d.id}>
                    <Link
                      href={`/${orgSlug}/roadmap/${d.slug}`}
                      className="flex items-center gap-2 text-[12px] hover:text-stone-900"
                    >
                      {s === "complete" ? (
                        <CheckCircle2 className="size-3 text-emerald-600" />
                      ) : (
                        <Lock className="size-3 text-stone-400" />
                      )}
                      {d.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {unlocks.length > 0 && (
          <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-1">
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              Unlocks
            </div>
            <ul className="space-y-1">
              {unlocks.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/${orgSlug}/roadmap/${u.slug}`}
                    className="text-[12px] text-stone-700 hover:text-stone-900"
                  >
                    {u.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="flex justify-end gap-2 pt-1">
          <button className="text-[12px] rounded-md border border-stone-200 bg-white px-3 py-1.5 hover:border-stone-400">
            Mark locked
          </button>
          <button className="text-[12px] rounded-md border border-stone-200 bg-white px-3 py-1.5 hover:border-stone-400">
            Mark in progress
          </button>
          <button className="text-[12px] rounded-md bg-stone-900 text-white px-3 py-1.5">
            Mark done
          </button>
        </div>
      </div>
    </div>
  );
}
