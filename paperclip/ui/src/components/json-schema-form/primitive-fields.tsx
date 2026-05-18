import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEXTAREA_THRESHOLD } from "@/components/json-schema-form/schema";

interface FieldWrapperProps {
  label: string;
  description?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  children: React.ReactNode;
}

const FieldWrapper = React.memo(({
  label,
  description,
  required,
  error,
  disabled,
  children,
}: FieldWrapperProps) => {
  return (
    <div className={cn("space-y-2", disabled && "opacity-60")}>
      <div className="flex items-center justify-between">
        {label && (
          <Label className="text-sm font-medium">
            {label}
            {required && <span className="ml-1 text-destructive">*</span>}
          </Label>
        )}
      </div>
      {children}
      {description && (
        <p className="text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
});

FieldWrapper.displayName = "FieldWrapper";

interface PrimitiveFieldProps {
  value: unknown;
  onChange: (val: unknown) => void;
  disabled: boolean;
  label: string;
  isRequired?: boolean;
  description?: string;
  error?: string;
}

export const BooleanField = React.memo(({
  id,
  value,
  onChange,
  disabled,
  label,
  isRequired,
  description,
  error,
}: PrimitiveFieldProps & { id: string }) => (
  <div className="flex items-start space-x-3 space-y-0">
    <Checkbox
      id={id}
      checked={!!value}
      onCheckedChange={onChange}
      disabled={disabled}
    />
    <div className="grid gap-1.5 leading-none">
      {label && (
        <Label
          htmlFor={id}
          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
        >
          {label}
          {isRequired && <span className="ml-1 text-destructive">*</span>}
        </Label>
      )}
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  </div>
));

BooleanField.displayName = "BooleanField";

export const EnumField = React.memo(({
  value,
  onChange,
  disabled,
  label,
  isRequired,
  description,
  error,
  options,
}: PrimitiveFieldProps & { options: unknown[] }) => (
  <FieldWrapper
    label={label}
    description={description}
    required={isRequired}
    error={error}
    disabled={disabled}
  >
    <Select
      value={String(value ?? "")}
      onValueChange={onChange}
      disabled={disabled}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select an option" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={String(option)} value={String(option)}>
            {String(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FieldWrapper>
));

EnumField.displayName = "EnumField";

export const SecretField = React.memo(({
  value,
  onChange,
  disabled,
  label,
  isRequired,
  description,
  error,
  defaultValue,
}: PrimitiveFieldProps & { defaultValue?: unknown }) => {
  const [isVisible, setIsVisible] = useState(false);
  return (
    <FieldWrapper
      label={label}
      description={
        description ||
        "This secret is stored securely via the Paperclip secret provider."
      }
      required={isRequired}
      error={error}
      disabled={disabled}
    >
      <div className="relative">
        <Input
          type={isVisible ? "text" : "password"}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={String(defaultValue ?? "")}
          disabled={disabled}
          className="pr-10"
          aria-invalid={!!error}
        />
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
          onClick={() => setIsVisible(!isVisible)}
          disabled={disabled}
        >
          {isVisible ? (
            <EyeOff className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Eye className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="sr-only">
            {isVisible ? "Hide secret" : "Show secret"}
          </span>
        </Button>
      </div>
    </FieldWrapper>
  );
});

SecretField.displayName = "SecretField";

export const NumberField = React.memo(({
  value,
  onChange,
  disabled,
  label,
  isRequired,
  description,
  error,
  defaultValue,
  type,
}: PrimitiveFieldProps & {
  defaultValue?: unknown;
  type: "number" | "integer";
}) => (
  <FieldWrapper
    label={label}
    description={description}
    required={isRequired}
    error={error}
    disabled={disabled}
  >
    <Input
      type="number"
      step={type === "integer" ? "1" : "any"}
      value={value !== undefined ? String(value) : ""}
      onChange={(e) => {
        const val = e.target.value;
        onChange(val === "" ? undefined : Number(val));
      }}
      placeholder={String(defaultValue ?? "")}
      disabled={disabled}
      aria-invalid={!!error}
    />
  </FieldWrapper>
));

NumberField.displayName = "NumberField";

export const StringField = React.memo(({
  value,
  onChange,
  disabled,
  label,
  isRequired,
  description,
  error,
  defaultValue,
  format,
  maxLength,
}: PrimitiveFieldProps & {
  defaultValue?: unknown;
  format?: string;
  maxLength?: number;
}) => {
  const isTextArea = format === "textarea" || (maxLength && maxLength > TEXTAREA_THRESHOLD);
  return (
    <FieldWrapper
      label={label}
      description={description}
      required={isRequired}
      error={error}
      disabled={disabled}
    >
      {isTextArea ? (
        <Textarea
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={String(defaultValue ?? "")}
          disabled={disabled}
          className="min-h-24"
          aria-invalid={!!error}
        />
      ) : (
        <Input
          type="text"
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
          placeholder={String(defaultValue ?? "")}
          disabled={disabled}
          aria-invalid={!!error}
        />
      )}
    </FieldWrapper>
  );
});

StringField.displayName = "StringField";
