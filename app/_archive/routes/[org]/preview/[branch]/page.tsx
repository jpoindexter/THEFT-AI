import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  GitPullRequest,
  ExternalLink,
  Bug,
} from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import AgentationBar from "@/components/agentation-bar";

const PREVIEWS: Record<
  string,
  {
    branch: string;
    pr: string;
    title: string;
    url: string;
    status: "ready" | "building" | "failed";
    notes: { ts: string; from: string; body: string }[];
  }
> = {
  "feat-subscriptions-table": {
    branch: "feat/subscriptions-table",
    pr: "#42",
    title: "feat: per-agent inbox addresses + subscriptions",
    url: "https://feat-subscriptions-table-theft-app.vercel.app",
    status: "ready",
    notes: [
      {
        ts: "2m",
        from: "Engineer",
        body: "Migration applied locally. Sandbox passes.",
      },
      {
        ts: "1m",
        from: "Engineer",
        body: "Deployed preview. Awaiting your review on /pricing.",
      },
    ],
  },
  "fix-canvas-pan": {
    branch: "fix/canvas-pan",
    pr: "#41",
    title: "fix: canvas pan regression on cmd+drag",
    url: "https://fix-canvas-pan-theft-app.vercel.app",
    status: "building",
    notes: [],
  },
};

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ org: string; branch: string }>;
}) {
  const { org, branch } = await params;
  const p = PREVIEWS[branch];
  if (!p) notFound();

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-4">
        <Link
          href={`/${org}/publishing`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to publishing
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div>
            <Eyebrow>
              <GitPullRequest className="size-3 inline-block mr-1" />
              {p.pr} · <code className="font-mono">{p.branch}</code>
            </Eyebrow>
            <PageTitle className="mt-1">{p.title}</PageTitle>
            <a
              href={p.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mt-1"
            >
              {p.url} <ExternalLink className="size-3" />
            </a>
          </div>
          <Pill
            tone={
              p.status === "ready"
                ? "sage"
                : p.status === "building"
                  ? "mustard"
                  : "brick"
            }
          >
            {p.status}
          </Pill>
        </header>

        <Card>
          <div className="relative aspect-[16/10] overflow-hidden rounded-md bg-canvas">
            {p.status === "ready" ? (
              <PreviewFrame url={p.url} />
            ) : (
              <div className="absolute inset-0 grid place-items-center text-xs text-ink-muted">
                {p.status === "building"
                  ? "Building preview… this usually takes 60-90s."
                  : "Preview build failed. See logs."}
              </div>
            )}
            {p.status === "ready" && <AgentationBar />}
          </div>
        </Card>

        <Card>
          <CardBody>
            <Eyebrow>Engineer notes</Eyebrow>
            {p.notes.length === 0 ? (
              <Hint>No notes yet.</Hint>
            ) : (
              <ul className="space-y-2 mt-2">
                {p.notes.map((n, i) => (
                  <li key={i} className="text-sm">
                    <span className="text-ink-muted text-xs">
                      {n.from} · {n.ts} ago —
                    </span>{" "}
                    {n.body}
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <button className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong inline-flex items-center gap-1">
            <Bug className="size-3" /> Report issue
          </button>
          <button className="text-sm rounded-md bg-ink text-paper px-3 py-1.5">
            Approve & merge
          </button>
        </div>
      </div>
    </div>
  );
}

function PreviewFrame({ url }: { url: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-paper">
      <div className="text-center max-w-sm px-4">
        <div className="text-xs text-ink-muted">Preview iframe</div>
        <code className="text-xs font-mono break-all text-ink">{url}</code>
        <p className="text-xs text-ink-soft mt-2">
          The real preview iframe loads here once the deployment is reachable
          from this origin.
        </p>
      </div>
    </div>
  );
}
