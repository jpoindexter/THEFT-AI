"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Mail, ArrowRight, Code2, Globe, Wrench } from "lucide-react";

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [devBusy, setDevBusy] = useState(false);

  async function send() {
    if (!email.includes("@")) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      router.push("/signin/sent");
    }, 600);
  }

  async function devLogin() {
    setDevBusy(true);
    const res = await fetch("/api/dev-login", { method: "POST" });
    const j = (await res.json()) as { redirect: string };
    router.replace(j.redirect);
  }

  return (
    <div className="min-h-screen bg-cream text-ink flex flex-col">
      <Header />
      <main className="flex-1 grid place-items-center px-4 py-10">
        <div className="w-full max-w-sm space-y-5">
          <header className="text-center space-y-1">
            <h1 className="text-xl tracking-tight">Sign in to THEFT</h1>
            <p className="text-xs text-ink-muted">
              We&apos;ll email you a one-time link. No passwords.
            </p>
          </header>

          <div className="rounded-lg border border-line/70 bg-paper p-4 space-y-3">
            <label className="space-y-1 block">
              <span className="text-sm">Work email</span>
              <input
                type="email"
                autoFocus
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="founder@company.com"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
              />
            </label>
            <button
              type="button"
              onClick={send}
              disabled={!email.includes("@") || busy}
              className="w-full inline-flex items-center justify-center gap-1 rounded-md bg-ink text-paper px-3 py-2 text-sm hover:opacity-90 disabled:opacity-40"
            >
              <Mail className="size-3.5" />
              {busy ? "Sending…" : "Send magic link"}
            </button>
          </div>

          <Divider />

          <div className="grid grid-cols-2 gap-2">
            <SsoButton Icon={Code2} label="Continue with GitHub" />
            <SsoButton Icon={Globe} label="Continue with Google" />
          </div>

          <p className="text-2xs text-ink-soft text-center">
            By continuing you agree to our{" "}
            <a className="underline" href="#">terms</a> and{" "}
            <a className="underline" href="#">privacy policy</a>.
          </p>

          {process.env.NODE_ENV !== "production" && (
            <div className="rounded-md border border-mustard/40 bg-mustard/15 p-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-mustard-ink">
                  <Wrench className="size-3.5" /> Dev mode
                </span>
                <button
                  type="button"
                  onClick={devLogin}
                  disabled={devBusy}
                  className="text-xs rounded-md bg-ink text-paper px-2 py-1 hover:opacity-90 disabled:opacity-40"
                >
                  {devBusy ? "Signing in…" : "Continue as dev"}
                </button>
              </div>
              <p className="text-2xs text-ink-muted mt-1">
                Skips the magic link, drops a dev cookie, and lands on the
                first workspace. Or bookmark{" "}
                <code className="font-mono">/dev</code>.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <div className="flex items-center justify-between p-4">
      <Link
        href="/"
        className="text-sm font-medium tracking-tight inline-flex items-center gap-2"
      >
        THEFT
      </Link>
      <Link
        href="/"
        className="text-xs text-ink-muted hover:text-ink inline-flex items-center gap-1"
      >
        Back home <ArrowRight className="size-3" />
      </Link>
    </div>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-2 text-2xs text-ink-soft uppercase tracking-wider">
      <span className="flex-1 h-px bg-line" />
      or
      <span className="flex-1 h-px bg-line" />
    </div>
  );
}

function SsoButton({
  Icon,
  label,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      className="inline-flex items-center justify-center gap-1.5 rounded-md border border-line bg-paper px-3 py-2 text-xs hover:border-line-strong"
    >
      <Icon className="size-3.5" />
      {label}
    </button>
  );
}
