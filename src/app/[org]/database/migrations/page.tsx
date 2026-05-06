import { FileText, CheckCircle2, ArrowRight } from "lucide-react";
import {
  Card,
  Eyebrow,
  PageTitle,
  Pill,
  Hint,
} from "@/components/ui/primitives";
import Link from "next/link";

const MIGRATIONS = [
  {
    id: "0014",
    name: "0014_add_subscriptions",
    when: "2026-05-06 14:22",
    by: "Engineer",
    status: "pending" as const,
    summary: "Adds subscriptions table with FK to auth.users.",
  },
  {
    id: "0013",
    name: "0013_drop_legacy_session_token",
    when: "2026-05-04 09:11",
    by: "Engineer",
    status: "applied" as const,
    summary: "Drops session_token column after rotation.",
  },
  {
    id: "0012",
    name: "0012_add_org_billing_email",
    when: "2026-05-02 17:48",
    by: "Engineer",
    status: "applied" as const,
    summary: "Adds organizations.billing_email (nullable).",
  },
];

export default async function MigrationsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  return (
    <div className="space-y-4">
      <header>
        <PageTitle className="text-md font-medium inline-flex items-center gap-2">
          <FileText className="size-4 text-ink-muted" /> Migrations
        </PageTitle>
        <Hint>
          Each migration is reversible and tracked in source control. The
          Engineer applies them via PRs.
        </Hint>
      </header>
      <Card>
        <ul className="divide-y divide-line/60">
          {MIGRATIONS.map((m) => (
            <MigrationRow key={m.id} org={org} m={m} />
          ))}
        </ul>
      </Card>
    </div>
  );
}

function MigrationRow({
  org,
  m,
}: {
  org: string;
  m: {
    id: string;
    name: string;
    when: string;
    by: string;
    status: "pending" | "applied";
    summary: string;
  };
}) {
  return (
    <li>
      <Link
        href={`/${org}/database/migrations/${m.name}`}
        className="px-4 py-3 flex items-start justify-between gap-3 hover:bg-canvas"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <code className="text-sm font-mono text-ink">{m.name}</code>
            {m.status === "applied" && (
              <CheckCircle2 className="size-3 text-sage-ink" />
            )}
          </div>
          <Eyebrow className="lowercase tracking-normal mt-0.5 normal-case">
            {m.when} · {m.by}
          </Eyebrow>
          <p className="text-sm text-ink mt-1">{m.summary}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Pill tone={m.status === "applied" ? "sage" : "mustard"}>
            {m.status}
          </Pill>
          <span className="text-xs inline-flex items-center gap-1 text-ink-muted">
            Open <ArrowRight className="size-3" />
          </span>
        </div>
      </Link>
    </li>
  );
}
