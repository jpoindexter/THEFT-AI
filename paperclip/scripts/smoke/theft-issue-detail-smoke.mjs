#!/usr/bin/env node

import { chromium } from "@playwright/test";

const DEFAULT_BASE_URL = "http://127.0.0.1:3100";

function parseArgs(argv) {
  const parsed = {
    baseUrl: process.env.PAPERCLIP_BASE_URL ?? DEFAULT_BASE_URL,
    companyPrefix: process.env.THEFT_MVP_COMPANY_PREFIX ?? null,
    issueIdentifier: process.env.THEFT_ISSUE_IDENTIFIER ?? null,
    viewport: { width: 1440, height: 900 },
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      parsed.baseUrl = argv[++index] ?? parsed.baseUrl;
      continue;
    }
    if (arg === "--company-prefix") {
      parsed.companyPrefix = argv[++index] ?? parsed.companyPrefix;
      continue;
    }
    if (arg === "--issue") {
      parsed.issueIdentifier = argv[++index] ?? parsed.issueIdentifier;
      continue;
    }
    if (arg === "--short") {
      parsed.viewport = { width: 1024, height: 620 };
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printUsage();
      process.exit(0);
    }
    throw new Error(`Unknown argument: ${arg}`);
  }

  parsed.baseUrl = parsed.baseUrl.replace(/\/+$/, "");
  return parsed;
}

function printUsage() {
  console.log(`
Usage:
  node paperclip/scripts/smoke/theft-issue-detail-smoke.mjs
  node paperclip/scripts/smoke/theft-issue-detail-smoke.mjs --company-prefix THFT --issue THFT-12
  node paperclip/scripts/smoke/theft-issue-detail-smoke.mjs --short --company-prefix THFT

Checks issue-detail rendering for the active THEFT company path and fails on:
- page errors
- React runtime loop errors
- duplicate key reconciliation errors
`);
}

async function fetchJson(url) {
  const response = await fetch(url);
  const text = await response.text();
  if (!response.ok) {
    throw new Error(`Expected 2xx from ${url}, got ${response.status}: ${text}`);
  }
  return JSON.parse(text);
}

function chooseCompany(companies, companyPrefix) {
  if (companyPrefix) {
    const exact = companies.find((company) => company.issuePrefix === companyPrefix);
    if (!exact) {
      throw new Error(`No company found for prefix ${companyPrefix}`);
    }
    return exact;
  }

  const activeCompanies = companies.filter((company) => company.status !== "archived" && company.issuePrefix);
  activeCompanies.sort((a, b) => {
    const issueCounterDelta = (b.issueCounter ?? 0) - (a.issueCounter ?? 0);
    if (issueCounterDelta !== 0) return issueCounterDelta;
    return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
  });
  const company = activeCompanies[0];
  if (!company) throw new Error("No active company with issuePrefix found.");
  return company;
}

function chooseIssue(issues, explicitIdentifier) {
  if (explicitIdentifier) {
    const issue = issues.find((entry) => entry.identifier === explicitIdentifier);
    if (!issue) throw new Error(`No issue found for identifier ${explicitIdentifier}`);
    return issue;
  }
  const visibleIssues = issues.filter((entry) => entry.identifier && !entry.hiddenAt);
  visibleIssues.sort((a, b) => {
    const numberDelta = (b.issueNumber ?? 0) - (a.issueNumber ?? 0);
    if (numberDelta !== 0) return numberDelta;
    return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
  });
  const issue = visibleIssues[0];
  if (!issue) throw new Error("No visible issue found for issue-detail smoke.");
  return issue;
}

function isFatalConsoleMessage(text) {
  if (!text) return false;
  return true;
}

async function run() {
  const options = parseArgs(process.argv.slice(2));
  const companies = await fetchJson(`${options.baseUrl}/api/companies`);
  const company = chooseCompany(companies, options.companyPrefix);
  const issues = await fetchJson(`${options.baseUrl}/api/companies/${company.id}/issues?limit=100`);
  const issue = chooseIssue(issues, options.issueIdentifier);
  const issueUrl = `${options.baseUrl}/${encodeURIComponent(company.issuePrefix)}/issues/${encodeURIComponent(issue.identifier)}`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: options.viewport });
  const consoleErrors = [];
  const pageErrors = [];
  page.on("console", (msg) => {
    if (msg.type() !== "error") return;
    const text = msg.text();
    if (!isFatalConsoleMessage(text)) return;
    consoleErrors.push(text);
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message || String(error));
  });

  await page.goto(issueUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
  await page.waitForTimeout(2_500);

  const runtimeDiagnosticsTab = page.getByRole("button", { name: /Runtime diagnostics/i });
  if (await runtimeDiagnosticsTab.count()) {
    await runtimeDiagnosticsTab.first().click();
    await page.waitForTimeout(700);
  }

  const contextTab = page.getByRole("button", { name: /Context/i });
  if (await contextTab.count()) {
    await contextTab.first().click();
    await page.waitForTimeout(700);
  }

  const contentLength = await page.evaluate(() => document.body.innerText.trim().length);
  await browser.close();

  if (contentLength < 40) {
    throw new Error(`Issue detail rendered too little content (${contentLength} characters).`);
  }
  if (pageErrors.length > 0) {
    throw new Error(`Issue detail page errors detected:\n${pageErrors.join("\n")}`);
  }
  if (consoleErrors.length > 0) {
    throw new Error(`Issue detail console errors detected:\n${consoleErrors.join("\n")}`);
  }

  console.log(`ok - issue detail smoke passed for ${issue.identifier} (${company.issuePrefix})`);
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});

