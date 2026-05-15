import { NextResponse } from "next/server";
import { readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

const SKILLS_DIR = path.resolve(process.cwd(), "..", "skills");

type Skill = {
  slug: string;
  name: string;
  description: string;
};

function parseFrontmatter(md: string): { name?: string; description?: string } {
  if (!md.startsWith("---")) return {};
  const end = md.indexOf("\n---", 3);
  if (end < 0) return {};
  const block = md.slice(3, end).trim();
  const out: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const i = line.indexOf(":");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    out[k] = v;
  }
  return { name: out.name, description: out.description };
}

export async function GET() {
  let entries: string[];
  try {
    entries = await readdir(SKILLS_DIR);
  } catch {
    return NextResponse.json({ skills: [] });
  }

  const skills: Skill[] = [];
  for (const slug of entries) {
    if (slug.startsWith(".") || slug.startsWith("_")) continue;
    const dir = path.join(SKILLS_DIR, slug);
    let s;
    try {
      s = await stat(dir);
    } catch {
      continue;
    }
    if (!s.isDirectory()) continue;

    const skillFile = path.join(dir, "SKILL.md");
    let name = slug;
    let description = "";
    try {
      const md = await readFile(skillFile, "utf8");
      const fm = parseFrontmatter(md);
      if (fm.name) name = fm.name;
      if (fm.description) description = fm.description;
    } catch {
      // ignore — skill exists without SKILL.md
    }
    skills.push({ slug, name, description });
  }

  skills.sort((a, b) => a.slug.localeCompare(b.slug));
  return NextResponse.json({ skills });
}
