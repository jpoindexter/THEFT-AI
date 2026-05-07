"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const AUTH_KINDS = [
  { id: "bearer", label: "Bearer token" },
  { id: "api_key", label: "API key (header)" },
  { id: "basic", label: "Basic auth" },
  { id: "oauth2", label: "OAuth 2.0" },
];

export default function NewIntegrationPage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [baseUrl, setBaseUrl] = useState("");
  const [auth, setAuth] = useState("bearer");
  const [secret, setSecret] = useState("");
  const [schema, setSchema] = useState(
    `{\n  "tools": [\n    {\n      "name": "search_records",\n      "description": "Search records by query",\n      "input_schema": {\n        "type": "object",\n        "properties": {\n          "q": { "type": "string" }\n        },\n        "required": ["q"]\n      }\n    }\n  ]\n}`,
  );

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <Link
          href={`/${params.org}/integrations`}
          className="inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to integrations
        </Link>

        <header>
          <h1 className="text-xl tracking-tight">New custom integration</h1>
          <p className="text-sm text-ink-muted">
            Wire any HTTP API into the agent runtime. Tools defined in the schema
            become callable by attached agents.
          </p>
        </header>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
          <Field label="Name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Encompass"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Base URL">
            <input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Auth">
            <select
              value={auth}
              onChange={(e) => setAuth(e.target.value)}
              className="w-full h-9 rounded-md border border-line bg-paper px-2 text-base"
            >
              {AUTH_KINDS.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.label}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Secret" hint="Stored encrypted. Never logged.">
            <input
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="••••••••"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
        </section>

        <section className="rounded-lg border border-line/70 bg-paper p-4 space-y-2">
          <div className="text-md font-medium tracking-tight">Schema</div>
          <p className="text-xs text-ink-muted">
            JSON Schema describing the tools agents can call. Each tool requires{" "}
            <code>name</code>, <code>description</code>, and{" "}
            <code>input_schema</code>.
          </p>
          <textarea
            value={schema}
            onChange={(e) => setSchema(e.target.value)}
            rows={14}
            className="w-full rounded-md border border-line bg-canvas px-3 py-2 text-sm font-mono focus:outline-none focus:border-line-strong"
          />
        </section>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!name || !baseUrl}
            className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 disabled:opacity-40"
          >
            Save integration
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-ink">{label}</div>
      {children}
      {hint && <p className="text-xs text-ink-muted">{hint}</p>}
    </div>
  );
}
