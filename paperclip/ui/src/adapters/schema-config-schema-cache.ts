import { useEffect, useState } from "react";

import type { AdapterConfigSchema } from "@paperclipai/adapter-utils";

const schemaCache = new Map<string, AdapterConfigSchema | null>();
const schemaFetchInflight = new Map<string, Promise<AdapterConfigSchema | null>>();
const failedSchemaTypes = new Set<string>();

async function fetchConfigSchema(adapterType: string): Promise<AdapterConfigSchema | null> {
  const cached = schemaCache.get(adapterType);
  if (cached !== undefined) return cached;
  if (failedSchemaTypes.has(adapterType)) return null;

  const inflight = schemaFetchInflight.get(adapterType);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const res = await fetch(`/api/adapters/${encodeURIComponent(adapterType)}/config-schema`);
      if (!res.ok) {
        failedSchemaTypes.add(adapterType);
        return null;
      }
      const schema = (await res.json()) as AdapterConfigSchema;
      schemaCache.set(adapterType, schema);
      return schema;
    } catch {
      failedSchemaTypes.add(adapterType);
      return null;
    } finally {
      schemaFetchInflight.delete(adapterType);
    }
  })();

  schemaFetchInflight.set(adapterType, promise);
  return promise;
}

export function invalidateConfigSchemaCache(adapterType: string): void {
  schemaCache.delete(adapterType);
  failedSchemaTypes.delete(adapterType);
}

export function useConfigSchema(adapterType: string): AdapterConfigSchema | null {
  const [schema, setSchema] = useState<AdapterConfigSchema | null>(
    schemaCache.get(adapterType) ?? null,
  );

  useEffect(() => {
    let cancelled = false;
    fetchConfigSchema(adapterType).then((s) => {
      if (!cancelled) setSchema(s);
    });
    return () => {
      cancelled = true;
    };
  }, [adapterType]);

  return schema;
}
