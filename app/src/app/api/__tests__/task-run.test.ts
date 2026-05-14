import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { db as DbType } from "@/lib/db/store";

vi.mock("@/lib/agent/run", () => ({
  runAgent: vi.fn(async () => ({
    history: [],
    turns: [
      { kind: "text", text: "Drafted the implementation plan." },
      { kind: "done" },
    ],
  })),
}));

vi.mock("@/lib/agent/compose-prompt", () => ({
  composeAgentPromptForDept: vi.fn(async () => null),
  composeAgentPrompt: vi.fn(async () => null),
}));

let tmpDir: string;
let db: typeof DbType;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "theft-api-task-run-"));
  process.env.THEFT_DATA_DIR = tmpDir;
  vi.resetModules();
  db = (await import("@/lib/db/store")).db;
});

afterEach(async () => {
  vi.resetModules();
  delete process.env.THEFT_DATA_DIR;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe("POST /api/[org]/tasks/[task]/run", () => {
  it("creates a run-summary artifact when task completes without write_artifact", async () => {
    const org = await db.createOrg({ name: "Run Task Test Org" });
    const task = await db.createTask({
      organization_id: org.id,
      department_id: null,
      agent_id: null,
      parent_task_id: null,
      title: "Ship onboarding polish",
      description: "Finalize onboarding and run verification.",
      status: "todo",
      priority: "normal",
      mode: "execute",
      due_at: null,
      started_at: null,
      result: null,
    });

    const { POST } = await import("@/app/api/[org]/tasks/[task]/run/route");
    const req = new Request("http://localhost/api/test/run", { method: "POST" });
    const res = await POST(req, { params: Promise.resolve({ org: org.slug, task: task.id }) });

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toContain("application/x-ndjson");
    await res.text();

    const artifacts = await db.listArtifacts(org.id);
    const summary = artifacts.find((a) => a.name.includes("run summary"));
    expect(summary).toBeTruthy();
    expect(summary?.content).toContain("Drafted the implementation plan.");

    const tasks = await db.listTasks(org.id);
    const updated = tasks.find((t) => t.id === task.id);
    expect(updated?.status).toBe("done");
  });
});
