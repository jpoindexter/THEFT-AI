"use client";

import { useState } from "react";
import { toast } from "@/components/toast-host";

export default function OrgNameForm({ org, initialName }: { org: string; initialName: string }) {
  const [name, setName] = useState(initialName);
  const [saved, setSaved] = useState(false);

  async function save() {
    if (!name.trim() || name === initialName) return;
    const res = await fetch(`/api/${org}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() }),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast("Organization name updated", "ok");
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input
        value={name}
        onChange={(e) => { setName(e.target.value); setSaved(false); }}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && save()}
        className="w-56 h-9 rounded-md border border-line bg-paper px-3 text-base focus:outline-none focus:border-line-strong"
      />
      {saved && <span className="text-xs text-sage-ink">Saved</span>}
    </div>
  );
}
