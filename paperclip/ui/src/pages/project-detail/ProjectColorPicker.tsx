import { PROJECT_COLORS } from "@paperclipai/shared";
import { Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

type ProjectColorPickerProps = {
  currentColor: string;
  onSelect: (color: string) => void;
};

function ColorDot({ color, selected = false }: { color: string; selected?: boolean }) {
  return (
    <svg className="size-4" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r={selected ? 7 : 6} fill={color} />
    </svg>
  );
}

export function ProjectColorPicker({ currentColor, onSelect }: ProjectColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          size="icon-xs"
          className="size-7"
          aria-label="Change project color"
        >
          <ColorDot color={currentColor} selected />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-2">
        <div className="grid grid-cols-5 gap-1.5">
          {PROJECT_COLORS.map((color) => {
            const selected = color === currentColor;
            return (
              <Button
                key={color}
                type="button"
                variant={selected ? "secondary" : "ghost"}
                size="icon-xs"
                className="size-7"
                onClick={() => onSelect(color)}
                aria-label={`Select color ${color}`}
              >
                {selected ? <Check className="size-3" /> : <ColorDot color={color} />}
              </Button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
