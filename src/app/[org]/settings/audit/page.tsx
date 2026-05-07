"use client";

import { useState } from "react";
import {
  SectionHeader,
  SettingsCard,
  Row,
} from "@/components/settings/section";
import { Switch } from "@/components/ui/switch";
import { ButtonPrimary, Hint, Pill } from "@/components/ui/primitives";
import { ScrollText, Download } from "lucide-react";
import { toast } from "@/components/toast-host";

const RETENTION = [
  { days: 30, label: "30 days", note: "Default — fits most teams" },
  { days: 180, label: "180 days", note: "Recommended for compliance reviews" },
  { days: 365, label: "1 year", note: "SOC 2 minimum" },
  { days: 1825, label: "5 years", note: "HIPAA / financial workflows" },
];

const EVENTS = [
  { key: "auth", label: "Sign-in / sign-out", default: true },
  { key: "memory", label: "Memory writes", default: true },
  { key: "approvals", label: "Approval decisions", default: true },
  { key: "agent_runs", label: "Agent runs (turn-level)", default: true },
  { key: "tool_calls", label: "Tool calls (verbose)", default: false },
  { key: "billing", label: "Billing changes", default: true },
];

export default function AuditSettings() {
  const [days, setDays] = useState(180);
  const [bucket, setBucket] = useState<"local" | "s3">("local");

  return (
    <>
      <SectionHeader
        title="Audit log"
        description="What gets recorded, how long it lives, and where it ships."
      />

      <SettingsCard
        title="Retention"
        description="Audit events are immutable for the retention window. Older events are pruned daily."
      >
        <ul className="grid grid-cols-2 gap-2">
          {RETENTION.map((r) => (
            <li key={r.days}>
              <button
                onClick={() => setDays(r.days)}
                className={`w-full text-left rounded-md border p-3 text-sm transition-colors ${
                  days === r.days
                    ? "border-ink bg-ink/5"
                    : "border-line/70 bg-paper hover:border-line-strong"
                }`}
              >
                <div className="font-medium tracking-tight">{r.label}</div>
                <div className="text-xs text-ink-muted">{r.note}</div>
              </button>
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Recorded events"
        description="Toggle which event categories land in the log."
      >
        <ul className="divide-y divide-line/60">
          {EVENTS.map((e) => (
            <li
              key={e.key}
              className="py-2 flex items-center justify-between text-sm"
            >
              <span>{e.label}</span>
              <Switch defaultChecked={e.default} />
            </li>
          ))}
        </ul>
      </SettingsCard>

      <SettingsCard
        title="Export & forwarding"
        description="Stream audit events to your SIEM or download a signed JSONL bundle."
      >
        <Row
          label="Destination"
          hint="Local stores in this workspace's bucket. S3 streams to your AWS account via assume-role."
        >
          <div className="inline-flex rounded-md border border-line bg-paper text-xs">
            {(["local", "s3"] as const).map((b) => (
              <button
                key={b}
                onClick={() => setBucket(b)}
                className={`px-3 py-1 ${
                  bucket === b
                    ? "bg-ink text-paper rounded-md"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {b === "local" ? "Local" : "Amazon S3"}
              </button>
            ))}
          </div>
        </Row>

        {bucket === "s3" && (
          <div className="space-y-2 pt-1">
            <Field label="Bucket" placeholder="my-audit-bucket" />
            <Field label="Region" placeholder="us-east-1" />
            <Field label="IAM role ARN" placeholder="arn:aws:iam::…" />
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Pill tone="sage">{days}-day window</Pill>
          <button
            onClick={() => toast("Export started · 8MB", "info")}
            className="inline-flex items-center gap-1 text-xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
          >
            <Download className="size-3" /> Export now
          </button>
        </div>
      </SettingsCard>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Hint>Audit retention can be reduced once per 90 days.</Hint>
        <ButtonPrimary
          onClick={() => toast("Audit settings saved", "ok")}
          className="inline-flex items-center gap-1"
        >
          <ScrollText className="size-3.5" /> Save
        </ButtonPrimary>
      </div>
    </>
  );
}

function Field({
  label,
  placeholder,
}: {
  label: string;
  placeholder: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] text-ink-muted">{label}</label>
      <input
        placeholder={placeholder}
        className="w-full h-9 rounded-md border border-line bg-paper px-3 text-xs font-mono focus:outline-none focus:border-line-strong"
      />
    </div>
  );
}
