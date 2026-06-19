import { SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { AdminPanel } from "@/components/admin-panel";
import { PageShell } from "@/components/site-shell";
import { Panel, SectionHeader } from "@/components/ui";
import { isAdminUser } from "@/lib/admin";
import { getUserHandle } from "@/lib/users";

export default async function AdminPage() {
  const user = await currentUser();
  const handle = getUserHandle(user);
  const isAdmin = isAdminUser(user);

  if (!user) {
    return (
      <PageShell>
        <SectionHeader eyebrow="Admin" title="Control room locked" description="Sign in with an administrator account to manage the library." />
        <Panel className="mt-10 p-6">
          <div className="empty-library-panel compact-empty-panel">
            <strong>Sign in required</strong>
            <p>Admin tools are only available to approved maintainers.</p>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-factory-amber px-4 py-2 text-sm font-bold text-[#1a1402]">Sign in</button>
            </SignInButton>
          </div>
        </Panel>
      </PageShell>
    );
  }

  if (!isAdmin) {
    return (
      <PageShell>
        <SectionHeader eyebrow="Admin" title="Access denied" description="Your account is signed in, but it is not configured as a Factorio Library administrator." />
        <Panel className="mt-10 p-6">
          <div className="space-y-3 text-stone-400">
            <p>
              Ask an owner to add your email to <code className="rounded bg-black/30 px-2 py-1 text-factory-amber">ADMIN_EMAILS</code> or set your Clerk metadata role to <code className="rounded bg-black/30 px-2 py-1 text-factory-amber">admin</code>.
            </p>
            <p className="font-mono text-xs uppercase tracking-[0.22em] text-stone-600">Signed in as {handle}</p>
          </div>
        </Panel>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Admin"
        title="Factory control room"
        description="Monitor library health, review blueprint records, and run data maintenance tools from one place."
      />
      <AdminPanel adminName={handle || "admin"} />
    </PageShell>
  );
}
