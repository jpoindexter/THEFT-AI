import { promises as fs } from "node:fs";
import path from "node:path";
import { db, type Agent, type Artifact, type Department, type Org, type Task } from "@/lib/db/store";

const SKILLS_ROOT = path.join(process.cwd(), "..", "skills");

export type SkillReference = {
  id: string;
  slug: string;
  path: string;
  exists: boolean;
};

export type AgentPackage = {
  kind: "agent";
  slug: string;
  name: string;
  title: string | null;
  role: string;
  teamSlug: string | null;
  skills: SkillReference[];
  body: string;
};

export type TeamPackage = {
  kind: "team";
  slug: string;
  name: string;
  manager: string | null;
  agents: string[];
};

export type TaskPackage = {
  kind: "task";
  slug: string;
  title: string;
  status: Task["status"];
  assignee: string | null;
  teamSlug: string | null;
  body: string;
};

export type ArtifactPackage = {
  kind: "artifact";
  slug: string;
  name: string;
  artifactKind: Artifact["kind"];
  teamSlug: string | null;
};

export type AgentCompanyPackage = {
  schema: "agentcompanies/v1";
  kind: "company";
  slug: string;
  name: string;
  description: string;
  companyDocument: string;
  teams: TeamPackage[];
  agents: AgentPackage[];
  tasks: TaskPackage[];
  artifacts: ArtifactPackage[];
  diagnostics: {
    missingSkills: SkillReference[];
  };
};

export async function buildAgentCompanyPackage(orgId: string): Promise<AgentCompanyPackage> {
  const org = (await db.listOrgs()).find((o) => o.id === orgId);
  if (!org) throw new Error(`Organization not found: ${orgId}`);

  const [departments, agents, tasks, artifacts] = await Promise.all([
    db.listDepartments(org.id),
    db.listAgents(org.id),
    db.listTasks(org.id),
    db.listArtifacts(org.id),
  ]);

  const departmentById = new Map(departments.map((d) => [d.id, d]));
  const agentById = new Map(agents.map((a) => [a.id, a]));
  const agentPackages = await Promise.all(
    agents.map((agent) => buildAgentPackage(agent, departmentById.get(agent.department_id ?? ""))),
  );

  const teams = departments.map((department) => buildTeamPackage(department, agents));
  const taskPackages = tasks.map((task) => buildTaskPackage(task, departmentById, agentById));
  const artifactPackages = artifacts.map((artifact) => buildArtifactPackage(artifact, departmentById));
  const missingSkills = agentPackages.flatMap((agent) => agent.skills.filter((skill) => !skill.exists));

  return {
    schema: "agentcompanies/v1",
    kind: "company",
    slug: org.slug,
    name: org.name,
    description: describeCompany(org),
    companyDocument: renderCompanyDocument(org, departments, agents),
    teams,
    agents: agentPackages,
    tasks: taskPackages,
    artifacts: artifactPackages,
    diagnostics: { missingSkills },
  };
}

function buildTeamPackage(department: Department, agents: Agent[]): TeamPackage {
  const teamAgents = agents.filter((agent) => agent.department_id === department.id);
  return {
    kind: "team",
    slug: department.slug,
    name: department.name,
    manager: teamAgents[0]?.slug ?? null,
    agents: teamAgents.map((agent) => agent.slug),
  };
}

async function buildAgentPackage(agent: Agent, department?: Department): Promise<AgentPackage> {
  const skills = await Promise.all(agent.attached_skills.map(resolveSkillReference));
  return {
    kind: "agent",
    slug: agent.slug,
    name: agent.name,
    title: agent.title,
    role: agent.role,
    teamSlug: department?.slug ?? null,
    skills,
    body: agent.instructions ?? agent.capabilities ?? "",
  };
}

function buildTaskPackage(
  task: Task,
  departmentById: Map<string, Department>,
  agentById: Map<string, Agent>,
): TaskPackage {
  const department = task.department_id ? departmentById.get(task.department_id) : null;
  const agent = task.agent_id ? agentById.get(task.agent_id) : null;
  return {
    kind: "task",
    slug: slugify(task.title || task.id),
    title: task.title,
    status: task.status,
    assignee: agent?.slug ?? null,
    teamSlug: department?.slug ?? null,
    body: task.description ?? "",
  };
}

function buildArtifactPackage(
  artifact: Artifact,
  departmentById: Map<string, Department>,
): ArtifactPackage {
  const department = artifact.department_id ? departmentById.get(artifact.department_id) : null;
  return {
    kind: "artifact",
    slug: slugify(artifact.name || artifact.id),
    name: artifact.name,
    artifactKind: artifact.kind,
    teamSlug: department?.slug ?? null,
  };
}

async function resolveSkillReference(id: string): Promise<SkillReference> {
  const slug = slugify(id.split("/").at(-1) ?? id);
  const relativePath = path.join("skills", slug, "SKILL.md");
  const absolutePath = path.join(SKILLS_ROOT, slug, "SKILL.md");
  let exists = true;
  try {
    await fs.access(absolutePath);
  } catch {
    exists = false;
  }
  return {
    id,
    slug,
    path: relativePath,
    exists,
  };
}

function renderCompanyDocument(org: Org, departments: Department[], agents: Agent[]): string {
  const goals = org.goal ? `\ngoals:\n  - ${org.goal}` : "";
  const teamIncludes = departments.map((d) => `  - teams/${d.slug}/TEAM.md`).join("\n");
  const agentIncludes = agents.map((a) => `  - agents/${a.slug}/AGENTS.md`).join("\n");
  return `---\nschema: agentcompanies/v1\nkind: company\nslug: ${org.slug}\nname: ${org.name}\ndescription: ${describeCompany(org)}${goals}\nincludes:\n${teamIncludes}\n${agentIncludes}\n---\n\n${describeCompany(org)}\n`;
}

function describeCompany(org: Org): string {
  const plan = org.business_plan;
  if (plan && typeof plan === "object") {
    const mission = plan.mission;
    if (typeof mission === "string" && mission.trim()) return mission.trim();
    const product = plan.product_or_service ?? plan.product;
    if (typeof product === "string" && product.trim()) return product.trim();
  }
  return org.goal ?? `${org.name} company workspace`;
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "item";
}
