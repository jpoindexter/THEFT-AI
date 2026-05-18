export type AgentDetailView = "dashboard" | "instructions" | "configuration" | "skills" | "runs" | "budget";

export function parseAgentDetailView(value: string | null): AgentDetailView {
  if (value === "instructions" || value === "prompts") return "instructions";
  if (value === "configure" || value === "configuration") return "configuration";
  if (value === "skills") return "skills";
  if (value === "budget") return "budget";
  if (value === "runs") return value;
  return "dashboard";
}

export function agentDetailViewToTab(view: AgentDetailView): AgentDetailView {
  return view;
}
