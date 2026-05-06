// File-backed JSON store. No DB required for local dev.
// One file per top-level table at .theft-data/<table>.json.
// Swappable for Supabase later by replacing this module.

import { promises as fs } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";

const DATA_DIR =
  process.env.THEFT_DATA_DIR ?? path.join(process.cwd(), ".theft-data");

async function readTable<T>(name: string): Promise<T[]> {
  try {
    const raw = await fs.readFile(path.join(DATA_DIR, `${name}.json`), "utf8");
    return JSON.parse(raw) as T[];
  } catch (e) {
    if ((e as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw e;
  }
}

async function writeTable<T>(name: string, rows: T[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(
    path.join(DATA_DIR, `${name}.json`),
    JSON.stringify(rows, null, 2),
  );
}

export type Org = {
  id: string;
  slug: string;
  name: string;
  goal: string | null;
  business_plan: unknown;
  created_at: string;
};

export type Department = {
  id: string;
  organization_id: string;
  slug: string;
  name: string;
  context: string | null;
  position_x: number;
  position_y: number;
};

export type Agent = {
  id: string;
  organization_id: string;
  department_id: string | null;
  slug: string;
  name: string;
  role: string;
  title: string | null;
  capabilities: string | null;
  status: "idle" | "running" | "error" | "paused" | "terminated";
  attached_skills: string[];
  instructions: string | null;
  model: string;
};

export type Task = {
  id: string;
  organization_id: string;
  department_id: string | null;
  agent_id: string | null;
  parent_task_id: string | null;
  title: string;
  description: string | null;
  status:
    | "backlog"
    | "todo"
    | "in_progress"
    | "in_review"
    | "blocked"
    | "done"
    | "cancelled";
  priority: "low" | "normal" | "high" | "urgent";
  mode: "plan" | "execute";
  result: unknown;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  organization_id: string;
  role: "user" | "assistant" | "system";
  text: string;
  created_at: string;
};

export type Artifact = {
  id: string;
  organization_id: string;
  department_id: string | null;
  task_id: string | null;
  name: string;
  kind:
    | "markdown"
    | "image"
    | "video"
    | "pdf"
    | "json"
    | "code"
    | "brand_kit"
    | "business_plan"
    | "other";
  content: string | null;
  metadata: unknown;
  pinned: boolean;
  created_at: string;
};

export type TechTreeStatus = {
  organization_id: string;
  node_id: string;
  status: "locked" | "available" | "in_progress" | "complete";
  completed_at: string | null;
};

export type TechTreeNode = {
  id: string;
  slug: string;
  stage: "idea" | "initial" | "identity" | "build" | "live" | "launch" | "scale";
  title: string;
  description: string | null;
  what_becomes_true: string | null;
  how_to_move_forward: string | null;
  position: number;
  agent_can_do_this: boolean;
  dependencies: string[]; // depends_on node ids
};

export const db = {
  // --- organizations ---
  async listOrgs(): Promise<Org[]> {
    return readTable<Org>("organizations");
  },
  async getOrgBySlug(slug: string): Promise<Org | null> {
    const all = await readTable<Org>("organizations");
    return all.find((o) => o.slug === slug) ?? null;
  },
  async createOrg(input: { name: string }): Promise<Org> {
    const all = await readTable<Org>("organizations");
    const slug = await uniqueSlug(
      all.map((o) => o.slug),
      input.name,
    );
    const org: Org = {
      id: randomUUID(),
      slug,
      name: input.name,
      goal: null,
      business_plan: null,
      created_at: new Date().toISOString(),
    };
    await writeTable("organizations", [...all, org]);
    return org;
  },
  async updateOrg(id: string, patch: Partial<Org>): Promise<void> {
    const all = await readTable<Org>("organizations");
    await writeTable(
      "organizations",
      all.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    );
  },

  // --- departments ---
  async listDepartments(orgId: string): Promise<Department[]> {
    const all = await readTable<Department>("departments");
    return all.filter((d) => d.organization_id === orgId);
  },
  async getDepartment(orgId: string, slug: string): Promise<Department | null> {
    const all = await readTable<Department>("departments");
    return all.find((d) => d.organization_id === orgId && d.slug === slug) ?? null;
  },
  async insertDepartments(rows: Omit<Department, "id">[]): Promise<Department[]> {
    const all = await readTable<Department>("departments");
    const created = rows.map((r) => ({ ...r, id: randomUUID() }));
    await writeTable("departments", [...all, ...created]);
    return created;
  },

  // --- agents ---
  async listAgents(orgId: string, departmentId?: string): Promise<Agent[]> {
    const all = await readTable<Agent>("agents");
    return all.filter(
      (a) =>
        a.organization_id === orgId &&
        (!departmentId || a.department_id === departmentId),
    );
  },
  async insertAgents(rows: Omit<Agent, "id">[]): Promise<Agent[]> {
    const all = await readTable<Agent>("agents");
    const created = rows.map((r) => ({ ...r, id: randomUUID() }));
    await writeTable("agents", [...all, ...created]);
    return created;
  },

  // --- tasks ---
  async listTasks(orgId: string, opts?: { departmentId?: string; activeOnly?: boolean }): Promise<Task[]> {
    const all = await readTable<Task>("tasks");
    return all.filter((t) => {
      if (t.organization_id !== orgId) return false;
      if (opts?.departmentId && t.department_id !== opts.departmentId)
        return false;
      if (opts?.activeOnly && t.status === "done") return false;
      return true;
    });
  },
  async createTask(input: Omit<Task, "id" | "created_at" | "updated_at">): Promise<Task> {
    const all = await readTable<Task>("tasks");
    const now = new Date().toISOString();
    const task: Task = {
      ...input,
      id: randomUUID(),
      created_at: now,
      updated_at: now,
    };
    await writeTable("tasks", [...all, task]);
    return task;
  },

  // --- cofounder messages ---
  async listMessages(orgId: string, limit = 100): Promise<Message[]> {
    const all = await readTable<Message>("cofounder_messages");
    return all
      .filter((m) => m.organization_id === orgId)
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .slice(-limit);
  },
  async appendMessage(input: Omit<Message, "id" | "created_at">): Promise<Message> {
    const all = await readTable<Message>("cofounder_messages");
    const msg: Message = {
      ...input,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    };
    await writeTable("cofounder_messages", [...all, msg]);
    return msg;
  },

  // --- artifacts ---
  async listArtifacts(orgId: string, departmentId?: string): Promise<Artifact[]> {
    const all = await readTable<Artifact>("artifacts");
    return all.filter(
      (a) =>
        a.organization_id === orgId &&
        (!departmentId || a.department_id === departmentId),
    );
  },
  async createArtifact(input: Omit<Artifact, "id" | "created_at">): Promise<Artifact> {
    const all = await readTable<Artifact>("artifacts");
    const a: Artifact = {
      ...input,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    };
    await writeTable("artifacts", [...all, a]);
    return a;
  },

  // --- tech tree ---
  async listTechTreeNodes(): Promise<TechTreeNode[]> {
    return TECH_TREE_NODES;
  },
  async listTechTreeStatus(orgId: string): Promise<TechTreeStatus[]> {
    const all = await readTable<TechTreeStatus>("tech_tree_status");
    return all.filter((s) => s.organization_id === orgId);
  },
  async seedTechTreeStatus(orgId: string): Promise<void> {
    const all = await readTable<TechTreeStatus>("tech_tree_status");
    if (all.some((s) => s.organization_id === orgId)) return;
    const seeded = TECH_TREE_NODES.map((n) => ({
      organization_id: orgId,
      node_id: n.id,
      status:
        n.slug === "initial-idea" ? ("available" as const) : ("locked" as const),
      completed_at: null,
    }));
    await writeTable("tech_tree_status", [...all, ...seeded]);
  },
};

async function uniqueSlug(existing: string[], name: string): Promise<string> {
  const base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 40) || "company";
  if (!existing.includes(base)) return base;
  for (let n = 2; n < 100; n++) {
    const candidate = `${base}-${n}`;
    if (!existing.includes(candidate)) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

// --- Tech tree node catalog (the "How to Build a Company" board) ---
function node(
  slug: string,
  stage: TechTreeNode["stage"],
  title: string,
  position: number,
  agentCanDoThis: boolean,
  whatBecomesTrue: string | null,
  howToMoveForward: string | null,
  dependencies: string[] = [],
): TechTreeNode {
  return {
    id: slug,
    slug,
    stage,
    title,
    description: null,
    what_becomes_true: whatBecomesTrue,
    how_to_move_forward: howToMoveForward,
    position,
    agent_can_do_this: agentCanDoThis,
    dependencies,
  };
}

const TECH_TREE_NODES: TechTreeNode[] = [
  node("initial-idea", "idea", "Initial idea", 1, false,
    "The initial company concept exists as a usable starting point.",
    "Provide your input.",
  ),
  node("pick-company-name", "initial", "Pick a company name", 1, false,
    "A confirmed company name exists.",
    "Pick a name from suggestions or provide your own.",
    ["initial-idea"],
  ),
  node("prepare-repository", "initial", "Prepare repository", 2, true,
    "The managed product repo and app foundation are ready.",
    "Provision the product repo foundation.",
    ["initial-idea"],
  ),
  node("incorporate-llc", "initial", "Incorporate LLC", 3, false,
    "A legal entity exists for the company.",
    "Provide your input.",
    ["initial-idea"],
  ),
  node("brand-identity", "identity", "Brand identity", 1, true,
    "A brand kit exists with logo, palette, type, components.",
    "Agent can do this.",
    ["pick-company-name"],
  ),
  node("buy-domain", "identity", "Buy domain", 2, false,
    "The custom domain is connected as the address on the internet.",
    "Acquire or connect the company domain.",
    ["pick-company-name"],
  ),
  node("setup-social-presence", "identity", "Setup social presence", 3, true,
    "Social presence exists across major platforms.",
    "Agent can do this.",
    ["brand-identity"],
  ),
  node("define-positioning", "identity", "Define positioning", 4, true,
    "Clear positioning statement exists.",
    "Needs approval.",
    ["pick-company-name"],
  ),
  node("open-bank-account", "identity", "Open bank account", 5, false,
    "Business bank account is open.",
    "Mark complete after the business bank account is open.",
    ["incorporate-llc"],
  ),
  node("build-app", "build", "Build app", 1, true,
    "Application is built and deployable.",
    "Agent can do this.",
    ["prepare-repository"],
  ),
  node("add-auth", "build", "Add auth", 2, true,
    "Authentication turns the project into a real application surface with users, sessions, redirects, and production-ready sign-in.",
    "Configure Supabase auth, users, and redirect URLs.",
    ["build-app"],
  ),
  node("deploy", "build", "Deploy", 3, true,
    "The app is deployed and accessible.",
    "Deploy via the managed Vercel project.",
    ["build-app"],
  ),
  node("set-up-transactional-email", "build", "Set up transactional email", 4, true,
    "Transactional email works for user flows.",
    "Configure Postmark and verify domain.",
    ["build-app"],
  ),
  node("build-marketing-website", "build", "Build marketing website", 5, true,
    "The marketing website is your 24/7 sales surface.",
    "Build the marketing website.",
    ["brand-identity", "define-positioning"],
  ),
  node("setup-outbound-email", "build", "Setup outbound email", 6, true,
    "Outbound email infrastructure is ready.",
    "Agent can do this.",
    ["set-up-transactional-email"],
  ),
  node("connect-postiz", "live", "Connect Postiz", 1, true,
    "Postiz is connected for scheduling.",
    "Connect the Postiz workspace used for scheduling.",
    ["setup-social-presence"],
  ),
  node("gather-prospects", "live", "Gather prospects", 2, true,
    "A list of qualified prospects exists.",
    "Agent can do this.",
    ["define-positioning"],
  ),
  node("setup-bookkeeping", "live", "Setup bookkeeping", 3, true,
    "Bookkeeping system is operational.",
    "Agent can do this.",
    ["open-bank-account"],
  ),
  node("grow-social-presence", "live", "Grow social presence", 4, true,
    "Social presence is growing.",
    "Agent can do this.",
    ["connect-postiz"],
  ),
  node("outbound-emails", "live", "Outbound emails", 5, true,
    "Outbound campaigns are running.",
    "Agent can do this.",
    ["setup-outbound-email"],
  ),
  node("public-launch", "launch", "Public launch", 1, true,
    "Public launch is complete.",
    "Coordinate launch across channels.",
    ["build-marketing-website", "deploy"],
  ),
  node("press-coverage", "launch", "Press coverage", 2, true,
    "Press coverage exists.",
    "Agent can do this.",
    ["public-launch"],
  ),
  node("product-hunt", "launch", "Product Hunt launch", 3, true,
    "Product Hunt launch is complete.",
    "Agent can do this.",
    ["public-launch"],
  ),
  node("first-customers", "launch", "First customers", 4, true,
    "First paying customers exist.",
    "Agent can do this.",
    ["public-launch"],
  ),
  node("onboard-accounts", "scale", "Onboard accounts", 1, true,
    "New customer onboarding flow exists.",
    "Capture onboarding handoff and first-success next steps.",
    ["first-customers"],
  ),
  node("close-deals", "scale", "Close deals", 2, true,
    "Sales deals are closing.",
    "Agent can do this.",
    ["first-customers"],
  ),
  node("launch-referral-program", "scale", "Launch referral program", 3, true,
    "Referral program is active.",
    "Agent can do this.",
    ["first-customers"],
  ),
];
