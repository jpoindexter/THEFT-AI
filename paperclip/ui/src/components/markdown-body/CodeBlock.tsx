import { useCallback, useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { Check, Copy } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  flattenText,
  MARKDOWN_SCROLLABLE_BLOCK_CLASS,
} from "./utils";

type CodeBlockProps = {
  children: ReactNode;
  preProps: HTMLAttributes<HTMLPreElement>;
};

export function CodeBlock({ children, preProps }: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  const preRef = useRef<HTMLPreElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  const handleCopy = useCallback(async () => {
    const text = preRef.current?.innerText ?? flattenText(children);
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.className = "fixed left-0 top-0 -translate-x-full opacity-0";
        textarea.tabIndex = -1;
        textarea.setAttribute("aria-hidden", "true");
        document.body.appendChild(textarea);
        try {
          textarea.select();
          const success = document.execCommand("copy");
          if (!success) throw new Error("execCommand copy failed");
        } finally {
          document.body.removeChild(textarea);
        }
      }
      setFailed(false);
      setCopied(true);
    } catch {
      setFailed(true);
      setCopied(true);
    }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setCopied(false);
      setFailed(false);
    }, 1500);
  }, [children]);

  const label = failed ? "Copy failed" : copied ? "Copied!" : "Copy";

  return (
    <div className="paperclip-markdown-codeblock">
      <pre
        {...preProps}
        ref={preRef}
        className={cn(preProps.className, MARKDOWN_SCROLLABLE_BLOCK_CLASS)}
      >
        {children}
      </pre>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleCopy}
        aria-label="Copy code"
        title={label}
        className="paperclip-markdown-codeblock-copy"
        data-copied={copied || undefined}
        data-failed={failed || undefined}
      >
        {copied && !failed ? (
          <Check aria-hidden="true" className="h-3.5 w-3.5" />
        ) : (
          <Copy aria-hidden="true" className="h-3.5 w-3.5" />
        )}
        <span className="paperclip-markdown-codeblock-copy-label">{label}</span>
      </Button>
    </div>
  );
}
