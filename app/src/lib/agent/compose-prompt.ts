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
  const skillIds = mergeSkillIds(agent.attached_skills, defaultSkillsForAgent(agent));

  for (const skillId of skillIds) {
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

function mergeSkillIds(...sets: (string[] | null | undefined)[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const set of sets) {
    for (const skillId of set ?? []) {
      if (seen.has(skillId)) continue;
      seen.add(skillId);
      merged.push(skillId);
    }
  }
  return merged;
}

function defaultSkillsForAgent(agent: { slug: string; name: string }): string[] {
  const key = `${agent.slug} ${agent.name}`.toLowerCase();
  if (key.includes("engineer")) return ["dev-workflow", "gic-coding-agent-skills"];
  if (key.includes("marketing")) return ["gic-skills", "content-engine", "last30days-research"];
  if (key.includes("sales")) return ["gic-skills", "company-naming", "last30days-research"];
  if (key.includes("design")) return ["web-design-guidelines"];
  if (key.includes("operations")) return ["ops-agent-skills"];
  if (key.includes("finance")) return ["finance-agent-skills"];
  if (key.includes("support")) return ["gic-skills"];
  return [];
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
