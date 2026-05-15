#!/usr/bin/env node
import process from "node:process";

const DEFAULT_ARGS = {
  baseUrl: process.env.PAPERCLIP_API_URL ?? "http://127.0.0.1:3100",
  adapterType: process.env.THEFT_SMOKE_ADAPTER ?? "process",
  codexModel: process.env.THEFT_SMOKE_CODEX_MODEL ?? "gpt-5.3-codex-spark",
  runTimeoutMs: Number.parseInt(process.env.THEFT_SMOKE_RUN_TIMEOUT_MS ?? "120000", 10),
  pollIntervalMs: Number.parseInt(process.env.THEFT_SMOKE_POLL_INTERVAL_MS ?? "500", 10),
  libraryPollIntervalMs: Number.parseInt(process.env.THEFT_SMOKE_LIBRARY_POLL_INTERVAL_MS ?? "1000", 10),
  libraryPollAttempts: Number.parseInt(process.env.THEFT_SMOKE_LIBRARY_POLL_MAX_ATTEMPTS ?? "12", 10),
  requireLibraryArtifacts:
    process.env.THEFT_SMOKE_REQUIRE_LIBRARY_ARTIFACTS === "1" ||
    process.env.THEFT_SMOKE_REQUIRE_LIBRARY_ARTIFACTS?.toLowerCase() === "true"
      ? true
      : process.env.THEFT_SMOKE_REQUIRE_LIBRARY_ARTIFACTS === "0" ||
          process.env.THEFT_SMOKE_REQUIRE_LIBRARY_ARTIFACTS?.toLowerCase() === "false"
        ? false
        : undefined,
  departments: process.env.THEFT_SMOKE_DEPARTMENTS ?? "",
  stopOnQuotaError:
    process.env.THEFT_SMOKE_STOP_ON_QUOTA_ERROR === "0" ||
    process.env.THEFT_SMOKE_STOP_ON_QUOTA_ERROR?.toLowerCase() === "false"
      ? false
      : true,
};

function parseArgs(argv) {
  const parsed = { ...DEFAULT_ARGS };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--base-url") {
      parsed.baseUrl = argv[++i] ?? parsed.baseUrl;
      continue;
    }
    if (arg === "--adapter") {
      parsed.adapterType = argv[++i] ?? parsed.adapterType;
      continue;
    }
    if (arg === "--codex-model" || arg === "--model") {
      parsed.codexModel = argv[++i] ?? parsed.codexModel;
      continue;
    }
    if (arg === "--run-timeout-ms") {
      parsed.runTimeoutMs = Number.parseInt(argv[++i] ?? `${parsed.runTimeoutMs}`, 10) || parsed.runTimeoutMs;
      continue;
    }
    if (arg === "--poll-ms") {
      parsed.pollIntervalMs = Number.parseInt(argv[++i] ?? `${parsed.pollIntervalMs}`, 10) || parsed.pollIntervalMs;
      continue;
    }
    if (arg === "--library-poll-ms") {
      parsed.libraryPollIntervalMs = Number.parseInt(argv[++i] ?? `${parsed.libraryPollIntervalMs}`, 10) || parsed.libraryPollIntervalMs;
      continue;
    }
    if (arg === "--library-poll-attempts") {
      parsed.libraryPollAttempts = Number.parseInt(argv[++i] ?? `${parsed.libraryPollAttempts}`, 10) || parsed.libraryPollAttempts;
      continue;
    }
    if (arg === "--require-library-artifacts") {
      parsed.requireLibraryArtifacts = true;
      continue;
    }
    if (arg === "--no-require-library-artifacts") {
      parsed.requireLibraryArtifacts = false;
      continue;
    }
    if (arg === "--continue-on-failure") {
      parsed.continueOnFailure = true;
      continue;
    }
    if (arg === "--departments") {
      parsed.departments = argv[++i] ?? parsed.departments;
      continue;
    }
    if (arg === "--stop-on-quota-error") {
      parsed.stopOnQuotaError = true;
      continue;
    }
    if (arg === "--no-stop-on-quota-error") {
      parsed.stopOnQuotaError = false;
      continue;
    }
    if (arg === "--stop-on-failure") {
      parsed.continueOnFailure = false;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  return {
    ...parsed,
    baseUrl: parsed.baseUrl.replace(/\/+$/, ""),
  };
}

function printUsage() {
  console.log(`
Usage:
  node paperclip/scripts/smoke/theft-department-runtime-smoke.mjs [options]

Options:
  --base-url URL                   API host root (default: http://127.0.0.1:3100)
  --adapter TYPE                   Adapter type: process|codex_local (default: process)
  --codex-model VALUE              Model id used for codex_local adapter
  --run-timeout-ms ms              Max ms to wait for each heartbeat run
  --poll-ms ms                     Poll interval for heartbeat run polling
  --library-poll-ms ms             Poll interval for issue artifact polling
  --library-poll-attempts N        Max library poll attempts
  --require-library-artifacts      Enforce artifact visibility for each department
  --no-require-library-artifacts   Do not require artifact visibility (default for process)
  --departments CSV                Comma-separated departments to run (e.g. Engineering,Design)
  --stop-on-quota-error            Stop immediately when provider/model quota is hit (default: on)
  --no-stop-on-quota-error         Keep running even after quota errors
`);
}

const args = parseArgs(process.argv.slice(2));
const BASE_URL = args.baseUrl;
const API_URL = `${BASE_URL}/api`;
const ADAPTER_TYPE = args.adapterType;
const CODEX_MODEL = args.codexModel;
const REPO_ROOT = process.env.THEFT_SMOKE_CWD ?? process.cwd();
const RUN_TIMEOUT_MS = args.runTimeoutMs;
const POLL_INTERVAL_MS = args.pollIntervalMs;
const LIBRARY_POLL_INTERVAL_MS = args.libraryPollIntervalMs;
const LIBRARY_POLL_MAX_ATTEMPTS = args.libraryPollAttempts;

const REQUIRE_LIBRARY_ARTIFACTS =
  typeof args.requireLibraryArtifacts === "boolean"
    ? args.requireLibraryArtifacts
    : ADAPTER_TYPE !== "process";
const CONTINUE_ON_FAILURE = args.continueOnFailure === true;
const STOP_ON_QUOTA_ERROR = args.stopOnQuotaError !== false;

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

const normalizedDepartmentMap = new Map(departments.map((department) => [department.toLowerCase(), department]));
const selectedDepartments =
  typeof args.departments === "string" && args.departments.trim().length > 0
    ? args.departments
      .split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
      .map((value) => {
        const found = normalizedDepartmentMap.get(value);
        if (!found) {
          throw new Error(`Unknown department "${value}". Valid values: ${departments.join(", ")}`);
        }
        return found;
      })
    : departments;

function adapterConfig(department) {
  if (ADAPTER_TYPE === "process") {
    const script = `
const department = ${JSON.stringify(department)};
const apiUrl = (process.env.PAPERCLIP_API_URL || process.env.PAPERCLIP_RUNTIME_API_URL || "").replace(/\\/+$/, "");
const agentId = process.env.PAPERCLIP_AGENT_ID;
const companyId = process.env.PAPERCLIP_COMPANY_ID;
const runId = process.env.PAPERCLIP_RUN_ID;
const apiKey = process.env.PAPERCLIP_API_KEY;

async function request(path, init = {}) {
  const res = await fetch(apiUrl + "/api" + path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(apiKey ? { Authorization: "Bearer " + apiKey } : {}),
      ...(runId ? { "X-Paperclip-Run-Id": runId } : {}),
      ...(init.headers || {}),
    },
  });
  if (!res.ok) {
    throw new Error((init.method || "GET") + " " + path + " failed: " + res.status + " " + await res.text());
  }
  return res.status === 204 ? null : res.json();
}

if (!apiUrl || !agentId || !companyId) {
  throw new Error("Missing PAPERCLIP_API_URL/PAPERCLIP_AGENT_ID/PAPERCLIP_COMPANY_ID for deterministic artifact smoke");
}

const issues = await request("/companies/" + companyId + "/issues");
const issue = Array.isArray(issues)
  ? issues.find((entry) =>
      entry &&
      entry.assigneeAgentId === agentId &&
      entry.title === "THEFT runtime smoke: " + department &&
      entry.status !== "cancelled"
    )
  : null;

if (!issue || !issue.id) {
  throw new Error("Could not resolve deterministic smoke issue for " + department);
}

const body = [
  "# " + department + " deterministic smoke result",
  "",
  "- Department: " + department,
  "- Adapter: process",
  "- Run ID: " + (runId || "unknown"),
  "- Result: Paperclip issue document API accepted a Library-visible artifact.",
].join("\\n");

await request("/issues/" + issue.id + "/documents/work-products", {
  method: "PUT",
  body: JSON.stringify({
    title: department + " smoke result",
    format: "markdown",
    body,
    changeSummary: "Created by deterministic THEFT smoke.",
  }),
});

await request("/issues/" + issue.id, {
  method: "PATCH",
  body: JSON.stringify({
    status: "done",
    comment: department + " deterministic smoke created a Library-visible document.",
  }),
});

console.log("THEFT runtime smoke artifact written for " + department);
`;
    return {
      command: process.execPath,
      args: [
        "--input-type=module",
        "-e",
        script,
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

function stringifyUnknown(value) {
  if (typeof value === "string") return value;
  if (value == null) return "";
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

function isQuotaErrorText(raw) {
  const text = raw.toLowerCase();
  return (
    text.includes("usage limit") ||
    text.includes("quota") ||
    text.includes("rate limit") ||
    text.includes("429")
  );
}

async function getRunLogSnippet(runId) {
  try {
    const log = await request(`/heartbeat-runs/${runId}/log?limitBytes=32768`);
    const content = typeof log === "string" ? log : stringifyUnknown(log?.content ?? log?.text ?? log);
    return content.slice(-8000);
  } catch {
    return "";
  }
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

async function getIssueLibraryArtifacts(issueId) {
  const [documents, attachments, workProducts] = await Promise.all([
    request(`/issues/${issueId}/documents`),
    request(`/issues/${issueId}/attachments`),
    request(`/issues/${issueId}/work-products`),
  ]);

  return {
    documents: Array.isArray(documents) ? documents : [],
    attachments: Array.isArray(attachments) ? attachments : [],
    workProducts: Array.isArray(workProducts) ? workProducts : [],
  };
}

function summarizeLibraryArtifacts(artifacts) {
  return {
    documents: artifacts.documents.map((doc) => doc.key ?? doc.id).filter(Boolean),
    attachments: artifacts.attachments.map((attachment) => attachment.id).filter(Boolean),
    workProducts: artifacts.workProducts.map((product) => product.id).filter(Boolean),
  };
}

async function pollLibraryArtifacts(issueId, department) {
  let attempts = 0;
  while (attempts <= LIBRARY_POLL_MAX_ATTEMPTS) {
    const artifacts = await getIssueLibraryArtifacts(issueId);
    const hasArtifact = artifacts.documents.length > 0 || artifacts.attachments.length > 0 || artifacts.workProducts.length > 0;

    if (hasArtifact) {
      return artifacts;
    }

    attempts += 1;
    if (attempts > LIBRARY_POLL_MAX_ATTEMPTS) {
      if (REQUIRE_LIBRARY_ARTIFACTS) {
        throw new Error(`${department}: run succeeded but no Library-visible artifacts were created`);
      }
      return artifacts;
    }

    await sleep(LIBRARY_POLL_INTERVAL_MS);
  }

  return { documents: [], attachments: [], workProducts: [] };
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
  for (const department of selectedDepartments) {
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
        "Keep output brief and do not modify repository files. " +
        "Write at least one concrete output artifact to the issue (a `work-products` artifact " +
        "or document) that summarizes your result, then set the issue status to done.",
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

    let status = "failed";
    let artifactSummary = { documents: [], attachments: [], workProducts: [] };
    let error = null;
    try {
      const result = await pollRun(company.id, agent.id, run.id);
      if (!result.sawAdapterInvoke) {
        throw new Error(`heartbeat ${run.id} finished without adapter.invoke`);
      }
      status = result.run.status;
      if (status !== "succeeded") {
        throw new Error(`heartbeat ${run.id} finished ${result.run.status}: ${result.run.error ?? ""}`);
      }

      const libraryArtifacts = await pollLibraryArtifacts(issue.id, department);
      artifactSummary = summarizeLibraryArtifacts(libraryArtifacts);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : String(caught);
      const runLogSnippet = await getRunLogSnippet(run.id);
      const quotaHit = isQuotaErrorText(`${error}\n${runLogSnippet}`);
      if (quotaHit) {
        error = `${error} [quota-limit-detected]`;
      }
      if (!CONTINUE_ON_FAILURE) {
        throw new Error(`${department}: ${error}`);
      }
      if (quotaHit && STOP_ON_QUOTA_ERROR) {
        results.push({
          department,
          agentId: agent.id,
          issue: issue.identifier ?? issue.id,
          runId: run.id,
          status,
          libraryArtifacts: artifactSummary,
        });
        console.log(
          `${department}: ${status} FAILED: ${error} (${run.id}) artifacts=${artifactSummary.documents.length + artifactSummary.attachments.length + artifactSummary.workProducts.length}`,
        );
        console.log("Stopping smoke run early because quota/rate limit was detected.");
        break;
      }
    }

    results.push({
      department,
      agentId: agent.id,
      issue: issue.identifier ?? issue.id,
      runId: run.id,
      status,
      libraryArtifacts: artifactSummary,
    });

    console.log(
      `${department}: ${status}${error ? ` FAILED: ${error}` : ""} (${run.id}) artifacts=${artifactSummary.documents.length + artifactSummary.attachments.length + artifactSummary.workProducts.length}`,
    );
  }

  console.log(JSON.stringify({ companyId: company.id, adapterType: ADAPTER_TYPE, results }, null, 2));
  const hasFailures = results.some((result) => result.status !== "succeeded");
  if (hasFailures) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
