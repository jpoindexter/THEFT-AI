import type { ChangeEvent } from "react";
import { CompanyPatternIcon } from "@/components/CompanyPatternIcon";
import { Field } from "@/components/agent-config-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AttachmentLimitField, BrandColorField } from "./AppearanceFields";
import { SettingsSection } from "./SettingsSection";

type AppearanceSettingsSectionProps = {
  companyName: string;
  selectedCompanyName: string;
  logoUrl: string;
  brandColor: string;
  attachmentMaxMiB: string;
  attachmentMaxValid: boolean;
  logoUploadError: string | null;
  logoMutationError: unknown;
  clearLogoError: unknown;
  isUploadingLogo: boolean;
  isClearingLogo: boolean;
  onLogoFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onClearLogo: () => void;
  onBrandColorChange: (value: string) => void;
  onAttachmentMaxMiBChange: (value: string) => void;
};

export function AppearanceSettingsSection({
  companyName,
  selectedCompanyName,
  logoUrl,
  brandColor,
  attachmentMaxMiB,
  attachmentMaxValid,
  logoUploadError,
  logoMutationError,
  clearLogoError,
  isUploadingLogo,
  isClearingLogo,
  onLogoFileChange,
  onClearLogo,
  onBrandColorChange,
  onAttachmentMaxMiBChange,
}: AppearanceSettingsSectionProps) {
  const logoError = logoUploadError ?? (logoMutationError instanceof Error ? logoMutationError.message : null);

  return (
    <SettingsSection title="Appearance">
      <div className="space-y-3 rounded-md border border-border px-4 py-4">
        <div className="flex items-start gap-4">
          <CompanyPatternIcon
            companyName={companyName || selectedCompanyName}
            logoUrl={logoUrl || null}
            brandColor={brandColor || null}
            className="shrink-0 rounded-md"
          />
          <div className="flex-1 space-y-3">
            <Field label="Logo" hint="Upload a PNG, JPEG, WEBP, GIF, or SVG logo image.">
              <div className="space-y-2">
                <Input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif,image/svg+xml"
                  onChange={onLogoFileChange}
                  className="file:text-xs"
                />
                {logoUrl && (
                  <Button size="sm" variant="outline" onClick={onClearLogo} disabled={isClearingLogo}>
                    {isClearingLogo ? "Removing..." : "Remove logo"}
                  </Button>
                )}
                {logoError && <span className="text-xs text-destructive">{logoError}</span>}
                {clearLogoError instanceof Error && (
                  <span className="text-xs text-destructive">{clearLogoError.message}</span>
                )}
                {isUploadingLogo && <span className="text-xs text-muted-foreground">Uploading logo...</span>}
              </div>
            </Field>
            <BrandColorField brandColor={brandColor} onBrandColorChange={onBrandColorChange} />
            <AttachmentLimitField
              attachmentMaxMiB={attachmentMaxMiB}
              attachmentMaxValid={attachmentMaxValid}
              onAttachmentMaxMiBChange={onAttachmentMaxMiBChange}
            />
          </div>
        </div>
      </div>
    </SettingsSection>
  );
}
