"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { OrgOnboardingChat } from "@/components/org-onboarding-chat";
import { OrgOnboardingPlanPhases } from "@/components/org-onboarding-plan";

type Org = { id: string; slug: string; name: string };
export type Phase = "describe" | "loading" | "questions" | "plan" | "activated" | "brand-design";
export type TranscriptMsg = { kind: "user" | "agent"; text: string };

export type QuestionOption = { key: string; label: string; description?: string; recommended?: boolean };
export type Question = { id: string; prompt: string; options: QuestionOption[] };

export function buildPlan(description: string, answers: (string | null)[], questions: Question[]) {
  const planFields: Record<string, string> = { mission: description.slice(0, 250) };
  questions.forEach((q, i) => { planFields[q.id] = answers[i] ?? "To be defined"; });
  return planFields;
}

const DEPTS = [
  { id: "eng", name: "Engineering", status: "product surface" },
  { id: "des", name: "Design", status: "brand system" },
  { id: "mkt", name: "Marketing", status: "positioning + site" },
  { id: "sls", name: "Sales", status: "outbound + close" },
  { id: "ops", name: "Operations", status: "request pipeline" },
  { id: "fin", name: "Finance", status: "billing + runway" },
  { id: "lgl", name: "Legal", status: "MSA + IP" },
  { id: "sup", name: "Support", status: "client comms" },
];

const FALLBACK_SECTIONS = [
  { id: "icp", label: "ICP — who we serve", n: 1 },
  { id: "model", label: "Model — how we charge", n: 2 },
  { id: "mode", label: "Mode — human vs. agent", n: 3 },
  { id: "edge", label: "Wedge — why us", n: 4 },
];

const CLIENT_FALLBACK_QUESTIONS: Question[] = [
  {
    id: "icp",
    prompt: "Who is the first buyer we should optimize for?",
    options: [
      { key: "founders", label: "Early-stage founders", description: "Founders who need expert execution before they can hire a full team.", recommended: true },
      { key: "operators", label: "Lean operators", description: "Small teams that already sell but need a repeatable execution system." },
      { key: "agencies", label: "Agencies and studios", description: "Service businesses that need leverage on delivery, ops, or growth work." },
      { key: "smb", label: "Small businesses", description: "Owner-led companies that need a practical business system without enterprise overhead." },
    ],
  },
  {
    id: "offer",
    prompt: "What should the first paid offer be?",
    options: [
      { key: "retainer", label: "Monthly operating retainer", description: "A recurring service with a clear scope and predictable weekly output.", recommended: true },
      { key: "sprint", label: "Fixed-scope launch sprint", description: "A short project that proves value and creates a reusable delivery system." },
      { key: "subscription", label: "Productized subscription", description: "A self-serve or assisted plan with tiered usage and repeatable fulfillment." },
      { key: "pilot", label: "Paid pilot", description: "A lower-friction first engagement designed to learn fast and convert." },
    ],
  },
  {
    id: "delivery",
    prompt: "How should work get delivered?",
    options: [
      { key: "agent-led", label: "Agent-led with human approval", description: "Agents draft and execute, with the founder approving important decisions.", recommended: true },
      { key: "human-led", label: "Human-led with agent support", description: "The founder stays hands-on while agents prepare briefs, drafts, and queues." },
      { key: "done-for-you", label: "Done-for-you service", description: "The customer buys outcomes, not tooling or operational visibility." },
      { key: "self-serve", label: "Self-serve workflow", description: "Customers use the product directly with agents assisting in the background." },
    ],
  },
  {
    id: "wedge",
    prompt: "What is the wedge that makes this hard to ignore?",
    options: [
      { key: "speed", label: "Speed to first useful output", description: "Buyers feel value quickly because the system ships real work immediately.", recommended: true },
      { key: "taste", label: "Taste and judgment", description: "The work is better curated than generic AI output or low-touch outsourcing." },
      { key: "system", label: "Repeatable operating system", description: "The durable process becomes more valuable than any one deliverable." },
      { key: "cost", label: "Lower cost than hiring", description: "Buyers get team-like output before they can justify payroll." },
    ],
  },
];

export default function OrgOnboardingFlow({ organization }: { organization: Org }) {
  const router = useRouter();
  const [phase, setPhase] = useState<Phase>("describe");
  const [description, setDescription] = useState("");
  const [transcript, setTranscript] = useState<TranscriptMsg[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(string | null)[]>([]);
  const [customTexts, setCustomTexts] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function submitDescription(d: string) {
    setDescription(d);
    setPhase("loading");
    setLoadError(null);
    setTranscript([{ kind: "user", text: d }]);
    setTimeout(() => {
      setTranscript((t) => [...t, { kind: "agent", text: "Got it. I’ll turn this into a company brief and setup questions." }]);
    }, 350);
    try {
      const res = await fetch(`/api/${organization.slug}/brief/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idea: d }),
      });
      if (!res.ok) throw new Error(`Brief generation failed (${res.status})`);
      const data = (await res.json()) as { questions: Question[]; analysis?: string };
      const qs = data.questions ?? [];
      if (qs.length === 0) throw new Error("No questions returned");
      setQuestions(qs);
      setAnswers(Array(qs.length).fill(null));
      setCustomTexts(Array(qs.length).fill(""));
      setQIndex(0);
      if (data.analysis) {
        setTranscript((t) => [...t, { kind: "agent", text: data.analysis! }]);
      }
      setPhase("questions");
    } catch (e) {
      const fallbackMessage = e instanceof Error ? e.message : "Failed to generate brief";
      setLoadError(`${fallbackMessage}. Continuing with local setup questions.`);
      setQuestions(CLIENT_FALLBACK_QUESTIONS);
      setAnswers(Array(CLIENT_FALLBACK_QUESTIONS.length).fill(null));
      setCustomTexts(Array(CLIENT_FALLBACK_QUESTIONS.length).fill(""));
      setQIndex(0);
      setTranscript((t) => [
        ...t,
        { kind: "agent", text: "Brief service was unavailable, so I switched to local setup questions to keep onboarding moving." },
      ]);
      setPhase("questions");
    }
  }

  function selectAnswer(val: string) {
    setAnswers((prev) => { const next = [...prev]; next[qIndex] = val; return next; });
  }
  function setCustomText(val: string) {
    setCustomTexts((prev) => { const next = [...prev]; next[qIndex] = val; return next; });
  }
  function advance() {
    const finalAnswer = customTexts[qIndex].trim() || answers[qIndex];
    setAnswers((prev) => { const next = [...prev]; next[qIndex] = finalAnswer; return next; });
    if (qIndex < questions.length - 1) setQIndex((i) => i + 1);
    else setPhase("plan");
  }
  function recommendedAnswer(index: number) {
    const q = questions[index];
    return q?.options.find((o) => o.recommended)?.label ?? q?.options[0]?.label ?? null;
  }
  function decideThisOne() {
    const finalAnswer = customTexts[qIndex].trim() || answers[qIndex] || recommendedAnswer(qIndex);
    setAnswers((prev) => { const next = [...prev]; next[qIndex] = finalAnswer; return next; });
    if (qIndex < questions.length - 1) setQIndex((i) => i + 1);
    else setPhase("plan");
  }
  function decideAll() {
    setAnswers((prev) =>
      questions.map((_, i) => customTexts[i]?.trim() || prev[i] || recommendedAnswer(i)),
    );
    setPhase("plan");
  }
  function goBack() {
    if (qIndex > 0) setQIndex((i) => i - 1);
  }
  function skipOnboarding() { router.replace(`/${organization.slug}`); }

  const briefPhase = phase === "describe" ? 0
    : phase === "loading" ? 1
    : answers.filter((a) => a !== null).length + 2;
  const showPlan = phase === "plan" || phase === "activated" || phase === "brand-design";

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 100,
      background: "var(--t-canvas)", color: "var(--t-ink)",
      fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
      display: "flex", flexDirection: "column",
    }}>
      <header style={{
        height: 52, display: "flex", alignItems: "center", padding: "0 20px",
        borderBottom: "1px solid var(--t-line)", flexShrink: 0,
      }}>
        <span style={{ fontSize: 13, fontWeight: 600, letterSpacing: 0, color: "var(--t-ink)" }}>
          THEFT<span style={{ color: "var(--t-ink-muted)", fontWeight: 400, marginLeft: 2 }}>&amp;</span>
        </span>
        <div style={{ flex: 1 }} />
        <div style={{ fontSize: 11, color: "var(--t-ink-muted)", textTransform: "uppercase", letterSpacing: "0.02em" }}>
          <strong style={{ color: "var(--t-ink)", fontWeight: 500 }}>{organization.name}</strong>
          {" · "}Workspace setup · 2 / 2
        </div>
      </header>

      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 380px", overflow: "hidden" }}>
        {/* Left canvas */}
        <div style={{
          overflow: "auto", padding: "32px 40px",
          background: "var(--t-canvas)", borderRight: "1px solid var(--t-line)",
        }}>
          {showPlan ? (
            <OrgOnboardingPlanPhases side="canvas" phase={phase} orgSlug={organization.slug} onSkip={skipOnboarding} />
          ) : (
            <BriefDoc
              orgName={organization.name}
              description={description}
              phase={phase}
              questions={questions}
              answers={answers}
              briefPhase={briefPhase}
            />
          )}
        </div>

        {/* Right chat panel */}
        <div style={{ background: "var(--t-canvas)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {!showPlan ? (
            <OrgOnboardingChat
              organization={organization}
              phase={phase}
              description={description}
              transcript={transcript}
              questions={questions}
              qIndex={qIndex}
              answers={answers}
              customTexts={customTexts}
              loadError={loadError}
              onSubmitDescription={(d) => void submitDescription(d)}
              onSelect={selectAnswer}
              onCustomText={(val) => { setCustomText(val); if (val.trim()) selectAnswer(""); }}
              onNext={advance}
              onDecideThis={decideThisOne}
              onBack={goBack}
              onDecideAll={decideAll}
            />
          ) : (
            <OrgOnboardingPlanPhases
              side="panel"
              phase={phase}
              orgSlug={organization.slug}
              organization={organization}
              description={description}
              answers={answers}
              questions={questions}
              onPhaseChange={setPhase}
              onSkip={skipOnboarding}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BriefDoc({ orgName, description, phase, questions, answers, briefPhase }: {
  orgName: string;
  description: string;
  phase: Phase;
  questions: Question[];
  answers: (string | null)[];
  briefPhase: number;
}) {
  const sections = questions.length > 0
    ? questions.map((q, i) => ({ id: q.id, label: q.prompt, answer: answers[i] ?? null, n: i + 1 }))
    : FALLBACK_SECTIONS.map((s) => ({ ...s, answer: null as string | null }));

  return (
    <div style={{
      background: "var(--t-paper)", border: "1px solid var(--t-line)",
      borderRadius: 8, padding: "24px 28px", maxWidth: 720, margin: "0 auto",
    }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px dashed var(--t-line-strong)", paddingBottom: 14, marginBottom: 20,
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: "var(--t-ink)" }}>business_context.md</span>
        <span style={{
          fontSize: 11, color: "var(--t-ink-soft)", textTransform: "uppercase",
          letterSpacing: "0.02em", display: "inline-flex", alignItems: "center", gap: 6,
        }}>
          <span
            className={phase !== "plan" ? "animate-pulse" : undefined}
            style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--t-ink-muted)", display: "inline-block" }}
          />
          {phase === "plan" ? "BRIEF READY" : "WRITING"}
        </span>
      </div>

      <DocSection>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: "var(--t-ink)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>
          <DocHash />{orgName}
        </h2>
        {description
          ? <p style={docP}>{description}</p>
          : <p style={docPMuted}>Mission statement will populate as you describe your idea.</p>}
      </DocSection>

      {sections.map((s) => (
        <DocSection key={s.id}>
          <h3 style={docH2}><DocHash2 />{s.label}</h3>
          {s.answer
            ? <p style={docP}>{s.answer}</p>
            : <p style={docPMuted}>Pending — interview question {s.n}.</p>}
        </DocSection>
      ))}

      <div style={{ marginBottom: phase === "plan" ? 26 : 0 }}>
        <h3 style={docH2}><DocHash2 />Departments — who builds what</h3>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 12 }}>
          {DEPTS.map((d, i) => {
            const active = phase !== "describe" && i < briefPhase + 1;
            return (
              <div key={d.id} style={{
                border: `1px solid ${active ? "var(--t-line-strong)" : "var(--t-line)"}`,
                borderRadius: 6, padding: "10px 12px", background: "var(--t-paper)",
                transition: "border-color 200ms ease",
              }}>
                <div style={{
                  fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.02em",
                  color: active ? "var(--t-ink)" : "var(--t-ink-muted)",
                }}>
                  {d.name}
                </div>
                <div style={{ fontSize: 10, marginTop: 6, minHeight: 12, color: active ? "var(--t-ink-muted)" : "var(--t-ink-soft)" }}>
                  {active ? d.status : "— empty —"}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {phase === "plan" && (
        <div style={{ borderTop: "1px dashed var(--t-line-strong)", paddingTop: 18 }}>
          <h3 style={docH2}><DocHash2 />Next</h3>
          <p style={{ ...docP, marginBottom: 0 }}>
            Brief locked. Generating your roadmap, department agents, and first work queue.
          </p>
        </div>
      )}
    </div>
  );
}

function DocSection({ children }: { children: React.ReactNode }) {
  return <div style={{ marginBottom: 26 }}>{children}</div>;
}
function DocHash() {
  return <span style={{ color: "var(--t-ink-soft)", marginRight: 8, fontWeight: 400 }}>#</span>;
}
function DocHash2() {
  return <span style={{ color: "var(--t-ink-soft)", marginRight: 8, fontWeight: 400 }}>##</span>;
}

const docH2: React.CSSProperties = { fontSize: 13, fontWeight: 600, color: "var(--t-ink)", margin: "0 0 8px", letterSpacing: "-0.02em" };
const docP: React.CSSProperties = { fontSize: 13, color: "var(--t-ink)", lineHeight: 1.6, margin: 0 };
const docPMuted: React.CSSProperties = { fontSize: 13, color: "var(--t-ink-soft)", fontStyle: "italic", lineHeight: 1.6, margin: 0 };
