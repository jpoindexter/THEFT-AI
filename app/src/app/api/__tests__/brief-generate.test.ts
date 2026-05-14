import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { db as DbType } from "@/lib/db/store";

let tmpDir: string;
let db: typeof DbType;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "theft-api-brief-"));
  process.env.THEFT_DATA_DIR = tmpDir;
  delete process.env.THEFT_ONBOARDING_LLM;
  vi.resetModules();
  db = (await import("@/lib/db/store")).db;
});

afterEach(async () => {
  vi.resetModules();
  delete process.env.THEFT_DATA_DIR;
  delete process.env.THEFT_ONBOARDING_LLM;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function callBriefGenerate(orgSlug: string, idea: string) {
  const { POST } = await import("@/app/api/[org]/brief/generate/route");
  const req = new Request("http://localhost/api/test/brief/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idea }),
  });
  return POST(req, { params: Promise.resolve({ org: orgSlug }) });
}

describe("POST /api/[org]/brief/generate", () => {
  it("marks first two roadmap nodes complete after idea submit", async () => {
    const org = await db.createOrg({ name: "Brief Route Test" });
    await db.seedTechTreeStatus(org.id);

    const res = await callBriefGenerate(org.slug, "AI marketing agency for accountants");
    expect(res.status).toBe(200);

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const statusBySlug = new Map(
      nodes.map((n) => [n.slug, statuses.find((s) => s.node_id === n.id)?.status]),
    );

    expect(statusBySlug.get("initial-idea")).toBe("complete");
    expect(statusBySlug.get("pick-company-name")).toBe("complete");
  });
});
