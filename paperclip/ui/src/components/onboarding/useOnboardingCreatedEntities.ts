import { useEffect, useState } from "react";
import type { Company } from "@paperclipai/shared";

import type { OnboardingStep } from "./types";

type OnboardingOptions = {
  initialStep?: OnboardingStep;
  companyId?: string;
};

export function useOnboardingCreatedEntities({
  companies,
  effectiveOnboardingOpen,
  effectiveOnboardingOptions,
  setStep,
}: {
  companies: Company[];
  effectiveOnboardingOpen: boolean;
  effectiveOnboardingOptions: OnboardingOptions;
  setStep: (step: OnboardingStep) => void;
}) {
  const [createdCompanyId, setCreatedCompanyId] = useState<string | null>(effectiveOnboardingOptions.companyId ?? null);
  const [createdCompanyPrefix, setCreatedCompanyPrefix] = useState<string | null>(null);
  const [createdCompanyGoalId, setCreatedCompanyGoalId] = useState<string | null>(null);
  const [createdAgentId, setCreatedAgentId] = useState<string | null>(null);
  const [createdProjectId, setCreatedProjectId] = useState<string | null>(null);
  const [createdIssueRef, setCreatedIssueRef] = useState<string | null>(null);
  const [seededDepartmentAgentIds, setSeededDepartmentAgentIds] = useState<Record<string, string>>({});
  const [seededDepartmentIssueKeys, setSeededDepartmentIssueKeys] = useState<Record<string, true>>({});

  useEffect(() => {
    if (!effectiveOnboardingOpen) return;
    setStep(effectiveOnboardingOptions.initialStep ?? 1);
    setCreatedCompanyId(effectiveOnboardingOptions.companyId ?? null);
    resetCreatedRuntimeEntities();
  }, [
    effectiveOnboardingOpen,
    effectiveOnboardingOptions.companyId,
    effectiveOnboardingOptions.initialStep,
    setStep,
  ]);

  useEffect(() => {
    if (!effectiveOnboardingOpen || !createdCompanyId || createdCompanyPrefix) return;
    const company = companies.find((entry) => entry.id === createdCompanyId);
    if (company) setCreatedCompanyPrefix(company.issuePrefix);
  }, [companies, createdCompanyId, createdCompanyPrefix, effectiveOnboardingOpen]);

  function resetCreatedRuntimeEntities() {
    setCreatedCompanyPrefix(null);
    setCreatedCompanyGoalId(null);
    setCreatedProjectId(null);
    setCreatedAgentId(null);
    setCreatedIssueRef(null);
    setSeededDepartmentAgentIds({});
    setSeededDepartmentIssueKeys({});
  }

  function resetCreatedEntities() {
    setCreatedCompanyId(null);
    resetCreatedRuntimeEntities();
  }

  return {
    createdAgentId,
    createdCompanyGoalId,
    createdCompanyId,
    createdCompanyPrefix,
    createdIssueRef,
    createdProjectId,
    seededDepartmentAgentIds,
    seededDepartmentIssueKeys,
    resetCreatedEntities,
    setCreatedAgentId,
    setCreatedCompanyGoalId,
    setCreatedCompanyId,
    setCreatedCompanyPrefix,
    setCreatedIssueRef,
    setCreatedProjectId,
    setSeededDepartmentAgentIds,
    setSeededDepartmentIssueKeys,
  };
}
