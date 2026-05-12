"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CheckSquare } from "lucide-react";

const STAGES = [
  "Provisioning workspace",
  "Hiring department agents",
  "Wiring built-in integrations",
  "Drafting business plan",
  "Generating tech tree",
];

export default function OnboardingDonePage() {
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const [org, setOrg] = useState("workspace");

  useEffect(() => {
    if (step >= STAGES.length) {
      setDone(true);
      return;
    }
    const t = setTimeout(() => setStep(step + 1), 700);
    return () => clearTimeout(t);
  }, [step]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    void fetch("/api/organizations")
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { organizations?: { slug: string }[] } | null) => {
        if (j?.organizations?.[0]?.slug) setOrg(j.organizations[0].slug);
      })
      .catch(() => undefined);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-canvas">
      <div className="max-w-md w-full px-6 space-y-6">
        <CrossStitchBadge />
        <header className="text-center">
          <h1 className="text-2xl tracking-tight">
            {done ? "Workspace ready" : "Setting up your workspace…"}
          </h1>
          <p className="text-base text-ink-muted mt-1">
            {done
              ? "Operator and the department agents are ready."
              : "This usually takes about 30 seconds."}
          </p>
        </header>

        <ul className="rounded-lg border border-line/70 bg-paper divide-y divide-line/60">
          {STAGES.map((s, i) => (
            <li key={s} className="px-4 py-3 flex items-center gap-3">
              <span
                className={`size-4 rounded-full inline-flex items-center justify-center text-2xs ${
                  i < step
                    ? "bg-sage text-paper"
                    : i === step
                      ? "bg-ink text-paper animate-pulse"
                      : "bg-line text-ink-soft"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </span>
              <span
                className={`text-base ${
                  i <= step ? "text-ink" : "text-ink-soft"
                }`}
              >
                {s}
              </span>
            </li>
          ))}
        </ul>

        {done && (
          <div className="text-center">
            <Link
              href={`/${org}`}
              className="inline-block rounded-md bg-ink text-paper px-4 py-2 text-base"
            >
              Enter workspace →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function CrossStitchBadge() {
  return (
    <div className="mx-auto size-16 rounded-lg border border-line/70 bg-paper inline-flex items-center justify-center">
      <CheckSquare className="size-7 text-ink-muted" />
    </div>
  );
}
