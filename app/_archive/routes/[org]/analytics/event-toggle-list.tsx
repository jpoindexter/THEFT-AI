'use client';

import { useState } from "react";

const INITIAL_EVENTS = [
  "signed_up",
  "onboarding_completed",
  "core_action_completed",
  "trial_started",
  "checkout_completed",
  "subscription_upgraded",
  "teammate_invited",
  "support_ticket_opened",
] as const;

type EventName = (typeof INITIAL_EVENTS)[number];

type EventState = { name: EventName; on: boolean };

export function EventToggleList() {
  const [events, setEvents] = useState<EventState[]>(
    INITIAL_EVENTS.map((name) => ({ name, on: true })),
  );

  function toggle(name: EventName) {
    setEvents((prev) =>
      prev.map((e) => (e.name === name ? { ...e, on: !e.on } : e)),
    );
  }

  return (
    <div className="rounded-xl border border-line/70 bg-paper overflow-hidden">
      {events.map((e, i) => (
        <div
          key={e.name}
          className={`flex items-center gap-3 px-4 py-2.5 ${
            i < events.length - 1 ? "border-b border-line/40" : ""
          }`}
        >
          <div
            className={`size-1.5 rounded-full shrink-0 ${
              e.on ? "bg-sage-ink" : "bg-line"
            }`}
          />
          <span className="flex-1 text-xs font-mono text-ink">{e.name}</span>
          <button
            type="button"
            onClick={() => toggle(e.name)}
            aria-pressed={e.on}
            aria-label={`Toggle ${e.name}`}
            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink ${
              e.on
                ? "bg-sage/70 border-sage/50"
                : "bg-cream border-line"
            }`}
          >
            <span
              className={`pointer-events-none inline-block size-3 rounded-full bg-paper shadow transition-transform ${
                e.on ? "translate-x-3" : "translate-x-0.5"
              } my-auto`}
            />
          </button>
          <span
            className={`text-2xs w-6 text-right ${
              e.on ? "text-sage-ink" : "text-ink-soft"
            }`}
          >
            {e.on ? "on" : "off"}
          </span>
        </div>
      ))}
    </div>
  );
}
