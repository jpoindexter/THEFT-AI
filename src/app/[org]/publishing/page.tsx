import { GitPullRequest, ExternalLink, GitBranch } from "lucide-react";
import Link from "next/link";

const TARGETS = [
  {
    slug: "app",
    label: "App",
    domain: "app.theft.ai",
    repo: "theft-app",
    branch: "main → prod",
    status: "up_to_date" as const,
  },
  {
    slug: "marketing",
    label: "Marketing Website",
    domain: "theft.ai",
    repo: "theft-marketing",
    branch: "main → prod",
    status: "behind" as const,
  },
];

export default async function PublishingPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <header>
          <h1 className="text-xl tracking-tight">Publishing</h1>
          <p className="text-[12px] text-stone-500">
            Move changes from staging to production. Each publish opens a PR
            from <code className="font-mono text-[11px]">main</code> →{" "}
            <code className="font-mono text-[11px]">prod</code>.
          </p>
        </header>

        <section className="space-y-3">
          {TARGETS.map((t) => (
            <article
              key={t.slug}
              className="rounded-lg border border-stone-200/70 bg-white p-4 space-y-3"
            >
              <header className="flex items-start justify-between">
                <div>
                  <h2 className="text-[14px] font-medium tracking-tight">
                    {t.label}
                  </h2>
                  <a
                    href={`https://${t.domain}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-stone-500 inline-flex items-center gap-1 hover:text-stone-900"
                  >
                    {t.domain}
                    <ExternalLink className="size-3" />
                  </a>
                </div>
                <span
                  className={`text-[10px] uppercase tracking-wider rounded px-1.5 py-0.5 ${
                    t.status === "up_to_date"
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-amber-100 text-amber-800"
                  }`}
                >
                  {t.status === "up_to_date" ? "Up to date" : "Behind prod"}
                </span>
              </header>
              <div className="grid grid-cols-3 gap-3 text-[11px]">
                <Stat icon={<GitBranch className="size-3" />} label="Repo" value={t.repo} />
                <Stat icon={<GitPullRequest className="size-3" />} label="Branch flow" value={t.branch} />
                <Stat icon={<ExternalLink className="size-3" />} label="Domain" value={t.domain} />
              </div>
              <div className="flex justify-end gap-2">
                <Link
                  href={`/${org}/${t.slug === "app" ? "engineering" : "marketing"}`}
                  className="text-[11px] rounded-md border border-stone-200 bg-white px-2 py-1 hover:border-stone-400"
                >
                  Open department
                </Link>
                <Link
                  href={`/${org}/publishing/${t.slug}`}
                  aria-disabled={t.status === "up_to_date"}
                  className={`text-[11px] rounded-md bg-stone-900 text-white px-2 py-1 ${
                    t.status === "up_to_date"
                      ? "opacity-40 pointer-events-none"
                      : ""
                  }`}
                >
                  Publish to prod
                </Link>
              </div>
            </article>
          ))}
        </section>
      </div>
    </div>
  );
}

function Stat({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-md border border-stone-200/70 px-2 py-1.5">
      <div className="text-[10px] text-stone-500 inline-flex items-center gap-1">
        {icon}
        {label}
      </div>
      <div className="font-mono text-[11px] mt-0.5">{value}</div>
    </div>
  );
}
