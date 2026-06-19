import { PageShell } from "@/components/site-shell";
import { Panel, SectionHeader } from "@/components/ui";

export default function AboutPage() {
  return (
    <PageShell>
      <SectionHeader
        eyebrow="Project"
        title="About Factorio Library"
        description="A Vercel-friendly Next.js foundation for a public archive of single Factorio blueprint strings."
      />
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {[
          ["Focused", "Designed around one blueprint string per entry so browsing stays simple."],
          ["Authenticated", "Clerk is installed and wired for user sessions."],
          ["Ready", "The structure is prepared for future upload, browse, detail, and moderation features."],
        ].map(([title, body]) => (
          <Panel key={title} className="p-6">
            <h2 className="font-display text-2xl font-semibold uppercase text-stone-100">{title}</h2>
            <p className="mt-3 text-stone-400">{body}</p>
          </Panel>
        ))}
      </div>
    </PageShell>
  );
}
