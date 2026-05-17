import type { ReactNode } from "react";
import { Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  ONBOARDING_STAGES,
  ONBOARDING_STAGE_LABELS,
  type OnboardingStage,
} from "@/lib/onboarding-context";
import type { SetupCompanyNameStatus, SetupItemStatus } from "./types";

const COMPANY_NAME_STATUSES = ["done", "skipped"] as const;
const SETUP_ITEM_STATUSES = ["todo", "done", "skipped"] as const;

export function CompanyStepForm({
  companyName,
  setCompanyName,
  companyGoal,
  setCompanyGoal,
  companyStage,
  setCompanyStage,
  setupCompanyNameStatus,
  setSetupCompanyNameStatus,
  setupCompanyNameNote,
  setSetupCompanyNameNote,
  setupLegalStatus,
  setSetupLegalStatus,
  setupLegalNote,
  setSetupLegalNote,
  setupOfferStatus,
  setSetupOfferStatus,
  setupOfferNote,
  setSetupOfferNote,
}: {
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
}) {
  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-3">
        <div className="bg-muted/50 p-2">
          <Building2 className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="font-medium">Name your company</h3>
          <p className="text-xs text-muted-foreground">
            This is the operating company THEFT will assemble.
          </p>
        </div>
      </div>

      <FieldLabel label="Company name" active={Boolean(companyName.trim())}>
        <Input
          className="w-full rounded-md border border-border bg-transparent px-3 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
          placeholder="Company name"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          autoFocus
        />
      </FieldLabel>

      <div>
        <label className="mb-2 block text-xs text-muted-foreground">
          Company stage
        </label>
        <div className="grid grid-cols-2 gap-2">
          {ONBOARDING_STAGES.map((stage) => (
            <Button
              key={stage}
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => setCompanyStage(stage)}
              className={cn(
                "h-auto justify-start rounded-md border px-2 py-1.5 text-left text-xs",
                companyStage === stage
                  ? "border-foreground bg-accent text-foreground"
                  : "border-border text-muted-foreground hover:bg-accent/40 hover:text-foreground",
              )}
            >
              {ONBOARDING_STAGE_LABELS[stage]}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="text-xs text-muted-foreground">Setup status</div>
        <div className="grid gap-2">
          <SetupStatusCard
            title="Company name"
            statuses={COMPANY_NAME_STATUSES}
            value={setupCompanyNameStatus}
            onChange={setSetupCompanyNameStatus}
            note={setupCompanyNameNote}
            onNoteChange={setSetupCompanyNameNote}
            placeholder="Name note (optional)"
          />
          <SetupStatusCard
            title="Legal / operating readiness"
            statuses={SETUP_ITEM_STATUSES}
            value={setupLegalStatus}
            onChange={setSetupLegalStatus}
            note={setupLegalNote}
            onNoteChange={setSetupLegalNote}
            placeholder="Legal, compliance, or operating note (optional)"
          />
          <SetupStatusCard
            title="Offer / product"
            statuses={SETUP_ITEM_STATUSES}
            value={setupOfferStatus}
            onChange={setSetupOfferStatus}
            note={setupOfferNote}
            onNoteChange={setSetupOfferNote}
            placeholder="Offer note (optional)"
          />
        </div>
      </div>

      <FieldLabel label="Mission / goal (optional)" active={Boolean(companyGoal.trim())}>
        <Textarea
          className="min-h-16 w-full resize-none rounded-md border border-border bg-transparent px-4 py-2 text-sm outline-none placeholder:text-muted-foreground/50 focus:ring-1 focus:ring-ring"
          placeholder="What is this company trying to achieve?"
          value={companyGoal}
          onChange={(e) => setCompanyGoal(e.target.value)}
        />
      </FieldLabel>
    </div>
  );
}

function FieldLabel({
  label,
  active,
  children,
}: {
  label: string;
  active: boolean;
  children: ReactNode;
}) {
  return (
    <div className="group mt-3">
      <label
        className={cn(
          "mb-1 block text-xs transition-colors",
          active
            ? "text-foreground"
            : "text-muted-foreground group-focus-within:text-foreground",
        )}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

function SetupStatusCard<TStatus extends string>({
  title,
  statuses,
  value,
  onChange,
  note,
  onNoteChange,
  placeholder,
}: {
  title: string;
  statuses: readonly TStatus[];
  value: TStatus;
  onChange: (value: TStatus) => void;
  note: string;
  onNoteChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="theft-inset-surface p-2">
      <div className="mb-1 text-xs">{title}</div>
      <div className="mb-2 flex gap-2">
        {statuses.map((status) => (
          <Button
            key={status}
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange(status)}
            className={cn(
              "h-auto border px-2 py-1 text-xs",
              value === status ? "border-foreground bg-accent" : "border-border",
            )}
          >
            {status}
          </Button>
        ))}
      </div>
      <Input
        className="w-full rounded-md border border-border bg-transparent px-2 py-1.5 text-xs outline-none focus:ring-1 focus:ring-ring"
        placeholder={placeholder}
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
      />
    </div>
  );
}
