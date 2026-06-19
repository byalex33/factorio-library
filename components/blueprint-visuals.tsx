export function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  );
}

export function CopiesIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
      <rect x="8" y="8" width="11" height="12" rx="2" />
      <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h2" />
    </svg>
  );
}

export function UserIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5 fill-none stroke-current" strokeWidth="1.8">
      <circle cx="12" cy="7" r="3.2" />
      <path d="M5.5 21v-1.6a6.5 6.5 0 0 1 13 0V21" />
    </svg>
  );
}

export function BlueprintDiagram({ large = false }: { large?: boolean }) {
  return (
    <div className={`blueprint-diagram ${large ? "blueprint-diagram-large" : ""}`} role="img" aria-label="Blueprint diagram preview">
      <span className="diagram-machine diagram-machine-orange diagram-machine-a" />
      {large ? <span className="diagram-machine diagram-machine-orange diagram-machine-b" /> : null}
      <span className="diagram-machine diagram-machine-blue diagram-machine-c" />
      <span className="diagram-machine diagram-machine-steel diagram-machine-d" />
      <span className="diagram-belt diagram-belt-gold" />
      <span className="diagram-belt diagram-belt-blue" />
      <span className="diagram-machine diagram-machine-dark diagram-machine-e" />
      {large ? <span className="diagram-machine diagram-machine-dark diagram-machine-f" /> : null}
    </div>
  );
}
