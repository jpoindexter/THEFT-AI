"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Upload, AlertTriangle } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
  ButtonGhost,
} from "@/components/ui/primitives";
import { toast } from "@/components/toast-host";

type Mode = "merge" | "replace";

type Snapshot = {
  organization?: { name?: string; slug?: string };
  departments?: unknown[];
  agents?: unknown[];
  tasks?: unknown[];
  artifacts?: unknown[];
  tech_tree_status?: unknown[];
};

export default function ImportWorkspacePage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [raw, setRaw] = useState("");
  const [parsed, setParsed] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("merge");
  const [busy, setBusy] = useState(false);

  function parse() {
    try {
      const json = JSON.parse(raw);
      setParsed(json as Snapshot);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Invalid JSON");
      setParsed(null);
    }
  }

  function apply() {
    if (!parsed) return;
    setBusy(true);
    setTimeout(() => {
      setBusy(false);
      toast(`Imported into ${params.org}`, "ok");
      router.replace(`/${params.org}`);
    }, 600);
  }

  return (
    <>
      <Link
        href={`/${params.org}/settings/organization`}
        className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink mb-3"
      >
        <ArrowLeft className="size-3" /> Back to organization
      </Link>

      <Eyebrow>Workspace</Eyebrow>
      <PageTitle>Import workspace.json</PageTitle>
      <Hint>
        Paste a snapshot exported from another THEFT workspace. Always preview
        first; replace mode is destructive.
      </Hint>

      <Card className="mt-5">
        <CardBody>
          <Eyebrow>Snapshot JSON</Eyebrow>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            rows={10}
            placeholder='{"organization": {...}, "agents": [...] }'
            className="w-full mt-2 rounded-md border border-line bg-canvas px-3 py-2 text-2xs font-mono leading-relaxed focus:outline-none focus:border-line-strong"
          />
          {error && (
            <div className="text-xs text-brick-ink mt-1 font-mono">
              {error}
            </div>
          )}
          <div className="flex justify-end mt-2">
            <ButtonGhost
              onClick={parse}
              disabled={!raw.trim()}
              className="text-xs px-3 py-1"
            >
              Parse & preview
            </ButtonGhost>
          </div>
        </CardBody>
      </Card>

      {parsed && (
        <Card className="mt-4">
          <CardBody>
            <div className="flex items-center justify-between">
              <Eyebrow>Preview</Eyebrow>
              <Pill tone="sage">parsed ok</Pill>
            </div>
            <ul className="mt-2 grid grid-cols-2 gap-1.5 text-sm">
              <li>
                <span className="text-ink-muted">Workspace:</span>{" "}
                <span className="font-mono">
                  {parsed.organization?.name ?? "—"}
                </span>
              </li>
              <li>
                <span className="text-ink-muted">Departments:</span>{" "}
                <span className="font-mono">{parsed.departments?.length ?? 0}</span>
              </li>
              <li>
                <span className="text-ink-muted">Agents:</span>{" "}
                <span className="font-mono">{parsed.agents?.length ?? 0}</span>
              </li>
              <li>
                <span className="text-ink-muted">Tasks:</span>{" "}
                <span className="font-mono">{parsed.tasks?.length ?? 0}</span>
              </li>
              <li>
                <span className="text-ink-muted">Artifacts:</span>{" "}
                <span className="font-mono">
                  {parsed.artifacts?.length ?? 0}
                </span>
              </li>
              <li>
                <span className="text-ink-muted">Tech-tree status:</span>{" "}
                <span className="font-mono">
                  {parsed.tech_tree_status?.length ?? 0}
                </span>
              </li>
            </ul>
          </CardBody>
        </Card>
      )}

      <Card className="mt-4">
        <CardBody>
          <Eyebrow>Apply mode</Eyebrow>
          <div className="grid grid-cols-2 gap-1.5 mt-2">
            <ModeButton
              on={mode === "merge"}
              onClick={() => setMode("merge")}
              title="Merge"
              body="Add anything missing; never overwrite existing rows."
            />
            <ModeButton
              on={mode === "replace"}
              onClick={() => setMode("replace")}
              title="Replace"
              body="Wipe current workspace state and use the snapshot."
              tone="brick"
            />
          </div>
          {mode === "replace" && (
            <div className="mt-2 inline-flex items-center gap-1 text-xs text-brick-ink">
              <AlertTriangle className="size-3" />
              Destructive. Export current state first.
            </div>
          )}
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2 mt-5">
        <Link
          href={`/${params.org}/settings/organization`}
          className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
        >
          Cancel
        </Link>
        <ButtonPrimary
          onClick={apply}
          disabled={!parsed || busy}
          className="inline-flex items-center gap-1"
        >
          <Upload className="size-3.5" />
          {busy ? "Importing…" : `Apply ${mode}`}
        </ButtonPrimary>
      </div>
    </>
  );
}

function ModeButton({
  on,
  onClick,
  title,
  body,
  tone,
}: {
  on: boolean;
  onClick: () => void;
  title: string;
  body: string;
  tone?: "brick";
}) {
  const onBg = tone === "brick" ? "bg-brick/10 border-brick/40" : "bg-cream border-ink";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left rounded-md border px-3 py-2 transition-colors ${
        on ? onBg : "border-line hover:border-line-strong"
      }`}
    >
      <div className="text-sm font-medium tracking-tight">{title}</div>
      <Hint>{body}</Hint>
    </button>
  );
}
