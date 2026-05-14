import { db, type Org } from "@/lib/db/store";
import { syncWorkspaceToWorkspaceSync, type WorkspaceSyncSyncResult } from "@/lib/workspace-sync-engine/sync";

export type SetupQuestionOption = {
  key: string;
  label: string;
  description?: string;
  recommended?: boolean;
};

export type SetupQuestion = {
  id: string;
  prompt: string;
  options: SetupQuestionOption[];
};

export type SetupAnswer = {
  questionId: string;
  prompt?: string;
  answer: string;
};

export type WorkspaceSetupInput = {
  idea: string;
  questions: SetupQuestion[];
  answers: SetupAnswer[];
};

const FIRST_TASKS = [
  {
    department: "engineering",
    title: "Prepare repository and product workspace",
    description:
      "Turn the company brief into the first shippable product workspace: repo structure, app surface, data model, and local verification path.",
  },
  {
    department: "design",
    title: "Create brand identity direction",
    description:
      "Use the company brief to define the first visual direction, UI tone, typography, color direction, and reusable design notes.",
  },
  {
    department: "marketing",
    title: "Draft positioning and first GTM page",
    description:
      "Translate the company brief into positioning, a landing page outline, first offer copy, and the first distribution angle.",
  },
];

export function fallbackSetupQuestions(idea: string): {
  analysis: string;
  questions: SetupQuestion[];
} {
  const subject = summarizeIdea(idea);
  return {
    analysis: `${subject} needs a sharper operating brief before agents start work. I’ll lock buyer, offer, delivery model, and wedge so the first tasks have enough context to move.`,
    questions: [
      {
        id: "icp",
        prompt: "Who is the first buyer we should optimize for?",
        options: [
          {
            key: "founders",
            label: "Early-stage founders",
            description: "Founders who need expert execution before they can hire a full team.",
            recommended: true,
          },
          {
            key: "operators",
            label: "Lean operators",
            description: "Small teams that already sell but need a repeatable execution system.",
          },
          {
            key: "agencies",
            label: "Agencies and studios",
            description: "Service businesses that need leverage on delivery, ops, or growth work.",
          },
          {
            key: "smb",
            label: "Small businesses",
            description: "Owner-led companies that need a practical business system without enterprise overhead.",
          },
        ],
      },
      {
        id: "offer",
        prompt: "What should the first paid offer be?",
        options: [
          {
            key: "retainer",
            label: "Monthly operating retainer",
            description: "A recurring service with a clear scope and predictable weekly output.",
            recommended: true,
          },
          {
            key: "sprint",
            label: "Fixed-scope launch sprint",
            description: "A short project that proves value and creates a reusable delivery system.",
          },
          {
            key: "subscription",
            label: "Productized subscription",
            description: "A self-serve or assisted plan with tiered usage and repeatable fulfillment.",
          },
          {
            key: "pilot",
            label: "Paid pilot",
            description: "A lower-friction first engagement designed to learn fast and convert.",
          },
        ],
      },
      {
        id: "delivery",
        prompt: "How should work get delivered?",
        options: [
          {
            key: "agent-led",
            label: "Agent-led with human approval",
            description: "Agents draft and execute, with the founder approving important decisions.",
            recommended: true,
          },
          {
            key: "human-led",
            label: "Human-led with agent support",
            description: "The founder stays hands-on while agents prepare briefs, drafts, and queues.",
          },
          {
            key: "done-for-you",
            label: "Done-for-you service",
            description: "The customer buys outcomes, not tooling or operational visibility.",
          },
          {
            key: "self-serve",
            label: "Self-serve workflow",
            description: "Customers use the product directly with agents assisting in the background.",
          },
        ],
      },
      {
        id: "wedge",
        prompt: "What is the wedge that makes this hard to ignore?",
        options: [
          {
            key: "speed",
            label: "Speed to first useful output",
            description: "Buyers feel value quickly because the system ships real work immediately.",
            recommended: true,
          },
          {
            key: "taste",
            label: "Taste and judgment",
            description: "The work is better curated than generic AI output or low-touch outsourcing.",
          },
          {
            key: "system",
            label: "Repeatable operating system",
            description: "The durable process becomes more valuable than any one deliverable.",
          },
          {
            key: "cost",
            label: "Lower cost than hiring",
            description: "Buyers get team-like output before they can justify payroll.",
          },
        ],
      },
    ],
  };
}

export async function completeWorkspaceSetup(
  org: Org,
  input: WorkspaceSetupInput,
): Promise<{ plan: Record<string, unknown>; createdTasks: number; workspace_sync: WorkspaceSyncSyncResult }> {
  const plan = buildBusinessPlan(org, input);

  await db.updateOrg(org.id, { business_plan: plan });
  await db.completeOnboardingRoadmap(org.id);
  await upsertBusinessPlanArtifact(org.id, plan, input);
  const createdTasks = await seedFirstWorkQueue(org.id);
  const updatedOrg = (await db.getOrgBySlug(org.slug)) ?? org;
  const workspace_sync = await syncWorkspaceToWorkspaceSync(updatedOrg, plan);

  return { plan, createdTasks, workspace_sync };
}

function buildBusinessPlan(
  org: Org,
  input: WorkspaceSetupInput,
): Record<string, unknown> {
  const answerMap = new Map(input.answers.map((a) => [a.questionId, a]));
  const fields = Object.fromEntries(
    input.questions.map((q) => [
      q.id,
      answerMap.get(q.id)?.answer ?? q.options.find((o) => o.recommended)?.label ?? q.options[0]?.label ?? "",
    ]),
  );

  return {
    company_name: org.name,
    product_or_service: summarizeIdea(input.idea),
    mission: input.idea.trim(),
    icp: fields.icp ?? "",
    offer: fields.offer ?? fields.model ?? fields.format ?? "",
    delivery_model: fields.delivery ?? fields.mode ?? "",
    differentiator: fields.wedge ?? fields.differentiator ?? fields.edge ?? "",
    setup_answers: input.questions.map((q) => ({
      question_id: q.id,
      question: q.prompt,
      answer: answerMap.get(q.id)?.answer ?? "",
    })),
    operating_model: "Operator coordinates department agents through explicit tasks, artifacts, approvals, and blocked/waiting states.",
  };
}

async function upsertBusinessPlanArtifact(
  orgId: string,
  plan: Record<string, unknown>,
  input: WorkspaceSetupInput,
) {
  const existing = (await db.listArtifacts(orgId)).find((a) => a.kind === "business_plan");
  if (existing) return;

  await db.createArtifact({
    organization_id: orgId,
    department_id: null,
    task_id: null,
    name: "Business Plan",
    kind: "business_plan",
    content: JSON.stringify(plan, null, 2),
    metadata: { onboarding: input },
    pinned: true,
  });
}

async function seedFirstWorkQueue(orgId: string): Promise<number> {
  const [departments, agents, existingTasks] = await Promise.all([
    db.listDepartments(orgId),
    db.listAgents(orgId),
    db.listTasks(orgId),
  ]);
  let created = 0;

  for (const taskInput of FIRST_TASKS) {
    if (existingTasks.some((t) => t.title === taskInput.title)) continue;
    const department = departments.find((d) => d.slug === taskInput.department);
    const agent = department
      ? agents.find((a) => a.department_id === department.id)
      : null;
    await db.createTask({
      organization_id: orgId,
      department_id: department?.id ?? null,
      agent_id: agent?.id ?? null,
      parent_task_id: null,
      title: taskInput.title,
      description: taskInput.description,
      status: "todo",
      priority: "normal",
      mode: "execute",
      due_at: null,
      started_at: null,
      result: null,
    });
    created += 1;
  }

  return created;
}

function summarizeIdea(idea: string): string {
  const trimmed = idea.trim().replace(/\s+/g, " ");
  if (!trimmed) return "New company";
  return trimmed.length > 140 ? `${trimmed.slice(0, 137)}...` : trimmed;
}
