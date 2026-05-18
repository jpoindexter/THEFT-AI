import type { Issue, Project } from "@paperclipai/shared";

export function getGoalLinkedProjects(goalId: string, projects: Project[]) {
  return projects.filter((project) => {
    if (project.goalIds.includes(goalId)) return true;
    if (project.goals.some((goalRef) => goalRef.id === goalId)) return true;
    return project.goalId === goalId;
  });
}

export function getGoalLinkedIssues(goalId: string, issues: Issue[]) {
  return issues.filter((issue) => issue.goalId === goalId);
}
