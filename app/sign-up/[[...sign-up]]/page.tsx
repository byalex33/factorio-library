import { SignUp } from "@clerk/nextjs";
import { PageShell } from "@/components/site-shell";

export default function SignUpPage() {
  return (
    <PageShell>
      <div className="flex justify-center py-10">
        <SignUp />
      </div>
    </PageShell>
  );
}
