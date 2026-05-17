import type { Agent, Issue } from "@paperclipai/shared";

const PROGRESS_WIDTH_CLASSES = [
  "w-0",
  "w-1/12",
  "w-1/6",
  "w-1/4",
  "w-1/3",
  "w-5/12",
  "w-1/2",
  "w-7/12",
  "w-2/3",
  "w-3/4",
  "w-5/6",
  "w-11/12",
  "w-full",
];

export function progressWidthClass(score: number) {
  const clamped = Math.min(Math.max(score, 0), 100);
  return PROGRESS_WIDTH_CLASSES[Math.round((clamped / 100) * (PROGRESS_WIDTH_CLASSES.length - 1))];
}

export function issuePath(issue: Issue) {
  return `/issues/${issue.identifier ?? issue.id}`;
}

export function formatStatusLabel(status: string) {
  return status.replace(/_/g, " ");
}

export function summarizeAgent(agent: Agent | null) {
  if (!agent) return "No lead assigned";
  const title = agent.title ? `${agent.title} · ` : "";
  return `${title}${agent.status}`;
}

export function issuePriority(issue: Issue) {
  return (issue.priority ?? "medium").replace(/_/g, " ");
}
