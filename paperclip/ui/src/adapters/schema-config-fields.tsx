import { useState, useEffect } from "react";

import type { ConfigFieldSchema } from "@paperclipai/adapter-utils";

import type { AdapterConfigFieldsProps } from "./types";
import {
  Field,
  DraftInput,
  DraftNumberInput,
  DraftTextarea,
  ToggleField,
} from "../components/agent-config-primitives";
import { ComboboxField, inputClass, SelectField } from "./schema-config-field-controls";
import { useConfigSchema } from "./schema-config-schema-cache";
import {
  fieldMatchesVisibleWhen,
  getDefaultValue,
  getSchemaComboboxOptions,
} from "./schema-config-values";

export { invalidateConfigSchemaCache } from "./schema-config-schema-cache";
export { buildSchemaAdapterConfig, fieldMatchesVisibleWhen } from "./schema-config-values";

export function SchemaConfigFields({
  adapterType,
  isCreate,
  values,
  set,
  config,
  eff,
  mark,
}: AdapterConfigFieldsProps) {
  const schema = useConfigSchema(adapterType);

  const [defaultsApplied, setDefaultsApplied] = useState(false);
  useEffect(() => {
    if (!schema || !isCreate || defaultsApplied) return;
    const defaults: Record<string, unknown> = {};
    for (const field of schema.fields) {
      const def = getDefaultValue(field);
      if (def !== undefined && def !== "") {
        defaults[field.key] = def;
      }
    }
    if (Object.keys(defaults).length > 0) {
      set?.({
        adapterSchemaValues: { ...values?.adapterSchemaValues, ...defaults },
      });
    }
    setDefaultsApplied(true);
  }, [schema, isCreate, defaultsApplied, set, values?.adapterSchemaValues]);

  if (!schema || schema.fields.length === 0) return null;
  const currentSchema = schema;

  function readValue(field: ConfigFieldSchema): unknown {
    if (isCreate) {
      return values?.adapterSchemaValues?.[field.key] ?? getDefaultValue(field);
    }
    const stored = config[field.key];
    return eff("adapterConfig", field.key, (stored ?? getDefaultValue(field)) as string);
  }

  function writeValue(field: ConfigFieldSchema, value: unknown): void {
    if (isCreate) {
      const next = {
        adapterSchemaValues: {
          ...values?.adapterSchemaValues,
          [field.key]: value,
        },
      };

      if (field.key === "provider") {
        const modelField = currentSchema.fields.find((f) => f.key === "model");
        if (modelField?.meta?.providerModels) {
          const modelsByProvider = modelField.meta.providerModels as Record<string, string[]>;
          const providerModels = modelsByProvider[String(value)] ?? [];
          const currentModel = values?.adapterSchemaValues?.model;
          if (currentModel && String(value) !== "auto" && !providerModels.includes(String(currentModel))) {
            next.adapterSchemaValues.model = "";
          }
        }
      }

      set?.(next);
    } else {
      mark("adapterConfig", field.key, value);

      if (field.key === "provider") {
        const modelField = currentSchema.fields.find((f) => f.key === "model");
        if (modelField?.meta?.providerModels) {
          const modelsByProvider = modelField.meta.providerModels as Record<string, string[]>;
          const providerModels = modelsByProvider[String(value)] ?? [];
          const currentModel = eff("adapterConfig", "model", "");
          if (currentModel && String(value) !== "auto" && !providerModels.includes(String(currentModel))) {
            mark("adapterConfig", "model", "");
          }
        }
      }
    }
  }

  return (
    <>
      {currentSchema.fields
        .filter((field) => fieldMatchesVisibleWhen(field, readValue, currentSchema))
        .map((field) => {
          switch (field.type) {
            case "select": {
              const currentVal = String(readValue(field) ?? "");
              return (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <SelectField
                    value={currentVal}
                    options={field.options ?? []}
                    onChange={(v) => writeValue(field, v)}
                  />
                </Field>
              );
            }

            case "toggle":
              return (
                <ToggleField
                  key={field.key}
                  label={field.label}
                  hint={field.hint}
                  checked={readValue(field) === true}
                  onChange={(v) => writeValue(field, v)}
                />
              );

            case "number":
              return (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <DraftNumberInput
                    value={Number(readValue(field) ?? 0)}
                    onCommit={(v) => writeValue(field, v)}
                    immediate
                    className={inputClass}
                  />
                </Field>
              );

            case "textarea":
              return (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <DraftTextarea
                    value={String(readValue(field) ?? "")}
                    onCommit={(v) => writeValue(field, v || undefined)}
                    immediate
                  />
                </Field>
              );

            case "combobox": {
              const currentVal = String(readValue(field) ?? "");
              return (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <ComboboxField
                    value={currentVal}
                    options={getSchemaComboboxOptions(field, currentSchema, readValue)}
                    onChange={(v) => writeValue(field, v || undefined)}
                    placeholder={field.hint}
                  />
                </Field>
              );
            }

            case "text":
            default:
              return (
                <Field key={field.key} label={field.label} hint={field.hint}>
                  <DraftInput
                    value={String(readValue(field) ?? "")}
                    onCommit={(v) => writeValue(field, v || undefined)}
                    immediate
                    className={inputClass}
                  />
                </Field>
              );
          }
        })}
    </>
  );
}
