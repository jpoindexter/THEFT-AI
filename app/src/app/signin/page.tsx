"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

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
      router.push(`/signin/sent?email=${encodeURIComponent(email)}`);
    }, 600);
  }

  async function devLogin() {
    setDevBusy(true);
    const res = await fetch("/api/dev-login", { method: "POST" });
    const j = (await res.json()) as { redirect: string };
    router.replace(j.redirect);
  }

  const canSubmit = email.includes("@") && !busy;

  return (
    <div style={{ fontFamily: "var(--font-geist-mono)", background: "var(--t-canvas)", color: "var(--t-ink)", minHeight: "100vh", display: "flex", flexDirection: "column", letterSpacing: "-0.02em", fontSize: 13 }}>
      <header style={{ height: 52, background: "var(--t-canvas)", borderBottom: "1px solid var(--t-line)", display: "flex", alignItems: "center", padding: "0 24px" }}>
        <Link href="/" style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0, color: "var(--t-ink)", textDecoration: "none" }}>
          THEFT<span style={{ color: "var(--t-ink-muted)", fontWeight: 400, marginLeft: 2 }}>&amp;</span>
        </Link>
      </header>

      <main style={{ minHeight: "calc(100vh - 52px)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "96px 24px 48px" }}>
        <div style={{ width: "100%", maxWidth: 360, background: "var(--t-paper)", border: "1px solid var(--t-line-strong)", borderRadius: 8, padding: 24, display: "flex", flexDirection: "column", gap: 18 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <h1 style={{ fontSize: 18, fontWeight: 600, letterSpacing: "-0.02em", margin: 0, color: "var(--t-ink)" }}>Sign in to THEFT</h1>
            <p style={{ fontSize: 12, color: "var(--t-ink-muted)", margin: 0 }}>We&apos;ll email you a one-time link. No passwords.</p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label htmlFor="email" style={{ fontSize: 11, color: "var(--t-ink-muted)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
              Work email
            </label>
            <input
              id="email"
              type="email"
              autoFocus
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") void send(); }}
              onFocus={(e) => { e.currentTarget.style.borderColor = "var(--t-line-strong)"; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = "var(--t-line)"; }}
              style={{ height: 36, padding: "0 12px", background: "var(--t-paper)", border: "1px solid var(--t-line)", borderRadius: 6, fontSize: 13, outline: "none", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.02em", color: "var(--t-ink)", width: "100%", boxSizing: "border-box", transition: "border-color 120ms ease" }}
            />
          </div>

          <button
            type="button"
            onClick={() => void send()}
            disabled={!canSubmit}
            style={{ width: "100%", height: 36, borderRadius: 6, border: "none", background: canSubmit ? "var(--t-ink)" : "var(--t-line-strong)", color: "var(--t-paper)", fontSize: 13, fontWeight: 500, cursor: canSubmit ? "pointer" : "not-allowed", fontFamily: "var(--font-geist-mono)", letterSpacing: "-0.02em", transition: "opacity 120ms ease" }}
          >
            {busy ? "Sending…" : "Send magic link →"}
          </button>

          <OrDivider />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
            <SsoButton label="GitHub"><GitHubIcon /></SsoButton>
            <SsoButton label="Google"><GoogleIcon /></SsoButton>
          </div>

          <p style={{ fontSize: 11, color: "var(--t-ink-soft)", textAlign: "center", lineHeight: 1.55, margin: 0 }}>
            By continuing you agree to our{" "}
            <a href="#" style={{ textDecoration: "underline", textUnderlineOffset: 2, color: "inherit" }}>terms</a>{" "}
            and{" "}
            <a href="#" style={{ textDecoration: "underline", textUnderlineOffset: 2, color: "inherit" }}>privacy policy</a>.
          </p>

          {process.env.NODE_ENV !== "production" && (
            <div style={{ marginTop: 8, background: "var(--t-paper)", border: "1px solid var(--t-line)", borderRadius: 8, padding: 12, display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, color: "var(--t-ink-soft)", letterSpacing: "0.02em", textTransform: "uppercase" }}>DEV MODE</span>
                <span style={{ fontSize: 9, padding: "2px 5px", border: "1px solid var(--t-line)", borderRadius: 3, color: "var(--t-ink-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>localhost only</span>
              </div>
              <button
                type="button"
                onClick={() => void devLogin()}
                disabled={devBusy}
                style={{ height: 28, padding: "0 12px", borderRadius: 5, background: "var(--t-ink)", color: "var(--t-paper)", fontSize: 11, fontWeight: 500, border: "none", cursor: devBusy ? "not-allowed" : "pointer", fontFamily: "var(--font-geist-mono)", display: "inline-flex", alignItems: "center", alignSelf: "flex-start" }}
              >
                {devBusy ? "Signing in…" : "Continue as dev →"}
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function OrDivider() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 11, color: "var(--t-ink-soft)" }}>
      <span style={{ flex: 1, height: 1, background: "var(--t-line)", display: "block" }} />
      — or —
      <span style={{ flex: 1, height: 1, background: "var(--t-line)", display: "block" }} />
    </div>
  );
}

function SsoButton({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--t-line-strong)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--t-line)"; }}
      style={{ height: 36, padding: "0 8px", borderRadius: 6, background: "var(--t-paper)", border: "1px solid var(--t-line)", fontSize: 11.5, fontWeight: 500, color: "var(--t-ink)", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer", fontFamily: "var(--font-geist-mono)", transition: "border-color 120ms ease" }}
    >
      {children}
      {label}
    </button>
  );
}

function GitHubIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5 3.3 9.3 7.8 10.8.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.8 0-1.3.4-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.2 1.2.9-.3 1.9-.4 2.9-.4 1 0 2 .1 2.9.4 2.2-1.5 3.2-1.2 3.2-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.5-2.7 5.5-5.3 5.8.4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6 4.5-1.5 7.8-5.8 7.8-10.8C23.5 5.7 18.3.5 12 .5z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.5 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9c-.3 1.4-1 2.5-2.2 3.3v2.7h3.6c2.1-1.9 3.2-4.7 3.2-8z" />
      <path fill="#34A853" d="M12 23c2.9 0 5.4-1 7.2-2.6l-3.6-2.7c-1 .7-2.2 1.1-3.6 1.1-2.8 0-5.1-1.9-6-4.4H2.3v2.8C4 20.5 7.7 23 12 23z" />
      <path fill="#FBBC04" d="M6 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.6.4-2.4V6.8H2.3C1.5 8.4 1 10.1 1 12s.5 3.6 1.3 5.2L6 14.4z" />
      <path fill="#EA4335" d="M12 5.4c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.4 2.1 14.9 1 12 1 7.7 1 4 3.5 2.3 6.8L6 9.6c.9-2.5 3.2-4.2 6-4.2z" />
    </svg>
  );
}
