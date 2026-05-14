#!/usr/bin/env node
import process from "node:process";

const BASE_URL = (process.env.PAPERCLIP_API_URL ?? "http://127.0.0.1:3100").replace(/\/+$/, "");
const API_URL = `${BASE_URL}/api`;
const ADAPTER_TYPE = process.env.THEFT_SMOKE_ADAPTER ?? "process";
const CODEX_MODEL = process.env.THEFT_SMOKE_CODEX_MODEL ?? "gpt-5.3-codex-spark";
const REPO_ROOT = process.env.THEFT_SMOKE_CWD ?? process.cwd();
const RUN_TIMEOUT_MS = Number.parseInt(process.env.THEFT_SMOKE_RUN_TIMEOUT_MS ?? "120000", 10);
const POLL_INTERVAL_MS = 500;

const departments = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Legal",
  "Support",
];

function adapterConfig(department) {
  if (ADAPTER_TYPE === "process") {
    return {
      command: process.execPath,
      args: [
        "-e",
        `console.log(${JSON.stringify(`THEFT runtime smoke adapter run for ${department}`)})`,
      ],
      cwd: REPO_ROOT,
      timeoutSec: 20,
    };
  }

  if (ADAPTER_TYPE === "codex_local") {
    return {
      cwd: REPO_ROOT,
      model: CODEX_MODEL,
      modelReasoningEffort: "low",
      dangerouslyBypassApprovalsAndSandbox: true,
      timeoutSec: Math.ceil(RUN_TIMEOUT_MS / 1000),
    };
  }

  return {
    cwd: REPO_ROOT,
    timeoutSec: Math.ceil(RUN_TIMEOUT_MS / 1000),
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(path, init = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${init.method ?? "GET"} ${path} failed: ${res.status} ${body}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

async function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body) });
}

async function pollRun(companyId, agentId, runId) {
  const deadline = Date.now() + RUN_TIMEOUT_MS;
  let sawAdapterInvoke = false;
  let afterSeq = 0;

  while (Date.now() < deadline) {
    const events = await request(`/heartbeat-runs/${runId}/events?afterSeq=${afterSeq}&limit=100`);
    for (const event of Array.isArray(events) ? events : []) {
      afterSeq = Math.max(afterSeq, event.seq ?? afterSeq);
      if (event.type === "adapter.invoke" || event.eventType === "adapter.invoke") {
        sawAdapterInvoke = true;
      }
    }

    const runs = await request(`/companies/${companyId}/heartbeat-runs?agentId=${agentId}`);
    const run = Array.isArray(runs) ? runs.find((entry) => entry?.id === runId) : null;
    if (run && ["succeeded", "failed", "cancelled", "timed_out"].includes(run.status)) {
      return { run, sawAdapterInvoke };
    }

    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(`Timed out waiting for heartbeat run ${runId}`);
}

async function main() {
  const health = await request("/health");
  if (health?.ok !== true && health?.status !== "ok") {
    throw new Error(`Paperclip health check did not return ok: ${JSON.stringify(health)}`);
  }

  const stamp = new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);
  const company = await post("/companies", {
    name: `THEFT Department Runtime Smoke ${stamp}`,
    description: "Throwaway company for adapter-backed eight-department runtime smoke.",
    budgetMonthlyCents: 0,
  });
  const goal = await post(`/companies/${company.id}/goals`, {
    title: "Verify eight-department adapter runtime",
    description: "Every seeded department must complete one adapter-backed heartbeat.",
    level: "company",
    status: "active",
  });
  const project = await post(`/companies/${company.id}/projects`, {
    name: "Runtime Smoke",
    status: "in_progress",
    goalIds: [goal.id],
  });

  const results = [];
  for (const department of departments) {
    const hire = await post(`/companies/${company.id}/agent-hires`, {
      name: `${department} Smoke Agent`,
      role: "general",
      title: department,
      adapterType: ADAPTER_TYPE,
      adapterConfig: adapterConfig(department),
      runtimeConfig: {
        heartbeat: {
          enabled: false,
          cooldownSec: 1,
          maxConcurrentRuns: 1,
        },
      },
      desiredSkills: [],
    });

    if (hire.approval?.id) {
      await post(`/approvals/${hire.approval.id}/approve`, {
        decisionNote: "Approved by THEFT department runtime smoke.",
      });
    }

    const agent = hire.agent;
    const issue = await post(`/companies/${company.id}/issues`, {
      title: `THEFT runtime smoke: ${department}`,
      description:
        `Run one adapter-backed smoke check for the ${department} department. ` +
        "Keep output brief and do not modify repository files.",
      assigneeAgentId: agent.id,
      projectId: project.id,
      goalId: goal.id,
      status: "todo",
    });

    const run = await post(`/agents/${agent.id}/wakeup`, {
      source: "on_demand",
      triggerDetail: "manual",
      reason: `THEFT department runtime smoke for ${department}`,
      payload: { issueId: issue.id, department },
      forceFreshSession: true,
    });

    if (!run?.id || run.status === "skipped") {
      throw new Error(`${department}: wakeup was skipped (${JSON.stringify(run)})`);
    }

    const result = await pollRun(company.id, agent.id, run.id);
    if (!result.sawAdapterInvoke) {
      throw new Error(`${department}: heartbeat ${run.id} finished without adapter.invoke`);
    }
    if (result.run.status !== "succeeded") {
      throw new Error(`${department}: heartbeat ${run.id} finished ${result.run.status}: ${result.run.error ?? ""}`);
    }

    results.push({
      department,
      agentId: agent.id,
      issue: issue.identifier ?? issue.id,
      runId: run.id,
      status: result.run.status,
    });
    console.log(`${department}: ${result.run.status} (${run.id})`);
  }

  console.log(JSON.stringify({ companyId: company.id, adapterType: ADAPTER_TYPE, results }, null, 2));
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
