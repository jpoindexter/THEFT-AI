import { promises as fs } from "node:fs";
import path from "node:path";
import { db, type Agent, type Department, type Org, type Task } from "@/lib/db/store";
import {
  createPaperclipClient,
  paperclipSyncEnabled,
  type PaperclipAgent,
  type PaperclipCompany,
  type PaperclipGoal,
} from "@/lib/paperclip-engine/client";

export type PaperclipSyncResult = {
  enabled: boolean;
  synced: boolean;
  companyId: string | null;
  goalId: string | null;
  operatorAgentId: string | null;
  createdAgents: number;
  createdIssues: number;
  missingSkills: string[];
  error: string | null;
};

const EMPTY_RESULT: PaperclipSyncResult = {
  enabled: false,
  synced: false,
  companyId: null,
  goalId: null,
  operatorAgentId: null,
  createdAgents: 0,
  createdIssues: 0,
  missingSkills: [],
  error: null,
};

const ROLE_MAP: Record<string, string> = {
  engineer: "engineer",
  designer: "designer",
  qa: "qa",
  devops: "devops",
  researcher: "researcher",
};

export async function syncWorkspaceToPaperclip(
  org: Org,
  plan: Record<string, unknown>,
): Promise<PaperclipSyncResult> {
  if (!paperclipSyncEnabled()) return EMPTY_RESULT;

  const client = createPaperclipClient();
  try {
    const health = await client.health();
    if (health.status !== "ok") {
      return unavailable(`Paperclip health returned ${health.status}`);
    }

    const company = await ensureCompany(org, plan);
    const goal = await ensureCompanyGoal(company, org, plan);
    const operator = await ensureOperator(company, org);
    const [departments, agents, tasks] = await Promise.all([
      db.listDepartments(org.id),
      db.listAgents(org.id),
      db.listTasks(org.id),
    ]);
    const missingSkills = await collectMissingSkills(agents);
    const agentResult = await ensureDepartmentAgents(company, operator, departments, agents);
    const issueResult = await ensureStarterIssues(company, goal, departments, tasks);

    await db.updateOrg(org.id, {
      paperclip_company_id: company.id,
      paperclip_goal_id: goal.id,
      paperclip_operator_agent_id: operator.id,
    });

    return {
      enabled: true,
      synced: true,
      companyId: company.id,
      goalId: goal.id,
      operatorAgentId: operator.id,
      createdAgents: agentResult.created,
      createdIssues: issueResult.created,
      missingSkills,
      error: null,
    };
  } catch (error) {
    return unavailable(error instanceof Error ? error.message : "Paperclip sync failed");
  }

  async function ensureCompany(
    currentOrg: Org,
    businessPlan: Record<string, unknown>,
  ): Promise<PaperclipCompany> {
    if (currentOrg.paperclip_company_id) {
      try {
        return await client.getCompany(currentOrg.paperclip_company_id);
      } catch {
        // Fall through and recreate when the stored link points at a missing Paperclip company.
      }
    }

    return client.createCompany({
      name: currentOrg.name,
      description: summarizePlan(businessPlan),
    });
  }

  async function ensureCompanyGoal(
    company: PaperclipCompany,
    currentOrg: Org,
    businessPlan: Record<string, unknown>,
  ): Promise<PaperclipGoal> {
    if (currentOrg.paperclip_goal_id) {
      const existing = (await client.listGoals(company.id)).find((g) => g.id === currentOrg.paperclip_goal_id);
      if (existing) return existing;
    }

    const goals = await client.listGoals(company.id);
    const existing = goals.find((g) => g.level === "company" && g.title === goalTitle(currentOrg));
    if (existing) return existing;

    return client.createGoal(company.id, {
      title: goalTitle(currentOrg),
      description: String(businessPlan.mission ?? businessPlan.product_or_service ?? ""),
      level: "company",
      status: "active",
    });
  }

  async function ensureOperator(company: PaperclipCompany, currentOrg: Org): Promise<PaperclipAgent> {
    if (currentOrg.paperclip_operator_agent_id) {
      const existing = (await client.listAgents(company.id)).find((a) => a.id === currentOrg.paperclip_operator_agent_id);
      if (existing) return existing;
    }

    const agents = await client.listAgents(company.id);
    const existing = agents.find((a) => a.name === "Operator");
    if (existing) return existing;

    return client.createAgent(company.id, {
      name: "Operator",
      role: "ceo",
      title: "Operator",
      capabilities: "Owns company setup, planning, approvals, and delegation across department agents.",
      adapterType: "process",
      adapterConfig: { command: "true" },
      budgetMonthlyCents: 0,
      permissions: { canCreateAgents: true, canAssignTasks: true },
      metadata: {
        theftOrgId: currentOrg.id,
        theftOrgSlug: currentOrg.slug,
        theftRole: "operator",
        desiredSkills: ["ops-agent-skills"],
      },
    });
  }

  async function ensureDepartmentAgents(
    company: PaperclipCompany,
    operator: PaperclipAgent,
    departments: Department[],
    localAgents: Agent[],
  ): Promise<{ created: number }> {
    const existingAgents = await client.listAgents(company.id);
    let created = 0;

    for (const localAgent of localAgents) {
      const department = departments.find((d) => d.id === localAgent.department_id);
      const name = localAgent.name || department?.name || localAgent.slug;
      if (existingAgents.some((a) => a.name === name)) continue;

      await client.createAgent(company.id, {
        name,
        role: ROLE_MAP[localAgent.role] ?? "general",
        title: localAgent.title ?? department?.name ?? localAgent.role,
        reportsTo: operator.id,
        capabilities: localAgent.capabilities,
        adapterType: "process",
        adapterConfig: { command: "true" },
        budgetMonthlyCents: 0,
        metadata: {
          theftOrgId: org.id,
          theftAgentId: localAgent.id,
          theftDepartmentSlug: department?.slug ?? null,
          desiredSkills: localAgent.attached_skills,
        },
      });
      created += 1;
    }

    return { created };
  }

  async function ensureStarterIssues(
    company: PaperclipCompany,
    goal: PaperclipGoal,
    departments: Department[],
    localTasks: Task[],
  ): Promise<{ created: number }> {
    const existingIssues = await client.listIssues(company.id);
    let created = 0;

    for (const task of localTasks) {
      if (existingIssues.some((issue) => issue.title === task.title)) continue;
      const department = departments.find((d) => d.id === task.department_id);
      await client.createIssue(company.id, {
        title: task.title,
        description: [
          task.description,
          department ? `THEFT department: ${department.name}` : null,
        ].filter(Boolean).join("\n\n"),
        status: "backlog",
        priority: mapPriority(task.priority),
        goalId: goal.id,
        assigneeAgentId: null,
      });
      created += 1;
    }

    return { created };
  }
}

function unavailable(error: string): PaperclipSyncResult {
  return {
    ...EMPTY_RESULT,
    enabled: true,
    error,
  };
}

function goalTitle(org: Org): string {
  return `Build ${org.name}`;
}

function summarizePlan(plan: Record<string, unknown>): string {
  const parts = [
    plan.product_or_service,
    plan.icp ? `for ${plan.icp}` : null,
    plan.offer ? `via ${plan.offer}` : null,
  ].filter(Boolean);
  return parts.join(" ").slice(0, 500);
}

function mapPriority(priority: Task["priority"]): "critical" | "high" | "medium" | "low" {
  if (priority === "urgent") return "critical";
  if (priority === "high") return "high";
  if (priority === "low") return "low";
  return "medium";
}

async function collectMissingSkills(agents: Agent[]): Promise<string[]> {
  const slugs = new Set(agents.flatMap((agent) => agent.attached_skills));
  const missing: string[] = [];
  await Promise.all(
    [...slugs].map(async (slug) => {
      const candidates = [
        path.join(process.cwd(), "skills", slug, "SKILL.md"),
        path.join(process.cwd(), "..", "skills", slug, "SKILL.md"),
      ];
      const exists = await Promise.any(
        candidates.map(async (candidate) => {
          await fs.access(candidate);
          return true;
        }),
      ).catch(() => false);
      if (!exists) {
        missing.push(slug);
      }
    }),
  );
  return missing.sort();
}
