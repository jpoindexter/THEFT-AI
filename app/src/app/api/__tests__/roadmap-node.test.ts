/**
 * Tests for PATCH /api/[org]/roadmap/[node]
 * Calls the route handler directly — no HTTP server needed.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { db as DbType } from "@/lib/db/store";

let tmpDir: string;
let db: typeof DbType;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "theft-api-roadmap-"));
  process.env.THEFT_DATA_DIR = tmpDir;
  vi.resetModules();
  db = (await import("@/lib/db/store")).db;
});

afterEach(async () => {
  vi.resetModules();
  delete process.env.THEFT_DATA_DIR;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/test/roadmap/initial-idea", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function callPatch(orgSlug: string, nodeSlug: string, body: unknown) {
  const { PATCH } = await import(
    "@/app/api/[org]/roadmap/[node]/route"
  );
  const req = makeRequest(body);
  const ctx = { params: Promise.resolve({ org: orgSlug, node: nodeSlug }) };
  return PATCH(req, ctx);
}

describe("PATCH /api/[org]/roadmap/[node]", () => {
  it("returns 404 when org does not exist", async () => {
    const res = await callPatch("ghost-org", "initial-idea", { status: "complete" });
    expect(res.status).toBe(404);
    const json = await res.json() as { error: string };
    expect(json.error).toBe("not_found");
  });

  it("returns 400 when status is invalid", async () => {
    const org = await db.createOrg({ name: "Route Test" });
    const res = await callPatch(org.slug, "initial-idea", { status: "banana" });
    expect(res.status).toBe(400);
    const json = await res.json() as { error: string };
    expect(json.error).toBe("invalid_input");
  });

  it("returns 400 when body is missing status", async () => {
    const org = await db.createOrg({ name: "No Status Test" });
    const res = await callPatch(org.slug, "initial-idea", {});
    expect(res.status).toBe(400);
  });

  it("updates node status to complete and returns ok", async () => {
    const org = await db.createOrg({ name: "Update Test" });
    await db.seedTechTreeStatus(org.id);

    const res = await callPatch(org.slug, "initial-idea", { status: "complete" });
    expect(res.status).toBe(200);
    const json = await res.json() as { ok: boolean };
    expect(json.ok).toBe(true);

    // Verify the DB was actually updated
    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const ideaNode = nodes.find((n) => n.slug === "initial-idea")!;
    const row = statuses.find((s) => s.node_id === ideaNode.id);
    expect(row?.status).toBe("complete");
  });

  it("accepts all valid status values", async () => {
    const org = await db.createOrg({ name: "All Status Test" });
    await db.seedTechTreeStatus(org.id);

    for (const status of ["locked", "available", "in_progress", "complete"] as const) {
      const res = await callPatch(org.slug, "initial-idea", { status });
      expect(res.status).toBe(200);
    }
  });
});
