#!/usr/bin/env node

const DEFAULT_BASE_URL = "http://127.0.0.1:3100";

function parseArgs(argv) {
  const parsed = {
    baseUrl: process.env.PAPERCLIP_BASE_URL ?? DEFAULT_BASE_URL,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      parsed.baseUrl = argv[++index] ?? parsed.baseUrl;
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
  node scripts/smoke/theft-local-health.mjs
  node scripts/smoke/theft-local-health.mjs --base-url http://127.0.0.1:3100

Checks an already-running Paperclip host for the minimum THEFT migration
run target: health endpoint, root route, and companies API reachability.
`);
}

async function fetchText(url) {
  const response = await fetch(url);
  const text = await response.text();
  return { response, text };
}

async function check(label, fn) {
  try {
    await fn();
    console.log(`ok - ${label}`);
  } catch (error) {
    console.error(`not ok - ${label}`);
    console.error(error instanceof Error ? error.message : String(error));
    process.exitCode = 1;
  }
}

async function main() {
  const { baseUrl } = parseArgs(process.argv.slice(2));
  console.log(`THEFT/Paperclip local smoke target: ${baseUrl}`);

  await check("GET /api/health returns status ok", async () => {
    const { response, text } = await fetchText(`${baseUrl}/api/health`);
    if (!response.ok) {
      throw new Error(`Expected 2xx, got ${response.status}: ${text}`);
    }
    const body = JSON.parse(text);
    if (body.status !== "ok") {
      throw new Error(`Expected status=ok, got ${text}`);
    }
  });

  await check("GET / serves the app shell", async () => {
    const { response, text } = await fetchText(`${baseUrl}/`);
    if (!response.ok) {
      throw new Error(`Expected 2xx, got ${response.status}: ${text.slice(0, 200)}`);
    }
    if (!text.trim()) {
      throw new Error("Root response was empty");
    }
  });

  await check("GET /api/companies is reachable", async () => {
    const { response, text } = await fetchText(`${baseUrl}/api/companies`);
    if (!response.ok) {
      throw new Error(`Expected 2xx, got ${response.status}: ${text}`);
    }
    const body = JSON.parse(text);
    if (!Array.isArray(body)) {
      throw new Error(`Expected companies array, got ${text}`);
    }
  });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
