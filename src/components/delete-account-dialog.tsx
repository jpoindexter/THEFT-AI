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
        <p className="text-[12px] text-stone-500 leading-snug">
          This action is irreversible. All your data, sessions, integrations,
          and billing will be permanently deleted.
        </p>
        <p className="text-[12px] text-stone-500">
          Please type <strong>DELETE</strong> to confirm.
        </p>
        <input
          autoFocus
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full rounded-md border border-stone-200 bg-white px-3 py-2 text-[13px] focus:outline-none focus:border-stone-400"
        />
        <DialogFooter>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="text-[12px] rounded-md border border-stone-200 bg-white px-3 py-1.5 hover:border-stone-400"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!valid}
            onClick={onConfirm}
            className="text-[12px] rounded-md bg-red-600 text-white px-3 py-1.5 disabled:opacity-40"
          >
            Delete Account
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
