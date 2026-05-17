import type { Dispatch, SetStateAction } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { isValidOpenCodeModelId } from "@paperclipai/adapter-opencode-local";

import { agentsApi } from "../../api/agents";
import { approvalsApi } from "../../api/approvals";
import { companiesApi } from "../../api/companies";
import { goalsApi } from "../../api/goals";
import { issuesApi } from "../../api/issues";
import { projectsApi } from "../../api/projects";
import { buildOperatorLaunchIssueDescription } from "../../lib/onboarding-copy";
import {
  getOnboardingStageGoalTemplate,
  mergeDescriptionWithOnboardingContext,
  type OnboardingStage,
  type OnboardingStageTaskTemplate,
} from "../../lib/onboarding-context";
import { parseOnboardingGoalInput } from "../../lib/onboarding-goal";
import {
  buildOnboardingIssuePayload,
  buildOnboardingProjectPayload,
  selectDefaultCompanyGoalId,
} from "../../lib/onboarding-launch";
import { DEPARTMENT_SEED_SPECS } from "../../lib/onboarding-seed";
import { queryKeys } from "../../lib/queryKeys";
import { buildNewAgentRuntimeConfig } from "../../lib/new-agent-runtime-config";
import type { OnboardingStep, SetupCompanyNameStatus, SetupItemStatus } from "./types";

type Navigate = (to: string) => void;

export function useOnboardingLaunchActions(params: {
  adapterEnvResult: unknown;
  adapterType: string;
  agentName: string;
  buildAdapterConfig: () => Record<string, unknown>;
  closeOnboarding: () => void;
  companyGoal: string;
  companyName: string;
  companyStage: OnboardingStage;
  createdAgentId: string | null;
  createdCompanyGoalId: string | null;
  createdCompanyId: string | null;
  createdCompanyPrefix: string | null;
  createdIssueRef: string | null;
  createdProjectId: string | null;
  isLocalAdapter: boolean;
  model: string;
  navigate: Navigate;
  reset: () => void;
  runAdapterEnvironmentTest: () => Promise<unknown>;
  seededDepartmentAgentIds: Record<string, string>;
  seededDepartmentIssueKeys: Record<string, true>;
  setCreatedAgentId: (value: string | null) => void;
  setCreatedCompanyGoalId: (value: string | null) => void;
  setCreatedCompanyId: (value: string | null) => void;
  setCreatedCompanyPrefix: (value: string | null) => void;
  setCreatedIssueRef: (value: string | null) => void;
  setCreatedProjectId: (value: string | null) => void;
  setError: (value: string | null) => void;
  setLoading: (value: boolean) => void;
  setSeededDepartmentAgentIds: Dispatch<SetStateAction<Record<string, string>>>;
  setSeededDepartmentIssueKeys: Dispatch<SetStateAction<Record<string, true>>>;
  setSelectedCompanyId: (companyId: string) => void;
  setStep: (value: OnboardingStep) => void;
  setupCompanyNameNote: string;
  setupCompanyNameStatus: SetupCompanyNameStatus;
  setupLegalNote: string;
  setupLegalStatus: SetupItemStatus;
  setupOfferNote: string;
  setupOfferStatus: SetupItemStatus;
  stageInterviewAnswer: string;
  stageTaskTemplate: OnboardingStageTaskTemplate;
  taskDescription: string;
  taskTitle: string;
}) {
  const queryClient = useQueryClient();

  async function handleStep1Next() {
    params.setLoading(true);
    params.setError(null);
    try {
      const trimmedName = params.companyName.trim();
      const company = await companiesApi.create({
        name: trimmedName,
        description: mergeDescriptionWithOnboardingContext({
          description: params.companyGoal.trim(),
          stage: params.companyStage,
          operatorName: params.agentName,
          setupItems: [
            { key: "company_name", label: "Company name", status: params.setupCompanyNameStatus, note: params.setupCompanyNameNote || trimmedName },
            { key: "legal_entity", label: "Legal / operating readiness", status: params.setupLegalStatus, note: params.setupLegalNote },
            { key: "offer", label: "Offer", status: params.setupOfferStatus, note: params.setupOfferNote },
          ],
        }),
      });
      params.setCreatedCompanyId(company.id);
      params.setCreatedCompanyPrefix(company.issuePrefix);
      params.setSelectedCompanyId(company.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.companies.all });

      const goalInput = params.companyGoal.trim();
      const goalPayload = goalInput
        ? parseOnboardingGoalInput(goalInput)
        : getOnboardingStageGoalTemplate(params.companyStage, trimmedName);
      const goal = await goalsApi.create(company.id, {
        title: goalPayload.title,
        ...(goalPayload.description ? { description: goalPayload.description } : {}),
        level: "company",
        status: "active",
      });
      params.setCreatedCompanyGoalId(goal.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.goals.list(company.id) });
      params.setStep(2);
    } catch (err) {
      params.setError(err instanceof Error ? err.message : "Failed to create company");
    } finally {
      params.setLoading(false);
    }
  }

  async function handleStep2Next() {
    if (!params.createdCompanyId) return;
    params.setLoading(true);
    params.setError(null);
    try {
      if (params.adapterType === "opencode_local" && !isValidOpenCodeModelId(params.model)) {
        params.setError("OpenCode requires an explicit model in provider/model format.");
        return;
      }
      if (params.isLocalAdapter) {
        const result = params.adapterEnvResult ?? (await params.runAdapterEnvironmentTest());
        if (!result) return;
      }
      const hire = await agentsApi.hire(params.createdCompanyId, {
        name: params.agentName.trim(),
        role: "ceo",
        adapterType: params.adapterType,
        adapterConfig: params.buildAdapterConfig(),
        runtimeConfig: buildNewAgentRuntimeConfig(),
      });
      if (hire.approval) {
        await approvalsApi.approve(hire.approval.id, "Approved during onboarding first-agent setup.");
        queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(params.createdCompanyId) });
      }
      params.setCreatedAgentId(hire.agent.id);
      queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(params.createdCompanyId) });
      params.setStep(3);
    } catch (err) {
      params.setError(err instanceof Error ? err.message : "Failed to create agent");
    } finally {
      params.setLoading(false);
    }
  }

  async function handleLaunch() {
    if (!params.createdCompanyId || !params.createdAgentId) return;
    params.setLoading(true);
    params.setError(null);
    try {
      const goalId = await ensureGoalId(params);
      const projectId = await ensureProjectId(params, goalId);
      await ensureOperatorIssue(params, projectId, goalId);
      const departmentAgentIds = await seedDepartmentAgents(params);
      await seedDepartmentIssues(params, departmentAgentIds, projectId, goalId);
      params.setSelectedCompanyId(params.createdCompanyId);
      params.reset();
      params.closeOnboarding();
      params.navigate(params.createdCompanyPrefix ? `/${params.createdCompanyPrefix}/dashboard` : "/");
    } catch (err) {
      params.setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      params.setLoading(false);
    }
  }

  return {
    handleLaunch,
    handlePlanReviewNext: () => {
      params.setError(null);
      params.setStep(5);
    },
    handleStep1Next,
    handleStep2Next,
    handleStep3Next: () => {
      if (!params.createdCompanyId || !params.createdAgentId) return;
      params.setError(null);
      params.setStep(4);
    },
  };

  async function ensureGoalId(input: typeof params) {
    if (input.createdCompanyGoalId) return input.createdCompanyGoalId;
    const goals = await goalsApi.list(input.createdCompanyId!);
    const goalId = selectDefaultCompanyGoalId(goals);
    input.setCreatedCompanyGoalId(goalId);
    return goalId;
  }

  async function ensureProjectId(input: typeof params, goalId: string | null) {
    if (input.createdProjectId) return input.createdProjectId;
    const project = await projectsApi.create(input.createdCompanyId!, buildOnboardingProjectPayload(goalId));
    input.setCreatedProjectId(project.id);
    queryClient.invalidateQueries({ queryKey: queryKeys.projects.list(input.createdCompanyId!) });
    return project.id;
  }

  async function ensureOperatorIssue(input: typeof params, projectId: string, goalId: string | null) {
    if (input.createdIssueRef) return;
    const issue = await issuesApi.create(
      input.createdCompanyId!,
      buildOnboardingIssuePayload({
        title: input.taskTitle,
        description: buildOperatorLaunchIssueDescription({
          taskDescription: input.taskDescription,
          stage: input.companyStage,
          prompt: input.stageTaskTemplate.interviewPrompt,
          answer: input.stageInterviewAnswer,
        }),
        assigneeAgentId: input.createdAgentId!,
        projectId,
        goalId,
      }),
    );
    input.setCreatedIssueRef(issue.identifier ?? issue.id);
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(input.createdCompanyId!) });
  }

  async function seedDepartmentAgents(input: typeof params) {
    const nextSeededDepartmentAgentIds = { ...input.seededDepartmentAgentIds };
    for (const spec of DEPARTMENT_SEED_SPECS) {
      if (nextSeededDepartmentAgentIds[spec.key]) continue;
      const hire = await agentsApi.hire(input.createdCompanyId!, {
        name: spec.agentName,
        role: spec.role,
        title: spec.title,
        reportsTo: input.createdAgentId!,
        adapterType: input.adapterType,
        adapterConfig: input.buildAdapterConfig(),
        desiredSkills: spec.desiredSkills,
        runtimeConfig: buildNewAgentRuntimeConfig(),
      });
      if (hire.approval) {
        await approvalsApi.approve(hire.approval.id, "Approved during onboarding department seed.");
      }
      nextSeededDepartmentAgentIds[spec.key] = hire.agent.id;
    }
    input.setSeededDepartmentAgentIds(nextSeededDepartmentAgentIds);
    queryClient.invalidateQueries({ queryKey: queryKeys.agents.list(input.createdCompanyId!) });
    queryClient.invalidateQueries({ queryKey: queryKeys.approvals.list(input.createdCompanyId!) });
    return nextSeededDepartmentAgentIds;
  }

  async function seedDepartmentIssues(
    input: typeof params,
    departmentAgentIds: Record<string, string>,
    projectId: string,
    goalId: string | null,
  ) {
    const nextSeededDepartmentIssueKeys = { ...input.seededDepartmentIssueKeys };
    for (const spec of DEPARTMENT_SEED_SPECS) {
      if (nextSeededDepartmentIssueKeys[spec.key]) continue;
      const assigneeAgentId = departmentAgentIds[spec.key];
      if (!assigneeAgentId) continue;
      await issuesApi.create(
        input.createdCompanyId!,
        buildOnboardingIssuePayload({
          title: spec.taskTitleByStage[input.companyStage],
          description: `${spec.taskDescriptionByStage[input.companyStage]}\n\nDepartment seed: ${spec.title}`,
          assigneeAgentId,
          projectId,
          goalId,
        }),
      );
      nextSeededDepartmentIssueKeys[spec.key] = true;
    }
    input.setSeededDepartmentIssueKeys(nextSeededDepartmentIssueKeys);
    queryClient.invalidateQueries({ queryKey: queryKeys.issues.list(input.createdCompanyId!) });
  }
}
