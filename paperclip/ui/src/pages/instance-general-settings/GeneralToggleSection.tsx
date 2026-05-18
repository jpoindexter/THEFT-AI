import type { ReactNode } from "react";
import { ToggleSwitch } from "@/components/ui/toggle-switch";

type GeneralToggleSectionProps = {
  title: string;
  description: ReactNode;
  checked: boolean;
  disabled: boolean;
  ariaLabel: string;
  onCheckedChange: () => void;
};

export function GeneralToggleSection({
  title,
  description,
  checked,
  disabled,
  ariaLabel,
  onCheckedChange,
}: GeneralToggleSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold">{title}</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">{description}</p>
        </div>
        <ToggleSwitch
          checked={checked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
          aria-label={ariaLabel}
        />
      </div>
    </section>
  );
}
