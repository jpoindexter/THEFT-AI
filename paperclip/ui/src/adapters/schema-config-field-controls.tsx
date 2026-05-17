import { useEffect, useRef, useCallback, useState } from "react";
import type { KeyboardEvent } from "react";
import { ChevronDown } from "lucide-react";

import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "../components/ui/popover";

export const inputClass =
  "w-full rounded-md border border-border px-2.5 py-1.5 bg-transparent outline-none text-sm font-mono placeholder:text-muted-foreground/40";

type SelectFieldProps = {
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
};

// Extracted to keep hooks at component top level.
export function SelectField({ value, options, onChange }: SelectFieldProps) {
  const [open, setOpen] = useState(false);
  const selectedOpt = options.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="w-full justify-between font-normal"
        >
          <span className={!value ? "text-muted-foreground" : ""}>
            {selectedOpt?.label ?? value ?? "Select..."}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-(--radix-popover-trigger-width) p-1" align="start">
        {options.map((opt) => (
          <Button
            key={opt.value}
            type="button"
            variant="ghost"
            size="sm"
            className={`h-auto w-full justify-start px-2 py-1.5 font-normal ${
              opt.value === value ? "bg-accent" : ""
            }`}
            onMouseDown={(e) => {
              e.preventDefault();
              onChange(opt.value);
              setOpen(false);
            }}
          >
            <span>{opt.label}</span>
          </Button>
        ))}
      </PopoverContent>
    </Popover>
  );
}

export type ComboboxOption = {
  label: string;
  value: string;
  group?: string;
};

type ComboboxFieldProps = {
  value: string;
  options: ComboboxOption[];
  onChange: (val: string) => void;
  placeholder?: string;
};

export function ComboboxField({
  value,
  options,
  onChange,
  placeholder,
}: ComboboxFieldProps) {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFilter("");
  }, [value]);

  const filtered = options.filter((opt) => {
    if (!filter) return true;
    const q = filter.toLowerCase();
    return (
      opt.value.toLowerCase().includes(q) ||
      opt.label.toLowerCase().includes(q) ||
      (opt.group && opt.group.toLowerCase().includes(q))
    );
  });

  const selectedOpt = options.find((o) => o.value === value);
  const displayValue = filter || selectedOpt?.value || value || "";

  const grouped = new Map<string, typeof filtered>();
  for (const opt of filtered) {
    const group = opt.group ?? "";
    if (!grouped.has(group)) grouped.set(group, []);
    grouped.get(group)!.push(opt);
  }

  const select = useCallback(
    (val: string) => {
      onChange(val);
      setOpen(false);
      setFilter("");
      inputRef.current?.blur();
    },
    [onChange],
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (filtered.length === 1) {
        select(filtered[0].value);
      } else if (filter) {
        select(filter);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setFilter("");
    } else if (e.key === "ArrowDown" && !open) {
      e.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div className="relative">
      <div className="flex items-center gap-0">
        <Input
          ref={inputRef}
          type="text"
          className="flex-1 rounded-r-none border-r-0 font-mono placeholder:text-muted-foreground/40 focus:z-10"
          value={displayValue}
          placeholder={placeholder ?? "Type or select..."}
          onChange={(e) => {
            setFilter(e.target.value);
            if (!open) setOpen(true);
          }}
          onFocus={() => {
            if (!open) setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => setOpen(false), 150);
          }}
          onKeyDown={handleKeyDown}
        />
        <Popover open={open && filtered.length > 0} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size="icon-sm"
              className="rounded-l-none"
            >
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="max-h-60 min-w-72 overflow-y-auto p-1"
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
          >
            {Array.from(grouped.entries()).map(([group, opts]) => (
              <div key={group || "_ungrouped"}>
                {group && (
                  <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                    {group}
                  </div>
                )}
                {opts.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant="ghost"
                    size="sm"
                    className={`h-auto w-full justify-start px-2 py-1.5 font-normal ${
                      opt.value === value ? "bg-accent" : ""
                    }`}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(opt.value);
                    }}
                  >
                    <span className="truncate">{opt.label}</span>
                  </Button>
                ))}
              </div>
            ))}
            {filter && filtered.length === 0 && (
              <div className="px-2 py-1.5 text-sm text-muted-foreground">
                Use &quot;{filter}&quot; as custom value (press Enter)
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
