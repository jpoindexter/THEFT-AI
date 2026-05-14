import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { promises as fs } from "node:fs";
import path from "node:path";
import os from "node:os";
import type { db as DbType } from "@/lib/db/store";
import { fallbackSetupQuestions } from "@/lib/onboarding/engine";

let tmpDir: string;
let db: typeof DbType;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "theft-api-onboarding-complete-"));
  process.env.THEFT_DATA_DIR = tmpDir;
  vi.resetModules();
  db = (await import("@/lib/db/store")).db;
});

afterEach(async () => {
  vi.resetModules();
  delete process.env.THEFT_DATA_DIR;
  await fs.rm(tmpDir, { recursive: true, force: true });
});

async function callOnboardingComplete(orgSlug: string, body: unknown) {
  const { POST } = await import("@/app/api/[org]/onboarding/complete/route");
  const req = new Request("http://localhost/api/test/onboarding/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return POST(req, { params: Promise.resolve({ org: orgSlug }) });
}

describe("POST /api/[org]/onboarding/complete", () => {
  it("writes business plan and completes first onboarding nodes", async () => {
    const org = await db.createOrg({ name: "Onboarding Complete Route Test" });
    const setup = fallbackSetupQuestions("Subscription design service for seed-stage founders");
    const answers = setup.questions.map((q) => ({
      questionId: q.id,
      prompt: q.prompt,
      answer: q.options.find((o) => o.recommended)?.label ?? q.options[0]?.label ?? "",
    }));

    const res = await callOnboardingComplete(org.slug, {
      idea: "Subscription design service for seed-stage founders",
      questions: setup.questions,
      answers,
    });

    expect(res.status).toBe(200);

    const updated = await db.getOrgBySlug(org.slug);
    expect(updated?.business_plan).toBeTruthy();

    const nodes = await db.listTechTreeNodes();
    const statuses = await db.listTechTreeStatus(org.id);
    const statusBySlug = new Map(
      nodes.map((n) => [n.slug, statuses.find((s) => s.node_id === n.id)?.status]),
    );
    expect(statusBySlug.get("initial-idea")).toBe("complete");
    expect(statusBySlug.get("pick-company-name")).toBe("complete");
    expect(statusBySlug.get("prepare-repository")).toBe("available");
  });
});
