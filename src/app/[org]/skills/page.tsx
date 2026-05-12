import { promises as fs } from "node:fs";
import path from "node:path";
import Link from "next/link";

type Skill = { slug: string; name: string; description: string };

async function loadSkills(): Promise<Skill[]> {
  const dir = path.join(process.cwd(), "..", "skills");
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const skills: Skill[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillPath = path.join(dir, entry.name, "SKILL.md");
      try {
        const raw = await fs.readFile(skillPath, "utf8");
        const meta = parseFrontmatter(raw);
        skills.push({
          slug: entry.name,
          name: meta.name ?? entry.name,
          description: (meta.description ?? "").slice(0, 200),
        });
      } catch {
        // skip directories without a SKILL.md
      }
    }
    return skills.sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

function parseFrontmatter(s: string): { name?: string; description?: string } {
  const m = s.match(/^---\n([\s\S]+?)\n---/);
  if (!m) return {};
  const body = m[1];
  const out: { name?: string; description?: string } = {};
  const nameMatch = body.match(/^name:\s*(.+)$/m);
  if (nameMatch) out.name = nameMatch[1].trim();
  const descMatch = body.match(/description:\s*(?:>-?\n)?([\s\S]+?)(?=\n[a-zA-Z_-]+:|\n*$)/);
  if (descMatch) {
    out.description = descMatch[1]
      .split("\n")
      .map((l) => l.trim())
      .join(" ")
      .replace(/^["'\\]|["'\\]$/g, "")
      .trim();
  }
  return out;
}

export default async function SkillsPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org } = await params;
  const skills = await loadSkills();
  return (
    <div className="absolute inset-0 overflow-y-auto p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <header className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl tracking-tight">Skills</h1>
            <p className="text-base text-ink-muted">
              Reusable guidance packages that any agent can have attached. Drop
              a skill into <code>/skills/&lt;name&gt;/SKILL.md</code> and it
              will appear here.
            </p>
          </div>
          <Link
            href={`/${org}/skills/new`}
            className="inline-flex items-center gap-1 rounded-md bg-ink text-paper px-3 py-1.5 text-sm shrink-0"
          >
            + New skill
          </Link>
        </header>
        <div className="grid grid-cols-2 gap-3">
          {skills.map((s) => (
            <Link
              href={`/${org}/skills/${s.slug}`}
              key={s.slug}
              className="rounded-lg border border-line/70 bg-paper p-3 hover:border-line-strong transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <div className="text-base font-medium tracking-tight">
                  {s.name}
                </div>
                <code className="text-2xs font-mono text-ink-soft">
                  {s.slug}
                </code>
              </div>
              <p className="text-sm text-ink-muted leading-snug line-clamp-3">
                {s.description}
              </p>
            </Link>
          ))}
          {skills.length === 0 && (
            <div className="col-span-2 rounded-md border border-line/70 bg-paper p-6 text-center text-sm text-ink-muted">
              No skills found. Add a skill at{" "}
              <code>/skills/&lt;name&gt;/SKILL.md</code>.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
