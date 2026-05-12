import { notFound } from "next/navigation";
import { Plus } from "lucide-react";
import { db } from "@/lib/db/store";
import { SectionHeader } from "@/components/settings/section";
import ArticleTable, { type Article } from "./article-table";

const ARTICLES: Article[] = [
  {
    id: "getting-started",
    title: "Getting started with your workspace",
    category: "Getting Started",
    updatedAt: "2026-05-01",
    status: "Published",
  },
  {
    id: "core-workflows",
    title: "How to run an agent workflow",
    category: "Core Workflows",
    updatedAt: "2026-04-28",
    status: "Published",
  },
  {
    id: "billing-plans",
    title: "Understanding plans and usage limits",
    category: "Billing & Plans",
    updatedAt: "2026-04-20",
    status: "Published",
  },
  {
    id: "troubleshooting",
    title: "Troubleshooting failed agent tasks",
    category: "Troubleshooting",
    updatedAt: "2026-04-15",
    status: "Draft",
  },
  {
    id: "account-management",
    title: "Managing team members and permissions",
    category: "Account Management",
    updatedAt: "2026-04-10",
    status: "Published",
  },
  {
    id: "known-limitations",
    title: "Known limitations and workarounds",
    category: "Known Limitations",
    updatedAt: "2026-05-05",
    status: "Draft",
  },
];

export default async function KnowledgeBasePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const organization = await db.getOrgBySlug(org);
  if (!organization) notFound();

  return (
    <>
      <div className="flex items-start justify-between mb-6">
        <SectionHeader
          title="Knowledge Base"
          description="Articles and documentation surfaced by your support agent."
        />
        <button
          type="button"
          className="shrink-0 inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 whitespace-nowrap ml-4 mt-1"
        >
          <Plus className="size-3.5" />
          New article
        </button>
      </div>
      <ArticleTable articles={ARTICLES} />
    </>
  );
}
