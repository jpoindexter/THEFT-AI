const THEFT_SKILL_KEY_PREFIX = "theft/skills/";

const THEFT_DEFAULT_SKILL_KEYS_BY_ROLE: Record<string, string[]> = {
  operator: [
    "company-naming",
    "gic-skills",
    "last30days-research",
    "dev-workflow",
    "ai-cost-routing",
    "ops-agent-skills",
  ],
  ceo: [
    "company-naming",
    "gic-skills",
    "last30days-research",
    "dev-workflow",
  ],
  cto: [
    "dev-workflow",
    "gic-coding-agent-skills",
    "supabase",
    "supabase-postgres-best-practices",
    "debugging-vercel-builds",
    "stripe-generated-app-scaffold",
    "stripe-payment-debugging",
  ],
  engineer: [
    "dev-workflow",
    "gic-coding-agent-skills",
    "supabase",
    "supabase-postgres-best-practices",
    "debugging-vercel-builds",
    "stripe-generated-app-scaffold",
    "stripe-payment-debugging",
  ],
  designer: [
    "web-design-guidelines",
    "huashu-design",
    "favicon-pack-maker",
    "shader-authoring",
    "hyperframes",
    "hyperframes-cli",
  ],
  cmo: [
    "content-engine",
    "last30days-research",
    "company-naming",
    "gic-skills",
    "hyperframes",
  ],
  marketer: [
    "content-engine",
    "last30days-research",
    "company-naming",
    "gic-skills",
    "hyperframes",
  ],
  cfo: [
    "finance-agent-skills",
    "ops-agent-skills",
    "stripe-app-builder",
    "stripe-payment-debugging",
    "supabase-postgres-best-practices",
  ],
  devops: [
    "ops-agent-skills",
    "debugging-vercel-builds",
    "supabase",
  ],
  ops: [
    "ops-agent-skills",
    "debugging-vercel-builds",
    "supabase",
  ],
  pm: [
    "last30days-research",
    "content-engine",
    "stripe-app-builder",
  ],
  sales: [
    "last30days-research",
    "content-engine",
    "stripe-app-builder",
  ],
  qa: [
    "gic-skills",
    "content-engine",
  ],
  legal: [
    "gic-skills",
  ],
  support: [
    "gic-skills",
    "content-engine",
  ],
  finance: [
    "finance-agent-skills",
    "ops-agent-skills",
    "stripe-app-builder",
    "stripe-payment-debugging",
    "supabase-postgres-best-practices",
  ],
  design: [
    "web-design-guidelines",
    "huashu-design",
    "favicon-pack-maker",
    "shader-authoring",
    "hyperframes",
    "hyperframes-cli",
  ],
  researcher: [
    "last30days-research",
    "content-engine",
    "gic-skills",
  ],
  security: [
    "gic-skills",
    "supabase-postgres-best-practices",
  ],
  general: [
    "gic-skills",
    "content-engine",
  ],
};

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export function resolveTheftDefaultDesiredSkillsForRole(role: string): string[] {
  const slugs = THEFT_DEFAULT_SKILL_KEYS_BY_ROLE[role] ?? [];
  return unique(
    slugs.map((slug) => `${THEFT_SKILL_KEY_PREFIX}${slug}`),
  );
}
