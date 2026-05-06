import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound } from "next/navigation";

async function loadSkill(slug: string) {
  const dir = path.join(process.cwd(), "..", "skills", slug);
  try {
    const raw = await fs.readFile(path.join(dir, "SKILL.md"), "utf8");
    const meta = parseFrontmatter(raw);
    const body = stripFrontmatter(raw);
    const files = await listFiles(dir);
    return {
      slug,
      name: meta.name ?? slug,
      description: meta.description ?? "",
      body,
      files,
    };
  } catch {
    return null;
  }
}

function parseFrontmatter(s: string): { name?: string; description?: string } {
  const m = s.match(/^---\n([\s\S]+?)\n---/);
  if (!m) return {};
  const body = m[1];
  const out: { name?: string; description?: string } = {};
  const nm = body.match(/^name:\s*(.+)$/m);
  if (nm) out.name = nm[1].trim();
  const dm = body.match(/description:\s*(?:>-?\n)?([\s\S]+?)(?=\n[a-zA-Z_-]+:|\n*$)/);
  if (dm) {
    out.description = dm[1]
      .split("\n")
      .map((l) => l.trim())
      .join(" ")
      .replace(/^["'\\]|["'\\]$/g, "")
      .trim();
  }
  return out;
}

function stripFrontmatter(s: string) {
  return s.replace(/^---\n[\s\S]+?\n---\n*/, "");
}

async function listFiles(dir: string, prefix = ""): Promise<string[]> {
  const out: string[] = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name.startsWith(".")) continue;
    const rel = prefix ? `${prefix}/${e.name}` : e.name;
    if (e.isDirectory()) {
      out.push(...(await listFiles(path.join(dir, e.name), rel)));
    } else {
      out.push(rel);
    }
  }
  return out.sort();
}

export default async function SkillDetail({
  params,
}: {
  params: Promise<{ org: string; slug: string }>;
}) {
  const { org, slug } = await params;
  const skill = await loadSkill(slug);
  if (!skill) notFound();
  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-4">
        <Link
          href={`/${org}/skills`}
          className="inline-flex items-center gap-1 text-[12px] text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to skills
        </Link>
        <header>
          <h1 className="text-xl tracking-tight">{skill.name}</h1>
          <code className="text-[11px] font-mono text-ink-soft">
            {skill.slug}
          </code>
          {skill.description && (
            <p className="text-[13px] text-ink-muted mt-2">
              {skill.description}
            </p>
          )}
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted mb-2">
            SKILL.md
          </div>
          <pre className="text-[11px] font-mono whitespace-pre-wrap leading-relaxed text-ink">
            {skill.body}
          </pre>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-muted mb-1">
            Files
          </div>
          {skill.files.map((f) => (
            <div
              key={f}
              className="flex items-center gap-2 text-[12px] font-mono text-ink"
            >
              <FileText className="size-3 text-ink-soft" />
              {f}
            </div>
          ))}
        </section>
      </div>
    </div>
  );
}
