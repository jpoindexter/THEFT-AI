import { useState } from "react";
import { useNavigate } from "@/lib/router";
import { useDialog } from "../context/DialogContext";
import { useCompany } from "../context/CompanyContext";
import { getUIAdapter } from "../adapters";
import { useDisabledAdaptersSync } from "../adapters/use-disabled-adapters";
import type { OnboardingStep as Step } from "./onboarding/types";
import { useOnboardingAdapterSelection } from "./onboarding/useOnboardingAdapterSelection";
import { useOnboardingAdapterRuntime } from "./onboarding/useOnboardingAdapterRuntime";
import { useOnboardingCreatedEntities } from "./onboarding/useOnboardingCreatedEntities";
import { useOnboardingDraftState } from "./onboarding/useOnboardingDraftState";
import { useOnboardingLaunchActions } from "./onboarding/useOnboardingLaunchActions";
import { OnboardingWizardShell } from "./onboarding/OnboardingWizardShell";
import { useOnboardingRouteDialog } from "./onboarding/useOnboardingRouteDialog";


export function OnboardingWizard() {
  const { onboardingOpen, onboardingOptions, closeOnboarding } = useDialog();
  const { companies, setSelectedCompanyId, loading: companiesLoading } = useCompany();
  const navigate = useNavigate();

  // Sync disabled adapter types from server so adapter grid filters them out
  const disabledTypes = useDisabledAdaptersSync();

  const {
    effectiveOnboardingOpen,
    effectiveOnboardingOptions,
    setRouteDismissed,
  } = useOnboardingRouteDialog({
    companies,
    companiesLoading,
    onboardingOpen,
    onboardingOptions,
  });

  const [step, setStep] = useState<Step>(effectiveOnboardingOptions.initialStep ?? 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const draft = useOnboardingDraftState(step);
  const {
    companyGoal,
    companyName,
    companyStage,
    planObjective,
    planSections,
    resetDraftState,
    setCompanyGoal,
    setCompanyName,
    setCompanyStage,
    setSetupCompanyNameNote,
    setSetupCompanyNameStatus,
    setSetupLegalNote,
    setSetupLegalStatus,
    setSetupOfferNote,
    setSetupOfferStatus,
    setStageInterviewAnswer,
    setTaskDescription,
    setTaskTemplateCustomized,
    setTaskTitle,
    setupCompanyNameNote,
    setupCompanyNameStatus,
    setupLegalNote,
    setupLegalStatus,
    setupOfferNote,
    setupOfferStatus,
    stageInterviewAnswer,
    stageTaskTemplate,
    taskDescription,
    taskTitle,
    textareaRef,
  } = draft;

  const createdEntities = useOnboardingCreatedEntities({
    companies,
    effectiveOnboardingOpen,
    effectiveOnboardingOptions,
    setStep,
  });
  const {
    createdAgentId,
    createdCompanyGoalId,
    createdCompanyId,
    createdCompanyPrefix,
    createdIssueRef,
    createdProjectId,
    resetCreatedEntities,
    seededDepartmentAgentIds,
    seededDepartmentIssueKeys,
    setCreatedAgentId,
    setCreatedCompanyGoalId,
    setCreatedCompanyId,
    setCreatedCompanyPrefix,
    setCreatedIssueRef,
    setCreatedProjectId,
    setSeededDepartmentAgentIds,
    setSeededDepartmentIssueKeys,
  } = createdEntities;
  const adapterRuntime = useOnboardingAdapterRuntime({
    createdAgentId,
    createdCompanyId,
    step,
  });

  const {
    selectedModel,
    filteredModels,
    groupedModels,
    recommendedAdapters,
    moreAdapters,
    isLocalAdapter,
  } = useOnboardingAdapterSelection({
    createdCompanyId,
    effectiveOnboardingOpen,
    step,
    adapterType: adapterRuntime.adapterType,
    model: adapterRuntime.model,
    disabledTypes,
    modelSearch: adapterRuntime.modelSearch,
  });
  const {
    handleLaunch,
    handlePlanReviewNext,
    handleStep1Next,
    handleStep2Next,
    handleStep3Next,
  } = useOnboardingLaunchActions({
    adapterEnvResult: adapterRuntime.adapterEnvResult,
    adapterType: adapterRuntime.adapterType,
    agentName: adapterRuntime.agentName,
    buildAdapterConfig: adapterRuntime.buildAdapterConfig,
    closeOnboarding,
    companyGoal,
    companyName,
    companyStage,
    createdAgentId,
    createdCompanyGoalId,
    createdCompanyId,
    createdCompanyPrefix,
    createdIssueRef,
    createdProjectId,
    isLocalAdapter,
    model: adapterRuntime.model,
    navigate,
    reset,
    runAdapterEnvironmentTest: adapterRuntime.runAdapterEnvironmentTest,
    seededDepartmentAgentIds,
    seededDepartmentIssueKeys,
    setCreatedAgentId,
    setCreatedCompanyGoalId,
    setCreatedCompanyId,
    setCreatedCompanyPrefix,
    setCreatedIssueRef,
    setCreatedProjectId,
    setError,
    setLoading,
    setSeededDepartmentAgentIds,
    setSeededDepartmentIssueKeys,
    setSelectedCompanyId,
    setStep,
    setupCompanyNameNote,
    setupCompanyNameStatus,
    setupLegalNote,
    setupLegalStatus,
    setupOfferNote,
    setupOfferStatus,
    stageInterviewAnswer,
    stageTaskTemplate,
    taskDescription,
    taskTitle,
  });

  function reset() {
    setStep(1);
    setLoading(false);
    setError(null);
    resetDraftState();
    adapterRuntime.resetAdapterRuntime();
    resetCreatedEntities();
  }

  function handleClose() {
    reset();
    closeOnboarding();
  }

  async function handleUnsetAnthropicApiKey() {
    setError(null);
    try {
      const status = await adapterRuntime.handleUnsetAnthropicApiKey();
      if (status === "fail") setError("Retried with ANTHROPIC_API_KEY unset in adapter config, but the environment test is still failing.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to unset ANTHROPIC_API_KEY and retry.");
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (step === 1 && companyName.trim()) handleStep1Next();
      else if (step === 2 && adapterRuntime.agentName.trim()) handleStep2Next();
      else if (step === 3 && taskTitle.trim()) handleStep3Next();
      else if (step === 4) handlePlanReviewNext();
      else if (step === 5) handleLaunch();
    }
  }

  const canContinue = step === 1 ? Boolean(companyName.trim()) : step === 2 ? Boolean(adapterRuntime.agentName.trim()) : step === 3 ? Boolean(taskTitle.trim()) : true;

  if (!effectiveOnboardingOpen) return null;

  return (
    <OnboardingWizardShell
      open={effectiveOnboardingOpen}
      onOpenChange={(open) => {
        if (!open) {
          setRouteDismissed(true);
          handleClose();
        }
      }}
      step={step}
      minStep={(onboardingOptions.initialStep ?? 1) as Step}
      loading={loading}
      error={error}
      companyName={companyName}
      setCompanyName={setCompanyName}
      companyGoal={companyGoal}
      setCompanyGoal={setCompanyGoal}
      companyStage={companyStage}
      setCompanyStage={setCompanyStage}
      setupCompanyNameStatus={setupCompanyNameStatus}
      setSetupCompanyNameStatus={setSetupCompanyNameStatus}
      setupCompanyNameNote={setupCompanyNameNote}
      setSetupCompanyNameNote={setSetupCompanyNameNote}
      setupLegalStatus={setupLegalStatus}
      setSetupLegalStatus={setSetupLegalStatus}
      setupLegalNote={setupLegalNote}
      setSetupLegalNote={setSetupLegalNote}
      setupOfferStatus={setupOfferStatus}
      setSetupOfferStatus={setSetupOfferStatus}
      setupOfferNote={setupOfferNote}
      setSetupOfferNote={setSetupOfferNote}
      agentName={adapterRuntime.agentName}
      setAgentName={adapterRuntime.setAgentName}
      adapterType={adapterRuntime.adapterType}
      setAdapterType={adapterRuntime.setAdapterType}
      adapterLabel={getUIAdapter(adapterRuntime.adapterType).label}
      model={adapterRuntime.model}
      setModel={adapterRuntime.setModel}
      url={adapterRuntime.url}
      setUrl={adapterRuntime.setUrl}
      modelOpen={adapterRuntime.modelOpen}
      setModelOpen={adapterRuntime.setModelOpen}
      modelSearch={adapterRuntime.modelSearch}
      setModelSearch={adapterRuntime.setModelSearch}
      selectedModel={selectedModel}
      groupedModels={groupedModels}
      filteredModels={filteredModels}
      recommendedAdapters={recommendedAdapters}
      moreAdapters={moreAdapters}
      showAdvancedRuntime={adapterRuntime.showAdvancedRuntime}
      setShowAdvancedRuntime={adapterRuntime.setShowAdvancedRuntime}
      showMoreAdapters={adapterRuntime.showMoreAdapters}
      setShowMoreAdapters={adapterRuntime.setShowMoreAdapters}
      isLocalAdapter={isLocalAdapter}
      adapterEnvLoading={adapterRuntime.adapterEnvLoading}
      adapterEnvError={adapterRuntime.adapterEnvError}
      adapterEnvResult={adapterRuntime.adapterEnvResult}
      shouldSuggestUnsetAnthropicApiKey={adapterRuntime.shouldSuggestUnsetAnthropicApiKey}
      unsetAnthropicLoading={adapterRuntime.unsetAnthropicLoading}
      effectiveAdapterCommand={adapterRuntime.effectiveAdapterCommand}
      taskTitle={taskTitle}
      setTaskTitle={setTaskTitle}
      taskDescription={taskDescription}
      setTaskDescription={setTaskDescription}
      setTaskTemplateCustomized={setTaskTemplateCustomized}
      stageInterviewPrompt={stageTaskTemplate.interviewPrompt}
      stageInterviewPlaceholder={stageTaskTemplate.interviewPlaceholder}
      stageInterviewAnswer={stageInterviewAnswer}
      setStageInterviewAnswer={setStageInterviewAnswer}
      textareaRef={textareaRef}
      planObjective={planObjective}
      planSections={planSections}
      canContinue={canContinue}
      onKeyDown={handleKeyDown}
      onClose={handleClose}
      onStepChange={setStep}
      onBack={() => setStep((step - 1) as Step)}
      onStep1Next={handleStep1Next}
      onStep2Next={handleStep2Next}
      onStep3Next={handleStep3Next}
      onPlanReviewNext={handlePlanReviewNext}
      onLaunch={handleLaunch}
      onTestEnvironment={() => void adapterRuntime.runAdapterEnvironmentTest()}
      onUnsetAnthropicApiKey={() => void handleUnsetAnthropicApiKey()}
    />
  );
}
