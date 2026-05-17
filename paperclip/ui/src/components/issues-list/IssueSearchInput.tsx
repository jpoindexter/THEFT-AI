import { startTransition, useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  shouldBlurPageSearchOnEnter,
  shouldBlurPageSearchOnEscape,
} from "../../lib/keyboardShortcuts";
import { ISSUE_SEARCH_DEBOUNCE_MS } from "./constants";

export function IssueSearchInput({
  value,
  onDebouncedChange,
}: {
  value: string;
  onDebouncedChange?: (search: string) => void;
}) {
  const [draftValue, setDraftValue] = useState(value);
  const lastCommittedValueRef = useRef(value);

  useEffect(() => {
    setDraftValue(value);
    lastCommittedValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (!onDebouncedChange || draftValue === lastCommittedValueRef.current) return;

    const timeoutId = window.setTimeout(() => {
      lastCommittedValueRef.current = draftValue;
      startTransition(() => {
        onDebouncedChange(draftValue);
      });
    }, ISSUE_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [draftValue, onDebouncedChange]);

  return (
    <div className="relative w-48 sm:w-64 md:w-80">
      <Search className="pointer-events-none absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={draftValue}
        onChange={(event) => {
          setDraftValue(event.target.value);
        }}
        onKeyDown={(event) => {
          if (shouldBlurPageSearchOnEnter({
            key: event.key,
            isComposing: event.nativeEvent.isComposing,
          })) {
            event.currentTarget.blur();
            return;
          }

          if (shouldBlurPageSearchOnEscape({
            key: event.key,
            isComposing: event.nativeEvent.isComposing,
            currentValue: event.currentTarget.value,
          })) {
            event.currentTarget.blur();
          }
        }}
        placeholder="Search issues..."
        className="pl-7 text-xs sm:text-sm"
        aria-label="Search issues"
        data-page-search-target="true"
      />
    </div>
  );
}
