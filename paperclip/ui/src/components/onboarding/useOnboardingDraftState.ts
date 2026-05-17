import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  getOnboardingStageTaskTemplate,
  type OnboardingStage,
} from "../../lib/onboarding-context";
import { DEFAULT_TASK_DESCRIPTION } from "../../lib/onboarding-copy";
import type { OnboardingStep, SetupCompanyNameStatus, SetupItemStatus } from "./types";
import { useOnboardingPlanSections } from "./useOnboardingPlanSections";

export function useOnboardingDraftState(step: OnboardingStep) {
  const [companyName, setCompanyName] = useState("");
  const [companyGoal, setCompanyGoal] = useState("");
  const [companyStage, setCompanyStage] = useState<OnboardingStage>("idea");
  const [setupCompanyNameStatus, setSetupCompanyNameStatus] = useState<SetupCompanyNameStatus>("done");
  const [setupCompanyNameNote, setSetupCompanyNameNote] = useState("");
  const [setupLegalStatus, setSetupLegalStatus] = useState<SetupItemStatus>("todo");
  const [setupLegalNote, setSetupLegalNote] = useState("");
  const [setupOfferStatus, setSetupOfferStatus] = useState<SetupItemStatus>("todo");
  const [setupOfferNote, setSetupOfferNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("Hire your first engineer and create a hiring plan");
  const [taskDescription, setTaskDescription] = useState(DEFAULT_TASK_DESCRIPTION);
  const [taskTemplateCustomized, setTaskTemplateCustomized] = useState(false);
  const [stageInterviewAnswer, setStageInterviewAnswer] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const autoResizeTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, []);

  const stageTaskTemplate = useMemo(
    () => getOnboardingStageTaskTemplate(companyStage),
    [companyStage],
  );
  const { planObjective, planSections } = useOnboardingPlanSections({
    companyName,
    companyGoal,
    companyStage,
    taskTitle,
    stageTaskTemplate,
  });

  useEffect(() => {
    if (step === 3) autoResizeTextarea();
  }, [autoResizeTextarea, step, taskDescription]);

  useEffect(() => {
    if (taskTemplateCustomized) return;
    setTaskTitle(stageTaskTemplate.taskTitle);
    setTaskDescription(stageTaskTemplate.taskDescription);
  }, [stageTaskTemplate, taskTemplateCustomized]);

  function resetDraftState() {
    setCompanyName("");
    setCompanyGoal("");
    setCompanyStage("idea");
    setSetupCompanyNameStatus("done");
    setSetupCompanyNameNote("");
    setSetupLegalStatus("todo");
    setSetupLegalNote("");
    setSetupOfferStatus("todo");
    setSetupOfferNote("");
    setTaskTitle("Hire your first engineer and create a hiring plan");
    setTaskDescription(DEFAULT_TASK_DESCRIPTION);
    setTaskTemplateCustomized(false);
    setStageInterviewAnswer("");
  }

  return {
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
  };
}
