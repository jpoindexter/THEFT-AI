import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, GitPullRequest, Undo2 } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
  ButtonGhost,
} from "@/components/ui/primitives";

const MIGRATIONS: Record<
  string,
  {
    name: string;
    when: string;
    by: string;
    pr: string;
    status: "pending" | "applied";
    summary: string;
    forward: string;
    reverse: string;
  }
> = {
  "0014_add_subscriptions": {
    name: "0014_add_subscriptions",
    when: "2026-05-06 14:22",
    by: "Engineer",
    pr: "#42",
    status: "pending",
    summary: "Adds subscriptions table with FK to auth.users.",
    forward: `-- Forward
create table public.subscriptions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  plan        text not null,
  status      text not null default 'active',
  created_at  timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions (user_id);`,
    reverse: `-- Reverse
drop index if exists public.subscriptions_user_id_idx;
drop table if exists public.subscriptions;`,
  },
  "0013_drop_legacy_session_token": {
    name: "0013_drop_legacy_session_token",
    when: "2026-05-04 09:11",
    by: "Engineer",
    pr: "#39",
    status: "applied",
    summary: "Drops legacy session_token column after rotation.",
    forward: `alter table public.users drop column session_token;`,
    reverse: `alter table public.users add column session_token text;`,
  },
  "0012_add_org_billing_email": {
    name: "0012_add_org_billing_email",
    when: "2026-05-02 17:48",
    by: "Engineer",
    pr: "#36",
    status: "applied",
    summary: "Adds organizations.billing_email (nullable).",
    forward: `alter table public.organizations add column billing_email text;`,
    reverse: `alter table public.organizations drop column billing_email;`,
  },
};

export default async function MigrationDetailPage({
  params,
}: {
  params: Promise<{ org: string; migration: string }>;
}) {
  const { org, migration } = await params;
  const m = MIGRATIONS[migration];
  if (!m) notFound();

  return (
    <div className="space-y-4">
      <Link
        href={`/${org}/database/migrations`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
      >
        <ArrowLeft className="size-3" /> Back to migrations
      </Link>

      <header className="flex items-start justify-between gap-3">
        <div>
          <Eyebrow>
            Migration · {m.when} · {m.by}
          </Eyebrow>
          <PageTitle>
            <code className="font-mono">{m.name}</code>
          </PageTitle>
          <Hint>{m.summary}</Hint>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <a
            href="#"
            className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
          >
            <GitPullRequest className="size-3" /> {m.pr}
          </a>
          <Pill tone={m.status === "applied" ? "sage" : "mustard"}>
            {m.status}
          </Pill>
        </div>
      </header>

      <Card>
        <CardBody>
          <Eyebrow>Forward SQL</Eyebrow>
          <pre className="mt-2 text-xs font-mono whitespace-pre-wrap leading-relaxed text-ink bg-canvas rounded-md p-3 overflow-x-auto">
            {m.forward}
          </pre>
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          <Eyebrow className="inline-flex items-center gap-1">
            <Undo2 className="size-3" /> Reverse SQL
          </Eyebrow>
          <pre className="mt-2 text-xs font-mono whitespace-pre-wrap leading-relaxed text-ink bg-canvas rounded-md p-3 overflow-x-auto">
            {m.reverse}
          </pre>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        {m.status === "applied" ? (
          <ButtonGhost className="inline-flex items-center gap-1">
            <Undo2 className="size-3" /> Roll back
          </ButtonGhost>
        ) : (
          <>
            <ButtonGhost>Decline</ButtonGhost>
            <ButtonPrimary>Apply migration</ButtonPrimary>
          </>
        )}
      </div>
    </div>
  );
}
