import { db } from "@/lib/db/store";
import BrandKitFlow from "@/components/brand-kit-flow";
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

  return <BrandKitFlow orgSlug={orgSlug} vibes={vibes} />;
}
