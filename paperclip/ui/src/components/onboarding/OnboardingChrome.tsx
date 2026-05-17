import { ArrowLeft, ArrowRight, Building2, ListTodo, Loader2, Monitor, Rocket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { OnboardingStep } from "./types";

const STEP_TABS = [
  { step: 1 as const, label: "Company", icon: Building2 },
  { step: 2 as const, label: "Assembly", icon: Users },
  { step: 3 as const, label: "Task", icon: ListTodo },
  { step: 4 as const, label: "Plan", icon: Rocket },
  { step: 5 as const, label: "Preview", icon: Monitor },
];

export function OnboardingFormHeader({
  step,
  companyName,
  onStepChange,
}: {
  step: OnboardingStep;
  companyName: string;
  onStepChange: (step: OnboardingStep) => void;
}) {
  return (
    <div className="theft-onboarding-panel-inner mx-auto w-full space-y-4 px-0 py-0">
      <div className="flex shrink-0 items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="theft-label">{step === 4 ? "Plan Review" : "Onboarding"}</p>
          <h2 className="mt-1.5 truncate text-xl font-medium">
            {companyName.trim() || "New company"}
          </h2>
        </div>
        <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
          {step} / 5
        </span>
      </div>
      <div className="flex shrink-0 items-center gap-0 overflow-x-auto border-b border-border">
        {STEP_TABS.map(({ step: tabStep, label, icon: Icon }) => (
          <Button
            key={tabStep}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => onStepChange(tabStep)}
            className={cn(
              "flex h-auto shrink-0 cursor-pointer items-center gap-1.5 rounded-sm border-b-2 px-3 py-2 text-xs font-medium transition-colors",
              tabStep === step
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:border-border hover:text-foreground/70",
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function OnboardingFormFooter({
  step,
  minStep,
  loading,
  adapterEnvLoading,
  canContinue,
  onBack,
  onStep1Next,
  onStep2Next,
  onStep3Next,
  onPlanReviewNext,
}: {
  step: OnboardingStep;
  minStep: OnboardingStep;
  loading: boolean;
  adapterEnvLoading: boolean;
  canContinue: boolean;
  onBack: () => void;
  onStep1Next: () => void;
  onStep2Next: () => void;
  onStep3Next: () => void;
  onPlanReviewNext: () => void;
}) {
  return (
    <div className="theft-onboarding-panel-inner mx-auto flex w-full shrink-0 items-center justify-between bg-background">
      <div>
        {step > 1 && step > minStep && (
          <Button variant="ghost" size="sm" onClick={onBack} disabled={loading}>
            <ArrowLeft className="mr-1 h-3.5 w-3.5" />
            Back
          </Button>
        )}
      </div>
      <div className="flex items-center gap-2">
        {step === 1 && (
          <NextButton disabled={!canContinue || loading} loading={loading} onClick={onStep1Next} />
        )}
        {step === 2 && (
          <NextButton
            disabled={!canContinue || loading || adapterEnvLoading}
            loading={loading}
            onClick={onStep2Next}
          />
        )}
        {step === 3 && (
          <NextButton disabled={!canContinue || loading} loading={loading} onClick={onStep3Next} />
        )}
        {step === 4 && (
          <Button size="sm" disabled={loading} onClick={onPlanReviewNext}>
            <ArrowRight className="mr-1 h-3.5 w-3.5" />
            Preview assembly
          </Button>
        )}
      </div>
    </div>
  );
}

function NextButton({
  disabled,
  loading,
  onClick,
}: {
  disabled: boolean;
  loading: boolean;
  onClick: () => void;
}) {
  return (
    <Button size="sm" disabled={disabled} onClick={onClick}>
      {loading ? (
        <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" />
      ) : (
        <ArrowRight className="mr-1 h-3.5 w-3.5" />
      )}
      {loading ? "Creating..." : "Next"}
    </Button>
  );
}
