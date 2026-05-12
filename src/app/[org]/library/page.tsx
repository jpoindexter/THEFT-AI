import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import {
  PageTitle,
  Hint,
  Pill,
  Card,
  CardBody,
  SectionTitle,
} from "@/components/ui/primitives";
import { Folder, Pin, Upload, Search } from "lucide-react";
import type { Artifact } from "@/lib/db/store";

type ArtifactKind = Artifact["kind"];

const KIND_TONE: Record<ArtifactKind, React.ComponentProps<typeof Pill>["tone"]> = {
  markdown: "neutral",
  code: "mustard",
  image: "sage",
  pdf: "brick",
  json: "neutral",
  video: "neutral",
  brand_kit: "sage",
  business_plan: "neutral",
  other: "neutral",
};

export default async function LibraryIndexPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();

  const [departments, artifacts] = await Promise.all([
    db.listDepartments(organization.id),
    db.listArtifacts(organization.id),
  ]);

  const recent = [...artifacts]
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .slice(0, 10);

  const deptMap = new Map(departments.map((d) => [d.id, d.name]));

  return (
    <div className="absolute inset-0 overflow-y-auto">
      <div className="p-6 space-y-6">

        {/* Header */}
        <div className="space-y-1">
          <PageTitle>Library</PageTitle>
          <Hint>
            Shared files, documents, and generated assets. Every agent can
            access every file.
          </Hint>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-md bg-ink text-paper text-xs px-3 py-1.5 hover:opacity-90 transition-opacity"
          >
            <Upload className="size-3" />
            Upload
          </button>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 size-3 text-ink-soft pointer-events-none" />
            <input
              type="search"
              placeholder="Search files…"
              className="w-full rounded-md border border-line bg-paper text-xs text-ink pl-7 pr-3 py-1.5 placeholder:text-ink-soft focus:outline-none focus:border-line-strong"
            />
          </div>
        </div>

        {/* Department folders */}
        {departments.length > 0 && (
          <section className="space-y-3">
            <SectionTitle>Departments</SectionTitle>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {departments.map((dept) => {
                const deptArtifacts = artifacts.filter(
                  (a) => a.department_id === dept.id,
                );
                const pinnedCount = deptArtifacts.filter(
                  (a) => a.pinned,
                ).length;

                return (
                  <Link
                    key={dept.id}
                    href={`/${orgSlug}/library?dept=${dept.id}`}
                    className="group rounded-lg border border-line/70 bg-paper p-4 space-y-2 hover:border-line-strong transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="size-4 text-ink-soft shrink-0" />
                      <span className="text-sm font-medium text-ink truncate">
                        {dept.name}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-2xs text-ink-muted">
                      <span>{deptArtifacts.length} files</span>
                      {pinnedCount > 0 && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-0.5">
                            <Pin className="size-2.5" />
                            {pinnedCount} pinned
                          </span>
                        </>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent files */}
        <section className="space-y-3">
          <SectionTitle>Recent files</SectionTitle>

          {artifacts.length === 0 ? (
            <Card>
              <CardBody className="flex flex-col items-center justify-center py-12 text-center gap-2">
                <Folder className="size-8 text-ink-soft" />
                <p className="text-sm text-ink">No files yet.</p>
                <p className="text-xs text-ink-muted max-w-xs">
                  Agents save outputs here automatically. You can also upload
                  files from any task.
                </p>
              </CardBody>
            </Card>
          ) : (
            <Card>
              <ul className="divide-y divide-line/60">
                {recent.map((artifact) => {
                  const deptName = artifact.department_id
                    ? (deptMap.get(artifact.department_id) ?? "—")
                    : "—";

                  return (
                    <li key={artifact.id}>
                      <Link
                        href={`/${orgSlug}/library/${artifact.id}`}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-cream transition-colors"
                      >
                        <span className="flex-1 min-w-0 flex items-center gap-1.5">
                          {artifact.pinned && (
                            <Pin
                              className="size-3 text-ink-soft shrink-0"
                              aria-label="Pinned"
                            />
                          )}
                          <span className="text-sm text-ink truncate">
                            {artifact.name}
                          </span>
                        </span>
                        <Pill tone={KIND_TONE[artifact.kind]}>
                          {artifact.kind}
                        </Pill>
                        <span className="hidden sm:block text-xs text-ink-muted shrink-0 w-24 truncate">
                          {deptName}
                        </span>
                        <span className="text-2xs text-ink-soft shrink-0">
                          {new Date(artifact.created_at).toLocaleDateString()}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
