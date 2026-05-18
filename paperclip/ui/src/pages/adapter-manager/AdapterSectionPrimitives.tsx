import { Cpu } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export function AdapterSectionHeading({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2">
      <Cpu className="h-5 w-5 text-muted-foreground" />
      <h2 className="text-base font-semibold">{title}</h2>
    </div>
  );
}

export function EmptyExternalAdapters() {
  return (
    <Card className="bg-muted/30">
      <CardContent className="flex flex-col items-center justify-center py-10">
        <Cpu className="mb-4 h-10 w-10 text-muted-foreground" />
        <p className="text-sm font-medium">No external adapters installed</p>
        <p className="mt-1 text-xs text-muted-foreground">Install an adapter package to extend model support.</p>
      </CardContent>
    </Card>
  );
}
