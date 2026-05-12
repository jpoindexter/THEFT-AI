import { promises as fs } from "node:fs";
import path from "node:path";
import { db } from "@/lib/db/store";

const SKILLS_ROOT = path.join(process.cwd(), "..", "skills");
const MAX_SKILL_CHARS = 3500;
const skillCache = new Map<string, string | null>();

export function burstSkillCache(skillId: string) {
  skillCache.delete(skillId);
}

export type ComposedAgentPrompt = {
  agent: { id: string; name: string; slug: string; model: string };
  system: string;
  skillsLoaded: string[];
  skillsMissing: string[];
};

/**
 * Resolve the agent for a department slug in an org and compose the full
 * system prompt = agent.instructions + each attached skill's SKILL.md body.
 *
 * Use this in API routes that should "invoke an agent" rather than send a
 * hardcoded prompt to the LLM.
 */
export async function composeAgentPromptForDept(
  orgId: string,
  deptSlug: string,
  taskDirective: string,
): Promise<ComposedAgentPrompt | null> {
  const departments = await db.listDepartments(orgId);
  const dept = departments.find((d) => d.slug === deptSlug);
  if (!dept) return null;

  const agents = await db.listAgents(orgId);
  const agent = agents.find((a) => a.department_id === dept.id);
  if (!agent) return null;

  return composeAgentPrompt(agent, taskDirective);
}

export async function composeAgentPrompt(
  agent: { id: string; name: string; slug: string; instructions: string | null; attached_skills: string[]; model: string },
  taskDirective: string,
): Promise<ComposedAgentPrompt> {
  const skillsLoaded: string[] = [];
  const skillsMissing: string[] = [];
  const skillTexts: string[] = [];

  for (const skillId of agent.attached_skills ?? []) {
    const body = await loadSkillBody(skillId);
    if (body) {
      skillsLoaded.push(skillId);
      skillTexts.push(`## Skill: ${skillId}\n\n${body}`);
    } else {
      skillsMissing.push(skillId);
    }
  }

  const sections: string[] = [];
  if (agent.instructions) sections.push(agent.instructions.trim());
  if (skillTexts.length > 0) {
    sections.push("# Skills available to you\n\n" + skillTexts.join("\n\n---\n\n"));
  }
  sections.push(`# Current task\n\n${taskDirective.trim()}`);

  return {
    agent: { id: agent.id, name: agent.name, slug: agent.slug, model: agent.model },
    system: sections.join("\n\n---\n\n"),
    skillsLoaded,
    skillsMissing,
  };
}

async function loadSkillBody(skillId: string): Promise<string | null> {
  if (skillCache.has(skillId)) return skillCache.get(skillId) ?? null;

  const candidates = [
    path.join(SKILLS_ROOT, skillId, "SKILL.md"),
    path.join(SKILLS_ROOT, skillId, "skill.md"),
    path.join(SKILLS_ROOT, skillId + ".md"),
  ];

  for (const p of candidates) {
    try {
      const raw = await fs.readFile(p, "utf8");
      let body = stripFrontmatter(raw);
      if (body.length > MAX_SKILL_CHARS) {
        body = body.slice(0, MAX_SKILL_CHARS) + "\n\n[…skill truncated for context budget]";
      }
      skillCache.set(skillId, body);
      return body;
    } catch {
      // try next
    }
  }

  skillCache.set(skillId, null);
  return null;
}

function stripFrontmatter(raw: string): string {
  if (!raw.startsWith("---")) return raw;
  const end = raw.indexOf("\n---", 3);
  if (end < 0) return raw;
  return raw.slice(end + 4).trimStart();
}
