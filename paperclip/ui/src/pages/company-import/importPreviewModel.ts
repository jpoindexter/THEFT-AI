import type {
  CompanyPortabilityFileEntry,
  CompanyPortabilityPreviewResult,
} from "@paperclipai/shared";
import { sidebarPreferencesApi } from "../../api/sidebarPreferences";
import { getAgentOrderStorageKey, writeAgentOrder } from "../../lib/agent-order";
import { readZipArchive } from "../../lib/zip";
import type { ConflictItem } from "./ImportReviewSetup";

export interface LocalCompanyImportPackage {
  name: string;
  rootPath: string | null;
  files: Record<string, CompanyPortabilityFileEntry>;
}

export function ensureMarkdownPath(p: string): string {
  return p.endsWith(".md") ? p : `${p}.md`;
}

export function buildActionMap(preview: CompanyPortabilityPreviewResult): Map<string, string> {
  const map = new Map<string, string>();
  const manifest = preview.manifest;

  for (const ap of preview.plan.agentPlans) {
    const agent = manifest.agents.find((a) => a.slug === ap.slug);
    if (agent) {
      const path = ensureMarkdownPath(agent.path);
      map.set(path, ap.action);
    }
  }

  for (const pp of preview.plan.projectPlans) {
    const project = manifest.projects.find((p) => p.slug === pp.slug);
    if (project) {
      const path = ensureMarkdownPath(project.path);
      map.set(path, pp.action);
    }
  }

  for (const ip of preview.plan.issuePlans) {
    const issue = manifest.issues.find((i) => i.slug === ip.slug);
    if (issue) {
      const path = ensureMarkdownPath(issue.path);
      map.set(path, ip.action);
    }
  }

  for (const skill of manifest.skills) {
    const path = ensureMarkdownPath(skill.path);
    map.set(path, "create");
    for (const file of skill.fileInventory) {
      if (preview.files[file.path]) {
        map.set(file.path, "create");
      }
    }
  }

  if (manifest.company) {
    const path = ensureMarkdownPath(manifest.company.path);
    map.set(path, preview.plan.companyAction === "none" ? "skip" : preview.plan.companyAction);
  }

  return map;
}

export function buildConflictList(
  preview: CompanyPortabilityPreviewResult,
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  const manifest = preview.manifest;

  for (const ap of preview.plan.agentPlans) {
    if (ap.existingAgentId) {
      const agent = manifest.agents.find((a) => a.slug === ap.slug);
      conflicts.push({
        slug: ap.slug,
        kind: "agent",
        originalName: agent?.name ?? ap.slug,
        plannedName: ap.plannedName,
        filePath: agent ? ensureMarkdownPath(agent.path) : null,
        action: ap.action === "update" ? "update" : "rename",
      });
    }
  }

  for (const pp of preview.plan.projectPlans) {
    if (pp.existingProjectId) {
      const project = manifest.projects.find((p) => p.slug === pp.slug);
      conflicts.push({
        slug: pp.slug,
        kind: "project",
        originalName: project?.name ?? pp.slug,
        plannedName: pp.plannedName,
        filePath: project ? ensureMarkdownPath(project.path) : null,
        action: pp.action === "update" ? "update" : "rename",
      });
    }
  }

  return conflicts;
}

export function deriveSourcePrefix(
  sourceMode: string,
  importUrl: string,
  localPackageName: string | null,
  localRootPath: string | null,
): string | null {
  if (sourceMode === "local") {
    if (localRootPath) return localRootPath.split("/").pop() ?? null;
    if (!localPackageName) return null;
    return localPackageName.replace(/\.zip$/i, "") || null;
  }
  if (sourceMode === "github") {
    const url = importUrl.trim();
    if (!url) return null;
    try {
      const pathname = new URL(url.startsWith("http") ? url : `https://${url}`).pathname;
      const segments = pathname.split("/").filter(Boolean);
      return segments.length > 0 ? segments[segments.length - 1] : null;
    } catch {
      return null;
    }
  }
  return null;
}

export function prefixedName(prefix: string | null, originalName: string): string {
  if (!prefix) return originalName;
  return `${prefix}-${originalName}`;
}

export async function applyImportedSidebarOrder(
  preview: CompanyPortabilityPreviewResult | null,
  result: {
    company: { id: string };
    agents: Array<{ slug: string; id: string | null }>;
    projects: Array<{ slug: string; id: string | null }>;
  },
  userId: string | null | undefined,
) {
  const sidebar = preview?.manifest.sidebar;
  if (!sidebar) return;
  if (!userId?.trim()) return;

  const agentIdBySlug = new Map(
    result.agents
      .filter((agent): agent is { slug: string; id: string } => typeof agent.id === "string" && agent.id.length > 0)
      .map((agent) => [agent.slug, agent.id]),
  );
  const projectIdBySlug = new Map(
    result.projects
      .filter((project): project is { slug: string; id: string } => typeof project.id === "string" && project.id.length > 0)
      .map((project) => [project.slug, project.id]),
  );

  const orderedAgentIds = sidebar.agents
    .map((slug) => agentIdBySlug.get(slug))
    .filter((id): id is string => Boolean(id));
  const orderedProjectIds = sidebar.projects
    .map((slug) => projectIdBySlug.get(slug))
    .filter((id): id is string => Boolean(id));

  if (orderedAgentIds.length > 0) {
    writeAgentOrder(getAgentOrderStorageKey(result.company.id, userId), orderedAgentIds);
  }
  if (orderedProjectIds.length > 0) {
    await sidebarPreferencesApi.updateProjectOrder(result.company.id, { orderedIds: orderedProjectIds });
  }
}

export async function readLocalPackageZip(file: File): Promise<LocalCompanyImportPackage> {
  if (!/\.zip$/i.test(file.name)) {
    throw new Error("Select a .zip company package.");
  }
  const archive = await readZipArchive(await file.arrayBuffer());
  if (Object.keys(archive.files).length === 0) {
    throw new Error("No package files were found in the selected zip archive.");
  }
  return {
    name: file.name,
    rootPath: archive.rootPath,
    files: archive.files,
  };
}
