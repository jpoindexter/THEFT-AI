import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db/store";
import { Search, Upload, Pin } from "lucide-react";

const COVER: Record<string, string> = {
  engineering: "linear-gradient(135deg,#fde7c0,#f5d6a8)",
  design: "linear-gradient(135deg,#e0e0e0,#bdbdbd)",
  marketing: "linear-gradient(135deg,#ffd9b5,#f3a26a)",
  sales: "linear-gradient(135deg,#d8e8d4,#a3c69a)",
  operations: "linear-gradient(135deg,#dbe1c9,#b6c2a3)",
  finance: "linear-gradient(135deg,#dfe2c2,#aab48a)",
  legal: "linear-gradient(135deg,#cfd2bd,#9ea08e)",
  support: "linear-gradient(135deg,#d5cfc1,#a89f8f)",
};

export default async function LibraryPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) notFound();
  const departments = await db.listDepartments(organization.id);
  const artifacts = await db.listArtifacts(organization.id);
  const pinned = artifacts.filter((a) => a.pinned);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-xl tracking-tight">Library</h1>
            <p className="text-[12px] text-ink-muted">
              Shared file system. Every agent in the workspace can read and
              write here.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 text-[12px]">
              <Search className="size-3 text-ink-soft" />
              <input
                placeholder="Search files"
                className="bg-transparent focus:outline-none w-40"
              />
            </div>
            <Link
              href={`/${orgSlug}/library/upload`}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-1 text-[12px] hover:border-line-strong"
            >
              <Upload className="size-3" /> Upload
            </Link>
          </div>
        </header>

        {pinned.length > 0 && (
          <section className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft inline-flex items-center gap-1">
              <Pin className="size-3" /> Pinned
            </div>
            <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
              {pinned.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/${orgSlug}/library/${a.id}`}
                    className="px-3 py-2 text-[13px] flex items-center justify-between hover:bg-canvas"
                  >
                    <span className="truncate">{a.name}</span>
                    <span className="text-[10px] text-ink-muted uppercase">
                      {a.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft mb-2">
            By department
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {departments.map((d) => {
              const count = artifacts.filter(
                (a) => a.department_id === d.id,
              ).length;
              return (
                <Link
                  key={d.id}
                  href={`/${orgSlug}/${d.slug}`}
                  className="rounded-lg border border-line/70 overflow-hidden bg-paper hover:border-line-strong transition-colors"
                >
                  <div
                    className="aspect-[16/10]"
                    style={{ background: COVER[d.slug] ?? "#f5f4f0" }}
                  />
                  <div className="p-2 text-[12px] flex items-center justify-between">
                    <span>{d.name}</span>
                    <span className="text-ink-soft">{count}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        {artifacts.length > 0 && (
          <section className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">
              All files
            </div>
            <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
              {artifacts.map((a) => (
                <li key={a.id}>
                  <Link
                    href={`/${orgSlug}/library/${a.id}`}
                    className="px-3 py-2 text-[13px] flex items-center justify-between hover:bg-canvas"
                  >
                    <span className="truncate">{a.name}</span>
                    <span className="text-[10px] text-ink-muted uppercase">
                      {a.kind}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
