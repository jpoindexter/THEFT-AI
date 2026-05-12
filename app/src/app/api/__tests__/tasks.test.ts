/**
 * Tests for POST /api/[org]/tasks
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { db as DbType } from "@/lib/db/store";

let tmpDir: string;
let db: typeof DbType;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "theft-api-tasks-"));
  process.env.THEFT_DATA_DIR = tmpDir;
  vi.resetModules();
  db = (await import("@/lib/db/store")).db;
});

afterEach(async () => {
  vi.resetModules();
  delete process.env.THEFT_DATA_DIR;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function callPost(orgSlug: string, body: unknown) {
  const { POST } = await import("@/app/api/[org]/tasks/route");
  const req = new Request("http://localhost/api/test/tasks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const ctx = { params: Promise.resolve({ org: orgSlug }) };
  return POST(req, ctx);
}

async function callGet(orgSlug: string) {
  const { GET } = await import("@/app/api/[org]/tasks/route");
  const req = new Request("http://localhost/api/test/tasks");
  const ctx = { params: Promise.resolve({ org: orgSlug }) };
  return GET(req, ctx);
}

describe("POST /api/[org]/tasks", () => {
  it("returns 404 when org does not exist", async () => {
    const res = await callPost("ghost-org", { description: "test task" });
    expect(res.status).toBe(404);
  });

  it("returns 400 when description is missing", async () => {
    const org = await db.createOrg({ name: "Task Route Test" });
    const res = await callPost(org.slug, {});
    expect(res.status).toBe(400);
  });

  it("returns 400 when description is empty string", async () => {
    const org = await db.createOrg({ name: "Empty Desc Test" });
    const res = await callPost(org.slug, { description: "" });
    expect(res.status).toBe(400);
  });

  it("creates a task and returns it", async () => {
    const org = await db.createOrg({ name: "Create Task Test" });
    const res = await callPost(org.slug, { description: "Launch the brand" });
    expect(res.status).toBe(200);

    const json = await res.json() as { task: { id: string; title: string; description: string } };
    expect(json.task.id).toBeTruthy();
    expect(json.task.description).toBe("Launch the brand");
    expect(json.task.title).toBe("Launch the brand");
  });

  it("truncates title to 80 chars from first line of description", async () => {
    const org = await db.createOrg({ name: "Title Truncate Test" });
    const longDesc = "A".repeat(100);
    const res = await callPost(org.slug, { description: longDesc });
    const json = await res.json() as { task: { title: string } };
    expect(json.task.title.length).toBe(80);
  });

  it("uses first line only for title when description is multiline", async () => {
    const org = await db.createOrg({ name: "Multiline Test" });
    const res = await callPost(org.slug, {
      description: "First line\nSecond line\nThird line",
    });
    const json = await res.json() as { task: { title: string } };
    expect(json.task.title).toBe("First line");
  });

  it("accepts optional mode and defaults to execute", async () => {
    const org = await db.createOrg({ name: "Mode Test" });
    const res = await callPost(org.slug, { description: "Plan something", mode: "plan" });
    const json = await res.json() as { task: { mode: string } };
    expect(json.task.mode).toBe("plan");
  });
});

describe("GET /api/[org]/tasks", () => {
  it("returns 404 when org does not exist", async () => {
    const res = await callGet("ghost-org");
    expect(res.status).toBe(404);
  });

  it("returns tasks for the org", async () => {
    const org = await db.createOrg({ name: "List Tasks Test" });
    await callPost(org.slug, { description: "Task one" });
    await callPost(org.slug, { description: "Task two" });

    const res = await callGet(org.slug);
    expect(res.status).toBe(200);
    const json = await res.json() as { tasks: unknown[] };
    expect(json.tasks).toHaveLength(2);
  });
});
