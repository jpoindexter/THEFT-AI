import { Input } from "@/components/ui/input";

export function AgentIdentityFields({
  name,
  title,
  onNameChange,
  onTitleChange,
}: {
  name: string;
  title: string;
  onNameChange: (value: string) => void;
  onTitleChange: (value: string) => void;
}) {
  return (
    <>
      <div className="px-4 pb-2 pt-4">
        <Input
          className="h-auto border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          placeholder="Agent name"
          value={name}
          onChange={(event) => onNameChange(event.target.value)}
          autoFocus
        />
      </div>
      <div className="px-4 pb-2">
        <Input
          className="h-auto border-0 px-0 text-sm text-muted-foreground shadow-none focus-visible:ring-0"
          placeholder="Title (e.g. VP of Engineering)"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
        />
      </div>
    </>
  );
}
