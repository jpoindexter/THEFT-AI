import type { Dispatch, KeyboardEvent, RefObject, SetStateAction } from "react";
import type { AdapterEnvironmentTestResult } from "@paperclipai/shared";
import type { OnboardingStage } from "@/lib/onboarding-context";
import { Dialog, DialogPortal } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TheftSplitCanvasFormTemplate } from "@/components/theft/templates/TheftSplitCanvasFormTemplate";
import { CircleDot, X } from "lucide-react";

import { AssemblyPreviewScreen } from "./AssemblyPreviewScreen";
import { AssemblyStepForm } from "./AssemblyStepForm";
import { CompanyStepForm } from "./CompanyStepForm";
import { OnboardingCanvasPreview } from "./OnboardingCanvasPreview";
import { OnboardingFormFooter, OnboardingFormHeader } from "./OnboardingChrome";
import { PlanReviewForm } from "./PlanReviewForm";
import { TaskStepForm } from "./TaskStepForm";
import type {
  AdapterChoice,
  AdapterModelEntry,
  AdapterModelGroup,
  OnboardingStep,
  PlanSection,
  SetupCompanyNameStatus,
  SetupItemStatus,
} from "./types";

export function OnboardingWizardShell(props: {
  open: boolean;
  step: OnboardingStep;
  minStep: OnboardingStep;
  loading: boolean;
  error: string | null;
  companyName: string;
  setCompanyName: (value: string) => void;
  companyGoal: string;
  setCompanyGoal: (value: string) => void;
  companyStage: OnboardingStage;
  setCompanyStage: (value: OnboardingStage) => void;
  setupCompanyNameStatus: SetupCompanyNameStatus;
  setSetupCompanyNameStatus: (value: SetupCompanyNameStatus) => void;
  setupCompanyNameNote: string;
  setSetupCompanyNameNote: (value: string) => void;
  setupLegalStatus: SetupItemStatus;
  setSetupLegalStatus: (value: SetupItemStatus) => void;
  setupLegalNote: string;
  setSetupLegalNote: (value: string) => void;
  setupOfferStatus: SetupItemStatus;
  setSetupOfferStatus: (value: SetupItemStatus) => void;
  setupOfferNote: string;
  setSetupOfferNote: (value: string) => void;
  agentName: string;
  setAgentName: (value: string) => void;
  adapterType: string;
  setAdapterType: (value: string) => void;
  adapterLabel: string;
  model: string;
  setModel: (value: string) => void;
  url: string;
  setUrl: (value: string) => void;
  modelOpen: boolean;
  setModelOpen: (value: boolean) => void;
  modelSearch: string;
  setModelSearch: (value: string) => void;
  selectedModel?: AdapterModelEntry;
  groupedModels: AdapterModelGroup[];
  filteredModels: AdapterModelEntry[];
  recommendedAdapters: AdapterChoice[];
  moreAdapters: AdapterChoice[];
  showAdvancedRuntime: boolean;
  setShowAdvancedRuntime: Dispatch<SetStateAction<boolean>>;
  showMoreAdapters: boolean;
  setShowMoreAdapters: Dispatch<SetStateAction<boolean>>;
  isLocalAdapter: boolean;
  adapterEnvLoading: boolean;
  adapterEnvError: string | null;
  adapterEnvResult: AdapterEnvironmentTestResult | null;
  shouldSuggestUnsetAnthropicApiKey: boolean;
  unsetAnthropicLoading: boolean;
  effectiveAdapterCommand: string;
  taskTitle: string;
  setTaskTitle: (value: string) => void;
  taskDescription: string;
  setTaskDescription: (value: string) => void;
  setTaskTemplateCustomized: (value: boolean) => void;
  stageInterviewPrompt: string;
  stageInterviewPlaceholder: string;
  stageInterviewAnswer: string;
  setStageInterviewAnswer: (value: string) => void;
  textareaRef: RefObject<HTMLTextAreaElement | null>;
  planObjective: string;
  planSections: PlanSection[];
  canContinue: boolean;
  onOpenChange: (open: boolean) => void;
  onKeyDown: (event: KeyboardEvent) => void;
  onClose: () => void;
  onStepChange: (step: OnboardingStep) => void;
  onBack: () => void;
  onStep1Next: () => void;
  onStep2Next: () => void;
  onStep3Next: () => void;
  onPlanReviewNext: () => void;
  onLaunch: () => void;
  onTestEnvironment: () => void;
  onUnsetAnthropicApiKey: () => void;
}) {
  const formTitle = props.step === 5 ? "Company Assembly" : props.step === 4 ? "Plan Review" : "Onboarding";

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogPortal>
        {/* Plain div instead of DialogOverlay: Radix RemoveScroll blocks wheel events on this custom scroll container. */}
        <div className="fixed inset-0 z-50 bg-background" />
        <div
          className="theft-onboarding-shell fixed inset-0 z-50 grid overflow-hidden bg-background text-foreground"
          onKeyDown={props.onKeyDown}
        >
          <aside className="hidden min-h-0 flex-col items-center justify-between border-r border-border bg-card py-5 md:flex">
            <div className="flex flex-col items-center gap-5">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary text-sm font-medium text-primary-foreground">
                T
              </div>
              <div className="h-px w-8 bg-border" />
              <div className="flex size-10 items-center justify-center rounded-full bg-secondary text-foreground">
                <CircleDot className="size-5" />
              </div>
            </div>
            <div className="mb-1 flex size-2 rounded-full bg-signal" aria-hidden />
          </aside>

          <div className="flex min-h-0 min-w-0 flex-col">
            <header className="theft-onboarding-header flex shrink-0 items-center justify-between border-b border-border">
              <div className="flex min-w-0 items-center gap-2 text-sm font-medium">
                <span className="truncate text-muted-foreground">Mission Control</span>
                <span className="text-muted-foreground">/</span>
                <span className="truncate text-foreground">{formTitle}</span>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={props.onClose}
                className="flex size-9 items-center justify-center rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground"
              >
                <X className="h-4 w-4" />
                <span className="sr-only">Close</span>
              </Button>
            </header>

            {props.step === 5 ? <OnboardingAssemblyLaunch {...props} /> : <OnboardingStepWorkspace {...props} />}
          </div>
        </div>
      </DialogPortal>
    </Dialog>
  );
}

function OnboardingAssemblyLaunch(props: Parameters<typeof OnboardingWizardShell>[0]) {
  return (
    <AssemblyPreviewScreen
      companyStage={props.companyStage}
      objective={props.planObjective}
      taskTitle={props.taskTitle}
      agentName={props.agentName}
      adapterLabel={props.adapterLabel}
      loading={props.loading}
      onBack={() => props.onStepChange(4)}
      onLaunch={props.onLaunch}
    />
  );
}

function OnboardingStepWorkspace(props: Parameters<typeof OnboardingWizardShell>[0]) {
  return (
    <TheftSplitCanvasFormTemplate
      className="min-h-0 flex-1"
      header={false}
      canvas={
        <OnboardingCanvasPreview
          companyName={props.companyName}
          companyStage={props.companyStage}
          step={props.step}
          agentName={props.agentName}
        />
      }
      formHeader={
        <OnboardingFormHeader
          step={props.step}
          companyName={props.companyName}
          onStepChange={props.onStepChange}
        />
      }
      form={<OnboardingStepForm {...props} />}
      formFooter={
        <OnboardingFormFooter
          step={props.step}
          minStep={props.minStep}
          loading={props.loading}
          adapterEnvLoading={props.adapterEnvLoading}
          canContinue={props.canContinue}
          onBack={props.onBack}
          onStep1Next={props.onStep1Next}
          onStep2Next={props.onStep2Next}
          onStep3Next={props.onStep3Next}
          onPlanReviewNext={props.onPlanReviewNext}
        />
      }
    />
  );
}

function OnboardingStepForm(props: Parameters<typeof OnboardingWizardShell>[0]) {
  return (
    <div className="theft-onboarding-panel-inner mx-auto w-full min-w-0">
      {props.step === 1 ? <CompanyStepForm {...props} /> : null}
      {props.step === 2 ? (
        <AssemblyStepForm
          {...props}
          onTestEnvironment={props.onTestEnvironment}
          onUnsetAnthropicApiKey={props.onUnsetAnthropicApiKey}
        />
      ) : null}
      {props.step === 3 ? (
        <TaskStepForm
          taskTitle={props.taskTitle}
          setTaskTitle={props.setTaskTitle}
          taskDescription={props.taskDescription}
          setTaskDescription={props.setTaskDescription}
          setTaskTemplateCustomized={props.setTaskTemplateCustomized}
          stageInterviewPrompt={props.stageInterviewPrompt}
          stageInterviewPlaceholder={props.stageInterviewPlaceholder}
          stageInterviewAnswer={props.stageInterviewAnswer}
          setStageInterviewAnswer={props.setStageInterviewAnswer}
          textareaRef={props.textareaRef}
        />
      ) : null}
      {props.step === 4 ? (
        <PlanReviewForm
          planSections={props.planSections}
          stageInterviewAnswer={props.stageInterviewAnswer}
          setStageInterviewAnswer={props.setStageInterviewAnswer}
          agentName={props.agentName}
          adapterLabel={props.adapterLabel}
        />
      ) : null}
      {props.error ? (
        <div className="mt-3">
          <p className="text-xs text-destructive">{props.error}</p>
        </div>
      ) : null}
    </div>
  );
}
