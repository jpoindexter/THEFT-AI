"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  SectionTitle,
  ButtonPrimary,
} from "@/components/ui/primitives";

const STEPS = [
  {
    label: "Connect repo",
    body: "Pick a GitHub repo we can read + push to. We'll add a deploy key and a workflow.",
  },
  {
    label: "Detect framework",
    body: "We'll scan package.json, supabase config, and migration history.",
  },
  {
    label: "Wire integrations",
    body: "Vercel project, Supabase project, Postmark sender — pointed at this repo.",
  },
  {
    label: "Run first preview",
    body: "Engineer opens a no-op PR to verify the round-trip.",
  },
];

export default function ImportRepoPage() {
  const params = useParams<{ org: string }>();
  const [repo, setRepo] = useState("");
  const [branch, setBranch] = useState("main");

  return (
    <>
      <Link
        href={`/${params.org}/settings/advanced`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3"
      >
        <ArrowLeft className="size-3" /> Back to advanced
      </Link>

      <Eyebrow>Advanced · Bring your own repo</Eyebrow>
      <PageTitle>Import an existing repo</PageTitle>
      <Hint>
        Skip the THEFT scaffold and point the Engineer at a repo you already
        have. Useful if you have hand-rolled patterns we'd otherwise overwrite.
      </Hint>

      <Card className="mt-5">
        <CardBody>
          <SectionTitle>Repo</SectionTitle>
          <Field label="GitHub repo (owner/name)">
            <input
              value={repo}
              onChange={(e) => setRepo(e.target.value)}
              placeholder="acme/loan-app"
              className="w-full h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
          <Field label="Default branch">
            <input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="w-32 h-9 rounded-md border border-line bg-paper px-3 text-base font-mono focus:outline-none focus:border-line-strong"
            />
          </Field>
        </CardBody>
      </Card>

      <Card className="mt-5">
        <CardBody>
          <SectionTitle>What happens next</SectionTitle>
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

      <Card className="mt-5 border-mustard/40 bg-mustard/15">
        <CardBody>
          <div className="text-mustard-ink inline-flex items-center gap-1 text-xs">
            <AlertTriangle className="size-3" />
            One-way for the first import
          </div>
          <Hint className="text-mustard-ink/80">
            We won't overwrite files in the repo without an Engineer PR. But
            once connected, the workspace assumes this repo is the source of
            truth — there's no rollback to the THEFT scaffold.
          </Hint>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2 mt-5">
        <Link
          href={`/${params.org}/settings/advanced`}
          className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
        >
          Cancel
        </Link>
        <ButtonPrimary disabled={!repo}>Connect repo</ButtonPrimary>
      </div>
    </>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-ink">{label}</div>
      {children}
    </div>
  );
}

