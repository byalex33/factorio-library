import Link from "next/link";
import { PageShell } from "@/components/site-shell";
import { EmptyState, Panel, SectionHeader } from "@/components/ui";

function safeDecode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default async function UserProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const handle = safeDecode(username).replace(/^@+/, "");

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Builder profile"
        title={handle}
        description="Public username profiles are reserved for future author pages, blueprint collections, and attribution."
      />
      <div className="mt-10 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel className="p-6">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-factory-amber">Username</p>
          <h2 className="mt-3 font-display text-3xl font-semibold uppercase text-stone-100">{handle}</h2>
          <p className="mt-4 text-stone-400">
            Blueprint uploads will use Clerk usernames for public author attribution.
          </p>
          <Link href="/browse" className="mt-6 inline-flex text-sm font-semibold text-factory-amber hover:text-[#ffb347]">
            Browse library
          </Link>
        </Panel>
        <EmptyState
          title="No public blueprints yet"
          description="When uploads are implemented, this profile will show approved blueprints by this username."
        />
      </div>
    </PageShell>
  );
}
