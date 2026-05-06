"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Upload as UploadIcon, FileText } from "lucide-react";
import {
  Card,
  CardBody,
  Eyebrow,
  Hint,
  PageTitle,
  Pill,
  ButtonPrimary,
} from "@/components/ui/primitives";

const KINDS = [
  "markdown",
  "pdf",
  "image",
  "video",
  "code",
  "json",
  "other",
] as const;

const DEPARTMENTS = [
  "engineering",
  "design",
  "marketing",
  "sales",
  "operations",
  "finance",
  "legal",
  "support",
];

export default function LibraryUploadPage() {
  const params = useParams<{ org: string }>();
  const router = useRouter();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<(typeof KINDS)[number]>("markdown");
  const [department, setDepartment] = useState("operations");
  const [pinned, setPinned] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const ready = !!name && (kind === "markdown" ? true : !!file);

  return (
    <div className="absolute inset-0 overflow-y-auto p-6">
      <div className="max-w-2xl mx-auto space-y-5">
        <Link
          href={`/${params.org}/library`}
          className="inline-flex items-center gap-1 text-xs text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-3" /> Back to library
        </Link>

        <header>
          <Eyebrow>Library</Eyebrow>
          <PageTitle>Upload artifact</PageTitle>
          <Hint>
            Files dropped here become readable by every agent in the workspace.
            Pin the ones agents should always see.
          </Hint>
        </header>

        <Card>
          <CardBody>
            <Field label="Name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. ICP brief — May 2026"
                className="w-full h-9 rounded-md border border-line bg-paper px-3 text-sm focus:outline-none focus:border-line-strong"
              />
            </Field>
            <Field label="Department">
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-9 rounded-md border border-line bg-paper px-2 text-sm"
              >
                {DEPARTMENTS.map((d) => (
                  <option key={d} value={d}>
                    {d[0].toUpperCase() + d.slice(1)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Kind">
              <select
                value={kind}
                onChange={(e) =>
                  setKind(e.target.value as (typeof KINDS)[number])
                }
                className="w-full h-9 rounded-md border border-line bg-paper px-2 text-sm"
              >
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </Field>

            {kind === "markdown" ? (
              <Field
                label="Body"
                hint="Plain markdown. Will render in the artifact viewer."
              >
                <textarea
                  rows={6}
                  placeholder="# Heading…"
                  className="w-full rounded-md border border-line bg-paper px-3 py-2 text-sm font-mono focus:outline-none focus:border-line-strong"
                />
              </Field>
            ) : (
              <Field label="File">
                <FileDrop file={file} onFile={setFile} />
              </Field>
            )}

            <label className="inline-flex items-center gap-2 text-xs">
              <input
                type="checkbox"
                checked={pinned}
                onChange={(e) => setPinned(e.target.checked)}
              />
              Pin (always visible to agents)
            </label>
          </CardBody>
        </Card>

        <div className="flex justify-end gap-2">
          <Link
            href={`/${params.org}/library`}
            className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </Link>
          <ButtonPrimary
            disabled={!ready}
            onClick={() => router.replace(`/${params.org}/library`)}
            className="inline-flex items-center gap-1"
          >
            <UploadIcon className="size-3.5" /> Upload
          </ButtonPrimary>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <div className="text-sm text-ink">{label}</div>
      {children}
      {hint && <Hint>{hint}</Hint>}
    </div>
  );
}

function FileDrop({
  file,
  onFile,
}: {
  file: File | null;
  onFile: (f: File | null) => void;
}) {
  return (
    <label
      className={`flex flex-col items-center justify-center gap-1 rounded-md border border-dashed px-4 py-6 text-center cursor-pointer ${
        file
          ? "border-sage/60 bg-sage/10"
          : "border-line-strong hover:border-line-strong/80"
      }`}
    >
      <input
        type="file"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      <FileText className="size-5 text-ink-muted" />
      {file ? (
        <>
          <div className="text-sm">{file.name}</div>
          <Pill tone="sage">{(file.size / 1024).toFixed(1)} KB</Pill>
        </>
      ) : (
        <>
          <div className="text-sm">Click or drop a file here</div>
          <Hint>Up to 25 MB · pdf, image, video, code, json, other</Hint>
        </>
      )}
    </label>
  );
}
