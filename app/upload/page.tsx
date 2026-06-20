import { SignInButton } from "@clerk/nextjs";
import { currentUser } from "@clerk/nextjs/server";
import { PageShell } from "@/components/site-shell";
import { Panel, SectionHeader } from "@/components/ui";
import { UploadBlueprintForm } from "@/components/upload-blueprint-form";
import { getUserHandle } from "@/lib/users";

export default async function UploadPage() {
  const user = await currentUser();
  const handle = getUserHandle(user);

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Contribute"
        title="Add a blueprint"
        description="Add a single Factorio blueprint string to the library."
      />

      <Panel className="mt-10 p-6">
        {user && handle ? (
          <UploadBlueprintForm />
        ) : (
          <div className="empty-library-panel compact-empty-panel">
            <strong>Sign in required</strong>
            <p>Create or enter your account to add a blueprint under your public username.</p>
            <SignInButton mode="modal">
              <button className="rounded-lg bg-factory-amber px-4 py-2 text-sm font-bold text-[#1a1402]">
                Sign in to add blueprints
              </button>
            </SignInButton>
          </div>
        )}
      </Panel>
    </PageShell>
  );
}
