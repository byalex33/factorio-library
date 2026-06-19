export function formatBlueprintStatCount(value: number) {
  return new Intl.NumberFormat("en", { notation: value >= 1000 ? "compact" : "standard", maximumFractionDigits: 1 }).format(value);
}

export function HeartIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="heart-icon">
      <path d="M12 21s-7.2-4.35-9.45-8.55C.72 9.03 2.46 5 6.25 5c2.15 0 3.6 1.15 4.45 2.45C11.1 8.06 11.9 8.06 12.3 7.45 13.15 6.15 14.6 5 16.75 5c3.79 0 5.53 4.03 3.7 7.45C19.2 16.65 12 21 12 21Z" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.9" strokeLinejoin="round" />
    </svg>
  );
}

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
