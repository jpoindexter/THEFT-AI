"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, AlertTriangle, Database } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  SectionTitle,
  ButtonPrimary,
  Pill,
} from "@/components/ui/primitives";

const STEPS = [
  {
    label: "Connect access",
    body: "Provide a Supabase Service Role key for the project. Stored encrypted; agents never see the raw value.",
  },
  {
    label: "Detect environments",
    body: "We map your existing branches to staging + production. Engineer reads schema and existing migrations.",
  },
  {
    label: "Sync schema cache",
    body: "Engineer caches the table list, RLS policies, and types so it can write migrations safely.",
  },
  {
    label: "Verify connection",
    body: "Run a no-op migration on staging to confirm the round-trip.",
  },
];

export default function ImportSupabasePage() {
  const params = useParams<{ org: string }>();
  const [projectRef, setProjectRef] = useState("");
  const [serviceKey, setServiceKey] = useState("");
  const [stagingRef, setStagingRef] = useState("");
  const ready = !!projectRef && !!serviceKey;

  return (
    <>
      <Link
        href={`/${params.org}/settings/advanced`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3"
      >
        <ArrowLeft className="size-3" /> Back to advanced
      </Link>

      <Eyebrow>Advanced · Bring your own Supabase</Eyebrow>
      <PageTitle className="inline-flex items-center gap-2">
        <Database className="size-5 text-ink-muted" /> Import Supabase project
      </PageTitle>
      <Hint>
        Skip the managed Supabase and point THEFT at a project you already
        own. Useful when you have audit, compliance, or data-residency
        constraints.
      </Hint>

      <Card className="mt-5">
        <CardBody>
          <SectionTitle>Production project</SectionTitle>
          <Field label="Project ref">
            <input
              value={projectRef}
              onChange={(e) => setProjectRef(e.target.value)}
              placeholder="e.g. xyzcompany"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Service role key" hint="Stored encrypted. Never echoed back.">
            <input
              type="password"
              value={serviceKey}
              onChange={(e) => setServiceKey(e.target.value)}
              placeholder="eyJhbGciOi…"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <SectionTitle>Staging project (optional)</SectionTitle>
          <Hint>
            Recommended. The Engineer applies + verifies migrations here before
            promoting to production.
          </Hint>
          <Field label="Project ref">
            <input
              value={stagingRef}
              onChange={(e) => setStagingRef(e.target.value)}
              placeholder="e.g. xyzcompany-staging"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
        </CardBody>
      </Card>

      <Card className="mt-4">
        <CardBody>
          <SectionTitle>What happens after import</SectionTitle>
          <ol className="space-y-2 mt-2">
            {STEPS.map((s, i) => (
              <li key={i} className="flex items-start gap-3 text-sm">
                <span className="size-5 rounded-full border border-line text-2xs text-ink-muted inline-flex items-center justify-center shrink-0 mt-0.5">
                  {i + 1}
                </span>
                <div>
                  <div className="font-medium tracking-tight">{s.label}</div>
                  <div className="text-xs text-ink-muted">{s.body}</div>
                </div>
              </li>
            ))}
          </ol>
        </CardBody>
      </Card>

      <Card className="mt-4 border-mustard/40 bg-mustard/15">
        <CardBody>
          <div className="text-mustard-ink inline-flex items-center gap-1 text-xs">
            <AlertTriangle className="size-3" />
            One-way for the first import
          </div>
          <Hint className="text-mustard-ink/80">
            Engineer treats this project as the source of truth after import.
            Migrations apply against your project. If something goes wrong,
            roll back via the migration history, not the workspace.
          </Hint>
          <div className="mt-2">
            <Pill tone="mustard">Backups recommended before first run</Pill>
          </div>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2 mt-5">
        <Link
          href={`/${params.org}/settings/advanced`}
          className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
        >
          Cancel
        </Link>
        <ButtonPrimary disabled={!ready}>Connect project</ButtonPrimary>
      </div>
    </>
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
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}
