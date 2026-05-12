"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

const VERSION = "v1.0.1";
const STORAGE_KEY = "cofounder-dismissed-update";

const UPDATE = {
  title: "Platform updates: faster infrastructure and stronger coding agents",
  description: "We've made the coding agent more reliable and improved infrastructure for a smoother experience.",
  sections: [
    {
      title: "More Reliable Infrastructure",
      body: "Cofounder now handles local development, previews, and longer-running agent work more reliably, with fewer interruptions during active tasks.",
    },
    {
      title: "Stronger Coding Agents",
      body: "Coding agents are better at understanding the repo, making code changes, following existing patterns, and verifying work before handing it back.",
    },
  ],
};

export default function FreshUpdates() {
  const [toastVisible, setToastVisible] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    if (dismissed !== VERSION) {
      setToastVisible(true);
    }
  }, []);

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, VERSION);
    setToastVisible(false);
    setModalOpen(false);
  }

  return (
    <>
      {/* Bottom-left toast */}
      {toastVisible && (
        <div className="fixed bottom-5 left-5 z-50 w-48 rounded-xl border border-line/80 bg-paper shadow-lg p-3 text-sm">
          <button
            type="button"
            onClick={dismiss}
            className="absolute top-2 right-2 text-ink-soft hover:text-ink"
            aria-label="Dismiss"
          >
            <X className="size-3" />
          </button>
          <div className="flex items-baseline gap-1.5 mb-1">
            <span className="font-medium text-ink">Fresh updates</span>
            <span className="text-2xs text-ink-soft">{VERSION}</span>
          </div>
          <p className="text-xs text-ink-muted leading-snug mb-2">
            Cofounder 2: infrastructure for the one-person billion-dollar company, orchestrating agents across engineering, sales, marketing, ops, and design.
          </p>
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="w-full text-xs rounded-md bg-ink text-paper px-2 py-1.5 hover:opacity-90"
          >
            View details
          </button>
        </div>
      )}

      {/* Dark centered modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="w-[420px] rounded-xl bg-[#1a1a1a] overflow-hidden">
            <div className="px-6 py-5">
              <h2 className="text-base font-semibold text-white leading-snug mb-1">
                {UPDATE.title}
              </h2>
              <p className="text-sm text-white/50 leading-relaxed">
                {UPDATE.description}
              </p>
            </div>

            {UPDATE.sections.map((section, i) => (
              <div key={i}>
                <div className="border-t border-white/10" />
                <div className="px-6 py-4">
                  <h3 className="text-sm font-semibold text-white mb-1">
                    {section.title}
                  </h3>
                  <p className="text-sm text-white/50 leading-relaxed">
                    {section.body}
                  </p>
                </div>
              </div>
            ))}

            <div className="border-t border-white/10 px-6 py-4 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={dismiss}
                className="px-4 py-2 text-sm text-white/60 border border-white/20 rounded-md hover:border-white/40 hover:text-white/80 transition-colors"
              >
                Dismiss
              </button>
              <Link
                href="/release-notes"
                onClick={dismiss}
                className="px-4 py-2 text-sm text-white/80 border border-white/20 rounded-md hover:border-white/40 hover:text-white transition-colors inline-flex items-center gap-1.5"
              >
                Read the details
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 10L10 2M10 2H4M10 2v6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
