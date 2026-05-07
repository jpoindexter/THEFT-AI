"use client";

import { useEffect, useState } from "react";
import { Upload, Search } from "lucide-react";

type Artifact = {
  id: string;
  name: string;
  kind: string;
  pinned: boolean;
  department_id: string | null;
  created_at: string;
};

type Department = { id: string; slug: string; name: string };

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

export default function LibraryTab({
  organization,
}: {
  organization: { id: string; slug: string };
}) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [artifacts, setArtifacts] = useState<Artifact[]>([]);
  const [q, setQ] = useState("");

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
    <div className="flex-1 overflow-y-auto p-4 space-y-4 text-base">
      <div className="flex items-center justify-between">
        <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft">
          Library
        </div>
        <button className="text-xs inline-flex items-center gap-1 rounded-md border border-line bg-paper px-2 py-0.5 hover:border-line-strong">
          <Upload className="size-3" />
          Upload file
        </button>
      </div>
      <div className="flex items-center gap-2 rounded-md border border-line/80 bg-paper px-2 py-1">
        <Search className="size-3 text-ink-soft" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search files"
          className="text-sm focus:outline-none w-full"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        {departments.map((d) => {
          const count = artifacts.filter((a) => a.department_id === d.id).length;
          return (
            <a
              key={d.id}
              href={`/${organization.slug}/${d.slug}`}
              className="rounded-lg border border-line/80 overflow-hidden bg-paper hover:border-line-strong transition-colors"
            >
              <div
                className="aspect-[16/9]"
                style={{ background: COVER[d.slug] ?? "#f5f4f0" }}
              />
              <div className="px-2 py-1.5 text-xs flex items-center justify-between">
                <span>{d.name}</span>
                <span className="text-ink-soft">{count}</span>
              </div>
            </a>
          );
        })}
      </div>

      {artifacts.length > 0 && (
        <div>
          <div className="text-2xs uppercase tracking-[0.12em] text-ink-soft mb-1.5">
            Recent files
          </div>
          <ul className="space-y-1">
            {artifacts
              .filter((a) => !q || a.name.toLowerCase().includes(q.toLowerCase()))
              .slice(0, 8)
              .map((a) => (
                <li
                  key={a.id}
                  className="rounded-md border border-line/80 bg-paper px-2 py-1 text-sm flex items-center justify-between"
                >
                  <span>{a.name}</span>
                  <span className="text-2xs text-ink-muted uppercase">
                    {a.kind}
                  </span>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
