"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export default function DeleteAccountDialog({
  open,
  onOpenChange,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  onConfirm: () => void;
}) {
  const [text, setText] = useState("");
  const valid = text === "DELETE";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Delete Your Account</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-ink-muted leading-snug">
          This action is irreversible. All your data, sessions, integrations,
          and billing will be permanently deleted.
        </p>
        <p className="text-sm text-ink-muted">
          Please type <strong>DELETE</strong> to confirm.
        </p>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-md border border-line bg-paper px-3 py-2 text-base focus:outline-none focus:border-line-strong"
        />
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-sm rounded-md border border-line bg-paper px-3 py-1.5 hover:border-line-strong"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={onConfirm}
            className="text-sm rounded-md bg-brick text-paper px-3 py-1.5 disabled:opacity-40"
          >
            Delete Account
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
