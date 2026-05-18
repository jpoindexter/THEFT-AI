import type { Dispatch, SetStateAction } from "react";
import type { JsonSchema } from "@paperclipai/shared";

import { Field } from "@/components/agent-config-primitives";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import type { EnvironmentFormState } from "./environment-model";
import { EnvironmentFormActions } from "./EnvironmentFormActions";
import {
  DriverField,
  SandboxFields,
  SshFields,
} from "./EnvironmentFormParts";

export type SandboxProvider = {
  provider: string;
  displayName: string;
  description?: string;
  configSchema: JsonSchema | null;
};

export type EnvironmentFormProps = {
  editingEnvironmentId: string | null;
  environmentForm: EnvironmentFormState;
  environmentFormValid: boolean;
  environmentMutation: { isPending: boolean; isError: boolean; error: unknown; mutate: (form: EnvironmentFormState) => void };
  draftEnvironmentProbeMutation: {
    isPending: boolean;
    data?: { ok: boolean; summary: string };
    mutate: (form: EnvironmentFormState) => void;
  };
  pluginSandboxProviders: SandboxProvider[];
  sandboxCreationEnabled: boolean;
  sandboxConfigErrors: Record<string, string>;
  secrets: Array<{ id: string; name: string }> | undefined;
  selectedSandboxProvider: SandboxProvider | null;
  selectedSandboxSchema: JsonSchema | null;
  setEnvironmentForm: Dispatch<SetStateAction<EnvironmentFormState>>;
  onCancel: () => void;
};

export function EnvironmentForm({
  editingEnvironmentId,
  environmentForm,
  environmentFormValid,
  environmentMutation,
  draftEnvironmentProbeMutation,
  pluginSandboxProviders,
  sandboxCreationEnabled,
  sandboxConfigErrors,
  secrets,
  selectedSandboxProvider,
  selectedSandboxSchema,
  setEnvironmentForm,
  onCancel,
}: EnvironmentFormProps) {
  return (
    <Card className="gap-4 py-4">
      <CardContent className="space-y-3 px-4">
        <div className="text-sm font-medium">{editingEnvironmentId ? "Edit environment" : "Add environment"}</div>
        <Field label="Name" hint="Operator-facing name for this execution target.">
          <Input value={environmentForm.name} onChange={(e) => updateForm(setEnvironmentForm, { name: e.target.value })} />
        </Field>
        <Field label="Description" hint="Optional note about what this machine is for.">
          <Input value={environmentForm.description} onChange={(e) => updateForm(setEnvironmentForm, { description: e.target.value })} />
        </Field>
        <DriverField
          environmentForm={environmentForm}
          sandboxCreationEnabled={sandboxCreationEnabled}
          pluginSandboxProviders={pluginSandboxProviders}
          setEnvironmentForm={setEnvironmentForm}
        />
        {environmentForm.driver === "ssh" ? (
          <SshFields environmentForm={environmentForm} secrets={secrets} setEnvironmentForm={setEnvironmentForm} />
        ) : null}
        {environmentForm.driver === "sandbox" ? (
          <SandboxFields
            environmentForm={environmentForm}
            pluginSandboxProviders={pluginSandboxProviders}
            sandboxConfigErrors={sandboxConfigErrors}
            selectedSandboxProvider={selectedSandboxProvider}
            selectedSandboxSchema={selectedSandboxSchema}
            setEnvironmentForm={setEnvironmentForm}
          />
        ) : null}
        <EnvironmentFormActions
          editingEnvironmentId={editingEnvironmentId}
          environmentForm={environmentForm}
          environmentFormValid={environmentFormValid}
          environmentMutation={environmentMutation}
          draftEnvironmentProbeMutation={draftEnvironmentProbeMutation}
          onCancel={onCancel}
        />
      </CardContent>
    </Card>
  );
}

function updateForm(
  setEnvironmentForm: Dispatch<SetStateAction<EnvironmentFormState>>,
  patch: Partial<EnvironmentFormState>,
) {
  setEnvironmentForm((current) => ({ ...current, ...patch }));
}
