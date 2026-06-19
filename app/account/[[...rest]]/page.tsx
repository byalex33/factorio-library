import { UserProfile } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { PageShell } from "@/components/site-shell";
import { Panel, SectionHeader } from "@/components/ui";

export default async function AccountPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/sign-in?redirect_url=/account");
  }

  return (
    <PageShell>
      <SectionHeader
        eyebrow="Account"
        title="Profile settings"
        description="Update your Clerk profile details here. Your username is used as your public Factorio Library handle."
      />
      <Panel className="mt-10 overflow-hidden p-3 sm:p-6">
        <UserProfile routing="path" path="/account" />
      </Panel>
    </PageShell>
  );
}
