import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

type SignOutSectionProps = {
  isPending: boolean;
  onSignOut: () => void;
};

export function SignOutSection({ isPending, onSignOut }: SignOutSectionProps) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1.5">
          <h2 className="text-sm font-semibold">Sign out</h2>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Sign out of this Paperclip instance. You will be redirected to the login page.
          </p>
        </div>
        <Button variant="outline" size="sm" disabled={isPending} onClick={onSignOut}>
          <LogOut className="size-4" />
          {isPending ? "Signing out..." : "Sign out"}
        </Button>
      </div>
    </section>
  );
}
