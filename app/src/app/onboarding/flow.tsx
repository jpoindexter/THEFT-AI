"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const EXAMPLES = [
  "AI marketing agency",
  "Subscription design service",
  "B2B SaaS for accountants",
];

const NEXT_STEPS = [
  {
    n: "01",
    title: "Cofounder interview",
    desc: "5–10 min conversation to nail down ICP, problem, and what kind of business you actually want.",
  },
  {
    n: "02",
    title: "Roadmap generated",
    desc: "A tech-tree of ~30 capabilities across 8 stages and 8 departments.",
  },
  {
    n: "03",
    title: "First agents launch",
    desc: "You pick the next move; the relevant department agent does it.",
  },
];

export default function OnboardingFlow() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const max = 80;

  async function submit(n: string) {
    const trimmed = n.trim();
    if (!trimmed || submitting) return;
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? "Failed to create organization");
      }
      const { slug } = (await res.json()) as { slug: string };
      router.replace(`/${slug}/onboarding`);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Unknown error");
      setSubmitting(false);
    }
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "var(--t-canvas)",
      color: "var(--t-ink)",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
    }}>
      {/* Topbar */}
      <div style={{
        height: 52, background: "var(--t-canvas)",
        borderBottom: "1px solid var(--t-line)",
        display: "flex", alignItems: "center", padding: "0 20px",
        position: "sticky", top: 0, zIndex: 30,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0, color: "var(--t-ink)" }}>
          THEFT<span style={{ color: "var(--t-ink-muted)", fontWeight: 400, marginLeft: 2 }}> &amp;</span>
        </span>
      </div>

      {/* Centered card */}
      <div style={{
        minHeight: "calc(100vh - 52px)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        padding: "80px 24px 48px",
      }}>
        <div style={{ width: "100%", maxWidth: 640, display: "flex", flexDirection: "column", gap: 32 }}>

          <span style={{
            fontSize: 11, fontWeight: 500, textTransform: "uppercase",
            letterSpacing: "0.02em", color: "var(--t-ink-soft)",
          }}>
            NEW WORKSPACE · STEP 1 OF 2
          </span>

          <h1 style={{
            fontSize: 40, fontWeight: 600, lineHeight: 1.05,
            letterSpacing: "-0.03em", margin: 0, color: "var(--t-ink)",
          }}>
            Name your company
          </h1>

          <p style={{ fontSize: 13, color: "var(--t-ink-muted)", lineHeight: 1.55, maxWidth: "56ch", margin: 0 }}>
            After naming, you&apos;ll do a quick Cofounder interview that generates
            your roadmap — capabilities, departments, what to ship first.
          </p>

          {/* Input card */}
          <div style={{
            background: "var(--t-paper)", border: "1px solid var(--t-line-strong)",
            borderRadius: 8, padding: 16,
            display: "flex", flexDirection: "column", gap: 10,
            transition: "border-color 120ms ease",
            outline: "none",
          }}
            onFocus={(e) => (e.currentTarget.style.borderColor = "var(--t-ink)")}
            onBlur={(e) => (e.currentTarget.style.borderColor = "var(--t-line-strong)")}
          >
            <input
              autoFocus
              placeholder="e.g. Design Subs"
              value={name}
              maxLength={max}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && name.trim()) void submit(name); }}
              style={{
                border: "none", outline: "none", background: "transparent",
                fontSize: 16, padding: "4px 0", color: "var(--t-ink)",
                letterSpacing: "-0.02em", fontFamily: "inherit", width: "100%",
              }}
            />
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderTop: "1px solid var(--t-line)", paddingTop: 10,
            }}>
              <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>{name.length} / {max}</span>
              <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>Enter ↵</span>
            </div>
          </div>

          {err && <p style={{ fontSize: 12, color: "var(--t-brick, #b05858)", margin: 0 }}>{err}</p>}

          {/* Example chips */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 500, textTransform: "uppercase",
              letterSpacing: "0.02em", color: "var(--t-ink-soft)",
            }}>
              OR PICK A STARTER
            </span>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {EXAMPLES.map((ex) => (
                <button
                  key={ex}
                  type="button"
                  onClick={() => setName(ex)}
                  style={{
                    height: 26, padding: "0 10px",
                    border: "1px solid var(--t-line)", borderRadius: 4,
                    background: "var(--t-paper)", fontSize: 11,
                    color: "var(--t-ink-muted)", fontFamily: "inherit",
                    cursor: "pointer", letterSpacing: "-0.02em",
                    transition: "border-color 120ms ease, color 120ms ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--t-line-strong)";
                    e.currentTarget.style.color = "var(--t-ink)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--t-line)";
                    e.currentTarget.style.color = "var(--t-ink-muted)";
                  }}
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <button
              type="button"
              onClick={() => void submit("Untitled workspace")}
              style={{
                fontSize: 12, color: "var(--t-ink-soft)", background: "none", border: "none",
                cursor: "pointer", fontFamily: "inherit", textDecoration: "underline",
                textUnderlineOffset: 3, textDecorationColor: "var(--t-line)",
                letterSpacing: "-0.02em",
              }}
            >
              Skip — I&apos;ll fill this in later
            </button>
            <button
              type="button"
              onClick={() => void submit(name)}
              disabled={!name.trim() || submitting}
              style={{
                height: 36, padding: "0 16px", borderRadius: 6,
                background: name.trim() && !submitting ? "var(--t-ink)" : "var(--t-line-strong)",
                color: "var(--t-paper)", fontSize: 13, fontWeight: 500,
                fontFamily: "inherit", letterSpacing: "-0.02em",
                border: "none", cursor: name.trim() && !submitting ? "pointer" : "not-allowed",
                display: "inline-flex", alignItems: "center", gap: 8,
                transition: "opacity 120ms ease",
              }}
            >
              {submitting ? "Creating…" : "Continue →"}
            </button>
          </div>

          {/* Dashed divider */}
          <hr style={{ border: "none", borderTop: "1px dashed var(--t-line-strong)", margin: "8px 0 0" }} />

          {/* What happens next */}
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{
              fontSize: 11, fontWeight: 500, textTransform: "uppercase",
              letterSpacing: "0.02em", color: "var(--t-ink-soft)",
            }}>
              WHAT HAPPENS NEXT
            </span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>
              {NEXT_STEPS.map((s) => (
                <div key={s.n} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>{s.n}</span>
                  <span style={{ fontSize: 12, color: "var(--t-ink)", fontWeight: 500 }}>{s.title}</span>
                  <span style={{ fontSize: 11, color: "var(--t-ink-muted)", lineHeight: 1.55 }}>{s.desc}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
