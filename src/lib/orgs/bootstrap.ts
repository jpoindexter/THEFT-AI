import { db, type Department } from "@/lib/db/store";

const DEPARTMENTS = [
  { slug: "engineering", name: "Engineering" },
  { slug: "design", name: "Design" },
  { slug: "marketing", name: "Marketing" },
  { slug: "sales", name: "Sales" },
  { slug: "operations", name: "Operations" },
  { slug: "finance", name: "Finance" },
  { slug: "legal", name: "Legal" },
  { slug: "support", name: "Support" },
];

const DEFAULT_AGENTS = [
  {
    department: "engineering",
    slug: "engineer",
    name: "Engineer",
    role: "engineer",
    title: "Default engineer",
    capabilities: "Writes code, runs migrations, ships features.",
    skills: [
      "dev-workflow",
      "supabase",
      "supabase-postgres-best-practices",
      "debugging-vercel-builds",
    ],
  },
  {
    department: "design",
    slug: "design",
    name: "Design",
    role: "designer",
    title: "Default designer",
    capabilities: "Brand systems, decks, UI design, hi-fi prototypes, animations.",
    skills: [
      "web-design-guidelines",
      "huashu-design",
      "shader-authoring",
      "favicon-pack-maker",
      "hyperframes",
    ],
  },
  {
    department: "marketing",
    slug: "marketing",
    name: "Marketing",
    role: "marketer",
    title: "Default marketer",
    capabilities: "Campaigns, copy, content.",
    skills: ["content-engine", "last30days-research"],
  },
  {
    department: "sales",
    slug: "sales",
    name: "Sales",
    role: "sales",
    title: "Default sales",
    capabilities: "ICP, outbound, pipeline.",
    skills: [],
  },
  {
    department: "operations",
    slug: "operations",
    name: "Operations",
    role: "ops",
    title: "Default operations",
    capabilities: "Internal ops, status updates.",
    skills: ["ops-agent-skills"],
  },
  {
    department: "finance",
    slug: "finance",
    name: "Finance",
    role: "finance",
    title: "Default finance",
    capabilities: "Bookkeeping, billing, runway.",
    skills: ["finance-agent-skills"],
  },
];

export async function bootstrapOrganization(orgId: string): Promise<void> {
  const deptInsert: Omit<Department, "id">[] = DEPARTMENTS.map((d, i) => ({
    organization_id: orgId,
    slug: d.slug,
    name: d.name,
    context: null,
    position_x: (i % 4) * 240 - 360,
    position_y: Math.floor(i / 4) * 200 - 100,
  }));
  const created = await db.insertDepartments(deptInsert);
  const deptMap = new Map(created.map((d) => [d.slug, d.id]));

  const agents = DEFAULT_AGENTS.flatMap((a) => {
    const departmentId = deptMap.get(a.department);
    if (!departmentId) return [];
    return [
      {
        organization_id: orgId,
        department_id: departmentId,
        slug: a.slug,
        name: a.name,
        role: a.role,
        title: a.title,
        capabilities: a.capabilities,
        status: "idle" as const,
        attached_skills: a.skills,
        instructions: null,
        model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-4-6",
      },
    ];
  });
  await db.insertAgents(agents);
  await db.seedTechTreeStatus(orgId);
}
