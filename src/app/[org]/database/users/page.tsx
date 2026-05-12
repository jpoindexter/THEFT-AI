"use client";

import { useState } from "react";
import { Download, X } from "lucide-react";

export default function UsersPage() {
  const [showDialog, setShowDialog] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmed, setConfirmed] = useState(true);

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-medium tracking-tight">Users</h1>
          <p className="text-sm text-ink-muted">View user signups over time.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="rounded-md border border-line/70 bg-paper px-2 py-1 text-xs text-ink-muted">
            Last 90 days ▾
          </div>
          <button
            type="button"
            onClick={() => setShowDialog(true)}
            className="inline-flex items-center gap-1 rounded-md bg-ink text-paper text-xs px-3 py-1.5 hover:opacity-90"
          >
            + Add user
          </button>
        </div>
      </header>

      <div className="rounded-lg border border-line/70 bg-paper p-4">
        <SignupChart />
      </div>

      <div className="rounded-lg border border-line/70 bg-paper overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2 border-b border-line/70">
          <span className="text-sm font-medium text-ink">Recent users</span>
          <button type="button" className="text-ink-soft hover:text-ink" aria-label="Export">
            <Download className="size-3.5" />
          </button>
        </div>
        <div className="px-4 py-8 text-center text-sm text-ink-muted">
          The query returned no results.
        </div>
      </div>

      {showDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-black/30" onClick={() => setShowDialog(false)} />
          <div className="relative w-full max-w-sm rounded-xl bg-paper border border-line/70 shadow-xl p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-base font-medium text-ink">Create auth user</div>
                <p className="text-xs text-ink-muted mt-0.5">
                  This creates a user in Supabase Auth with a password you provide here.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="text-ink-soft hover:text-ink"
                aria-label="Close"
              >
                <X className="size-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-ink-muted block mb-1">Email</label>
                <input
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                  type="email"
                  className="w-full rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm focus:outline-none focus:border-line-strong"
                />
              </div>
              <div>
                <label className="text-xs text-ink-muted block mb-1">Password</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="••••••••"
                  className="w-full rounded-md border border-line/70 bg-paper px-3 py-1.5 text-sm focus:outline-none focus:border-line-strong"
                />
                <p className="text-2xs text-ink-muted mt-1">
                  Share this securely with the user after creation.
                </p>
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-0.5"
                />
                <div>
                  <div className="text-sm text-ink">Mark email as confirmed</div>
                  <p className="text-2xs text-ink-muted mt-0.5 leading-snug">
                    Leave this on so the user can sign in immediately without a confirmation email.
                  </p>
                </div>
              </label>
            </div>
            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDialog(false)}
                className="text-sm rounded-md border border-line px-3 py-1.5 hover:border-line-strong"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!email.trim() || !password.trim()}
                className="text-sm rounded-md bg-ink text-paper px-3 py-1.5 hover:opacity-90 disabled:opacity-40"
              >
                Create user
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SignupChart() {
  const months = ["Feb 6","Feb 12","Feb 18","Feb 24","Mar 2","Mar 8","Mar 14","Mar 20","Mar 26","Apr 1","Apr 6","Apr 12","Apr 18","Apr 24","Apr 30","May 6"];
  const vals = [0,0,0,0,0,1,0,0,2,0,1,0,3,1,0,0];
  const max = 4;
  const h = 80;

  const points = vals.map((v, i) => {
    const x = (i / (vals.length - 1)) * 100;
    const y = h - (v / max) * h;
    return `${x},${y}`;
  }).join(" ");

  return (
    <div className="space-y-1">
      <div className="flex items-end gap-1 text-2xs text-ink-soft">
        {[max, 3, 2, 1, 0].map((n) => (
          <span key={n} className="w-3 text-right shrink-0">{n}</span>
        ))}
      </div>
      <svg
        viewBox={`0 0 100 ${h}`}
        preserveAspectRatio="none"
        className="w-full h-20"
      >
        <polyline
          points={points}
          fill="none"
          stroke="currentColor"
          strokeWidth="0.8"
          className="text-line-strong"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="flex items-center justify-between text-2xs text-ink-soft overflow-hidden">
        {months.filter((_, i) => i % 4 === 0).map((m) => (
          <span key={m}>{m}</span>
        ))}
      </div>
    </div>
  );
}
