# ROADMAP

> Sequential. Don't start v1 work until v0 ships. No parallel work that touches engine.

## v0 — Engine works end-to-end across 8 departments

Goal: a founder creates an org, hands a real task to each of 8 dept agents, and gets a real result back. Ugly UI is fine.

### Slice 0.1 — Fix the bootstrap bug
- [ ] Add Legal agent to `bootstrap.ts` (with appropriate default prompt + skills)
- [ ] Add Support agent to `bootstrap.ts`
- [ ] Test: create new org, verify all 8 dept pages have an agent assigned
- [ ] Type-check clean

### Slice 0.2 — General tool palette for dept agents
Add tools that let agents actually DO work, not just write markdown.

Minimum tool set (all 8 depts share these):
- [ ] `read_file` (Library + workspace)
- [ ] `list_files` (Library + workspace)
- [ ] `web_search` (Tavily or Brave Search API — env-keyed)
- [ ] `web_fetch` (raw HTTP GET, return text)
- [ ] `write_artifact` (already exists)
- [ ] `delegate_to_department` (already exists)
- [ ] `ask_user_question` (already exists)

Dept-specific (gate by agent.slug or skill):
- [ ] Engineer: `run_command` (sandboxed bash), `write_file_to_repo` (commit-style)
- [ ] Marketing/Sales: `send_email` (Postmark API or stub)
- [ ] Design: `generate_image` (Anthropic Claude API image input or stub returning placeholder)
- [ ] Legal: `generate_pdf` (Markdown → PDF via `pdf-lib` or stub)

### Slice 0.3 — Verify each dept end-to-end
For each of 8 depts:
- [ ] Engineering: "Build a hello-world Next.js endpoint" → file written, returned
- [ ] Design: "Generate a logo concept brief" → markdown artifact in Library
- [ ] Marketing: "Research top 3 competitors and summarize positioning" → web_search + artifact
- [ ] Sales: "Draft an outreach email for [persona]" → email artifact
- [ ] Operations: "Summarize the last 5 tasks across the org" → uses read_file + artifact
- [ ] Finance: "Estimate monthly burn from current usage records" → reads usage_records
- [ ] Legal: "Draft an NDA template" → artifact PDF
- [ ] Support: "Draft a knowledge-base article for [topic]" → artifact

Each dept gets one canonical "smoke test" task documented in STATUS.md after passing.

### Slice 0.4 — Strip dead routes
Move to `_archive/` everything not on the v0 path:
- [ ] All sales sub-pages built off PLAN.md (pipeline/leads/competitors/outreach)
- [ ] All support sub-pages (knowledge-base/decision-trees)
- [ ] All costs sub-pages (unit-economics/budget/breakdown) — keep `/costs` itself
- [ ] All analytics pages
- [ ] All finance/operations/legal sub-pages
- [ ] All marketing sub-pages
- [ ] All design sub-pages (logo/components/pitch-deck)
- [ ] Database sub-pages (keep `/database` only)
- [ ] Settings: keep org / payments / domains / env / inbox / company-context / support. Archive others.
- [ ] Misc: marketplace, templates, share, sandbox, studio, feed, whats-new, help, dev, status, release-notes, calendar, timeline, dashboard

Result: ~30 routes instead of 153. Engine work has nowhere to hide.

### Slice 0.5 — Done criterion
- [ ] Founder can sign in, create org, complete onboarding
- [ ] All 8 depts visible, each has working agent
- [ ] Each dept's smoke-test task runs to completion via real Claude
- [ ] Library shows all 8 produced artifacts
- [ ] Cost tracking records all 8 runs
- [ ] No broken routes in shipped code

---

## v1 — After v0 ships AND first real user

Triggered only after a real human (Jason or someone else) has used v0 to actually run a task.

Candidates (re-prioritized after v0 feedback):
- Real GitHub integration (read repo, push commits)
- Real Vercel integration (deploy preview)
- Real Postmark email
- Real Stripe billing integration
- Knowledge base + decision trees (rebuilt from cofounder-docs spec, not PLAN.md guesses)
- Brand kit flow (only if it's load-bearing for design dept)
- Differentiation work (positioning vs cofounder/paperclip — see PRD.md)

---

## v2 — Aspirational

- Multi-user / team / RBAC
- Real Supabase backend (replace file-backed store)
- Routines / scheduled tasks
- Approvals workflow
- Webhooks for external triggers
- Marketplace for custom agents
- Custom skills creator
