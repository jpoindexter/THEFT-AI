export function checkedSlugs(checkedFiles: Set<string>): {
  agents: Set<string>;
  projects: Set<string>;
  tasks: Set<string>;
  routines: Set<string>;
} {
  const agents = new Set<string>();
  const projects = new Set<string>();
  const tasks = new Set<string>();
  for (const p of checkedFiles) {
    const agentMatch = p.match(/^agents\/([^/]+)\//);
    if (agentMatch) agents.add(agentMatch[1]);
    const projectMatch = p.match(/^projects\/([^/]+)\//);
    if (projectMatch) projects.add(projectMatch[1]);
    const taskMatch = p.match(/^tasks\/([^/]+)\//);
    if (taskMatch) tasks.add(taskMatch[1]);
  }
  return { agents, projects, tasks, routines: new Set(tasks) };
}

export function filterPaperclipYaml(yaml: string, checkedFiles: Set<string>): string {
  const slugs = checkedSlugs(checkedFiles);
  const lines = yaml.split("\n");
  const out: string[] = [];
  const filterableSections = new Set(["agents", "projects", "tasks", "routines"]);
  const sidebarSections = new Set(["agents", "projects"]);

  let currentSection: string | null = null;
  let currentEntry: string | null = null;
  let includeEntry = true;
  let currentSidebarList: string | null = null;
  let currentSidebarHeaderLine: string | null = null;
  let currentSidebarBuffer: string[] = [];
  let sectionHeaderLine: string | null = null;
  let sectionBuffer: string[] = [];

  function flushSidebarSection() {
    if (currentSidebarHeaderLine !== null && currentSidebarBuffer.length > 0) {
      sectionBuffer.push(currentSidebarHeaderLine);
      sectionBuffer.push(...currentSidebarBuffer);
    }
    currentSidebarHeaderLine = null;
    currentSidebarBuffer = [];
  }

  function flushSection() {
    flushSidebarSection();
    if (sectionHeaderLine !== null && sectionBuffer.length > 0) {
      out.push(sectionHeaderLine);
      out.push(...sectionBuffer);
    }
    sectionHeaderLine = null;
    sectionBuffer = [];
  }

  for (const line of lines) {
    const topMatch = line.match(/^([a-zA-Z_][\w-]*):\s*(.*)$/);
    if (topMatch && !line.startsWith(" ")) {
      flushSection();
      currentEntry = null;
      includeEntry = true;

      const key = topMatch[0].split(":")[0];
      if (filterableSections.has(key)) {
        currentSection = key;
        sectionHeaderLine = line;
        continue;
      }
      if (key === "sidebar") {
        currentSection = key;
        currentSidebarList = null;
        sectionHeaderLine = line;
        continue;
      }
      currentSection = null;
      out.push(line);
      continue;
    }

    if (currentSection === "sidebar") {
      const sidebarMatch = line.match(/^  ([\w-]+):\s*$/);
      if (sidebarMatch && !line.startsWith("    ")) {
        flushSidebarSection();
        const sidebarKey = sidebarMatch[1];
        currentSidebarList = sidebarKey && sidebarSections.has(sidebarKey) ? sidebarKey : null;
        currentSidebarHeaderLine = currentSidebarList ? line : null;
        continue;
      }

      const sidebarEntryMatch = line.match(/^    - ["']?([^"'\n]+)["']?\s*$/);
      if (sidebarEntryMatch && currentSidebarList) {
        const slug = sidebarEntryMatch[1];
        const sectionSlugs = slugs[currentSidebarList as keyof typeof slugs];
        if (slug && sectionSlugs.has(slug)) currentSidebarBuffer.push(line);
        continue;
      }

      if (currentSidebarList) {
        currentSidebarBuffer.push(line);
        continue;
      }
    }

    if (currentSection && filterableSections.has(currentSection)) {
      const entryMatch = line.match(/^  ([\w][\w-]*):\s*(.*)$/);
      if (entryMatch && !line.startsWith("    ")) {
        const slug = entryMatch[1];
        currentEntry = slug;
        const sectionSlugs = slugs[currentSection as keyof typeof slugs];
        includeEntry = sectionSlugs.has(slug);
        if (includeEntry) sectionBuffer.push(line);
        continue;
      }

      if (currentEntry !== null) {
        if (includeEntry) sectionBuffer.push(line);
        continue;
      }

      sectionBuffer.push(line);
      continue;
    }

    out.push(line);
  }

  flushSection();

  let filtered = out.join("\n");
  const logoPathMatch = filtered.match(/^\s{2}logoPath:\s*["']?([^"'\n]+)["']?\s*$/m);
  if (logoPathMatch && !checkedFiles.has(logoPathMatch[1]!)) {
    filtered = filtered.replace(/^\s{2}logoPath:\s*["']?([^"'\n]+)["']?\s*\n?/m, "");
  }

  return filtered;
}
