import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Field } from "@/components/agent-config-primitives";
import { SettingsSection } from "./SettingsSection";

type GeneralSettingsSectionProps = {
  companyName: string;
  description: string;
  generalDirty: boolean;
  attachmentMaxValid: boolean;
  isSaving: boolean;
  saveSuccess: boolean;
  saveError: unknown;
  onCompanyNameChange: (value: string) => void;
  onDescriptionChange: (value: string) => void;
  onSave: () => void;
};

export function GeneralSettingsSection({
  companyName,
  description,
  generalDirty,
  attachmentMaxValid,
  isSaving,
  saveSuccess,
  saveError,
  onCompanyNameChange,
  onDescriptionChange,
  onSave,
}: GeneralSettingsSectionProps) {
  const saveErrorMessage = saveError
    ? saveError instanceof Error
      ? saveError.message
      : "Failed to save"
    : null;

  return (
    <>
      <SettingsSection title="General">
        <div className="space-y-3 rounded-md border border-border px-4 py-4">
          <Field label="Company name" hint="The display name for your company.">
            <Input
              type="text"
              value={companyName}
              onChange={(event) => onCompanyNameChange(event.target.value)}
            />
          </Field>
          <Field label="Description" hint="Optional description shown in the company profile.">
            <Input
              type="text"
              value={description}
              placeholder="Optional company description"
              onChange={(event) => onDescriptionChange(event.target.value)}
            />
          </Field>
        </div>
      </SettingsSection>

      {generalDirty && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={onSave}
            disabled={isSaving || !companyName.trim() || !attachmentMaxValid}
          >
            {isSaving ? "Saving..." : "Save changes"}
          </Button>
          {saveSuccess && <span className="text-xs text-muted-foreground">Saved</span>}
          {saveErrorMessage && (
            <span className="text-xs text-destructive">
              {saveErrorMessage}
            </span>
          )}
        </div>
      )}
    </>
  );
}
