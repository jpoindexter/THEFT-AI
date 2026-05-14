import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db/store";
import { ArrowLeft, Lock, CheckCircle2, Sparkles } from "lucide-react";
import RoadmapNodeStatusActions from "@/components/roadmap-node-status-actions";

const STAGE_TONE: Record<string, string> = {
  idea: "bg-cream text-ink",
  initial: "bg-mustard/30 text-mustard-ink",
  identity: "bg-cream text-ink",
  build: "bg-cream text-ink",
  live: "bg-sage/30 text-sage-ink",
  launch: "bg-cream text-ink",
  scale: "bg-line text-ink",
};

const STATUS_TONE: Record<string, string> = {
  locked: "bg-cream text-ink-muted",
  available: "bg-mustard/30 text-mustard-ink",
  in_progress: "bg-cream text-ink",
  complete: "bg-sage/30 text-sage-ink",
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
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to roadmap
        </Link>

        <header className="space-y-1">
          <div className="flex items-center gap-2">
            <span
              className={`text-2xs uppercase tracking-wider rounded px-1.5 py-0.5 ${
                STAGE_TONE[node.stage] ?? "bg-cream text-ink"
              }`}
            >
              {node.stage}
            </span>
            <span
              className={`text-2xs uppercase tracking-wider rounded px-1.5 py-0.5 ${
                STATUS_TONE[myStatus] ?? "bg-cream text-ink-muted"
              }`}
            >
              {myStatus.replace("_", " ")}
            </span>
            {node.agent_can_do_this && (
              <span className="text-2xs inline-flex items-center gap-1 text-ink-muted">
                <Sparkles className="size-3" /> agent can do this
              </span>
            )}
          </div>
          <h1 className="text-xl tracking-tight">{node.title}</h1>
          {node.description && (
            <p className="text-base text-ink-muted leading-relaxed pt-1 max-w-prose">
              {node.description}
            </p>
          )}
        </header>

        {node.what_becomes_true && (
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-1">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              What becomes true
            </div>
            <p className="text-base text-ink leading-relaxed">
              {node.what_becomes_true}
            </p>
          </section>
        )}

        {node.how_to_move_forward && (
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-1">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              How to move forward
            </div>
            <p className="text-base text-ink leading-relaxed">
              {node.how_to_move_forward}
            </p>
          </section>
        )}

        {node.checklist_item && (
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-1">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Checklist item
            </div>
            <p className="text-base text-ink leading-relaxed">
              {node.checklist_item}
            </p>
          </section>
        )}

        {node.external_cta?.url && (
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Suggested external action
            </div>
            <a
              href={node.external_cta.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 text-sm text-ink-muted border border-line/70 rounded px-2.5 py-1 hover:text-ink hover:border-line-strong"
            >
              {node.external_cta.label || "Open link"}
            </a>
          </section>
        )}

        {dependsOn.length > 0 && (
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-1">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Depends on
            </div>
            <ul className="space-y-1">
              {dependsOn.map((d) => {
                const s = statusFor(d.id);
                return (
                  <li key={d.id}>
                    <Link
                      href={`/${orgSlug}/roadmap/${d.slug}`}
                      className="flex items-center gap-2 text-sm hover:text-ink"
                    >
                      {s === "complete" ? (
                        <CheckCircle2 className="size-3 text-sage-ink" />
                      ) : (
                        <Lock className="size-3 text-ink-soft" />
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
          <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-1">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              Unlocks
            </div>
            <ul className="space-y-1">
              {unlocks.map((u) => (
                <li key={u.id}>
                  <Link
                    href={`/${orgSlug}/roadmap/${u.slug}`}
                    className="text-sm text-ink hover:text-ink"
                  >
                    {u.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <RoadmapNodeStatusActions
          orgSlug={orgSlug}
          nodeSlug={node.slug}
          currentStatus={myStatus as "locked" | "available" | "in_progress" | "complete"}
        />
      </div>
    </div>
  );
}
