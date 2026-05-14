"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import {
  ChevronLeft,
  MoreHorizontal,
  Link2,
  Sparkles,
  ArrowUp,
  RefreshCw,
  X,
} from "lucide-react";

type Org = { id: string; slug: string; name: string };

type Msg = {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  created_at: string;
};

const DEPT_LABELS: Record<string, string> = {
  engineering: "Engineering Agent",
  design: "Design Agent",
  marketing: "Marketing Agent",
  sales: "Sales Agent",
  operations: "Operations Agent",
  finance: "Finance Agent",
  legal: "Legal Agent",
  support: "Support Agent",
};

const DEPT_SLUGS = new Set(Object.keys(DEPT_LABELS));

export default function OrgChatPanel({
  organization,
  hasPlan,
  onClose,
}: {
  organization: Org;
  hasPlan: boolean;
  onClose?: () => void;
}) {
  const pathname = usePathname();
  const segs = pathname.replace(/^\/+|\/+$/g, "").split("/");

  const activeDeptSlug =
    segs[1] && DEPT_SLUGS.has(segs[1]) ? segs[1] : null;

  const isOperator = !activeDeptSlug;

  return (
    <div
      className="flex flex-col"
      style={{
        borderLeft: "1px solid var(--t-line)",
        background: "var(--t-canvas)",
        height: "100%",
        minHeight: 0,
      }}
    >
      <ChatHeader
        title={
          activeDeptSlug
            ? DEPT_LABELS[activeDeptSlug]
            : "Operator"
        }
        subtitle={
          activeDeptSlug
            ? "Department agent · idle"
            : "Company-level agent"
        }
        onClose={onClose}
      />

      <div
        className="flex-1 overflow-y-auto"
        style={{ padding: "20px 16px" }}
      >
        {!hasPlan ? (
          <PlaceholderHint body="Complete onboarding to activate agents." />
        ) : isOperator ? (
          <OperatorMessages organization={organization} />
        ) : (
          <DeptMessages
            deptSlug={activeDeptSlug!}
          />
        )}
      </div>

      <ChatInputBox
        placeholder={
          activeDeptSlug
            ? `Ask the ${DEPT_LABELS[activeDeptSlug].replace(" Agent", "")} agent anything…`
            : "Ask anything about your company…"
        }
        disabled={!hasPlan}
        orgSlug={organization.slug}
        deptSlug={activeDeptSlug ?? undefined}
      />
    </div>
  );
}

function ChatHeader({
  title,
  subtitle,
  onBack,
  onClose,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onClose?: () => void;
}) {
  return (
    <div
      className="flex items-center gap-2.5 shrink-0"
      style={{
        padding: "10px 12px",
        borderBottom: "1px solid var(--t-line)",
        minHeight: 50,
      }}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="flex items-center justify-center rounded hover:bg-canvas transition-colors"
          style={{ width: 26, height: 26, color: "var(--t-ink-muted)" }}
        >
          <ChevronLeft size={15} />
        </button>
      )}
      <div className="flex flex-col min-w-0 flex-1">
        <span
          style={{
            fontWeight: 600,
            fontSize: 13.5,
            lineHeight: "16px",
            color: "var(--t-ink)",
          }}
        >
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 11.5, color: "var(--t-ink-soft)" }}>
            {subtitle}
          </span>
        )}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Close chat"
          className="flex items-center justify-center rounded hover:bg-canvas transition-colors"
          style={{ width: 26, height: 26, color: "var(--t-ink-muted)" }}
        >
          <X size={15} />
        </button>
      ) : (
        <button
          type="button"
          className="flex items-center justify-center rounded hover:bg-canvas transition-colors"
          style={{ width: 26, height: 26, color: "var(--t-ink-muted)" }}
        >
          <MoreHorizontal size={15} />
        </button>
      )}
    </div>
  );
}

function PlaceholderHint({ body }: { body: string }) {
  return (
    <div
      style={{
        padding: 12,
        borderRadius: 10,
        background: "var(--t-paper)",
        border: "1px dashed var(--t-line-strong)",
        color: "var(--t-ink-muted)",
        fontSize: 12.5,
        lineHeight: 1.5,
      }}
    >
      {body}
    </div>
  );
}

function OperatorMessages({ organization }: { organization: Org }) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void fetch(`/api/${organization.slug}/operator/messages`)
      .then((r) => r.json())
      .then((j) => {
        setMessages(j.messages ?? []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [organization.slug]);

  if (loading) {
    return (
      <div
        style={{ color: "var(--t-ink-soft)", fontSize: 12, textAlign: "center", paddingTop: 32 }}
      >
        Loading…
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <>
        <PlaceholderHint body="Ask anything — strategy, status, 'what should I do next.' I can also launch other agents on your behalf." />
        <div style={{ marginTop: 16 }}>
          <div className="flex flex-wrap gap-1.5" style={{ marginTop: 12 }}>
            {["Walk me through approvals", "What's in progress?", "Next milestone?"].map((s) => (
              <button
                key={s}
                style={{
                  height: 22,
                  padding: "0 8px",
                  borderRadius: 4,
                  fontFamily: "inherit",
                  fontSize: 11,
                  fontWeight: 400,
                  letterSpacing: "-0.01em",
                  background: "transparent",
                  color: "var(--t-ink-muted)",
                  border: "1px solid var(--t-line-strong)",
                  textTransform: "uppercase",
                  cursor: "pointer",
                }}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {messages.slice(-20).map((m) => (
        <Bubble key={m.id} role={m.role} text={m.text} />
      ))}
    </div>
  );
}

function DeptMessages({
  deptSlug,
}: {
  deptSlug: string;
}) {
  return (
    <PlaceholderHint
      body={`${DEPT_LABELS[deptSlug]} is idle. Give it a task from the roadmap or type a prompt directly.`}
    />
  );
}

function Bubble({
  role,
  text,
}: {
  role: "user" | "assistant" | "system";
  text: string;
}) {
  const isUser = role === "user";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        marginBottom: 2,
      }}
    >
      <div
        style={{
          maxWidth: "78%",
          padding: "8px 11px",
          borderRadius: 10,
          background: isUser ? "var(--t-canvas)" : "var(--t-paper)",
          border: "1px solid var(--t-line)",
          fontSize: 13,
          lineHeight: 1.5,
          color: "var(--t-ink)",
          whiteSpace: "pre-wrap",
          wordBreak: "break-word",
        }}
      >
        {text}
      </div>
    </div>
  );
}

function ChatInputBox({
  placeholder,
  disabled,
  orgSlug,
  deptSlug,
}: {
  placeholder: string;
  disabled: boolean;
  orgSlug: string;
  deptSlug?: string;
}) {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function send() {
    const msg = value.trim();
    if (!msg || busy || disabled) return;
    setValue("");
    setBusy(true);
    try {
      const endpoint = deptSlug
        ? `/api/${orgSlug}/departments/${deptSlug}/run`
        : `/api/${orgSlug}/operator`;
      await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msg }),
      });
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div
      className="shrink-0"
      style={{
        borderTop: "1px solid var(--t-line)",
        padding: 10,
        background: "var(--t-canvas)",
      }}
    >
      <div
        style={{
          background: "var(--t-paper)",
          border: "1px solid var(--t-line-strong)",
          borderRadius: 6,
          padding: 8,
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled || busy}
          style={{
            border: "none",
            outline: "none",
            resize: "none",
            background: "transparent",
            fontSize: 13,
            lineHeight: 1.45,
            minHeight: 44,
            padding: "4px 6px",
            color: "var(--t-ink)",
            fontFamily: "inherit",
            width: "100%",
          }}
        />
        <div className="flex items-center gap-1">
          <button
            className="flex items-center justify-center rounded hover:bg-canvas transition-colors"
            style={{
              width: 26,
              height: 26,
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--t-ink-muted)",
            }}
            type="button"
          >
            <Link2 size={14} />
          </button>
          <button
            className="flex items-center gap-1 rounded hover:bg-canvas transition-colors"
            style={{
              height: 26,
              padding: "0 8px",
              border: "1px solid transparent",
              background: "transparent",
              color: "var(--t-ink-muted)",
              fontSize: 13,
            }}
            type="button"
          >
            <Sparkles size={13} />
            Skills
          </button>
          <div className="flex-1" />
          <button
            onClick={() => void send()}
            disabled={disabled || busy || !value.trim()}
            className="flex items-center justify-center rounded transition-colors"
            style={{
              width: 28,
              height: 28,
              background: "var(--t-ink)",
              color: "var(--t-paper)",
              border: "1px solid var(--t-ink)",
              opacity: disabled || !value.trim() ? 0.4 : 1,
              cursor: disabled || !value.trim() ? "default" : "pointer",
              borderRadius: 4,
            }}
            aria-label="Send"
            type="button"
          >
            {busy ? (
              <RefreshCw size={13} style={{ animation: "spin 1s linear infinite" }} />
            ) : (
              <ArrowUp size={14} />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
