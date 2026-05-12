"use client";

import { useState, useRef, type DragEvent, type ChangeEvent } from "react";
import { Upload, FileText, Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

const MAX_BYTES = 10 * 1024 * 1024;

export default function BankStatementPage() {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function acceptFile(f: File) {
    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("File exceeds the 10 MB limit.");
      return;
    }
    setError(null);
    setFile(f);
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) acceptFile(f);
  }

  function onInputChange(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) acceptFile(f);
    e.target.value = "";
  }

  function clearFile() {
    setFile(null);
    setError(null);
  }

  async function onConvert() {
    if (!file || loading) return;
    setLoading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/convert/bank-statement", {
        method: "POST",
        body,
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(data.error ?? "Conversion failed. Please try again.");
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const date = new Date().toISOString().slice(0, 10);
      a.download = `transactions-${date}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto py-12 px-4">
      <h1 className="text-xl font-semibold tracking-tight mb-1">
        Bank Statement → Excel
      </h1>
      <p className="text-sm text-muted-foreground mb-8">
        Upload a PDF bank statement and download a .xlsx file with transactions
        in rows.
      </p>

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        aria-label="Upload PDF bank statement"
        className={cn(
          "border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors select-none",
          dragging
            ? "border-primary bg-primary/10"
            : file
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50",
        )}
        onDrop={onDrop}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          aria-hidden="true"
          onChange={onInputChange}
        />

        {file ? (
          <div className="flex items-center justify-center gap-3">
            <FileText className="size-5 text-primary shrink-0" />
            <span className="text-sm font-medium truncate max-w-[260px]">
              {file.name}
            </span>
            <button
              type="button"
              aria-label="Remove file"
              className="ml-1 text-muted-foreground hover:text-foreground transition-colors"
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
            >
              <X className="size-4" />
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop or click to select a PDF
            </p>
            <p className="text-xs text-muted-foreground/60">Max 10 MB</p>
          </div>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <p className="mt-3 text-sm text-destructive" role="alert">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onConvert}
        disabled={!file || loading}
        className="mt-6 w-full h-10 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2 transition-opacity hover:opacity-90"
      >
        {loading && <Loader2 className="size-4 animate-spin" />}
        {loading ? "Converting…" : "Upload & Convert"}
      </button>
    </div>
  );
}
