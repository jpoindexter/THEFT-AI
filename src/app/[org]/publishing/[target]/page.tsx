"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import {
  ArrowLeft,
  GitPullRequest,
  ExternalLink,
  GitCommit,
} from "lucide-react";

const TARGETS: Record<
  string,
  {
    label: string;
    domain: string;
    repo: string;
    commits: { sha: string; msg: string; by: string; when: string }[];
  }
> = {
  app: {
    label: "App",
    domain: "app.theft.ai",
    repo: "theft-app",
    commits: [
      {
        sha: "8a3f1c0",
        msg: "feat: per-agent inbox addresses",
        by: "Engineer",
        when: "2h",
      },
      {
        sha: "7b1e892",
        msg: "fix: regression on org canvas pan",
        by: "Engineer",
        when: "5h",
      },
    ],
  },
  marketing: {
    label: "Marketing Website",
    domain: "theft.ai",
    repo: "theft-marketing",
    commits: [
      {
        sha: "c10aa22",
        msg: "copy: tighten hero",
        by: "Marketing",
        when: "1h",
      },
      {
        sha: "b9e0014",
        msg: "design: new pricing block",
        by: "Design",
        when: "1d",
      },
      {
        sha: "f001234",
        msg: "feat: add /security page",
        by: "Engineer",
        when: "1d",
      },
    ],
  },
};

export default function PublishTargetPage() {
  const params = useParams<{ org: string; target: string }>();
  const target = TARGETS[params.target];
  const [title, setTitle] = useState(`Publish ${params.target}`);
  const [body, setBody] = useState(
    "Includes:\n- ${changes summarised by agent}\n\nRollback plan: revert PR.",
  );

  if (!target) {
    return (
      <div className="absolute inset-0 grid place-items-center text-[12px] text-stone-500">
        Unknown publish target.
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/publishing`}
          className="inline-flex items-center gap-1 text-[12px] text-stone-500 hover:text-stone-900"
        >
          <ArrowLeft className="size-3" /> Back to publishing
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400">
              Publishing
            </div>
            <h1 className="text-xl tracking-tight">{target.label}</h1>
            <a
              href={`https://${target.domain}`}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-stone-500 inline-flex items-center gap-1 hover:text-stone-900 mt-1"
            >
              {target.domain}
              <ExternalLink className="size-3" />
            </a>
          </div>
          <span className="text-[10px] uppercase tracking-wider rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">
            {target.commits.length} commits ahead
          </span>
        </header>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-2">
          <div className="text-[14px] font-medium tracking-tight">
            Changes since prod
          </div>
          <ul className="divide-y divide-stone-100">
            {target.commits.map((c) => (
              <li key={c.sha} className="py-2 flex items-start gap-3">
                <GitCommit className="size-3.5 text-stone-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-[13px]">{c.msg}</div>
                  <div className="text-[10px] text-stone-500 font-mono">
                    {c.sha} · {c.by} · {c.when} ago
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3">
          <div className="text-[14px] font-medium tracking-tight inline-flex items-center gap-2">
            <GitPullRequest className="size-4 text-stone-500" />
            Open publish PR
          </div>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full h-9 rounded-md border border-stone-200 bg-white px-3 text-[13px] focus:outline-none focus:border-stone-400"
          />
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={6}
            className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-[12px] font-mono focus:outline-none focus:border-stone-400"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="text-[12px] rounded-md border border-stone-200 bg-white px-3 py-1.5 hover:border-stone-400"
            >
              Save as draft
            </button>
            <button
              type="button"
              className="text-[12px] rounded-md bg-stone-900 text-white px-3 py-1.5"
            >
              Open PR &rarr; prod
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
