import { notFound } from "next/navigation";
import Link from "next/link";
import { Bot, BookOpen, GitFork, AlertCircle } from "lucide-react";
import { db } from "@/lib/db/store";
import { SectionHeader } from "@/components/settings/section";
import { StatCard } from "@/components/ui/primitives";

const NAV_CARDS = [
  {
    slug: "knowledge-base",
    label: "Knowledge Base",
    description: "Manage articles, FAQs, and documentation for your support agent.",
    Icon: BookOpen,
    meta: "6 articles",
  },
  {
    slug: "decision-trees",
    label: "Decision Trees",
    description: "Build step-by-step resolution flows for common support scenarios.",
    Icon: GitFork,
    meta: "2 trees",
  },
] as const;

export default async function SupportHub({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const organization = await db.getOrgBySlug(org);
  if (!organization) notFound();

  return (
    <>
      <SectionHeader
        title="Support"
        description="Configure your customer-facing support agent and knowledge resources."
      />

      {/* Fin AI agent card */}
      <section className="rounded-lg border border-line/70 bg-paper p-5 mb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="size-10 rounded-lg border border-line/70 bg-canvas flex items-center justify-center shrink-0">
              <Bot className="size-5 text-ink-muted" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h2 className="text-base font-medium">Fin by Intercom</h2>
                <span className="inline-flex items-center gap-1 text-2xs uppercase tracking-wider rounded bg-mustard/10 border border-mustard/30 text-mustard-ink px-1.5 py-0.5">
                  <AlertCircle className="size-3" />
                  Not connected
                </span>
              </div>
              <p className="text-sm text-ink-muted">
                Deploy Fin as your customer-facing support agent
              </p>
            </div>
          </div>
          <button
            type="button"
            className="shrink-0 text-sm rounded-md border border-line px-3 py-1.5 hover:border-line-strong whitespace-nowrap"
          >
            Connect Intercom
          </button>
        </div>
      </section>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard label="Open tickets" value="0" />
        <StatCard label="Avg response time" value="—" />
        <StatCard label="CSAT score" value="—" />
      </div>

      {/* Navigation cards */}
      <div className="grid grid-cols-2 gap-3">
        {NAV_CARDS.map(({ slug, label, description, Icon, meta }) => (
          <Link
            key={slug}
            href={`/${org}/support/${slug}`}
            className="group rounded-lg border border-line/70 bg-paper p-4 hover:border-line-strong transition-colors flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <div className="size-8 rounded-md border border-line/70 bg-canvas flex items-center justify-center">
                <Icon className="size-4 text-ink-muted" />
              </div>
              <span className="text-xs text-ink-soft group-hover:text-ink transition-colors">→</span>
            </div>
            <div>
              <div className="text-base font-medium">{label}</div>
              <p className="text-xs text-ink-muted mt-0.5">{description}</p>
              <p className="text-xs text-ink-soft mt-1">{meta}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
