"use client";

import { useState } from "react";
import { Trash2, Plus, Mail, Phone, Globe } from "lucide-react";

const SIGN_IN_METHODS = [
  { label: "Email", sub: "Sign in with email and password", Icon: Mail },
  { label: "Phone", sub: "Sign in with phone number", Icon: Phone },
  { label: "Google", sub: "Sign in with Google", Icon: Globe },
];

export default function AuthPage() {
  const [siteUrl, setSiteUrl] = useState("");
  const [redirectUrls, setRedirectUrls] = useState<string[]>([""]);
  const [disableSignup, setDisableSignup] = useState(false);
  const [allowAnon, setAllowAnon] = useState(false);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-lg font-medium tracking-tight">Authentication</h1>
        <p className="text-sm text-ink-muted">
          Configure sign in, redirects, and auth providers.
        </p>
      </header>

      <section className="rounded-lg border border-line/70 bg-paper p-5 space-y-4">
        <div>
          <div className="text-base font-medium text-ink">General Settings</div>
          <p className="text-xs text-ink-muted mt-0.5">Allow people to sign up to your app.</p>
        </div>
        <div className="space-y-3">
          <ToggleRow
            label="Disable Signup"
            sub="This will prevent new users from signing up."
            value={disableSignup}
            onChange={setDisableSignup}
          />
          <ToggleRow
            label="Allow Anonymous Sign-ins"
            sub="This will enable anonymous users to sign in to your application."
            value={allowAnon}
            onChange={setAllowAnon}
          />
        </div>
        <button
          type="button"
          className="rounded-md bg-ink text-paper text-sm px-3 py-1.5 hover:opacity-90"
        >
          Save
        </button>
      </section>

      <section className="rounded-lg border border-line/70 bg-paper p-5 space-y-4">
        <div>
          <div className="text-base font-medium text-ink">Application URLs</div>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure the base site URL and the redirect URLs Supabase can send people back to after sign-in, sign-up, and recovery flows.
          </p>
        </div>

        <div>
          <div className="text-sm font-medium text-ink mb-1">Site URL</div>
          <p className="text-xs text-ink-muted mb-1.5">
            The base URL for your app. Supabase uses this for auth emails and default callback links.
          </p>
          <input
            value={siteUrl}
            onChange={(e) => setSiteUrl(e.target.value)}
            placeholder="https://your-app.vercel.app"
            className="w-full rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm focus:outline-none focus:border-line-strong"
          />
        </div>

        <div>
          <div className="text-sm font-medium text-ink mb-1">Redirect URLs</div>
          <p className="text-xs text-ink-muted mb-1.5">
            Add allowed redirect URLs one per row. Empty rows are ignored and duplicate URLs are removed when you save.
          </p>
          <div className="space-y-1.5">
            {redirectUrls.map((url, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <input
                  value={url}
                  onChange={(e) => {
                    const next = [...redirectUrls];
                    next[i] = e.target.value;
                    setRedirectUrls(next);
                  }}
                  placeholder="https://your-app.vercel.app/auth/callback"
                  className="flex-1 rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm focus:outline-none focus:border-line-strong"
                />
                <button
                  type="button"
                  onClick={() => setRedirectUrls((r) => r.filter((_, j) => j !== i))}
                  className="text-ink-soft hover:text-ink"
                  aria-label="Remove"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setRedirectUrls((r) => [...r, ""])}
            className="mt-2 inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
          >
            <Plus className="size-3" />
            Add redirect URL
          </button>
        </div>

        <button
          type="button"
          className="rounded-md bg-ink text-paper text-sm px-3 py-1.5 hover:opacity-90"
        >
          Save
        </button>
      </section>

      <section className="rounded-lg border border-line/70 bg-paper p-5 space-y-3">
        <div>
          <div className="text-base font-medium text-ink">Sign in methods</div>
          <p className="text-xs text-ink-muted mt-0.5">Configure how people sign in and up to your app.</p>
        </div>
        <ul className="divide-y divide-line/70">
          {SIGN_IN_METHODS.map((m) => (
            <li key={m.label} className="flex items-center justify-between py-2.5">
              <div className="flex items-center gap-3">
                <div className="size-7 rounded border border-line/70 inline-flex items-center justify-center">
                  <m.Icon className="size-3.5 text-ink-muted" />
                </div>
                <div>
                  <div className="text-sm text-ink">{m.label}</div>
                  <div className="text-xs text-ink-muted">{m.sub}</div>
                </div>
              </div>
              <span className="text-ink-soft">›</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ToggleRow({
  label,
  sub,
  value,
  onChange,
}: {
  label: string;
  sub: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm text-ink">{label}</div>
        <div className="text-xs text-ink-muted mt-0.5">{sub}</div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!value)}
        className={`relative inline-flex h-5 w-9 shrink-0 rounded-full transition-colors ${
          value ? "bg-ink" : "bg-line"
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`inline-block size-4 rounded-full bg-paper shadow transition-transform mt-0.5 ${
            value ? "translate-x-4.5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
