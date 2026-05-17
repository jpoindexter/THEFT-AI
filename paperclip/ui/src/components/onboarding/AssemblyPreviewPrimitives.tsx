export function AssemblyStatGroup({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="border-b border-border pb-4 last:border-b-0">
      <p className="theft-label">{title}</p>
      <div className="mt-2 space-y-1 text-muted-foreground">
        {rows.map((row) => (
          <p key={row}>{row}</p>
        ))}
      </div>
    </div>
  );
}

export function InspectorBlock({ title, rows }: { title: string; rows: string[] }) {
  return (
    <div className="theft-surface-plain p-4">
      <p className="theft-label">{title}</p>
      <ul className="mt-2 space-y-1.5 text-sm leading-5 text-muted-foreground">
        {rows.map((row) => (
          <li key={row}>{row}</li>
        ))}
      </ul>
    </div>
  );
}
