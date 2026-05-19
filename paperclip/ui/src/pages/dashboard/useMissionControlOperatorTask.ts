import { useMemo, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Agent, Issue } from "@paperclipai/shared";
import { issuesApi } from "../../api/issues";
import {
  buildOperatorIssueTitle,
  buildOperatorTaskDraft,
  type OperatorTaskDraftKind,
} from "@/components/theft/organisms/mission-control/operatorTaskDraft";
import { queryKeys } from "../../lib/queryKeys";
import type { CompanyBottleneck, DepartmentCanvasRow } from "../../lib/theft-canvas";

export function useMissionControlOperatorTask(input: {
  selectedCompanyId: string | null | undefined;
  selectedDepartment: DepartmentCanvasRow | null;
  operator: Agent | null;
  nextMove: CompanyBottleneck;
  objective: string;
}) {
  const queryClient = useQueryClient();
  const [operatorDraft, setOperatorDraft] = useState("");
  const [createdIssue, setCreatedIssue] = useState<Issue | null>(null);

  const canSubmit = !!operatorDraft.trim();

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!input.selectedCompanyId || !input.selectedDepartment) {
        throw new Error("Select a company and department first.");
      }
      const title = buildOperatorIssueTitle(operatorDraft);
      if (!title) {
        throw new Error("Describe the task first.");
      }

      return issuesApi.create(input.selectedCompanyId, {
        title,
        description: buildOperatorIssueDescription({
          draft: operatorDraft,
          department: input.selectedDepartment,
          operator: input.operator,
          objective: input.objective,
        }),
        status: "todo",
        priority: "medium",
        assigneeAgentId: input.selectedDepartment.agent?.id ?? null,
      });
    },
    onSuccess: async (issue) => {
      setCreatedIssue(issue);
      setOperatorDraft("");
      if (!input.selectedCompanyId) return;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(input.selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard(input.selectedCompanyId) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.activity(input.selectedCompanyId) }),
      ]);
    },
  });

  const applyDraft = useMemo(
    () => (kind: OperatorTaskDraftKind) => {
      setCreatedIssue(null);
      setOperatorDraft(buildOperatorTaskDraft({
        kind,
        nextMove: input.nextMove,
        department: input.selectedDepartment,
        objective: input.objective,
      }));
    },
    [input.nextMove, input.objective, input.selectedDepartment],
  );

  return {
    operatorDraft,
    setOperatorDraft: (value: string) => {
      setCreatedIssue(null);
      setOperatorDraft(value);
    },
    createdIssue,
    clearCreatedIssue: () => setCreatedIssue(null),
    applyDraft,
    createTask: () => createTaskMutation.mutate(),
    error: createTaskMutation.error?.message,
    isPending: createTaskMutation.isPending,
    canSubmit,
  };
}

function buildOperatorIssueDescription(input: {
  draft: string;
  department: DepartmentCanvasRow;
  operator: Agent | null;
  objective: string;
}): string {
  return [
    `Founder request:\n${input.draft.trim()}`,
    "",
    `Mission objective: ${input.objective}`,
    `Department route: ${input.department.title}`,
    input.operator ? `Operator context: ${input.operator.name}` : null,
    "Expected Library output: a durable brief, plan, page, checklist, or decision artifact saved before founder approval.",
  ].filter(Boolean).join("\n");
}
