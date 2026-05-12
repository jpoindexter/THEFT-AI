"use client";

import { useState } from "react";
import { X } from "lucide-react";

const VERSION = "v1.0.0";

const CHANGELOG = [
  {
    title: "Cofounder 2: Run an Entire Company with Agents",
    body: "Introducing Cofounder 2: The infrastructure for the one-person billion-dollar company — orchestrating agents across engineering, sales, marketing, ops, and design.",
  },
  {
    title: "Agents on an Org Chart",
    body: "Your agents sit on your org chart, enabling massive parallel work. Each agent gets a specialized workspace tailored to its function. At the highest level, Cofounder manages it all — kicking off tasks, monitoring work, and executing long-term strategy.",
  },
  {
    title: "A Roadmap for the Whole Company",
    body: "There's a lot to do when starting a business. As we took inspiration from RTS games like C&C and built in a roadmap of an entire company, tick off the next step while maintaining full business context.",
  },
  {
    title: "Departments That Actually Run",
    body: "Cofounder orchestrates departments like marketing, sales, and engineering. Each sales department prospect and connects, and engineering the product and then distributes channels.",
  },
];

export default function FreshUpdates() {
  const [visible, setVisible] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  if (!visible) return null;

  return (
    <>
      <div className="fixed bottom-5 left-5 z-50 w-48 rounded-xl border border-line/80 bg-paper shadow-lg p-3 text-sm">
        <button
          type="button"
          onClick={() => setVisible(false)}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => setModalOpen(false)}
          />
          <div className="relative w-full max-w-lg rounded-xl bg-paper border border-line/70 shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="px-6 pt-6 pb-4 border-b border-line/70">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base font-medium text-ink">
                    Fresh updates
                  </h2>
                  <p className="text-xs text-ink-muted mt-1 leading-snug max-w-sm">
                    Cofounder 2: infrastructure for the one-person billion-dollar company, orchestrating agents across engineering, sales, marketing, ops, and design.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="text-ink-soft hover:text-ink ml-4 shrink-0"
                  aria-label="Close"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>
            <div className="overflow-y-auto px-6 py-4 space-y-5">
              {CHANGELOG.map((entry) => (
                <div key={entry.title}>
                  <h3 className="text-sm font-medium text-ink mb-1">
                    {entry.title}
                  </h3>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {entry.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
