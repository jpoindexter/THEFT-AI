import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { PageTitle, Hint, Pill } from "@/components/ui/primitives";
import { ArrowLeft, Plus } from "lucide-react";

const KB_ARTICLES = [
  { id: "1", title: "Getting Started with THEFT AI",        category: "Getting started", status: "published", updated: "3d ago",  words: 820  },
  { id: "2", title: "Core Workflows — Department Overview",  category: "Core workflows",  status: "published", updated: "1w ago",  words: 1240 },
  { id: "3", title: "Billing Plans and Upgrades",           category: "Billing",          status: "draft",     updated: "2d ago",  words: 380  },
  { id: "4", title: "Troubleshooting Agent Errors",         category: "Troubleshooting",  status: "published", updated: "5d ago",  words: 960  },
  { id: "5", title: "Account Management",                   category: "Account",          status: "draft",     updated: "Today",   words: 220  },
  { id: "6", title: "Known Limitations",                    category: "Getting started",  status: "published", updated: "2w ago",  words: 440  },
];

const CATEGORIES = ["Getting started", "Core workflows", "Billing", "Troubleshooting", "Account"];

export default async function KnowledgeBasePage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">
        <header className="flex items-start justify-between">
          <div>
            <Link
              href={`/${org}/support`}
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-2"
            >
              <ArrowLeft className="size-3" /> Support
            </Link>
            <PageTitle>Knowledge Base</PageTitle>
            <Hint>
              Articles Fin uses to answer customer questions. Published = Fin can
              cite it. Draft = not live.
            </Hint>
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1.5 text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
          >
            <Plus className="size-3.5" /> New article
          </button>
        </header>

        {/* Category counts */}
        <div className="grid grid-cols-5 gap-2">
          {CATEGORIES.map((cat) => {
            const count = KB_ARTICLES.filter((a) => a.category === cat).length;
            return (
              <div
                key={cat}
                className="rounded-lg border border-line/70 bg-paper p-2.5 text-center"
              >
                <div className="text-xl font-medium text-ink">{count}</div>
                <div className="text-2xs text-ink-muted mt-0.5 leading-snug">{cat}</div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line/50 text-2xs uppercase tracking-wider text-ink-soft">
                <th className="text-left px-4 py-2 font-medium">Title</th>
                <th className="text-left px-4 py-2 font-medium">Category</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
                <th className="text-right px-4 py-2 font-medium">Words</th>
                <th className="text-left px-4 py-2 font-medium">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line/40">
              {KB_ARTICLES.map((a) => (
                <tr key={a.id} className="hover:bg-canvas/50 cursor-pointer">
                  <td className="px-4 py-2.5 text-xs font-medium text-ink">{a.title}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-muted">{a.category}</td>
                  <td className="px-4 py-2.5">
                    <Pill tone={a.status === "published" ? "sage" : "neutral"}>
                      {a.status}
                    </Pill>
                  </td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft text-right">{a.words}</td>
                  <td className="px-4 py-2.5 text-xs text-ink-soft">{a.updated}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
