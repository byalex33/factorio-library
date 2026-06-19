import { SignIn } from "@clerk/nextjs";
import { PageShell } from "@/components/site-shell";

export default function SignInPage() {
  return (
    <PageShell>
      <div className="flex justify-center py-10">
        <SignIn />
      </div>
    </PageShell>
  );
}
