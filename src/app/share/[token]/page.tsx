import Link from "next/link";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
} from "@/components/ui/primitives";
import { Eye, Lock, ArrowRight } from "lucide-react";

const SHARE = {
  workspace: "PDF Champ",
  founder: "jpoindexter",
  goal: "Help mortgage operations cut closed-loan handoff from 14 manual steps to 1.",
  highlights: [
    {
      label: "Stage",
      value: "Identity",
      tone: "mustard" as const,
    },
    {
      label: "Headcount",
      value: "1 founder · 8 agents",
      tone: "neutral" as const,
    },
    {
      label: "Last shipped",
      value: "Subscriptions migration · 12m ago",
      tone: "sage" as const,
    },
  ],
  recent: [
    { actor: "Engineer", body: "opened PR #42 — feat/subscriptions-table" },
    { actor: "Marketing", body: "drafted Launch broadcast — May" },
    { actor: "Operations", body: "kicked routine: Weekly status brief" },
  ],
};

export default async function PublicSharePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return (
    <div className="min-h-screen bg-cream text-ink">
      <Header />
      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        <header className="space-y-1">
          <Eyebrow>
            <Eye className="size-3 inline-block mr-1" /> Read-only · token{" "}
            <code className="font-mono">{token.slice(0, 6)}…</code>
          </Eyebrow>
          <PageTitle>{SHARE.workspace}</PageTitle>
          <Hint>
            Snapshot from the {SHARE.founder} workspace. The owner can revoke
            this link at any time from Share → Anyone with the link.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Eyebrow>What we're building</Eyebrow>
            <p className="text-sm text-ink mt-2 leading-relaxed">{SHARE.goal}</p>
          </CardBody>
        </Card>

        <div className="grid grid-cols-3 gap-3">
          {SHARE.highlights.map((h) => (
            <Card key={h.label}>
              <CardBody className="!p-3">
                <Eyebrow>{h.label}</Eyebrow>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-base font-medium tracking-tight">
                    {h.value}
                  </span>
                  <Pill tone={h.tone}>{h.tone}</Pill>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card>
          <CardBody>
            <Eyebrow>Recent activity</Eyebrow>
            <ul className="divide-y divide-line/60 mt-2">
              {SHARE.recent.map((r, i) => (
                <li key={i} className="py-2 text-sm">
                  <span className="font-medium">{r.actor}</span>{" "}
                  <span className="text-ink-muted">{r.body}</span>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>

        <Card className="bg-paper">
          <CardBody className="flex items-center justify-between">
            <div>
              <div className="text-base font-medium tracking-tight inline-flex items-center gap-2">
                <Lock className="size-4 text-ink-muted" /> Want full access?
              </div>
              <Hint>
                Ask {SHARE.founder} to invite you, or start your own workspace.
              </Hint>
            </div>
            <Link
              href="/signin"
              className="text-xs inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90"
            >
              Sign in <ArrowRight className="size-3" />
            </Link>
          </CardBody>
        </Card>
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="border-b border-line/70 bg-paper">
      <div className="max-w-3xl mx-auto px-6 py-3 flex items-center justify-between text-sm">
        <Link href="/" className="inline-flex items-center gap-2 tracking-tight">
          <span className="size-3 rounded-sm bg-mustard" /> THEFT
        </Link>
        <Link
          href="/"
          className="text-xs text-ink-muted hover:text-ink"
        >
          Make your own workspace →
        </Link>
      </div>
    </div>
  );
}
