"use client";

import { useState } from "react";
import {
  SectionHeader,
  SettingsCard,
  Row,
} from "@/components/settings/section";
import { Switch } from "@/components/ui/switch";
import { Pill, ButtonPrimary, Hint } from "@/components/ui/primitives";
import { KeyRound, Copy, Check } from "lucide-react";
import { toast } from "@/components/toast-host";

type Protocol = "saml" | "oidc";

export default function SsoSettings() {
  const [protocol, setProtocol] = useState<Protocol>("saml");
  const [enforced, setEnforced] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  function copy(label: string, value: string) {
    void navigator.clipboard.writeText(value);
    setCopied(label);
    toast(`${label} copied`, "ok");
    window.setTimeout(() => setCopied(null), 1200);
  }

  return (
    <>
      <SectionHeader
        title="Single sign-on"
        description="Enforce identity-provider authentication for your team. SAML and OIDC supported."
      />

      <SettingsCard>
        <Row
          label="Status"
          hint="SSO is configured but not yet enforced. Test with one user before turning on enforcement."
        >
          <Pill tone={enforced ? "sage" : "mustard"}>
            {enforced ? "Enforced" : "Test mode"}
          </Pill>
        </Row>
        <Row
          label="Enforce SSO for all members"
          hint="Once on, password and magic-link sign-in are disabled for everyone except the workspace founder."
        >
          <Switch checked={enforced} onCheckedChange={setEnforced} />
        </Row>
        <Row
          label="Protocol"
          hint="Pick the protocol your IdP supports. Most enterprise IdPs support both."
        >
          <div className="inline-flex rounded-md border border-line bg-paper text-xs">
            {(["saml", "oidc"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={`px-3 py-1 ${
                  protocol === p
                    ? "bg-ink text-paper rounded-md"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {p.toUpperCase()}
              </button>
            ))}
          </div>
        </Row>
      </SettingsCard>

      {protocol === "saml" ? (
        <SettingsCard
          title="SAML 2.0"
          description="Paste these into your IdP (Okta, Entra ID, Google, JumpCloud)."
        >
          <ConfigRow
            label="ACS URL"
            value="https://app.theft.ai/sso/saml/acs/encompass-design"
            copied={copied === "ACS URL"}
            onCopy={(v) => copy("ACS URL", v)}
          />
          <ConfigRow
            label="Entity ID"
            value="urn:theft.ai:encompass-design"
            copied={copied === "Entity ID"}
            onCopy={(v) => copy("Entity ID", v)}
          />
          <ConfigRow
            label="SP metadata"
            value="https://app.theft.ai/sso/saml/metadata/encompass-design.xml"
            copied={copied === "SP metadata"}
            onCopy={(v) => copy("SP metadata", v)}
          />

          <div className="space-y-1 pt-2">
            <label className="text-[12px] text-ink-muted">
              IdP metadata XML (paste here)
            </label>
            <textarea
              rows={6}
              placeholder="<?xml version='1.0'?>..."
              className="w-full rounded-md border border-line bg-paper p-2 text-xs font-mono focus:outline-none focus:border-line-strong"
            />
          </div>
        </SettingsCard>
      ) : (
        <SettingsCard
          title="OpenID Connect"
          description="Configure an OIDC client at your IdP and paste credentials here."
        >
          <ConfigRow
            label="Redirect URI"
            value="https://app.theft.ai/sso/oidc/callback/encompass-design"
            copied={copied === "Redirect URI"}
            onCopy={(v) => copy("Redirect URI", v)}
          />
          <Field label="Issuer URL" placeholder="https://login.example.com" />
          <Field label="Client ID" placeholder="client_xxx" />
          <Field
            label="Client secret"
            placeholder="••••••••"
            type="password"
          />
        </SettingsCard>
      )}

      <SettingsCard
        title="Group → role mapping"
        description="Map IdP groups to roles inside this workspace."
      >
        <ul className="divide-y divide-line/60">
          {[
            { group: "theft-engineering", role: "editor" },
            { group: "theft-finance", role: "admin" },
            { group: "theft-readonly", role: "viewer" },
          ].map((m) => (
            <li
              key={m.group}
              className="py-2 flex items-center justify-between text-sm"
            >
              <span className="font-mono text-xs">{m.group}</span>
              <span className="inline-flex items-center gap-1 text-xs">
                <span className="text-ink-muted">→</span>
                <Pill tone="neutral">{m.role}</Pill>
              </span>
            </li>
          ))}
        </ul>
        <button className="mt-2 text-[11px] rounded-md border border-line px-2 py-1 hover:border-line-strong">
          + Add mapping
        </button>
      </SettingsCard>

      <div className="flex items-center justify-end gap-2 pt-2">
        <Hint>Changes apply on next sign-in.</Hint>
        <ButtonPrimary
          onClick={() => toast("SSO config saved", "ok")}
          className="inline-flex items-center gap-1"
        >
          <KeyRound className="size-3.5" /> Save
        </ButtonPrimary>
      </div>
    </>
  );
}

function ConfigRow({
  label,
  value,
  copied,
  onCopy,
}: {
  label: string;
  value: string;
  copied: boolean;
  onCopy: (v: string) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0 flex-1">
        <div className="text-[12px] text-ink-muted">{label}</div>
        <div className="text-xs font-mono truncate">{value}</div>
      </div>
      <button
        onClick={() => onCopy(value)}
        className="inline-flex items-center gap-1 text-2xs rounded-md border border-line bg-paper px-2 py-1 hover:border-line-strong"
      >
        {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}

function Field({
  label,
  placeholder,
  type = "text",
}: {
  label: string;
  placeholder: string;
  type?: string;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[12px] text-ink-muted">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        className="w-full h-9 rounded-md border border-line bg-paper px-3 text-xs font-mono focus:outline-none focus:border-line-strong"
      />
    </div>
  );
}
