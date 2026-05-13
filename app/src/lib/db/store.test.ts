import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { db as DbType } from "@/lib/db/store";

let tmpDir: string;
let db: typeof DbType;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "theft-db-test-"));
  process.env.THEFT_DATA_DIR = tmpDir;
  vi.resetModules();
  db = (await import("@/lib/db/store")).db;
});

afterEach(async () => {
  vi.resetModules();
  delete process.env.THEFT_DATA_DIR;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("createOrg / getOrgBySlug", () => {
  it("creates org and retrieves it by slug", async () => {
    const org = await db.createOrg({ name: "Test Corp" });
    expect(org.slug).toBeTruthy();
    expect(org.name).toBe("Test Corp");
    const found = await db.getOrgBySlug(org.slug);
    expect(found?.id).toBe(org.id);
  });

  it("returns null for unknown slug", async () => {
    expect(await db.getOrgBySlug("does-not-exist")).toBeNull();
  });
});

describe("seedTechTreeStatus", () => {
  it("seeds initial-idea as available, all others locked", async () => {
    const org = await db.createOrg({ name: "Seed Test" });
    await db.seedTechTreeStatus(org.id);

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const ideaNode = nodes.find((n) => n.slug === "initial-idea")!;

    const ideaStatus = statuses.find((s) => s.node_id === ideaNode.id);
    expect(ideaStatus?.status).toBe("available");

    const otherStatuses = statuses.filter((s) => s.node_id !== ideaNode.id);
    expect(otherStatuses.every((s) => s.status === "locked")).toBe(true);
  });

  it("is idempotent — double-seed does not duplicate rows", async () => {
    const org = await db.createOrg({ name: "Idempotent Test" });
    await db.seedTechTreeStatus(org.id);
    await db.seedTechTreeStatus(org.id);

    const statuses = await db.listTechTreeStatus(org.id);
    const nodes = await db.listTechTreeNodes();
    expect(statuses.length).toBe(nodes.length);
  });

  it("fills missing rows when some roadmap statuses already exist", async () => {
    const org = await db.createOrg({ name: "Partial Seed Test" });
    await db.upsertTechTreeNodeStatus(org.id, "initial-idea", "complete");

    await db.seedTechTreeStatus(org.id);

    const statuses = await db.listTechTreeStatus(org.id);
    const nodes = await db.listTechTreeNodes();
    expect(statuses.length).toBe(nodes.length);
  });

  it("isolates statuses by org", async () => {
    const orgA = await db.createOrg({ name: "Org A" });
    const orgB = await db.createOrg({ name: "Org B" });
    await db.seedTechTreeStatus(orgA.id);
    await db.seedTechTreeStatus(orgB.id);

    const statusA = await db.listTechTreeStatus(orgA.id);
    const statusB = await db.listTechTreeStatus(orgB.id);
    expect(statusA.every((s) => s.organization_id === orgA.id)).toBe(true);
    expect(statusB.every((s) => s.organization_id === orgB.id)).toBe(true);
  });
});

describe("upsertTechTreeNodeStatus", () => {
  it("updates a seeded row to complete and sets completed_at", async () => {
    const org = await db.createOrg({ name: "Upsert Test" });
    await db.seedTechTreeStatus(org.id);

    await db.upsertTechTreeNodeStatus(org.id, "initial-idea", "complete");

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const ideaNode = nodes.find((n) => n.slug === "initial-idea")!;
    const row = statuses.find((s) => s.node_id === ideaNode.id);
    expect(row?.status).toBe("complete");
    expect(row?.completed_at).toBeTruthy();
  });

  it("does not duplicate rows on double upsert", async () => {
    const org = await db.createOrg({ name: "Dup Test" });
    await db.seedTechTreeStatus(org.id);
    await db.upsertTechTreeNodeStatus(org.id, "initial-idea", "complete");
    await db.upsertTechTreeNodeStatus(org.id, "initial-idea", "complete");

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const ideaNode = nodes.find((n) => n.slug === "initial-idea")!;
    const matches = statuses.filter((s) => s.node_id === ideaNode.id);
    expect(matches.length).toBe(1);
  });

  it("does not set completed_at for non-complete statuses", async () => {
    const org = await db.createOrg({ name: "In Progress Test" });
    await db.seedTechTreeStatus(org.id);

    await db.upsertTechTreeNodeStatus(org.id, "initial-idea", "in_progress");

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const ideaNode = nodes.find((n) => n.slug === "initial-idea")!;
    const row = statuses.find((s) => s.node_id === ideaNode.id);
    expect(row?.status).toBe("in_progress");
    expect(row?.completed_at).toBeNull();
  });

  it("silently ignores unknown node slugs", async () => {
    const org = await db.createOrg({ name: "Unknown Slug Test" });
    await expect(
      db.upsertTechTreeNodeStatus(org.id, "not-a-real-node", "complete"),
    ).resolves.toBeUndefined();
  });
});

describe("completeOnboardingRoadmap", () => {
  it("marks initial idea and company name complete", async () => {
    const org = await db.createOrg({ name: "Onboarding Test" });

    await db.completeOnboardingRoadmap(org.id);

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const statusBySlug = new Map(
      nodes.map((n) => [
        n.slug,
        statuses.find((s) => s.node_id === n.id)?.status,
      ]),
    );

    expect(statusBySlug.get("initial-idea")).toBe("complete");
    expect(statusBySlug.get("pick-company-name")).toBe("complete");
  });

  it("keeps the roadmap fully seeded and unlocks newly available next steps", async () => {
    const org = await db.createOrg({ name: "Unlock Test" });

    await db.completeOnboardingRoadmap(org.id);

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const statusBySlug = new Map(
      nodes.map((n) => [
        n.slug,
        statuses.find((s) => s.node_id === n.id)?.status,
      ]),
    );

    expect(statuses.length).toBe(nodes.length);
    expect(statusBySlug.get("prepare-repository")).toBe("available");
    expect(statusBySlug.get("brand-identity")).toBe("available");
  });
});

describe("completeWorkspaceSetup", () => {
  it("creates a working post-onboarding workspace state", async () => {
    const { completeWorkspaceSetup, fallbackSetupQuestions } = await import("@/lib/onboarding/engine");
    const { bootstrapOrganization } = await import("@/lib/orgs/bootstrap");
    const org = await db.createOrg({ name: "Engine Test" });
    await bootstrapOrganization(org.id);
    const setup = fallbackSetupQuestions("A subscription design service for seed-stage founders");

    const result = await completeWorkspaceSetup(org, {
      idea: "A subscription design service for seed-stage founders",
      questions: setup.questions,
      answers: setup.questions.map((q) => ({
        questionId: q.id,
        prompt: q.prompt,
        answer: q.options.find((o) => o.recommended)?.label ?? q.options[0].label,
      })),
    });

    const saved = await db.getOrgBySlug(org.slug);
    const artifacts = await db.listArtifacts(org.id);
    const tasks = await db.listTasks(org.id);
    const statuses = await db.listTechTreeStatus(org.id);
    const nodes = await db.listTechTreeNodes();
    const statusBySlug = new Map(
      nodes.map((n) => [
        n.slug,
        statuses.find((s) => s.node_id === n.id)?.status,
      ]),
    );

    expect(result.createdTasks).toBe(3);
    expect(saved?.business_plan).toBeTruthy();
    expect(artifacts.some((a) => a.kind === "business_plan")).toBe(true);
    expect(tasks.map((t) => t.title)).toContain("Prepare repository and product workspace");
    expect(statusBySlug.get("initial-idea")).toBe("complete");
    expect(statusBySlug.get("pick-company-name")).toBe("complete");
  });
});

describe("Paperclip-style engine boundary", () => {
  it("builds an Agent Company package with departments, agents, tasks, and skills", async () => {
    const { bootstrapOrganization } = await import("@/lib/orgs/bootstrap");
    const { completeWorkspaceSetup, fallbackSetupQuestions } = await import("@/lib/onboarding/engine");
    const { buildAgentCompanyPackage } = await import("@/lib/engine/company-package");
    const org = await db.createOrg({ name: "Package Test" });
    await bootstrapOrganization(org.id);
    const setup = fallbackSetupQuestions("An operator-native design service");
    await completeWorkspaceSetup(org, {
      idea: "An operator-native design service",
      questions: setup.questions,
      answers: setup.questions.map((q) => ({
        questionId: q.id,
        prompt: q.prompt,
        answer: q.options.find((o) => o.recommended)?.label ?? q.options[0].label,
      })),
    });

    const pkg = await buildAgentCompanyPackage(org.id);
    const engineer = pkg.agents.find((agent) => agent.slug === "engineer");

    expect(pkg.schema).toBe("agentcompanies/v1");
    expect(pkg.teams).toHaveLength(8);
    expect(pkg.agents).toHaveLength(8);
    expect(pkg.tasks).toHaveLength(3);
    expect(pkg.companyDocument).toContain("schema: agentcompanies/v1");
    expect(engineer?.skills.some((skill) => skill.slug === "dev-workflow" && skill.exists)).toBe(true);
    expect(pkg.diagnostics.missingSkills).toHaveLength(0);
  });

  it("executes registered engine tools through one dispatcher", async () => {
    const { executeEngineTool, listEngineTools } = await import("@/lib/engine/tool-dispatcher");
    const org = await db.createOrg({ name: "Dispatcher Test" });

    expect(listEngineTools().map((tool) => tool.name)).toContain("write_artifact");

    const result = await executeEngineTool({
      org,
      name: "write_artifact",
      input: {
        name: "Dispatcher Artifact",
        kind: "markdown",
        content: "# Dispatcher Artifact",
      },
      source: "local-harness",
    });
    const artifacts = await db.listArtifacts(org.id);
    const unknown = await executeEngineTool({
      org,
      name: "missing_tool",
      input: {},
    });

    expect(result).toMatchObject({ ok: true });
    expect(artifacts.map((a) => a.name)).toContain("Dispatcher Artifact");
    expect(unknown).toMatchObject({ ok: false, error: "unknown tool: missing_tool" });
  });
});

describe("createTask / listTasks", () => {
  it("creates a task and lists it for the org", async () => {
    const org = await db.createOrg({ name: "Task Test" });
    const task = await db.createTask({
      organization_id: org.id,
      department_id: null,
      agent_id: null,
      parent_task_id: null,
      title: "Do the thing",
      description: "A test task",
      status: "todo",
      priority: "normal",
      mode: "execute",
      due_at: null,
      started_at: null,
      result: null,
    });

    expect(task.id).toBeTruthy();
    expect(task.title).toBe("Do the thing");

    const tasks = await db.listTasks(org.id);
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe(task.id);
  });

  it("activeOnly excludes done tasks", async () => {
    const org = await db.createOrg({ name: "Active Filter Test" });
    await db.createTask({
      organization_id: org.id,
      department_id: null,
      agent_id: null,
      parent_task_id: null,
      title: "Done task",
      description: "",
      status: "done",
      priority: "normal",
      mode: "execute",
      due_at: null,
      started_at: null,
      result: null,
    });

    expect(await db.listTasks(org.id, { activeOnly: true })).toHaveLength(0);
  });

  it("does not leak tasks across orgs", async () => {
    const orgA = await db.createOrg({ name: "Task Org A" });
    const orgB = await db.createOrg({ name: "Task Org B" });
    await db.createTask({
      organization_id: orgA.id,
      department_id: null,
      agent_id: null,
      parent_task_id: null,
      title: "Org A task",
      description: "",
      status: "todo",
      priority: "normal",
      mode: "execute",
      due_at: null,
      started_at: null,
      result: null,
    });

    expect(await db.listTasks(orgB.id)).toHaveLength(0);
  });
});
