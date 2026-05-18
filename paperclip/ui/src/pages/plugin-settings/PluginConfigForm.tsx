import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

import { pluginsApi } from "@/api/plugins";
import { Button } from "@/components/ui/button";
import {
  getDefaultValues,
  JsonSchemaForm,
  validateJsonSchemaForm,
  type JsonSchemaNode,
} from "@/components/JsonSchemaForm";
import { queryKeys } from "@/lib/queryKeys";

interface PluginConfigFormProps {
  pluginId: string;
  schema: JsonSchemaNode;
  initialValues?: Record<string, unknown>;
  isLoading?: boolean;
  pluginStatus?: string;
  supportsConfigTest?: boolean;
}

export function PluginConfigForm({
  pluginId,
  schema,
  initialValues,
  isLoading,
  pluginStatus,
  supportsConfigTest,
}: PluginConfigFormProps) {
  const queryClient = useQueryClient();
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...getDefaultValues(schema),
    ...(initialValues ?? {}),
  }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveMessage, setSaveMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [testResult, setTestResult] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const hasHydratedRef = useRef(false);

  useEffect(() => {
    if (initialValues && !hasHydratedRef.current) {
      hasHydratedRef.current = true;
      setValues({
        ...getDefaultValues(schema),
        ...initialValues,
      });
    }
  }, [initialValues, schema]);

  const isDirty = JSON.stringify(values) !== JSON.stringify({
    ...getDefaultValues(schema),
    ...(initialValues ?? {}),
  });

  const saveMutation = useMutation({
    mutationFn: (configJson: Record<string, unknown>) =>
      pluginsApi.saveConfig(pluginId, configJson),
    onSuccess: () => {
      setSaveMessage({ type: "success", text: "Configuration saved." });
      setTestResult(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.plugins.config(pluginId) });
      setTimeout(() => setSaveMessage(null), 3000);
    },
    onError: (err: Error) => {
      setSaveMessage({ type: "error", text: err.message || "Failed to save configuration." });
    },
  });

  const testMutation = useMutation({
    mutationFn: (configJson: Record<string, unknown>) =>
      pluginsApi.testConfig(pluginId, configJson),
    onSuccess: (result) => {
      setTestResult(
        result.valid
          ? { type: "success", text: "Configuration test passed." }
          : { type: "error", text: result.message || "Configuration test failed." },
      );
    },
    onError: (err: Error) => {
      setTestResult({ type: "error", text: err.message || "Configuration test failed." });
    },
  });

  const handleChange = useCallback((newValues: Record<string, unknown>) => {
    setValues(newValues);
    setErrors({});
    setSaveMessage(null);
  }, []);

  const handleSave = useCallback(() => {
    const validationErrors = validateJsonSchemaForm(schema, values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    saveMutation.mutate(values);
  }, [schema, values, saveMutation]);

  const handleTestConnection = useCallback(() => {
    const validationErrors = validateJsonSchemaForm(schema, values);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    setErrors({});
    setTestResult(null);
    testMutation.mutate(values);
  }, [schema, values, testMutation]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading configuration...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <JsonSchemaForm
        schema={schema}
        values={values}
        onChange={handleChange}
        errors={errors}
        disabled={saveMutation.isPending}
      />

      <FormMessage message={saveMessage} />
      <FormMessage message={testResult} />

      <div className="flex items-center gap-2 pt-2">
        <Button
          onClick={handleSave}
          disabled={saveMutation.isPending || !isDirty}
          size="sm"
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Saving...
            </>
          ) : (
            "Save Configuration"
          )}
        </Button>
        {pluginStatus === "ready" && supportsConfigTest ? (
          <Button
            variant="outline"
            onClick={handleTestConnection}
            disabled={testMutation.isPending}
            size="sm"
          >
            {testMutation.isPending ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Configuration"
            )}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

function FormMessage({ message }: { message: { type: "success" | "error"; text: string } | null }) {
  if (!message) return null;

  return (
    <div
      className={`rounded border p-2 text-sm ${
        message.type === "success"
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-400"
          : "border-destructive/20 bg-destructive/10 text-destructive"
      }`}
    >
      {message.text}
    </div>
  );
}
