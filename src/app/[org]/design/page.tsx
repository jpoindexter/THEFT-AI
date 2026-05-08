import { db } from "@/lib/db/store";
import BrandKitFlow from "@/components/brand-kit-flow";
import TaskContextBar from "@/components/task/task-context-bar";
import { PreviewScene } from "@/components/org-chart-preview";
import { promises as fs } from "node:fs";
import path from "node:path";

export const dynamic = "force-dynamic";

export default async function DesignPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) return null;

  // load brand annotation templates from the skills library — these are the "vibes"
  const vibesDir = path.join(
    process.cwd(),
    "..",
    "skills",
    "web-design-guidelines",
    "annotation-templates",
  );
  let vibes: { id: string; name: string; description: string; palette: string[]; mood: string }[] = [];
  try {
    const files = await fs.readdir(vibesDir);
    vibes = (
      await Promise.all(
        files
          .filter((f) => f.endsWith(".json") && f !== "design-annotation-schema.json")
          .map(async (f) => {
            const raw = await fs.readFile(path.join(vibesDir, f), "utf8");
            const j = JSON.parse(raw) as {
              id?: string;
              name?: string;
              description?: string;
              vibes?: { mood?: string };
              visual?: { palette?: { dominant?: string; secondary?: string; accent?: string; text_primary?: string; text_secondary?: string } };
            };
            return {
              id: j.id ?? f,
              name: j.name ?? f.replace(".json", ""),
              description: j.description ?? "",
              mood: j.vibes?.mood ?? "",
              palette: [
                j.visual?.palette?.dominant,
                j.visual?.palette?.secondary,
                j.visual?.palette?.accent,
                j.visual?.palette?.text_primary,
              ].filter((c): c is string => Boolean(c)),
            };
          }),
      )
    ).sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    // skills folder not present — keep going with empty list
  }

  const [departments, agents, tasks] = await Promise.all([
    db.listDepartments(organization.id),
    db.listAgents(organization.id),
    db.listTasks(organization.id),
  ]);
  const designDept = departments.find((d) => d.slug === "design") ?? null;
  const designAgent = designDept ? agents.find((a) => a.department_id === designDept.id) ?? null : null;
  const hasActiveTasks = tasks.some(
    (t) => t.department_id === designDept?.id && t.status !== "done" && t.status !== "cancelled",
  );

  // Use display label — DB name "Design" maps to "Design Agent" for display
  const agentName = "Design Agent";

  return (
    <div className="absolute inset-0">
      <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
        <TaskContextBar
          organization={{ id: organization.id, slug: organization.slug }}
          agentName={agentName}
          deptSlug="design"
        />
      </div>
      {hasActiveTasks ? (
        <BrandKitFlow orgSlug={orgSlug} vibes={vibes} />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative rounded-2xl overflow-hidden w-72 aspect-[4/3] shadow-[0_8px_40px_-12px_rgba(0,0,0,0.3)] bg-canvas">
            <PreviewScene scene="design" />
            <div className="absolute inset-0 flex flex-col items-center justify-end pb-8 px-4 text-center bg-gradient-to-t from-black/60 to-transparent">
              <p className="text-white text-lg font-semibold tracking-tight drop-shadow">
                No tasks yet
              </p>
              <p className="text-white/70 text-xs mt-1 drop-shadow">
                {agentName} is ready for new tasks
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
