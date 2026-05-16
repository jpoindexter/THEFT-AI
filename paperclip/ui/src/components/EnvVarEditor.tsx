import { useEffect, useRef, useState } from "react";
import type { CompanySecret, EnvBinding } from "@paperclipai/shared";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const inputClass =
  "h-8 w-full font-mono text-sm shadow-none placeholder:text-muted-foreground/40";
const NO_SECRET_VALUE = "__paperclip_no_secret__";

type Row = {
  key: string;
  source: "plain" | "secret";
  plainValue: string;
  secretId: string;
};

function toRows(rec: Record<string, EnvBinding> | null | undefined): Row[] {
  if (!rec || typeof rec !== "object") {
    return [{ key: "", source: "plain", plainValue: "", secretId: "" }];
  }
  const entries = Object.entries(rec).map(([key, binding]) => {
    if (typeof binding === "string") {
      return { key, source: "plain" as const, plainValue: binding, secretId: "" };
    }
    if (
      typeof binding === "object" &&
      binding !== null &&
      "type" in binding &&
      (binding as { type?: unknown }).type === "secret_ref"
    ) {
      const record = binding as { secretId?: unknown };
      return {
        key,
        source: "secret" as const,
        plainValue: "",
        secretId: typeof record.secretId === "string" ? record.secretId : "",
      };
    }
    if (
      typeof binding === "object" &&
      binding !== null &&
      "type" in binding &&
      (binding as { type?: unknown }).type === "plain"
    ) {
      const record = binding as { value?: unknown };
      return {
        key,
        source: "plain" as const,
        plainValue: typeof record.value === "string" ? record.value : "",
        secretId: "",
      };
    }
    return { key, source: "plain" as const, plainValue: "", secretId: "" };
  });
  return [...entries, { key: "", source: "plain", plainValue: "", secretId: "" }];
}

export function EnvVarEditor({
  value,
  secrets,
  onCreateSecret,
  onChange,
}: {
  value: Record<string, EnvBinding>;
  secrets: CompanySecret[];
  onCreateSecret: (name: string, value: string) => Promise<CompanySecret>;
  onChange: (env: Record<string, EnvBinding> | undefined) => void;
}) {
  const [rows, setRows] = useState<Row[]>(() => toRows(value));
  const [sealError, setSealError] = useState<string | null>(null);
  const valueRef = useRef(value);
  const emittingRef = useRef(false);

  useEffect(() => {
    if (emittingRef.current) {
      emittingRef.current = false;
      valueRef.current = value;
      return;
    }
    if (value !== valueRef.current) {
      valueRef.current = value;
      setRows(toRows(value));
    }
  }, [value]);

  function emit(nextRows: Row[]) {
    const rec: Record<string, EnvBinding> = {};
    for (const row of nextRows) {
      const key = row.key.trim();
      if (!key) continue;
      if (row.source === "secret") {
        if (row.secretId) {
          rec[key] = { type: "secret_ref", secretId: row.secretId, version: "latest" };
        } else {
          rec[key] = { type: "plain", value: row.plainValue };
        }
      } else {
        rec[key] = { type: "plain", value: row.plainValue };
      }
    }
    emittingRef.current = true;
    onChange(Object.keys(rec).length > 0 ? rec : undefined);
  }

  function updateRow(index: number, patch: Partial<Row>) {
    const withPatch = rows.map((row, rowIndex) => (rowIndex === index ? { ...row, ...patch } : row));
    if (
      withPatch[withPatch.length - 1].key ||
      withPatch[withPatch.length - 1].plainValue ||
      withPatch[withPatch.length - 1].secretId
    ) {
      withPatch.push({ key: "", source: "plain", plainValue: "", secretId: "" });
    }
    setRows(withPatch);
    emit(withPatch);
  }

  function removeRow(index: number) {
    const next = rows.filter((_, rowIndex) => rowIndex !== index);
    if (
      next.length === 0 ||
      next[next.length - 1].key ||
      next[next.length - 1].plainValue ||
      next[next.length - 1].secretId
    ) {
      next.push({ key: "", source: "plain", plainValue: "", secretId: "" });
    }
    setRows(next);
    emit(next);
  }

  function defaultSecretName(key: string) {
    return key
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 64);
  }

  async function sealRow(index: number) {
    const row = rows[index];
    if (!row) return;
    const key = row.key.trim();
    const plain = row.plainValue;
    if (!key || plain.length === 0) return;

    const suggested = defaultSecretName(key) || "secret";
    const name = window.prompt("Secret name", suggested)?.trim();
    if (!name) return;

    try {
      setSealError(null);
      const created = await onCreateSecret(name, plain);
      updateRow(index, { source: "secret", secretId: created.id });
    } catch (error) {
      setSealError(error instanceof Error ? error.message : "Failed to create secret");
    }
  }

  return (
    <div className="space-y-1.5">
      {rows.map((row, index) => {
        const isTrailing =
          index === rows.length - 1 &&
          !row.key &&
          !row.plainValue &&
          !row.secretId;
        return (
          <div key={index} className="grid grid-cols-12 items-center gap-2">
            <Input
              className={`${inputClass} col-span-3 min-w-0`}
              placeholder="KEY"
              value={row.key}
              onChange={(event) => updateRow(index, { key: event.target.value })}
            />
            <Select
              value={row.source}
              onValueChange={(value) =>
                updateRow(index, {
                  source: value === "secret" ? "secret" : "plain",
                  ...(value === "plain" ? { secretId: "" } : {}),
                })
              }
            >
              <SelectTrigger className={`${inputClass} col-span-2 min-w-0 bg-background`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="plain">Plain</SelectItem>
                <SelectItem value="secret">Secret</SelectItem>
              </SelectContent>
            </Select>
            {row.source === "secret" ? (
              <>
                <Select
                  value={row.secretId || NO_SECRET_VALUE}
                  onValueChange={(value) =>
                    updateRow(index, {
                      secretId: value === NO_SECRET_VALUE ? "" : value,
                    })
                  }
                >
                  <SelectTrigger className={`${inputClass} col-span-5 min-w-0 bg-background`}>
                    <SelectValue placeholder="Select secret..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NO_SECRET_VALUE}>Select secret...</SelectItem>
                    {secrets.map((secret) => (
                      <SelectItem key={secret.id} value={secret.id}>
                        {secret.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="col-span-1 text-muted-foreground"
                  onClick={() => sealRow(index)}
                  disabled={!row.key.trim() || !row.plainValue}
                  title="Create secret from current plain value"
                >
                  New
                </Button>
              </>
            ) : (
              <>
                <Input
                  className={`${inputClass} col-span-5 min-w-0`}
                  placeholder="value"
                  value={row.plainValue}
                  onChange={(event) => updateRow(index, { plainValue: event.target.value })}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="xs"
                  className="col-span-1 text-muted-foreground"
                  onClick={() => sealRow(index)}
                  disabled={!row.key.trim() || !row.plainValue}
                  title="Store value as secret and replace with reference"
                >
                  Seal
                </Button>
              </>
            )}
            {!isTrailing ? (
              <Button
                type="button"
                variant="ghost"
                size="icon-xs"
                className="col-span-1 justify-self-end text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => removeRow(index)}
                aria-label={`Remove ${row.key || "environment variable"}`}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            ) : (
              <div className="col-span-1 size-6 justify-self-end" />
            )}
          </div>
        );
      })}
      {sealError && <p className="text-micro text-destructive">{sealError}</p>}
      <p className="text-micro text-muted-foreground/60">
        PAPERCLIP_* variables are injected automatically at runtime.
      </p>
    </div>
  );
}
