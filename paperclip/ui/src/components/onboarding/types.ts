import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";

export type OnboardingStep = 1 | 2 | 3 | 4 | 5;
export type SetupItemStatus = "todo" | "done" | "skipped";
export type SetupCompanyNameStatus = Exclude<SetupItemStatus, "todo">;

export type AdapterChoice = {
  type: string;
  label: string;
  description: string;
  recommended?: boolean;
  comingSoon?: boolean;
  disabledLabel?: string;
  icon: ComponentType<{ className?: string }>;
};

export type AdapterModelEntry = {
  id: string;
  label: string;
};

export type AdapterModelGroup = {
  provider: string;
  entries: AdapterModelEntry[];
};

export type PlanSection =
  | {
      title: string;
      icon: LucideIcon;
      body: string;
    }
  | {
      title: string;
      icon: LucideIcon;
      bullets: string[];
    };
