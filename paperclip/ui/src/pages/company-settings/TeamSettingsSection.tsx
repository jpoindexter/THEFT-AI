import { ToggleField } from "@/components/agent-config-primitives";
import { SettingsSection } from "./SettingsSection";

export function TeamSettingsSection({
  requireApproval,
  onRequireApprovalChange,
}: {
  requireApproval: boolean;
  onRequireApprovalChange: (value: boolean) => void;
}) {
  return (
    <SettingsSection title="Hiring" testId="company-settings-team-section">
      <div className="rounded-md border border-border px-4 py-3">
        <ToggleField
          label="Require board approval for new hires"
          hint="New agent hires stay pending until approved by board."
          checked={requireApproval}
          onChange={onRequireApprovalChange}
          toggleTestId="company-settings-team-approval-toggle"
        />
      </div>
    </SettingsSection>
  );
}
