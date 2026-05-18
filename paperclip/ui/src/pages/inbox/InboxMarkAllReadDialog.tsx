import type { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function InboxMarkAllReadDialog({
  pending,
  showConfirm,
  unreadCount,
  setShowConfirm,
  onConfirm,
}: {
  pending: boolean;
  showConfirm: boolean;
  unreadCount: number;
  setShowConfirm: Dispatch<SetStateAction<boolean>>;
  onConfirm: () => void;
}) {
  return (
    <>
      <Button type="button" variant="outline" size="sm" className="h-8 shrink-0" onClick={() => setShowConfirm(true)} disabled={pending}>
        {pending ? "Marking…" : "Mark all as read"}
      </Button>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Mark all as read?</DialogTitle>
            <DialogDescription>
              This will mark {unreadCount} unread {unreadCount === 1 ? "item" : "items"} as read.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>Cancel</Button>
            <Button onClick={onConfirm}>Mark all as read</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
