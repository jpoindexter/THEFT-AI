import type { ChangeEvent, RefObject } from "react";
import { Paperclip } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function IssueChatComposerAttachButton({
  attaching,
  inputRef,
  onChange,
}: {
  attaching: boolean;
  inputRef: RefObject<HTMLInputElement | null>;
  onChange: (evt: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <>
      <Input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={onChange}
      />
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={() => inputRef.current?.click()}
        disabled={attaching}
        title="Attach file"
      >
        <Paperclip className="h-4 w-4" />
      </Button>
    </>
  );
}
