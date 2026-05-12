import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { ArrowLeft, Pin, MessageSquare } from "lucide-react";

export default async function ArtifactDetailPage({
  params,
}: {
  params: Promise<{ org: string; artifact: string }>;
}) {
  const { org: orgSlug, artifact: artifactId } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const artifacts = await db.listArtifacts(organization.id);
  const artifact = artifacts.find((a) => a.id === artifactId);
  if (!artifact) notFound();
  const departments = await db.listDepartments(organization.id);
  const dept = artifact.department_id
    ? departments.find((d) => d.id === artifact.department_id)
    : null;

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${orgSlug}/library`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to library
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-2xs uppercase tracking-wider text-ink-soft">
              {artifact.kind}
              {dept && ` · ${dept.name}`}
            </div>
            <h1 className="text-xl tracking-tight truncate">{artifact.name}</h1>
            <p className="text-xs text-ink-muted mt-1">
              Created {new Date(artifact.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              <Pin className="size-3" />
              {artifact.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              <MessageSquare className="size-3" /> Comment
            </button>
          </div>
        </header>

        {artifact.kind === "markdown" || artifact.kind === "code" ? (
          <section className="rounded-lg border border-line/70 bg-paper p-4">
            <pre className="text-sm font-mono whitespace-pre-wrap leading-relaxed text-ink">
              {artifact.content ?? "(empty)"}
            </pre>
          </section>
        ) : (
          <section className="rounded-lg border border-line/70 bg-paper p-4 text-sm text-ink-muted">
            Binary preview not implemented for <code>{artifact.kind}</code> yet.
          </section>
        )}

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Versions
          </div>
          <ul className="divide-y divide-line/60">
            {[
              {
                v: "v3",
                by: "Marketing",
                when: "12m ago",
                note: "Tightened opening paragraph",
                current: true,
              },
              {
                v: "v2",
                by: "Marketing",
                when: "1h ago",
                note: "Added pricing block",
                current: false,
              },
              {
                v: "v1",
                by: "Operator",
                when: "1d ago",
                note: "Initial draft",
                current: false,
              },
            ].map((row) => (
              <li
                key={row.v}
                className="py-1.5 flex items-center justify-between text-sm"
              >
                <span className="font-mono text-ink">{row.v}</span>
                <span className="text-ink-muted truncate flex-1 mx-2">
                  {row.note}
                </span>
                <span className="text-2xs text-ink-soft shrink-0">
                  {row.by} · {row.when}
                </span>
                {row.current ? (
                  <span className="ml-2 text-2xs uppercase tracking-wider rounded px-1.5 py-0.5 bg-sage/30 text-sage-ink">
                    current
                  </span>
                ) : (
                  <button className="ml-2 text-2xs rounded-md border border-line px-1.5 py-0.5 hover:border-line-strong">
                    Diff
                  </button>
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-2xs uppercase tracking-wider text-ink-soft">
            Comments
          </div>
          <p className="text-sm text-ink-muted">
            No comments yet. Select text inside the artifact to start a thread.
          </p>
        </section>
      </div>
    </div>
  );
}
