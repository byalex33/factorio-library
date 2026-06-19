import Link from "next/link";

export function SectionHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="max-w-3xl">
      {eyebrow ? <p className="mb-3 font-mono text-xs uppercase tracking-[0.28em] text-factory-amber">{eyebrow}</p> : null}
      <h1 className="font-display text-4xl font-semibold uppercase tracking-wide text-stone-100 sm:text-6xl">{title}</h1>
      {description ? <p className="mt-5 text-lg leading-8 text-stone-400">{description}</p> : null}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-white/10 bg-white/[0.035] shadow-[0_24px_80px_rgba(0,0,0,0.25)] ${className}`}>{children}</div>;
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <Panel className="grid min-h-80 place-items-center p-8 text-center">
      <div className="max-w-xl">
        <div className="mx-auto mb-6 grid size-16 place-items-center rounded-2xl border border-factory-amber/30 bg-factory-amber/10 font-display text-2xl text-factory-amber">
          FL
        </div>
        <h2 className="font-display text-3xl font-semibold uppercase text-stone-100">{title}</h2>
        <p className="mt-4 text-stone-400">{description}</p>
        {action ? (
          <Link href={action.href} className="mt-7 inline-flex rounded-xl bg-factory-amber px-5 py-3 text-sm font-bold text-[#1a1402] transition hover:bg-[#ffb347]">
            {action.label}
          </Link>
        ) : null}
      </div>
    </Panel>
  );
}

export function BlueprintPreview() {
  return (
    <div className="relative aspect-[16/10] overflow-hidden rounded-2xl border border-white/10 bg-[#14150e]">
      <div className="absolute inset-0 blueprint-grid opacity-70" />
      <div className="absolute inset-x-8 top-1/2 h-4 -translate-y-1/2 rounded-full bg-factory-amber/80 shadow-[0_0_24px_rgba(255,157,35,0.25)]" />
      <div className="absolute inset-y-8 left-1/2 w-4 -translate-x-1/2 rounded-full bg-factory-amber/50" />
      <div className="absolute left-1/2 top-1/2 grid size-24 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-3xl bg-[linear-gradient(180deg,#ffb347,#ff8a14)] text-4xl font-black text-[#1a1402]">
        ⇣
      </div>
    </div>
  );
}
