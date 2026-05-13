# SKILL AUDIT

> Created 2026-05-13. Root `skills/` is now treated as THEFT product data and auto-imported into the Paperclip company-skill system.

## Import Behavior

Paperclip now treats `../skills` as a bundled THEFT skill root when running from `paperclip/`.

Imported skills get stable keys:

```text
theft/skills/<skill-slug>
```

They appear as read-only local bundled skills in the Paperclip company skill library. This lets agents select and sync them through Paperclip's existing `desiredSkills` and runtime skill materialization path.

## Department Mapping

| Skill | Primary Department | Secondary |
|---|---|---|
| `company-naming` | Marketing | Design, Operator |
| `content-engine` | Marketing | Sales |
| `last30days-research` | Marketing | Sales, Operator |
| `gic-skills` | Support | Marketing, Operator |
| `gic-coding-agent-skills` | Engineering | Marketing |
| `dev-workflow` | Engineering | Operator |
| `debugging-vercel-builds` | Engineering | Operations |
| `supabase` | Engineering | Operations |
| `supabase-postgres-best-practices` | Engineering | Finance |
| `web-design-guidelines` | Design | Engineering |
| `huashu-design` | Design | Marketing |
| `favicon-pack-maker` | Design | Engineering |
| `shader-authoring` | Design | Engineering |
| `hyperframes` | Design | Marketing |
| `hyperframes-cli` | Design | Engineering |
| `stripe-app-builder` | Finance | Engineering, Sales |
| `stripe-generated-app-scaffold` | Engineering | Finance |
| `stripe-payment-debugging` | Engineering | Finance |
| `ops-agent-skills` | Operations | Finance |
| `finance-agent-skills` | Finance | Operations |

## Default Agent Skill Sets

These are the target defaults for the staged onboarding seed:

| Agent | Default Skills |
|---|---|
| Operator | `company-naming`, `gic-skills`, `last30days-research`, `dev-workflow` |
| Engineering | `dev-workflow`, `gic-coding-agent-skills`, `supabase`, `supabase-postgres-best-practices`, `debugging-vercel-builds`, `stripe-generated-app-scaffold`, `stripe-payment-debugging` |
| Design | `web-design-guidelines`, `huashu-design`, `favicon-pack-maker`, `shader-authoring`, `hyperframes`, `hyperframes-cli` |
| Marketing | `content-engine`, `last30days-research`, `company-naming`, `gic-skills`, `hyperframes` |
| Sales | `last30days-research`, `content-engine`, `stripe-app-builder` |
| Operations | `ops-agent-skills`, `debugging-vercel-builds`, `supabase` |
| Finance | `finance-agent-skills`, `ops-agent-skills`, `stripe-app-builder`, `stripe-payment-debugging`, `supabase-postgres-best-practices` |
| Legal | `gic-skills` until dedicated legal skill exists |
| Support | `gic-skills`, `content-engine` |

## Remaining Gaps

- Add a dedicated Legal skill packet.
- Wire staged onboarding seed agents to these stable `theft/skills/*` keys.
- Smoke one issue per department and confirm selected skills materialize for Codex, Claude, Gemini, OpenCode, and other local adapters.
