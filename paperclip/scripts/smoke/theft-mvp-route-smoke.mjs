#!/usr/bin/env node

import { mkdir } from "node:fs/promises";
import path from "node:path";
import { chromium } from "@playwright/test";

const DEFAULT_BASE_URL = "http://127.0.0.1:3100";
const DEFAULT_CHROME_PATH = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";

const MVP_ROUTES = [
  {
    name: "Mission Control",
    path: "/dashboard",
    expectedText: ["Mission Control", "Objective", "Strategy map"],
  },
  {
    name: "Tasks / Needs Action",
    path: "/issues",
    expectedText: ["Tasks", "Founder review queue", "Next move"],
  },
  {
    name: "Tech Tree",
    path: "/goals",
    expectedText: ["Tech Tree", "Build order", "Selected node"],
  },
  {
    name: "Library / Outcomes",
    path: "/library",
    expectedText: ["Library", "Durable company output"],
  },
  {
    name: "Department Workspace",
    path: "/departments/engineering",
    expectedText: ["Engineering", "Department workspace", "Objective contribution"],
  },
  {
    name: "System / Diagnostics",
    path: "/agents/all",
    expectedText: ["Agents", "Agent Runtime"],
  },
];

function parseArgs(argv) {
  const parsed = {
    baseUrl: process.env.PAPERCLIP_BASE_URL ?? DEFAULT_BASE_URL,
    companyPrefix: process.env.THEFT_MVP_COMPANY_PREFIX ?? null,
    chromePath: process.env.THEFT_CHROME_PATH ?? DEFAULT_CHROME_PATH,
    screenshotDir: process.env.THEFT_MVP_SCREENSHOT_DIR ?? null,
    viewport: { width: 1440, height: 900 },
    mobile: false,
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
    if (arg === "--chrome-path") {
      parsed.chromePath = argv[++index] ?? parsed.chromePath;
      continue;
    }
    if (arg === "--screenshot-dir") {
      parsed.screenshotDir = argv[++index] ?? parsed.screenshotDir;
      continue;
    }
    if (arg === "--mobile") {
      parsed.mobile = true;
      parsed.viewport = { width: 390, height: 844 };
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
  node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs
  node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --company-prefix THE --screenshot-dir /private/tmp/theft-mvp
  node paperclip/scripts/smoke/theft-mvp-route-smoke.mjs --mobile --company-prefix THE

Checks the already-running Paperclip host for the THEFT MVP product path:
Mission Control, Tasks, Tech Tree, Library, Department Workspace, and System.
This is a zero-quota browser smoke. It does not invoke agents or LLM adapters.
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

async function resolveCompanyPrefix(baseUrl, requestedPrefix) {
  if (requestedPrefix) return requestedPrefix;
  const companies = await fetchJson(`${baseUrl}/api/companies`);
  const activeCompanies = companies.filter((company) => company.status !== "archived" && company.issuePrefix);
  activeCompanies.sort((a, b) => {
    const counterDelta = (b.issueCounter ?? 0) - (a.issueCounter ?? 0);
    if (counterDelta !== 0) return counterDelta;
    return new Date(b.updatedAt ?? b.createdAt ?? 0).getTime() - new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
  });
  const company = activeCompanies[0];
  if (!company) throw new Error("No active company with an issuePrefix was found.");
  return company.issuePrefix;
}

function routeUrl(baseUrl, companyPrefix, routePath) {
  return `${baseUrl}/${encodeURIComponent(companyPrefix)}${routePath}`;
}

function safeScreenshotName(routeName) {
  return routeName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "route";
}

async function checkRoute({ page, baseUrl, companyPrefix, route, screenshotDir }) {
  const url = routeUrl(baseUrl, companyPrefix, route.path);
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15_000 });
  await page.waitForTimeout(2_000);

  const result = await page.evaluate((expectedText) => {
    const bodyText = document.body.innerText;
    const root = document.documentElement;
    return {
      title: document.title,
      bodyText,
      clientWidth: root.clientWidth,
      scrollWidth: root.scrollWidth,
      missingText: expectedText.filter((text) => !bodyText.toLowerCase().includes(text.toLowerCase())),
      rightOverflowCount: [...document.querySelectorAll("body *")].filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.right > root.clientWidth + 2;
      }).length,
    };
  }, route.expectedText);

  if (result.bodyText.trim().length < 20) {
    throw new Error(`${route.name} rendered too little text.`);
  }
  if (result.missingText.length > 0) {
    throw new Error(`${route.name} missing expected text: ${result.missingText.join(", ")}`);
  }
  if (result.scrollWidth > result.clientWidth) {
    throw new Error(`${route.name} has document overflow: ${result.scrollWidth} > ${result.clientWidth}`);
  }
  if (result.rightOverflowCount > 0) {
    throw new Error(`${route.name} has ${result.rightOverflowCount} right-edge overflow element(s).`);
  }

  if (screenshotDir) {
    await mkdir(screenshotDir, { recursive: true });
    await page.screenshot({
      path: path.join(screenshotDir, `${safeScreenshotName(route.name)}.png`),
      fullPage: false,
    });
  }

  console.log(`ok - ${route.name} renders without horizontal overflow`);
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const companyPrefix = await resolveCompanyPrefix(options.baseUrl, options.companyPrefix);
  console.log(`THEFT MVP route smoke target: ${options.baseUrl}/${companyPrefix}`);
  console.log(`Viewport: ${options.viewport.width}x${options.viewport.height}`);

  const browser = await chromium.launch({
    headless: true,
    executablePath: options.chromePath,
  });
  try {
    const page = await browser.newPage({ viewport: options.viewport });
    for (const route of MVP_ROUTES) {
      await checkRoute({
        page,
        baseUrl: options.baseUrl,
        companyPrefix,
        route,
        screenshotDir: options.screenshotDir,
      });
    }
  } finally {
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
