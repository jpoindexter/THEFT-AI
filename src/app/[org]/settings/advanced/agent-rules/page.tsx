"use client";

import { useState } from "react";
import { SectionHeader, SettingsCard } from "@/components/settings/section";
import { FileCode, Save, RotateCcw } from "lucide-react";

const DEFAULT_RULES = `# Agent Rules

## Stack
- Next.js App Router (params is a Promise — always await it)
- Supabase (PostgreSQL + Auth + Storage + RLS required on all public tables)
- TypeScript strict mode
- Tailwind CSS with project design tokens (use canvas/paper/ink/line, not arbitrary colors)
- Zod for validation at all API/form boundaries

## Coding conventions
- ESM modules only. No CommonJS.
- File names: kebab-case.ts · Components: PascalCase.tsx
- Functions max 50 lines · Files max 300 lines
- No \`any\` — use \`unknown\` + narrowing
- Errors as values, don't throw across boundaries
- One concern per file

## Libraries to use
- \`zod\` — schema validation
- \`date-fns\` — date manipulation
- \`lucide-react\` — icons
- \`@tanstack/react-query\` — client-side data fetching

## Libraries to avoid
- moment.js (use date-fns)
- lodash (use native JS)
- jQuery

## Common pitfalls
- params is a Promise in this version of Next.js — always: const { org } = await params
- Never commit .env files — only .env.example with placeholder values
- RLS policies required on all public Supabase tables before shipping
- No console.log in committed code — use the logger module
- Don't add placeholder TODOs or stub implementations — every function must return real values
`.trim();

export default function AgentRulesPage() {
  const [rules, setRules] = useState(DEFAULT_RULES);
  const [dirty, setDirty] = useState(false);

  function handleChange(val: string) {
    setRules(val);
    setDirty(true);
  }

  function handleSave() {
    setDirty(false);
  }

  function handleReset() {
    setRules(DEFAULT_RULES);
    setDirty(false);
  }

  return (
    <>
      <SectionHeader
        title="Agent Rules"
        description="Instructions for AI agents working in this codebase. Saved as agents.md in the repo root."
      />
      <SettingsCard>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-ink-muted">
              <FileCode className="size-3.5" />
              agents.md · {rules.split("\n").length} lines
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
              >
                <RotateCcw className="size-3" /> Reset
              </button>
              <button
                type="button"
                onClick={handleSave}
                className={`inline-flex items-center gap-1 text-xs rounded-md px-3 py-1.5 ${
                  dirty
                    ? "bg-ink text-paper hover:opacity-90"
                    : "bg-canvas border border-line text-ink-muted cursor-default"
                }`}
              >
                <Save className="size-3" /> {dirty ? "Save" : "Saved"}
              </button>
            </div>
          </div>
          <textarea
            value={rules}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full h-96 rounded-lg border border-line/70 bg-canvas font-mono text-xs text-ink p-3 resize-y focus:outline-none focus:border-line-strong"
            spellCheck={false}
          />
          <p className="text-2xs text-ink-soft">
            Agents read this file before writing code. Keep it accurate —
            outdated rules cause drift.
          </p>
        </div>
      </SettingsCard>
    </>
  );
}
