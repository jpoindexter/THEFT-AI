import type { AdapterConfigSchema, ConfigFieldSchema, CreateConfigValues } from "@paperclipai/adapter-utils";

import type { ComboboxOption } from "./schema-config-field-controls";

export function getDefaultValue(field: ConfigFieldSchema): unknown {
  if (field.default !== undefined) return field.default;
  switch (field.type) {
    case "toggle":
      return false;
    case "number":
      return 0;
    case "text":
    case "textarea":
      return "";
    case "select":
      return field.options?.[0]?.value ?? "";
  }
}

export function fieldMatchesVisibleWhen(
  field: ConfigFieldSchema,
  readValue: (field: ConfigFieldSchema) => unknown,
  schema: AdapterConfigSchema,
): boolean {
  const visibleWhen = field.meta?.visibleWhen;
  if (!visibleWhen || typeof visibleWhen !== "object" || Array.isArray(visibleWhen)) return true;

  const condition = visibleWhen as {
    key?: unknown;
    value?: unknown;
    values?: unknown;
    notValues?: unknown;
  };
  if (typeof condition.key !== "string" || condition.key.length === 0) return true;

  const sourceField = schema.fields.find((candidate) => candidate.key === condition.key);
  if (!sourceField) return true;

  const actual = String(readValue(sourceField) ?? "");
  if (typeof condition.value === "string") return actual === condition.value;
  if (Array.isArray(condition.values)) {
    const values = condition.values.filter((value): value is string => typeof value === "string");
    return values.length > 0 && values.includes(actual);
  }
  if (Array.isArray(condition.notValues)) {
    const values = condition.notValues.filter((value): value is string => typeof value === "string");
    return !values.includes(actual);
  }
  return true;
}

export function getSchemaComboboxOptions(
  field: ConfigFieldSchema,
  schema: AdapterConfigSchema,
  readValue: (field: ConfigFieldSchema) => unknown,
): ComboboxOption[] {
  if (!field.meta?.providerModels) return field.options ?? [];

  const providerField = schema.fields.find((f) => f.key === "provider");
  const providerVal = String(providerField ? readValue(providerField) : "auto");
  const modelsByProvider = field.meta.providerModels as Record<string, string[]>;
  const providerOptions = providerField?.options ?? [];

  if (providerVal === "auto") {
    return Object.entries(modelsByProvider).flatMap(([provider, models]) =>
      models.map((model) => ({
        label: model,
        value: model,
        group: providerOptions.find((option) => option.value === provider)?.label ?? provider,
      })),
    );
  }

  const providerModels = modelsByProvider[providerVal] ?? [];
  const providerName = providerOptions.find((option) => option.value === providerVal)?.label ?? providerVal;
  return providerModels.map((model) => ({
    label: model,
    value: model,
    group: providerName,
  }));
}

export function buildSchemaAdapterConfig(
  values: CreateConfigValues,
): Record<string, unknown> {
  const ac: Record<string, unknown> = {};

  if (values.model?.trim()) ac.model = values.model.trim();
  if (values.cwd) ac.cwd = values.cwd;
  if (values.command) ac.command = values.command;
  if (values.instructionsFilePath) ac.instructionsFilePath = values.instructionsFilePath;
  if (values.thinkingEffort) ac.thinkingEffort = values.thinkingEffort;

  if (values.extraArgs) {
    ac.extraArgs = values.extraArgs
      .split(/\s+/)
      .filter(Boolean);
  }

  if (values.adapterSchemaValues) {
    Object.assign(ac, values.adapterSchemaValues);
  }

  return ac;
}
