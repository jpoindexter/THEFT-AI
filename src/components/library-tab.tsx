"use client";

import { useEffect, useState } from "react";
import { Upload, Search, Grid2x2, AlignJustify, X, Folder, ChevronDown, ChevronRight } from "lucide-react";
import { PreviewScene } from "@/components/org-chart-preview";

type Artifact = {
  id: string;
  name: string;
  kind: string;
  pinned: boolean;
  department_id: string | null;
  created_at: string;
};

type Department = { id: string; slug: string; name: string };

const VALID_SCENES = new Set(["engineering","design","marketing","sales","operations","finance","legal","support"]);

type ViewMode = "gallery" | "files";

export default function LibraryTab({
  organization,
}: {
  organization: { id: string; slug: string };
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [q, setQ] = useState("");
  const [view, setView] = useState<ViewMode>("gallery");
  const [bannerDismissed, setBannerDismissed] = useState(false);

  useEffect(() => {
    void Promise.all([
      fetch(`/api/${organization.slug}/departments`).then((r) => r.json()),
      fetch(`/api/${organization.slug}/artifacts`).then((r) => r.json()),
    ]).then(([d, a]) => {
      setDepartments(d.departments ?? []);
      setArtifacts(a.artifacts ?? []);
    });
  }, [organization.slug]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 text-base">
      <div className="flex items-center gap-2">
        <span className="text-base tracking-tight text-ink flex-1">Library</span>
        <button
          type="button"
          onClick={() => setView("gallery")}
          aria-label="Gallery view"
          className={`size-6 inline-flex items-center justify-center rounded transition-colors ${view === "gallery" ? "text-ink" : "text-ink-muted hover:text-ink"}`}
        >
          <Grid2x2 className="size-3.5" />
        </button>
        <button
          type="button"
          onClick={() => setView("files")}
          aria-label="File view"
          className={`size-6 inline-flex items-center justify-center rounded transition-colors ${view === "files" ? "text-ink" : "text-ink-muted hover:text-ink"}`}
        >
          <AlignJustify className="size-3.5" />
        </button>
        <button
          type="button"
          className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong"
        >
          <Upload className="size-3" />
          Upload file
        </button>
      </div>

      <p className="text-xs text-ink-muted leading-snug">
        Your agents save their work here and are automatically referenced in future tasks unless archived.
      </p>

      <div className="flex items-center gap-1.5 rounded-md border border-line/80 bg-paper px-2 py-1">
        <Search className="size-3 text-ink-soft shrink-0" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files"
          className="text-sm focus:outline-none w-full bg-transparent"
        />
      </div>

      {!bannerDismissed && (
        <div className="rounded-lg border border-line/80 bg-paper p-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink">
              Bring over ChatGPT or Claude context
            </div>
            <p className="text-xs text-ink-muted mt-0.5 leading-snug">
              Copy a prompt that turns old chats, decisions, and assistant preferences into Import-ready Plaintext.
            </p>
            <button
              type="button"
              className="mt-2 text-xs rounded-md border border-line bg-paper px-2.5 py-1 hover:border-line-strong"
            >
              Copy prompt
            </button>
          </div>
          <button
            type="button"
            onClick={() => setBannerDismissed(true)}
            className="shrink-0 text-ink-soft hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="size-3.5" />
          </button>
        </div>
      )}

      {view === "gallery" ? (
        <GalleryView
          departments={departments}
          artifacts={artifacts}
          q={q}
          orgSlug={organization.slug}
        />
      ) : (
        <FilesView
          departments={departments}
          artifacts={artifacts}
          q={q}
        />
      )}
    </div>
  );
}

function GalleryView({
  departments,
  artifacts,
  q,
  orgSlug,
}: {
  departments: Department[];
  artifacts: Artifact[];
  q: string;
  orgSlug: string;
}) {
  const filtered = q
    ? departments.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()))
    : departments;

  return (
    <div className="grid grid-cols-2 gap-2">
      {filtered.map((d) => {
        const count = artifacts.filter((a) => a.department_id === d.id).length;
        const scene = VALID_SCENES.has(d.slug)
          ? (d.slug as Parameters<typeof PreviewScene>[0]["scene"])
          : "engineering";
        return (
          <a
            key={d.id}
            href={`/${orgSlug}/${d.slug}`}
            className="rounded-lg border border-line/80 overflow-hidden bg-canvas hover:border-line-strong transition-colors"
          >
            <div className="aspect-[16/9] relative">
              <PreviewScene scene={scene} />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />
              <div className="absolute bottom-1 left-2 text-xs font-medium text-white/90 drop-shadow">
                {d.name}
              </div>
              {count > 0 && (
                <div className="absolute top-1.5 right-1.5 text-2xs bg-black/40 text-white rounded px-1">
                  {count}
                </div>
              )}
            </div>
          </a>
        );
      })}
    </div>
  );
}

function FilesView({
  departments,
  artifacts,
  q,
}: {
  departments: Department[];
  artifacts: Artifact[];
  q: string;
}) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const generalArtifacts = artifacts.filter((a) => !a.department_id);

  const allDepts: { id: string; slug: string; name: string; files: Artifact[] }[] = [
    {
      id: "general",
      slug: "general",
      name: "general",
      files: generalArtifacts,
    },
    ...departments.map((d) => ({
      id: d.id,
      slug: d.slug,
      name: d.slug,
      files: artifacts.filter((a) => a.department_id === d.id),
    })),
  ];

  const filtered = q
    ? allDepts.map((d) => ({
        ...d,
        files: d.files.filter((f) =>
          f.name.toLowerCase().includes(q.toLowerCase()),
        ),
      }))
    : allDepts;

  return (
    <div className="space-y-0.5">
      {filtered.map((d) => {
        const isOpen = expanded.has(d.id);
        return (
          <div key={d.id}>
            <button
              type="button"
              onClick={() => toggle(d.id)}
              className="w-full flex items-center gap-1.5 px-1 py-1 hover:bg-canvas rounded text-sm text-ink"
            >
              {isOpen ? (
                <ChevronDown className="size-3 text-ink-muted shrink-0" />
              ) : (
                <ChevronRight className="size-3 text-ink-muted shrink-0" />
              )}
              <Folder className="size-3 text-ink-muted shrink-0" />
              <span className="flex-1 text-left">{d.name}</span>
              <span className="text-2xs text-ink-soft">{d.files.length || ""}</span>
            </button>
            {isOpen && d.files.length > 0 && (
              <ul className="pl-7 space-y-0.5">
                {d.files.map((f) => (
                  <li
                    key={f.id}
                    className="flex items-center gap-1.5 px-1 py-1 hover:bg-canvas rounded text-xs text-ink"
                  >
                    <span className="size-3 shrink-0 text-ink-muted">
                      <svg viewBox="0 0 12 14" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="size-3">
                        <path d="M2 1h5l3 3v9H2z" />
                        <path d="M7 1v3h3" />
                      </svg>
                    </span>
                    <span className="truncate flex-1">{f.name}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
