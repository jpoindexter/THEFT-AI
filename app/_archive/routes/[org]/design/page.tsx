import { db } from "@/lib/db/store";
import BrandKitFlow from "@/components/brand-kit-flow";
import TaskContextBar from "@/components/task/task-context-bar";
import { DesignLaunchers } from "@/components/design-launchers";
import { PreviewScene } from "@/components/org-chart-preview";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { GeneratedKit } from "@/components/brand-kit-flow";

export const dynamic = "force-dynamic";

export default async function DesignPage({
  params,
}: {
  params: Promise<{ org: string }>;
}) {
  const { org: orgSlug } = await params;
  const organization = await db.getOrgBySlug(orgSlug);
  if (!organization) return null;

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
    // skills folder not present
  }

  const [departments, agents, artifacts] = await Promise.all([
    db.listDepartments(organization.id),
    db.listAgents(organization.id),
    db.listArtifacts(organization.id),
  ]);

  const designDept = departments.find((d) => d.slug === "design") ?? null;
  const designAgent = designDept
    ? agents.find((a) => a.department_id === designDept.id) ?? null
    : null;
  const agentName = designAgent?.name ?? "Design Agent";

  const brandKitArtifact = artifacts
    .filter((a) => a.kind === "brand_kit")
    .sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;

  const brandKit: GeneratedKit | null = brandKitArtifact
    ? (() => {
        try {
          return JSON.parse(brandKitArtifact.content ?? "null") as GeneratedKit;
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="absolute inset-0">
      <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
        <TaskContextBar
          organization={{ id: organization.id, slug: organization.slug }}
          agentName={agentName}
          deptSlug="design"
        />
      </div>
      {brandKit ? (
        <div className="absolute inset-0 overflow-y-auto bg-[#f5f4f0]">
          <div className="max-w-2xl mx-auto p-8 pt-16">
            <DesignLaunchers orgSlug={orgSlug} kit={brandKit} />
          </div>
        </div>
      ) : (
        <BrandKitFlow orgSlug={orgSlug} vibes={vibes} />
      )}
    </div>
  );
}
