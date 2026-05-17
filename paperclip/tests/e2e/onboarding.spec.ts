import { test, expect } from "@playwright/test";

/**
 * E2E: THEFT onboarding wizard flow (skip_llm mode).
 *
 * Walks through the 4-step OnboardingWizard:
 *   Step 1 — Name your company
 *   Step 2 — Assemble your company (Operator + department preview)
 *   Step 3 — Set the first company task
 *   Step 4 — Launch your company OS (summary + company canvas)
 *
 * By default this runs in skip_llm mode: we do NOT assert that an LLM
 * heartbeat fires. Set PAPERCLIP_E2E_SKIP_LLM=false to enable LLM-dependent
 * assertions (requires a valid ANTHROPIC_API_KEY).
 */

const SKIP_LLM = process.env.PAPERCLIP_E2E_SKIP_LLM !== "false";

const COMPANY_NAME = `E2E-Test-${Date.now()}`;
const AGENT_NAME = "Operator";
const TASK_TITLE = "E2E test task";
const REQUIRED_DEPARTMENTS = [
  "Engineering",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "Finance",
  "Legal",
  "Support",
];

test.describe("Onboarding wizard", () => {
  test("renders company assembly preview on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/onboarding");

    await expect(page.locator("h3", { hasText: "Name your company" })).toBeVisible({ timeout: 5_000 });
    await page.locator('input[placeholder="Company name"]').fill(`E2E-Mobile-${Date.now()}`);
    await page.getByRole("button", { name: "Validating" }).click();
    await page.getByRole("button", { name: "Next" }).click();

    await expect(page.locator("h3", { hasText: "Assemble your company" })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Company assembly preview")).toBeVisible();
    await expect(page.getByText("8 business lanes")).toBeVisible();
    await expect(page.getByText("Advanced runtime")).toBeVisible();
  });

  test("completes full wizard flow", async ({ page }) => {
    await page.goto("/onboarding");

    const wizardHeading = page.locator("h3", { hasText: "Name your company" });

    await expect(wizardHeading).toBeVisible({ timeout: 5_000 });

    const companyNameInput = page.locator('input[placeholder="Company name"]');
    await companyNameInput.fill(COMPANY_NAME);

    const nextButton = page.getByRole("button", { name: "Next" });
    await page.getByRole("button", { name: "Building" }).click();
    await page.locator('input[placeholder="Legal, compliance, or operating note (optional)"]').fill("Already operating locally");
    await page.locator('input[placeholder="Offer note (optional)"]').fill("Initial offer exists");

    await nextButton.click();

    await expect(
      page.locator("h3", { hasText: "Assemble your company" })
    ).toBeVisible({ timeout: 30_000 });

    const agentNameInput = page.locator('input[placeholder="Operator"]');
    await expect(agentNameInput).toHaveValue(AGENT_NAME);

    const assemblyPreview = page.getByLabel("Company assembly preview");
    await expect(assemblyPreview).toBeVisible();
    await expect(assemblyPreview.getByText("8 business lanes")).toBeVisible();
    for (const department of REQUIRED_DEPARTMENTS) {
      await expect(assemblyPreview.getByText(department, { exact: true })).toBeVisible();
    }

    await expect(page.getByText("Advanced runtime")).toBeVisible();
    await expect(page.getByRole("button", { name: "More Agent Adapter Types" })).toHaveCount(0);
    await page.getByText("Advanced runtime").click();
    await page.getByRole("button", { name: "More Agent Adapter Types" }).click();
    await expect(page.getByRole("button", { name: "Process" })).toHaveCount(0);

    await page.getByRole("button", { name: "Next" }).click();

    await expect(
      page.locator("h3", { hasText: "Set the first company task" })
    ).toBeVisible({ timeout: 30_000 });

    const baseUrl = page.url().split("/").slice(0, 3).join("/");
    if (SKIP_LLM) {
      const companiesAfterAgentRes = await page.request.get(`${baseUrl}/api/companies`);
      expect(companiesAfterAgentRes.ok()).toBe(true);
      const companiesAfterAgent = await companiesAfterAgentRes.json();
      const companyAfterAgent = companiesAfterAgent.find(
        (c: { name: string }) => c.name === COMPANY_NAME
      );
      expect(companyAfterAgent).toBeTruthy();

      const agentsAfterCreateRes = await page.request.get(
        `${baseUrl}/api/companies/${companyAfterAgent.id}/agents`
      );
      expect(agentsAfterCreateRes.ok()).toBe(true);
      const agentsAfterCreate = await agentsAfterCreateRes.json();
      const ceoAgentAfterCreate = agentsAfterCreate.find(
        (a: { name: string }) => a.name === AGENT_NAME
      );
      expect(ceoAgentAfterCreate).toBeTruthy();

      const disableWakeRes = await page.request.patch(
        `${baseUrl}/api/agents/${ceoAgentAfterCreate.id}?companyId=${encodeURIComponent(companyAfterAgent.id)}`,
        {
          data: {
            runtimeConfig: {
              heartbeat: {
                enabled: false,
                intervalSec: 300,
                wakeOnDemand: false,
                cooldownSec: 10,
                maxConcurrentRuns: 5,
              },
            },
          },
        }
      );
      expect(disableWakeRes.ok()).toBe(true);
    }

    const taskTitleInput = page.locator(
      'input[placeholder="e.g. Research competitor pricing"]'
    );
    await taskTitleInput.clear();
    await taskTitleInput.fill(TASK_TITLE);

    await page.getByRole("button", { name: "Next" }).click();

    await expect(
      page.locator("h3", { hasText: "Review the business plan" })
    ).toBeVisible({ timeout: 30_000 });
    await page.getByRole("button", { name: "Preview assembly" }).click();

    await expect(
      page.locator("h2", { hasText: "Company Assembly Preview" })
    ).toBeVisible({ timeout: 30_000 });

    await expect(page.locator("text=" + COMPANY_NAME)).toBeVisible();
    await expect(page.getByText(AGENT_NAME, { exact: true })).toBeVisible();
    await expect(page.locator("text=" + TASK_TITLE)).toBeVisible();
    await expect(page.getByText("8 departments", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: "Launch company" }).click();

    await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });
    await expect(page.getByRole("heading", { name: COMPANY_NAME })).toBeVisible();
    await expect(page.getByRole("link", { name: /Tech Tree/i }).first()).toBeVisible();
    await expect(page.getByText("Next Move recommended")).toBeVisible();

    const companiesRes = await page.request.get(`${baseUrl}/api/companies`);
    expect(companiesRes.ok()).toBe(true);
    const companies = await companiesRes.json();
    const company = companies.find(
      (c: { name: string }) => c.name === COMPANY_NAME
    );
    expect(company).toBeTruthy();
    expect(company.description).toContain("[theft-onboarding]");
    expect(company.description).toContain('"stage": "building"');

    const agentsRes = await page.request.get(
      `${baseUrl}/api/companies/${company.id}/agents`
    );
    expect(agentsRes.ok()).toBe(true);
    const agents = await agentsRes.json();
    const ceoAgent = agents.find(
      (a: { name: string }) => a.name === AGENT_NAME
    );
    expect(ceoAgent).toBeTruthy();
    expect(ceoAgent.role).toBe("ceo");
    expect(ceoAgent.adapterType).not.toBe("process");
    for (const department of REQUIRED_DEPARTMENTS) {
      expect(
        agents.some((agent: { title?: string | null; name: string }) =>
          (agent.title ?? agent.name).includes(department)
        )
      ).toBe(true);
    }

    const instructionsBundleRes = await page.request.get(
      `${baseUrl}/api/agents/${ceoAgent.id}/instructions-bundle?companyId=${company.id}`
    );
    expect(instructionsBundleRes.ok()).toBe(true);
    const instructionsBundle = await instructionsBundleRes.json();
    expect(
      instructionsBundle.files.map((file: { path: string }) => file.path).sort()
    ).toEqual(["AGENTS.md", "HEARTBEAT.md", "SOUL.md", "TOOLS.md"]);

    const issuesRes = await page.request.get(
      `${baseUrl}/api/companies/${company.id}/issues`
    );
    expect(issuesRes.ok()).toBe(true);
    const issues = await issuesRes.json();
    const task = issues.find(
      (i: { title: string }) => i.title === TASK_TITLE
    );
    expect(task).toBeTruthy();
    expect(task.assigneeAgentId).toBe(ceoAgent.id);
    expect(task.description).toContain("You are the Operator. You set the direction for the company.");
    expect(task.description).toContain("THEFT Library");
    expect(task.description).not.toContain("github.com/paperclipai/companies");
    for (const department of REQUIRED_DEPARTMENTS) {
      expect(
        issues.some((issue: { title: string; description?: string | null }) =>
          issue.description?.includes(`Department seed: ${department}`)
        )
      ).toBe(true);
    }

    if (!SKIP_LLM) {
      await expect(async () => {
        const res = await page.request.get(
          `${baseUrl}/api/issues/${task.id}`
        );
        const issue = await res.json();
        expect(["in_progress", "done"]).toContain(issue.status);
      }).toPass({ timeout: 120_000, intervals: [5_000] });
    } else {
      await expect
        .poll(async () => {
          const runsRes = await page.request.get(
            `${baseUrl}/api/companies/${company.id}/heartbeat-runs?agentId=${ceoAgent.id}`
          );
          expect(runsRes.ok()).toBe(true);
          const runs = await runsRes.json();
          return Array.isArray(runs) ? runs.length : -1;
        }, { timeout: 10_000, intervals: [500, 1_000, 2_000] })
        .toBe(0);
    }
  });
});
