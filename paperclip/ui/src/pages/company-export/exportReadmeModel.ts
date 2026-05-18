import type { CompanyPortabilityManifest } from "@paperclipai/shared";
import { checkedSlugs } from "./exportYamlModel";

const ROLE_LABELS: Record<string, string> = {
  ceo: "CEO",
  cto: "CTO",
  cmo: "CMO",
  cfo: "CFO",
  coo: "COO",
  vp: "VP",
  manager: "Manager",
  engineer: "Engineer",
  agent: "Agent",
};

export function generateReadmeFromSelection(
  manifest: CompanyPortabilityManifest,
  checkedFiles: Set<string>,
  companyName: string,
  companyDescription: string | null,
): string {
  const slugs = checkedSlugs(checkedFiles);
  const agents = manifest.agents.filter((a) => slugs.agents.has(a.slug));
  const projects = manifest.projects.filter((p) => slugs.projects.has(p.slug));
  const tasks = manifest.issues.filter((t) => slugs.tasks.has(t.slug));
  const skills = manifest.skills.filter((s) =>
    [...checkedFiles].some((f) => f.startsWith(`skills/${s.key}/`) || f.startsWith("skills/") && f.includes(`/${s.slug}/`)),
  );

  const lines: string[] = [];
  lines.push(`# ${companyName}`);
  lines.push("");
  if (companyDescription) {
    lines.push(`> ${companyDescription}`);
    lines.push("");
  }
  if (agents.length > 0) {
    lines.push("![Org Chart](images/org-chart.png)");
    lines.push("");
  }

  lines.push("## What's Inside");
  lines.push("");
  lines.push("This is an [Agent Company](https://paperclip.ing) package.");
  lines.push("");

  const counts: Array<[string, number]> = [];
  if (agents.length > 0) counts.push(["Agents", agents.length]);
  if (projects.length > 0) counts.push(["Projects", projects.length]);
  if (skills.length > 0) counts.push(["Skills", skills.length]);
  if (tasks.length > 0) counts.push(["Tasks", tasks.length]);

  if (counts.length > 0) {
    lines.push("| Content | Count |");
    lines.push("|---------|-------|");
    for (const [label, count] of counts) {
      lines.push(`| ${label} | ${count} |`);
    }
    lines.push("");
  }

  if (agents.length > 0) {
    lines.push("### Agents");
    lines.push("");
    lines.push("| Agent | Role | Reports To |");
    lines.push("|-------|------|------------|");
    for (const agent of agents) {
      const roleLabel = ROLE_LABELS[agent.role] ?? agent.role;
      const reportsTo = agent.reportsToSlug ?? "\u2014";
      lines.push(`| ${agent.name} | ${roleLabel} | ${reportsTo} |`);
    }
    lines.push("");
  }

  if (projects.length > 0) {
    lines.push("### Projects");
    lines.push("");
    for (const project of projects) {
      const desc = project.description ? ` \u2014 ${project.description}` : "";
      lines.push(`- **${project.name}**${desc}`);
    }
    lines.push("");
  }

  lines.push("## Getting Started");
  lines.push("");
  lines.push("```bash");
  lines.push("pnpm paperclipai company import this-github-url-or-folder");
  lines.push("```");
  lines.push("");
  lines.push("See [Paperclip](https://paperclip.ing) for more information.");
  lines.push("");
  lines.push("---");
  lines.push(`Exported from [Paperclip](https://paperclip.ing) on ${new Date().toISOString().split("T")[0]}`);
  lines.push("");

  return lines.join("\n");
}
