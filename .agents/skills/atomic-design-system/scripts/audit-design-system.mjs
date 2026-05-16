#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";

const DEFAULT_TARGETS = ["paperclip/ui/src"];
const DEFAULT_MAX_FINDINGS = 80;
const SEVERITY_ORDER = ["info", "low", "medium", "high", "blocker"];
const SKIP_DIRS = new Set([
  ".cache",
  ".agents",
  ".claude",
  ".git",
  ".next",
  ".pnpm",
  ".specify",
  ".turbo",
  ".vercel",
  "_archive",
  "_reference",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "storybook-static",
]);
const SCAN_EXTENSIONS = new Set([
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".cjs",
]);
const RESOLVE_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css"];
const STYLE_EXTENSIONS = new Set([".css", ".scss", ".sass", ".less"]);
const JSX_EXTENSIONS = new Set([".tsx", ".jsx"]);

const ACTIVE_ROUTE_SEEDS = [
  "paperclip/ui/src/index.css",
  "paperclip/ui/src/App.tsx",
  "paperclip/ui/src/components/Layout.tsx",
  "paperclip/ui/src/components/OnboardingWizard.tsx",
  "paperclip/ui/src/pages/Dashboard.tsx",
  "paperclip/ui/src/pages/DepartmentWorkspace.tsx",
  "paperclip/ui/src/pages/Issues.tsx",
  "paperclip/ui/src/pages/IssueDetail.tsx",
  "paperclip/ui/src/pages/Library.tsx",
  "paperclip/ui/src/pages/Goals.tsx",
  "paperclip/ui/src/pages/Agents.tsx",
];

const CHECKS = [
  {
    id: "inline-style",
    severity: "high",
    pattern: /\bstyle\s*=\s*\{/g,
    message: "Inline React style prop",
  },
  {
    id: "hex-color",
    severity: "high",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    message: "Hardcoded hex color",
    tokenSeverity: "info",
  },
  {
    id: "raw-color-function",
    severity: "medium",
    pattern: /\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(/g,
    message: "Raw color function",
    tokenSeverity: "info",
  },
  {
    id: "arbitrary-tailwind",
    severity: "high",
    pattern: /\b(?:bg|text|border|shadow|rounded|grid-cols|min-w|max-w|w|h|min-h|max-h|left|right|top|bottom|inset|tracking|leading|p|px|py|m|mx|my|gap)-\[[^\]]+\]/g,
    message: "Arbitrary Tailwind value",
  },
  {
    id: "radius-override",
    severity: "high",
    pattern: /\brounded-(?:none|\[[^\]]+\])/g,
    message: "Radius override outside token scale",
  },
  {
    id: "important-css",
    severity: "medium",
    pattern: /!important\b/g,
    message: "Important CSS override",
  },
  {
    id: "theme-root",
    severity: "high",
    pattern: /(?:^|\n)\s*(?::root|\.dark|@theme)\b[^{]*\{/g,
    message: "Theme root declaration",
    tokenSeverity: "info",
  },
  {
    id: "raw-px",
    severity: "medium",
    pattern: /\b\d+(?:\.\d+)?px\b/g,
    message: "Raw pixel value outside spacing/type/radius tokens",
    tokenSeverity: "info",
  },
  {
    id: "native-control",
    severity: "medium",
    pattern: /<\s*(?:button|input|textarea|select)\b/g,
    message: "Native control outside the primitive layer; confirm it is not replacing shadcn",
  },
];

function usage() {
  console.log(`
Usage:
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs [options] [target ...]

Options:
  --active-routes          Scan THEFT MVP active route seeds plus local static imports.
  --json                   Print machine-readable JSON.
  --max-findings <n>       Limit printed findings in text mode. Default: ${DEFAULT_MAX_FINDINGS}.
  --baseline <file>        Fail when current counts exceed a previously written baseline.
  --write-baseline <file>  Write the current audit summary as a baseline JSON file.
  --fail-on <severity>     Fail when any finding at or above severity exists.
                           Values: ${SEVERITY_ORDER.join(", ")}.
  -h, --help               Show this help.

Examples:
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs . --max-findings 40
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs --active-routes --json
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs --active-routes --write-baseline /private/tmp/theft-design-baseline.json
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs --active-routes --baseline /private/tmp/theft-design-baseline.json
`);
}

function parseArgs(argv) {
  const options = {
    activeRoutes: false,
    baselinePath: null,
    failOn: null,
    json: false,
    maxFindings: DEFAULT_MAX_FINDINGS,
    targets: [],
    writeBaselinePath: null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help" || arg === "-h") {
      options.help = true;
      continue;
    }
    if (arg === "--active-routes") {
      options.activeRoutes = true;
      continue;
    }
    if (arg === "--json") {
      options.json = true;
      continue;
    }
    if (arg === "--max-findings") {
      options.maxFindings = readPositiveInteger(argv[++index], "--max-findings");
      continue;
    }
    if (arg === "--baseline") {
      options.baselinePath = readRequiredValue(argv[++index], "--baseline");
      continue;
    }
    if (arg === "--write-baseline") {
      options.writeBaselinePath = readRequiredValue(argv[++index], "--write-baseline");
      continue;
    }
    if (arg === "--fail-on") {
      const severity = readRequiredValue(argv[++index], "--fail-on");
      if (!SEVERITY_ORDER.includes(severity)) {
        throw new Error(`Invalid --fail-on severity "${severity}". Expected one of: ${SEVERITY_ORDER.join(", ")}`);
      }
      options.failOn = severity;
      continue;
    }
    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    options.targets.push(arg);
  }

  if (options.targets.length === 0) options.targets = DEFAULT_TARGETS;
  return options;
}

function readRequiredValue(value, flag) {
  if (!value || value.startsWith("-")) throw new Error(`${flag} requires a value.`);
  return value;
}

function readPositiveInteger(value, flag) {
  const parsed = Number.parseInt(readRequiredValue(value, flag), 10);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${flag} must be a positive integer.`);
  return parsed;
}

function walk(target, files = []) {
  const absolute = path.resolve(target);
  const stat = statSync(absolute, { throwIfNoEntry: false });
  if (!stat) return files;

  if (stat.isFile()) {
    if (shouldScanFile(absolute)) files.push(absolute);
    return files;
  }

  if (!stat.isDirectory()) return files;

  for (const entry of readdirSync(absolute)) {
    if (SKIP_DIRS.has(entry)) continue;
    walk(path.join(absolute, entry), files);
  }

  return files;
}

function shouldScanFile(file) {
  const extension = path.extname(file);
  if (!SCAN_EXTENSIONS.has(extension)) return false;
  if (STYLE_EXTENSIONS.has(extension) || JSX_EXTENSIONS.has(extension)) return true;

  const normalized = normalizePath(file);
  const base = path.basename(file).toLowerCase();
  return (
    normalized.startsWith("app/") ||
    normalized.includes("/ui/") ||
    normalized.includes("/components/") ||
    normalized.includes("/pages/") ||
    /\b(?:color|design|style|tailwind|theme|token)s?\b/.test(base)
  );
}

function activeRouteFiles() {
  const queue = ACTIVE_ROUTE_SEEDS.map((file) => path.resolve(file)).filter((file) => existsSync(file));
  const seen = new Set();

  while (queue.length > 0) {
    const file = queue.shift();
    if (!file || seen.has(file)) continue;
    seen.add(file);

    if (!SCAN_EXTENSIONS.has(path.extname(file))) continue;
    for (const imported of readStaticImports(file)) {
      const resolved = resolveImport(file, imported);
      if (resolved && !seen.has(resolved)) queue.push(resolved);
    }
  }

  return [...seen].filter((file) => SCAN_EXTENSIONS.has(path.extname(file))).sort();
}

function readStaticImports(file) {
  const text = readFileSync(file, "utf8");
  const imports = [];
  const importPattern = /(?:import|export)\s+(?:type\s+)?(?:[^'"]*?\s+from\s+)?["']([^"']+)["']/g;
  let match;

  while ((match = importPattern.exec(text))) {
    imports.push(match[1]);
  }

  return imports;
}

function resolveImport(fromFile, specifier) {
  if (!specifier.startsWith(".") && !specifier.startsWith("@/")) return null;

  const base = specifier.startsWith("@/")
    ? path.resolve("paperclip/ui/src", specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);

  return resolveFile(base);
}

function resolveFile(base) {
  if (existsSync(base) && statSync(base).isFile()) return base;

  for (const extension of RESOLVE_EXTENSIONS) {
    const file = `${base}${extension}`;
    if (existsSync(file) && statSync(file).isFile()) return file;
  }

  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const extension of RESOLVE_EXTENSIONS) {
      const file = path.join(base, `index${extension}`);
      if (existsSync(file) && statSync(file).isFile()) return file;
    }
  }

  return null;
}

function lineNumberForIndex(text, index) {
  let line = 1;
  for (let i = 0; i < index; i += 1) {
    if (text.charCodeAt(i) === 10) line += 1;
  }
  return line;
}

function normalizePath(file) {
  return path.relative(process.cwd(), file);
}

function atomicLayerForFile(file) {
  const normalized = normalizePath(file);
  if (isTokenSource(normalized) || normalized.includes("/components/ui/")) return "atoms";
  if (normalized.includes("/components/")) return "molecules/organisms";
  if (normalized.includes("/pages/") || normalized.endsWith("App.tsx")) return "pages";
  return "support";
}

function isTokenSource(file) {
  return file === "paperclip/ui/src/index.css" || file.endsWith("/tokens.css") || file.endsWith("/theme.css");
}

function isPrimitiveLayer(file) {
  return file.includes("/components/ui/");
}

function findingSeverity(check, file) {
  if (check.tokenSeverity && isTokenSource(file)) return check.tokenSeverity;
  if (check.id === "native-control" && isPrimitiveLayer(file)) return "info";
  return check.severity;
}

function scanFile(file) {
  const text = readFileSync(file, "utf8");
  const normalized = normalizePath(file);
  const findings = [];

  for (const check of CHECKS) {
    const pattern = new RegExp(check.pattern.source, check.pattern.flags);
    let match;
    while ((match = pattern.exec(text))) {
      findings.push({
        check: check.id,
        severity: findingSeverity(check, normalized),
        message: check.message,
        file: normalized,
        line: lineNumberForIndex(text, match.index),
        sample: match[0],
        layer: atomicLayerForFile(file),
      });
    }
  }

  return {
    file: normalized,
    lines: text.split("\n").length,
    layer: atomicLayerForFile(file),
    findings,
  };
}

function summarize(scannedFiles, options) {
  const findings = scannedFiles.flatMap((file) => file.findings);
  const byCheck = countBy(findings, (finding) => finding.check);
  const byLayer = countBy(findings, (finding) => finding.layer);
  const bySeverity = countBy(findings, (finding) => finding.severity);
  const byFile = countBy(findings, (finding) => finding.file);

  const oversized = scannedFiles
    .filter((file) => file.lines > 300 && !file.file.includes(".test."))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 25)
    .map(({ file, lines, layer }) => ({ file, lines, layer }));

  const counts = {
    filesScanned: scannedFiles.length,
    findings: findings.length,
    byCheck: Object.fromEntries(sortCountEntries(byCheck)),
    byLayer: Object.fromEntries(sortCountEntries(byLayer)),
    bySeverity: Object.fromEntries(sortCountEntries(bySeverity)),
    byFile: Object.fromEntries(sortCountEntries(byFile)),
    oversized: oversized.length,
  };

  return {
    generatedAt: new Date().toISOString(),
    mode: options.activeRoutes ? "active-routes" : "repo",
    targets: options.targets,
    activeRouteSeeds: options.activeRoutes ? ACTIVE_ROUTE_SEEDS : [],
    counts,
    oversized,
    findings,
  };
}

function countBy(items, keyFn) {
  const map = new Map();
  for (const item of items) {
    const key = keyFn(item);
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return map;
}

function sortCountEntries(map) {
  return [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
}

function printObjectCounts(title, counts) {
  console.log(`\n${title}`);
  const entries = Object.entries(counts);
  if (entries.length === 0) {
    console.log("  none");
    return;
  }
  for (const [key, value] of entries) {
    console.log(`  ${key}: ${value}`);
  }
}

function baselinePayload(summary) {
  return {
    generatedAt: summary.generatedAt,
    mode: summary.mode,
    targets: summary.targets,
    counts: {
      filesScanned: summary.counts.filesScanned,
      findings: summary.counts.findings,
      byCheck: summary.counts.byCheck,
      byLayer: summary.counts.byLayer,
      bySeverity: summary.counts.bySeverity,
      oversized: summary.counts.oversized,
    },
  };
}

function compareBaseline(summary, baselinePath) {
  const baseline = JSON.parse(readFileSync(path.resolve(baselinePath), "utf8"));
  const failures = [];

  compareCount(failures, "total findings", summary.counts.findings, baseline.counts?.findings ?? 0);
  compareCount(failures, "oversized modules", summary.counts.oversized, baseline.counts?.oversized ?? 0);
  compareCountObject(failures, "check", summary.counts.byCheck, baseline.counts?.byCheck ?? {});
  compareCountObject(failures, "severity", summary.counts.bySeverity, baseline.counts?.bySeverity ?? {});

  return failures;
}

function compareCount(failures, label, current, baseline) {
  if (current > baseline) failures.push(`${label}: ${current} > baseline ${baseline}`);
}

function compareCountObject(failures, label, current, baseline) {
  for (const [key, value] of Object.entries(current)) {
    const allowed = baseline[key] ?? 0;
    if (value > allowed) failures.push(`${label} ${key}: ${value} > baseline ${allowed}`);
  }
}

function failOnSeverity(summary, severity) {
  if (!severity) return [];
  const minimum = SEVERITY_ORDER.indexOf(severity);
  return Object.entries(summary.counts.bySeverity)
    .filter(([key, value]) => value > 0 && SEVERITY_ORDER.indexOf(key) >= minimum)
    .map(([key, value]) => `${value} finding(s) at severity ${key}, failing on ${severity}`);
}

function printTextSummary(summary, options, failures) {
  console.log(`Design system audit mode: ${summary.mode}`);
  console.log(`Target(s): ${summary.targets.join(", ")}`);
  console.log(`Files scanned: ${summary.counts.filesScanned}`);
  console.log(`Findings: ${summary.counts.findings}`);

  printObjectCounts("Findings by severity", summary.counts.bySeverity);
  printObjectCounts("Findings by check", summary.counts.byCheck);
  printObjectCounts("Findings by atomic layer", summary.counts.byLayer);

  console.log("\nTop oversized modules (>300 lines, excluding tests)");
  if (summary.oversized.length === 0) {
    console.log("  none");
  } else {
    for (const file of summary.oversized) {
      console.log(`  ${file.lines} ${file.file} [${file.layer}]`);
    }
  }

  console.log("\nTop findings");
  for (const finding of summary.findings.slice(0, options.maxFindings)) {
    console.log(`  ${finding.severity} ${finding.check} ${finding.file}:${finding.line} ${JSON.stringify(finding.sample)}`);
  }

  if (summary.findings.length > options.maxFindings) {
    console.log(`  ... ${summary.findings.length - options.maxFindings} more`);
  }

  if (failures.length > 0) {
    console.log("\nGate failures");
    for (const failure of failures) console.log(`  ${failure}`);
  }
}

function jsonPayload(summary, options, failures) {
  const visibleFindings = summary.findings.slice(0, options.maxFindings);
  return {
    ...summary,
    findings: visibleFindings,
    findingsTruncated: Math.max(0, summary.findings.length - visibleFindings.length),
    gateFailures: failures,
  };
}

function filesForOptions(options) {
  if (options.activeRoutes) return activeRouteFiles();
  return [...new Set(options.targets.flatMap((target) => walk(target)))].sort();
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (options.help) {
    usage();
    return;
  }

  const files = filesForOptions(options);
  const scannedFiles = files.map(scanFile);
  const summary = summarize(scannedFiles, options);
  const failures = [
    ...(options.baselinePath ? compareBaseline(summary, options.baselinePath) : []),
    ...failOnSeverity(summary, options.failOn),
  ];

  if (options.writeBaselinePath) {
    writeFileSync(path.resolve(options.writeBaselinePath), `${JSON.stringify(baselinePayload(summary), null, 2)}\n`);
  }

  if (options.json) {
    console.log(JSON.stringify(jsonPayload(summary, options, failures), null, 2));
  } else {
    printTextSummary(summary, options, failures);
    if (options.writeBaselinePath) console.log(`\nBaseline written: ${options.writeBaselinePath}`);
  }

  if (failures.length > 0) process.exitCode = 1;
}

main();
