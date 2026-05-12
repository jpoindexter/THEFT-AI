"use client";

import { useState, Fragment } from "react";
import { ChevronDown } from "lucide-react";

export type Article = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
  status: "Published" | "Draft";
};

const STATUS_CLS: Record<Article["status"], string> = {
  Published: "bg-sage/30 text-sage-ink",
  Draft: "bg-cream text-ink-muted",
};

export default function ArticleTable({ articles }: { articles: Article[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="rounded-lg border border-line/70 bg-paper overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line/70 bg-canvas">
            <th className="text-left px-4 py-2.5 text-xs text-ink-muted font-medium">Title</th>
            <th className="text-left px-4 py-2.5 text-xs text-ink-muted font-medium">Category</th>
            <th className="text-left px-4 py-2.5 text-xs text-ink-muted font-medium">Last updated</th>
            <th className="text-left px-4 py-2.5 text-xs text-ink-muted font-medium">Status</th>
            <th className="w-8" />
          </tr>
        </thead>
        <tbody>
          {articles.map((article, i) => {
            const isOpen = openId === article.id;
            return (
              <Fragment key={article.id}>
                <tr
                  onClick={() => setOpenId(isOpen ? null : article.id)}
                  className={`cursor-pointer hover:bg-canvas transition-colors ${
                    i < articles.length - 1 || isOpen ? "border-b border-line/40" : ""
                  }`}
                >
                  <td className="px-4 py-3 text-base text-ink">{article.title}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{article.category}</td>
                  <td className="px-4 py-3 text-xs text-ink-muted">{article.updatedAt}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-2xs uppercase tracking-wider rounded px-1.5 py-0.5 ${STATUS_CLS[article.status]}`}
                    >
                      {article.status}
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <ChevronDown
                      className={`size-3.5 text-ink-soft transition-transform ${isOpen ? "rotate-180" : ""}`}
                    />
                  </td>
                </tr>
                {isOpen && (
                  <tr className={i < articles.length - 1 ? "border-b border-line/40" : ""}>
                    <td colSpan={5} className="px-6 py-4 bg-canvas">
                      <p className="text-sm text-ink-muted leading-relaxed">
                        This article covers <strong className="text-ink">{article.title}</strong> in the{" "}
                        <em>{article.category}</em> category. Content will appear here once this article is
                        authored and published. Use the editor to add steps, screenshots, and related links.
                      </p>
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
