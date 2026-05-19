import type { CompanyBottleneck, DepartmentCanvasRow } from "@/lib/theft-canvas";

export type OperatorTaskDraftKind = "recommended" | "compare" | "risk";

export function buildOperatorTaskDraft(input: {
  kind: OperatorTaskDraftKind;
  nextMove: CompanyBottleneck;
  department: DepartmentCanvasRow | null;
  objective: string;
}): string {
  const departmentName = input.department?.title ?? "Operator";
  if (input.kind === "compare") {
    return [
      `Compare the next two moves for ${input.objective}.`,
      `Route the recommendation to ${departmentName}.`,
      "Include tradeoffs, decision criteria, and the first task that should create Library output.",
    ].join("\n");
  }

  if (input.kind === "risk") {
    return [
      `Explain the risk in ${input.nextMove.label}.`,
      `Route the mitigation work to ${departmentName}.`,
      "Include what could block the company, what evidence is missing, and what artifact should be saved to Library.",
    ].join("\n");
  }

  return [
    input.nextMove.issue?.title ?? input.nextMove.label,
    `Route this to ${departmentName}.`,
    "Create a durable Library artifact before founder approval.",
  ].join("\n");
}

export function buildOperatorIssueTitle(draft: string): string {
  const firstLine = draft.trim().split(/\r?\n/).find(Boolean)?.trim() ?? "";
  if (!firstLine) return "";
  return firstLine.length > 96 ? `${firstLine.slice(0, 93).trimEnd()}...` : firstLine;
}
