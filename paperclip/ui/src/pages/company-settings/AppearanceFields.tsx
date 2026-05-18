import { Field } from "@/components/agent-config-primitives";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MAX_COMPANY_ATTACHMENT_MAX_MIB, getDefaultColorPickerValue } from "./companySettingsModel";

export function BrandColorField({
  brandColor,
  onBrandColorChange,
}: {
  brandColor: string;
  onBrandColorChange: (value: string) => void;
}) {
  return (
    <Field label="Brand color" hint="Sets the hue for the company icon. Leave empty for auto-generated color.">
      <div className="flex items-center gap-2">
        <Input
          type="color"
          value={brandColor || getDefaultColorPickerValue()}
          onChange={(event) => onBrandColorChange(event.target.value)}
          className="h-8 w-8 cursor-pointer p-0"
        />
        <Input
          type="text"
          value={brandColor}
          onChange={(event) => {
            const value = event.target.value;
            if (value === "" || /^#[0-9a-fA-F]{0,6}$/.test(value)) onBrandColorChange(value);
          }}
          placeholder="Auto"
          className="w-28 font-mono"
        />
        {brandColor && (
          <Button size="sm" variant="ghost" onClick={() => onBrandColorChange("")} className="text-xs text-muted-foreground">
            Clear
          </Button>
        )}
      </div>
    </Field>
  );
}

export function AttachmentLimitField({
  attachmentMaxMiB,
  attachmentMaxValid,
  onAttachmentMaxMiBChange,
}: {
  attachmentMaxMiB: string;
  attachmentMaxValid: boolean;
  onAttachmentMaxMiBChange: (value: string) => void;
}) {
  return (
    <Field label="Attachment size limit" hint={`Accepted range: 1-${MAX_COMPANY_ATTACHMENT_MAX_MIB} MiB.`}>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={1}
            max={MAX_COMPANY_ATTACHMENT_MAX_MIB}
            step={1}
            value={attachmentMaxMiB}
            onChange={(event) => onAttachmentMaxMiBChange(event.target.value)}
            className="w-28"
          />
          <span className="text-xs text-muted-foreground">MiB</span>
        </div>
        {!attachmentMaxValid && (
          <span className="text-xs text-destructive">
            Enter a whole number from 1 to {MAX_COMPANY_ATTACHMENT_MAX_MIB}.
          </span>
        )}
      </div>
    </Field>
  );
}
