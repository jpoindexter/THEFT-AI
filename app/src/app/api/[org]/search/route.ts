import { NextResponse } from "next/server";
import { db } from "@/lib/db/store";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ org: string }> },
) {
  const { org } = await params;
  const o = await db.getOrgBySlug(org);
  if (!o) return NextResponse.json({ error: "not found" }, { status: 404 });

  const q = new URL(req.url).searchParams.get("q")?.toLowerCase() ?? "";

  const [tasks, agents, artifacts] = await Promise.all([
    db.listTasks(o.id),
    db.listAgents(o.id),
    db.listArtifacts(o.id),
  ]);

  type Result = { kind: string; id: string; title: string; sub: string; href: string };
  const results: Result[] = [];

  for (const t of tasks) {
    if (!q || t.title.toLowerCase().includes(q) || (t.description ?? "").toLowerCase().includes(q)) {
      results.push({
        kind: "task",
        id: t.id,
        title: t.title,
        sub: `${t.status} · ${t.priority}`,
        href: `/${org}/tasks/${t.id}`,
      });
    }
  }

  for (const a of agents) {
    if (!q || a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q)) {
      results.push({
        kind: "agent",
        id: a.id,
        title: a.name,
        sub: `${a.role} · ${a.status}`,
        href: `/${org}/agents/${a.slug}`,
      });
    }
  }

  for (const a of artifacts) {
    if (!q || a.name.toLowerCase().includes(q) || a.kind.toLowerCase().includes(q)) {
      results.push({
        kind: "artifact",
        id: a.id,
        title: a.name,
        sub: `${a.kind}${a.pinned ? " · pinned" : ""}`,
        href: `/${org}/library/${a.id}`,
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, 50) });
}
