#!/usr/bin/env node

import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

const DEFAULT_TARGETS = ["paperclip/ui/src"];
const SKIP_DIRS = new Set([
  ".git",
  "node_modules",
  "dist",
  "build",
  "coverage",
  "storybook-static",
  ".next",
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

const CHECKS = [
  {
    id: "inline-style",
    severity: "high",
    pattern: /\bstyle\s*=\s*\{\{/g,
    message: "Inline React style object",
  },
  {
    id: "hex-color",
    severity: "high",
    pattern: /#[0-9a-fA-F]{3,8}\b/g,
    message: "Hardcoded hex color",
  },
  {
    id: "raw-color-function",
    severity: "medium",
    pattern: /\b(?:rgb|rgba|hsl|hsla|oklch|oklab)\(/g,
    message: "Raw color function",
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
    severity: "medium",
    pattern: /(?:^|\n)\s*(?::root|\.dark)\s*\{/g,
    message: "Theme root declaration",
  },
];

function usage() {
  console.log(`
Usage:
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs [target ...]

Examples:
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs
  node .agents/skills/atomic-design-system/scripts/audit-design-system.mjs paperclip/ui/src app
`);
}

function walk(target, files = []) {
  const absolute = path.resolve(target);
  const stat = statSync(absolute, { throwIfNoEntry: false });
  if (!stat) return files;

  if (stat.isFile()) {
    if (SCAN_EXTENSIONS.has(path.extname(absolute))) files.push(absolute);
    return files;
  }

  if (!stat.isDirectory()) return files;

  for (const entry of readdirSync(absolute)) {
    if (SKIP_DIRS.has(entry)) continue;
    walk(path.join(absolute, entry), files);
  }

  return files;
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
  if (normalized.includes("/components/ui/") || normalized.endsWith("index.css")) return "atoms";
  if (normalized.includes("/components/")) return "molecules/organisms";
  if (normalized.includes("/pages/") || normalized.endsWith("App.tsx")) return "pages";
  return "support";
}

function scanFile(file) {
  const text = readFileSync(file, "utf8");
  const findings = [];

  for (const check of CHECKS) {
    const pattern = new RegExp(check.pattern.source, check.pattern.flags);
    let match;
    while ((match = pattern.exec(text))) {
      findings.push({
        check: check.id,
        severity: check.severity,
        message: check.message,
        file: normalizePath(file),
        line: lineNumberForIndex(text, match.index),
        sample: match[0],
        layer: atomicLayerForFile(file),
      });
    }
  }

  return {
    file: normalizePath(file),
    lines: text.split("\n").length,
    layer: atomicLayerForFile(file),
    findings,
  };
}

function summarize(scannedFiles) {
  const findings = scannedFiles.flatMap((file) => file.findings);
  const byCheck = new Map();
  const byLayer = new Map();
  const bySeverity = new Map();

  for (const finding of findings) {
    byCheck.set(finding.check, (byCheck.get(finding.check) ?? 0) + 1);
    byLayer.set(finding.layer, (byLayer.get(finding.layer) ?? 0) + 1);
    bySeverity.set(finding.severity, (bySeverity.get(finding.severity) ?? 0) + 1);
  }

  const oversized = scannedFiles
    .filter((file) => file.lines > 300 && !file.file.includes(".test."))
    .sort((a, b) => b.lines - a.lines)
    .slice(0, 25);

  return { findings, byCheck, byLayer, bySeverity, oversized };
}

function printMap(title, map) {
  console.log(`\n${title}`);
  if (map.size === 0) {
    console.log("  none");
    return;
  }
  for (const [key, value] of [...map.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
    console.log(`  ${key}: ${value}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    usage();
    return;
  }

  const targets = args.length > 0 ? args : DEFAULT_TARGETS;
  const files = [...new Set(targets.flatMap((target) => walk(target)))].sort();
  const scannedFiles = files.map(scanFile);
  const summary = summarize(scannedFiles);

  console.log(`Design system audit target(s): ${targets.join(", ")}`);
  console.log(`Files scanned: ${scannedFiles.length}`);
  console.log(`Findings: ${summary.findings.length}`);

  printMap("Findings by severity", summary.bySeverity);
  printMap("Findings by check", summary.byCheck);
  printMap("Findings by atomic layer", summary.byLayer);

  console.log("\nTop oversized modules (>300 lines, excluding tests)");
  if (summary.oversized.length === 0) {
    console.log("  none");
  } else {
    for (const file of summary.oversized) {
      console.log(`  ${file.lines} ${file.file} [${file.layer}]`);
    }
  }

  console.log("\nTop findings");
  for (const finding of summary.findings.slice(0, 80)) {
    console.log(`  ${finding.severity} ${finding.check} ${finding.file}:${finding.line} ${JSON.stringify(finding.sample)}`);
  }

  if (summary.findings.length > 80) {
    console.log(`  ... ${summary.findings.length - 80} more`);
  }
}

main();
