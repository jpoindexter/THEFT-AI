"use client";

import { useState } from "react";
import { ArrowUp, X } from "lucide-react";
import type { Phase, Question, TranscriptMsg } from "@/components/org-onboarding-flow";

type Org = { id: string; slug: string; name: string };

const EXAMPLES = [
  "AI marketing agency",
  "Subscription design service",
  "B2B SaaS for accountants",
];

type Props = {
  organization: Org;
  phase: Phase;
  description: string;
  transcript: TranscriptMsg[];
  questions: Question[];
  qIndex: number;
  answers: (string | null)[];
  customTexts: string[];
  loadError: string | null;
  onSubmitDescription: (d: string) => void;
  onSelect: (v: string) => void;
  onCustomText: (v: string) => void;
  onNext: () => void;
  onDecideThis: () => void;
  onBack: () => void;
  onDecideAll: () => void;
};

export function OrgOnboardingChat(props: Props) {
  if (props.phase === "describe") {
    return <DescribePhase onSubmit={props.onSubmitDescription} loadError={props.loadError} initialText={props.description} />;
  }
  if (props.phase === "loading") {
    return <LoadingPhase transcript={props.transcript} />;
  }
  return <QuestionPhase {...props} />;
}

function DescribePhase({ onSubmit, loadError, initialText }: {
  onSubmit: (d: string) => void;
  loadError: string | null;
  initialText?: string;
}) {
  const [input, setInput] = useState(initialText ?? "");

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChatHead />

      {/* Chat area — centered agent prompt */}
      <div style={{ flex: 1, overflow: "auto", padding: "24px 20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 20 }}>
        {loadError && (
          <p style={{ fontSize: 12, color: "var(--t-brick, #b05858)", margin: 0, textAlign: "center" }}>
            Couldn&apos;t generate brief: {loadError}. Try again.
          </p>
        )}
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 15, fontWeight: 500, color: "var(--t-ink)", lineHeight: 1.4, margin: "0 0 6px" }}>
            Tell me about your company.
          </p>
          <p style={{ fontSize: 12, color: "var(--t-ink-soft)", margin: 0, lineHeight: 1.5 }}>
            What you&apos;re building, who it&apos;s for, and how it works.
          </p>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center" }}>
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => submit(`A ${ex.toLowerCase()} for early-stage operators.`)}
              style={{
                height: 26, padding: "0 10px", border: "1px solid var(--t-line)",
                borderRadius: 4, background: "var(--t-paper)", fontSize: 11,
                color: "var(--t-ink-muted)", fontFamily: "inherit", cursor: "pointer",
                letterSpacing: "-0.01em", transition: "border-color 120ms ease, color 120ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--t-line-strong)"; e.currentTarget.style.color = "var(--t-ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--t-line)"; e.currentTarget.style.color = "var(--t-ink-muted)"; }}
            >
              {ex}
            </button>
          ))}
        </div>
      </div>

      {/* Active input — bottom */}
      <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-line)", flexShrink: 0 }}>
        <div
          style={{
            background: "var(--t-paper)", border: "1px solid var(--t-line)",
            borderRadius: 8, padding: "10px 12px",
            display: "flex", flexDirection: "column", gap: 6,
            transition: "border-color 120ms ease",
          }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "var(--t-line-strong)")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "var(--t-line)")}
        >
          <textarea
            autoFocus
            placeholder="A subscription service for designers who need ongoing brand work…"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit(input);
              }
            }}
            rows={3}
            style={{
              border: "none", outline: "none", background: "transparent",
              fontSize: 13, lineHeight: 1.55, resize: "none",
              color: "var(--t-ink)", width: "100%", fontFamily: "inherit",
            }}
          />
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>Enter to send · Shift+Enter newline</span>
            <button
              type="button"
              onClick={() => submit(input)}
              disabled={!input.trim()}
              aria-label="Send"
              style={{
                width: 28, height: 28, borderRadius: 6, border: "none",
                background: input.trim() ? "var(--t-ink)" : "var(--t-line-strong)",
                color: "var(--t-paper)", display: "inline-flex", alignItems: "center", justifyContent: "center",
                cursor: input.trim() ? "pointer" : "not-allowed", transition: "opacity 120ms ease",
              }}
            >
              <ArrowUp size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingPhase({ transcript }: { transcript: TranscriptMsg[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChatHead />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {transcript.map((m, i) =>
          m.kind === "user"
            ? <UserBubble key={i} text={m.text} />
            : <AgentBubble key={i} text={m.text} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ActivityRow glyph="~" label="Reading your description" />
          <ActivityRow glyph="~" label="Generating refinement questions" />
          <ActivityRow glyph="⊙" label="Working…" pulse />
        </div>
        <div style={{
          background: "var(--t-paper)", border: "1px solid var(--t-line)",
          borderRadius: 8, padding: 14, display: "flex", flexDirection: "column", gap: 8,
        }}>
          <div className="animate-pulse" style={{ height: 10, width: "90%", borderRadius: 3, background: "var(--t-line)" }} />
          <div className="animate-pulse" style={{ height: 10, width: "70%", borderRadius: 3, background: "var(--t-line)" }} />
          <div className="animate-pulse" style={{ height: 34, borderRadius: 6, background: "var(--t-line)", marginTop: 4 }} />
          <div className="animate-pulse" style={{ height: 34, borderRadius: 6, background: "var(--t-line)" }} />
        </div>
      </div>
      <LockedFooter />
    </div>
  );
}

function QuestionPhase({ transcript, questions, qIndex, answers, customTexts, onSelect, onCustomText, onNext, onDecideThis, onBack, onDecideAll }: Props) {
  const q = questions[qIndex];
  if (!q) return null;
  const selected = answers[qIndex];
  const customText = customTexts[qIndex] ?? "";
  const isLast = qIndex === questions.length - 1;
  const canAdvance = !!selected || !!customText.trim();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <ChatHead />
      <div style={{ flex: 1, overflow: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
        {transcript.map((m, i) =>
          m.kind === "user"
            ? <UserBubble key={i} text={m.text} />
            : <AgentBubble key={i} text={m.text} />
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <ActivityRow glyph="✓" label="Asked a refinement question" />
          <ActivityRow glyph="~" label="Running Tool: Ask User Question" />
          <ActivityRow glyph="⊙" label="Waited for the user's answer" />
        </div>

        {/* Question card */}
        <div style={{
          background: "var(--t-paper)", border: "1px solid var(--t-line)",
          borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 14,
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {qIndex > 0 && (
                <button
                  type="button" onClick={onBack} aria-label="Previous question"
                  style={{
                    width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
                    color: "var(--t-ink-soft)", background: "none", border: "none", cursor: "pointer",
                    fontSize: 12,
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-ink)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-ink-soft)")}
                >
                  ‹
                </button>
              )}
              <span style={{ fontSize: 11, color: "var(--t-ink-muted)", letterSpacing: "0.02em" }}>
                {qIndex + 1} / {questions.length}
              </span>
              <span style={{ fontSize: 12, color: "var(--t-ink-soft)" }}>›</span>
            </div>
            <button
              type="button" onClick={onDecideAll} aria-label="Decide all remaining questions"
              style={{
                width: 20, height: 20, display: "inline-flex", alignItems: "center", justifyContent: "center",
                color: "var(--t-ink-soft)", background: "none", border: "none", cursor: "pointer",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "var(--t-ink)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "var(--t-ink-soft)")}
            >
              <X size={12} />
            </button>
          </div>

          <p style={{ fontSize: 14, fontWeight: 500, color: "var(--t-ink)", lineHeight: 1.4, margin: 0 }}>{q.prompt}</p>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {q.options.map((opt) => (
              <button
                key={opt.key} type="button" onClick={() => onSelect(opt.label)}
                style={{
                  width: "100%", textAlign: "left", background: "var(--t-paper)",
                  border: `1px solid ${selected === opt.label ? "var(--t-ink)" : "var(--t-line)"}`,
                  borderRadius: 6, padding: "10px 12px",
                  display: "flex", flexDirection: "column", gap: 4,
                  cursor: "pointer", fontFamily: "inherit", transition: "border-color 120ms ease",
                }}
                onMouseEnter={(e) => { if (selected !== opt.label) e.currentTarget.style.borderColor = "var(--t-line-strong)"; }}
                onMouseLeave={(e) => { if (selected !== opt.label) e.currentTarget.style.borderColor = "var(--t-line)"; }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: "var(--t-ink)", letterSpacing: "-0.02em" }}>{opt.label}</span>
                  {opt.recommended && (
                    <span style={{
                      fontSize: 10, padding: "2px 6px", borderRadius: 3,
                      background: "var(--t-paper)", border: "1px solid var(--t-line)",
                      color: "var(--t-ink-muted)", textTransform: "uppercase",
                      letterSpacing: "0.02em", whiteSpace: "nowrap",
                    }}>Recommended</span>
                  )}
                </div>
                {opt.description && (
                  <span style={{ fontSize: 11, color: "var(--t-ink-soft)", lineHeight: 1.5 }}>{opt.description}</span>
                )}
              </button>
            ))}

            <div style={{
              border: `1px solid ${customText ? "var(--t-ink)" : "var(--t-line)"}`,
              borderRadius: 6, padding: "10px 12px", background: "var(--t-paper)",
              display: "flex", flexDirection: "column", gap: 4,
            }}>
              <label style={{ fontSize: 11, color: "var(--t-ink-soft)" }}>Something else</label>
              <input
                type="text" value={customText} onChange={(e) => onCustomText(e.target.value)}
                placeholder="Describe in your own words…"
                style={{
                  background: "transparent", outline: "none", border: "none",
                  fontSize: 13, padding: "2px 0", color: "var(--t-ink)", fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          <div style={{ display: "flex", gap: 8 }}>
            <button
              type="button" onClick={onDecideAll}
              style={{
                flex: 1, height: 34, borderRadius: 6,
                background: "var(--t-paper)", border: "1px solid var(--t-line)",
                color: "var(--t-ink-muted)", fontSize: 12,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontFamily: "inherit",
                transition: "border-color 120ms ease, color 120ms ease",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--t-line-strong)"; e.currentTarget.style.color = "var(--t-ink)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--t-line)"; e.currentTarget.style.color = "var(--t-ink-muted)"; }}
            >
              Decide all
            </button>
            <button
              type="button" onClick={canAdvance ? onNext : onDecideThis}
              style={{
                flex: 1, height: 34, borderRadius: 6, border: "none",
                background: "var(--t-ink)",
                color: "var(--t-paper)", fontSize: 12, fontWeight: 500,
                display: "inline-flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", fontFamily: "inherit",
                transition: "opacity 120ms ease",
              }}
            >
              {canAdvance ? (isLast ? "Submit" : "Next →") : "Decide this one"}
            </button>
          </div>
        </div>
      </div>
      <LockedFooter />
    </div>
  );
}

function ChatHead() {
  return (
    <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--t-line)", flexShrink: 0 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: "var(--t-ink)", display: "flex", alignItems: "center", gap: 8 }}>
        <span style={{ color: "var(--t-ink-muted)" }}>✦</span> Operator
      </div>
      <div style={{ fontSize: 11, color: "var(--t-ink-soft)", marginTop: 4 }}>Building your company brief</div>
    </div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div style={{
      alignSelf: "flex-end", maxWidth: "90%",
      background: "var(--t-canvas)", border: "1px solid var(--t-line)",
      borderRadius: 10, padding: "10px 12px",
      fontSize: 13, color: "var(--t-ink)", lineHeight: 1.5,
    }}>{text}</div>
  );
}

function AgentBubble({ text }: { text: string }) {
  return (
    <div style={{ alignSelf: "flex-start", maxWidth: "95%", fontSize: 13, color: "var(--t-ink)", lineHeight: 1.5 }}>{text}</div>
  );
}

function ActivityRow({ glyph, label, pulse }: { glyph: string; label: string; pulse?: boolean }) {
  return (
    <div
      className={pulse ? "animate-pulse" : undefined}
      style={{ fontSize: 12, color: "var(--t-ink-soft)", display: "flex", alignItems: "center", gap: 8, lineHeight: 1.5 }}
    >
      <span style={{ fontFamily: "var(--font-geist-mono), monospace", width: 14, display: "inline-block", textAlign: "center" }}>{glyph}</span>
      {label}
    </div>
  );
}

function LockedFooter() {
  return (
    <div style={{ padding: "12px 20px", borderTop: "1px solid var(--t-line)", flexShrink: 0 }}>
      <div style={{
        background: "var(--t-paper)", border: "1px solid var(--t-line)",
        borderRadius: 8, padding: "8px 12px",
        display: "flex", alignItems: "center", gap: 8,
        opacity: 0.5, pointerEvents: "none",
      }}>
        <input
          type="text" disabled placeholder="Ask for follow up changes…"
          style={{
            flex: 1, border: "none", outline: "none", background: "transparent",
            fontSize: 13, color: "var(--t-ink)", fontFamily: "inherit",
          }}
        />
        <ArrowUp size={14} style={{ color: "var(--t-ink-soft)" }} />
      </div>
    </div>
  );
}
