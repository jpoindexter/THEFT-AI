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
          className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to library
        </Link>

        <header className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[10px] uppercase tracking-wider text-ink-soft">
              {artifact.kind}
              {dept && ` · ${dept.name}`}
            </div>
            <h1 className="text-xl tracking-tight truncate">{artifact.name}</h1>
            <p className="text-[11px] text-ink-muted mt-1">
              Created {new Date(artifact.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              <Pin className="size-3" />
              {artifact.pinned ? "Unpin" : "Pin"}
            </button>
            <button
              type="button"
              className="inline-flex items-center gap-1 text-[11px] rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
            >
              <MessageSquare className="size-3" /> Comment
            </button>
          </div>
        </header>

        {artifact.kind === "markdown" || artifact.kind === "code" ? (
          <section className="rounded-lg border border-line/70 bg-paper p-4">
            <pre className="text-[12px] font-mono whitespace-pre-wrap leading-relaxed text-ink">
              {artifact.content ?? "(empty)"}
            </pre>
          </section>
        ) : (
          <section className="rounded-lg border border-line/70 bg-paper p-4 text-[12px] text-ink-muted">
            Binary preview not implemented for <code>{artifact.kind}</code> yet.
          </section>
        )}

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-[10px] uppercase tracking-wider text-ink-soft">
            Comments
          </div>
          <p className="text-[12px] text-ink-muted">
            No comments yet. Select text inside the artifact to start a thread.
          </p>
        </section>
      </div>
    </div>
  );
}
