"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const GROUPS: { name: string; rows: { keys: string[]; label: string }[] }[] = [
  {
    name: "Global",
    rows: [
      { keys: ["⌘", "K"], label: "Open search" },
      { keys: ["⌘", "/"], label: "Open keyboard shortcuts" },
      { keys: ["⌘", "."], label: "Toggle review queue" },
      { keys: ["G", "H"], label: "Go to home" },
      { keys: ["G", "T"], label: "Go to tasks" },
      { keys: ["G", "L"], label: "Go to library" },
    ],
  },
  {
    name: "Canvas",
    rows: [
      { keys: ["Space", "Drag"], label: "Pan canvas" },
      { keys: ["⌘", "Scroll"], label: "Zoom" },
      { keys: ["0"], label: "Fit to screen" },
      { keys: ["1"], label: "Zoom to 100%" },
    ],
  },
  {
    name: "Tasks",
    rows: [
      { keys: ["N"], label: "New task" },
      { keys: ["P"], label: "Toggle plan mode" },
      { keys: ["Enter"], label: "Submit task" },
      { keys: ["Esc"], label: "Close composer" },
    ],
  },
];

export default function KeyboardShortcutsDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 bg-paper">
        <DialogHeader className="px-4 py-3 border-b border-line/70">
          <DialogTitle className="text-md font-medium tracking-tight">
            Keyboard shortcuts
          </DialogTitle>
        </DialogHeader>
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          {GROUPS.map((g) => (
            <section key={g.name}>
              <div className="text-2xs uppercase tracking-[0.14em] text-ink-soft mb-2">
                {g.name}
              </div>
              <ul className="space-y-1">
                {g.rows.map((r) => (
                  <li
                    key={r.label}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-ink">{r.label}</span>
                    <span className="flex items-center gap-1">
                      {r.keys.map((k) => (
                        <kbd
                          key={k}
                          className="rounded border border-line bg-canvas px-1.5 py-0.5 text-2xs font-mono text-ink min-w-[20px] text-center"
                        >
                          {k}
                        </kbd>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
