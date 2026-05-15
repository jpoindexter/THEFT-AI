import { expect, test } from "@playwright/test";

const COMPANY_NAME = `UX079-${Date.now()}`;
const AGENT_NAME = "Operator";
const TASK_TITLE = "UX079 visual verification task";
const SCREENSHOT_DIR = "test-results/ux079";
const VIEWPORTS = [
  { name: "desktop", width: 1440, height: 900 },
  { name: "tablet", width: 1024, height: 768 },
  { name: "mobile", width: 390, height: 844 },
] as const;

async function expectNoHorizontalOverflow(page: import("@playwright/test").Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      bodyScrollWidth: document.body.scrollWidth,
      bodyClientWidth: document.body.clientWidth,
    };
  });
  expect(overflow.scrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.clientWidth + 2);
  expect(overflow.bodyScrollWidth, JSON.stringify(overflow)).toBeLessThanOrEqual(overflow.bodyClientWidth + 2);
}

async function seedCompany(page: import("@playwright/test").Page) {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto("/onboarding");
  await expect(page.locator("h3", { hasText: "Name your company" })).toBeVisible({ timeout: 5_000 });
  await page.getByRole("textbox", { name: "Company name" }).fill(COMPANY_NAME);
  await page.getByRole("button", { name: "Building" }).click();
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.locator("h3", { hasText: "Assemble your company" })).toBeVisible({ timeout: 30_000 });
  await expect(page.locator('input[placeholder="Operator"]')).toHaveValue(AGENT_NAME);
  await page.getByRole("button", { name: "Next" }).click();

  await expect(page.locator("h3", { hasText: "Set the first company task" })).toBeVisible({ timeout: 30_000 });
  const baseUrl = page.url().split("/").slice(0, 3).join("/");
  const companiesAfterAgentRes = await page.request.get(`${baseUrl}/api/companies`);
  expect(companiesAfterAgentRes.ok()).toBe(true);
  const companiesAfterAgent = await companiesAfterAgentRes.json();
  const companyAfterAgent = companiesAfterAgent.find((c: { name: string }) => c.name === COMPANY_NAME);
  expect(companyAfterAgent).toBeTruthy();

  const agentsAfterCreateRes = await page.request.get(`${baseUrl}/api/companies/${companyAfterAgent.id}/agents`);
  expect(agentsAfterCreateRes.ok()).toBe(true);
  const agentsAfterCreate = await agentsAfterCreateRes.json();
  const operator = agentsAfterCreate.find((a: { name: string }) => a.name === AGENT_NAME);
  expect(operator).toBeTruthy();

  const disableWakeRes = await page.request.patch(
    `${baseUrl}/api/agents/${operator.id}?companyId=${encodeURIComponent(companyAfterAgent.id)}`,
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
    },
  );
  expect(disableWakeRes.ok()).toBe(true);

  const taskTitleInput = page.locator('input[placeholder="e.g. Research competitor pricing"]');
  await taskTitleInput.clear();
  await taskTitleInput.fill(TASK_TITLE);
  await page.getByRole("button", { name: "Next" }).click();
  await expect(page.locator("h3", { hasText: "Launch your company OS" })).toBeVisible({ timeout: 30_000 });
  await page.getByRole("button", { name: "Launch Company" }).click();
  await expect(page).toHaveURL(/\/dashboard$/, { timeout: 30_000 });

  const companiesRes = await page.request.get(`${baseUrl}/api/companies`);
  expect(companiesRes.ok()).toBe(true);
  const companies = await companiesRes.json();
  const company = companies.find((c: { name: string }) => c.name === COMPANY_NAME);
  expect(company).toBeTruthy();
  const issuesRes = await page.request.get(`${baseUrl}/api/companies/${company.id}/issues`);
  expect(issuesRes.ok()).toBe(true);
  const issues = await issuesRes.json();
  const task = issues.find((i: { title: string }) => i.title === TASK_TITLE);
  expect(task).toBeTruthy();

  const docRes = await page.request.put(`${baseUrl}/api/issues/${task.id}/documents/work-products`, {
    data: {
      format: "markdown",
      body: "# Visual verification artifact\n\nThis output verifies Library and Task Review responsive surfaces.",
    },
  });
  expect(docRes.ok()).toBe(true);

  const commentRes = await page.request.post(`${baseUrl}/api/issues/${task.id}/comments`, {
    data: { body: "Decision: keep the visual pass focused on responsive overlap and readable work surfaces." },
  });
  expect(commentRes.ok()).toBe(true);

  return {
    baseUrl,
    companyPrefix: company.issuePrefix ?? company.id,
    issueIdentifier: task.identifier ?? task.id,
  };
}

test("UX079 captures onboarding, Command Center, Library, and Task Review across breakpoints", async ({ page }) => {
  test.setTimeout(180_000);
  const seeded = await seedCompany(page);

  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });

    await page.goto("/onboarding");
    await expect(page.locator("h3", { hasText: "Name your company" })).toBeVisible({ timeout: 10_000 });
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${viewport.name}-onboarding.png`,
      fullPage: true,
    });

    await page.goto(`/${seeded.companyPrefix}/dashboard`);
    await expect(page.getByRole("heading", { name: COMPANY_NAME })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText("Operator tray")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${viewport.name}-command-center.png`,
      fullPage: true,
    });

    await page.goto(`/${seeded.companyPrefix}/library`);
    await expect(page.locator("#main-content").getByRole("heading", { name: "Library", exact: true })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText("Visual verification artifact")).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${viewport.name}-library.png`,
      fullPage: true,
    });

    await page.goto(`/${seeded.companyPrefix}/issues/${seeded.issueIdentifier}`);
    await expect(page.getByRole("heading", { name: TASK_TITLE })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole("heading", { name: "Task review" })).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: `${SCREENSHOT_DIR}/${viewport.name}-task-review.png`,
      fullPage: true,
    });
  }
});
