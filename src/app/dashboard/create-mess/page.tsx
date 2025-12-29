import { Building2 } from "lucide-react";
import ContinueMessButton from "@/components/Buttons/ContinueMessButton";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export default async function CreateMessButton() {
  const session = await getServerSession(authOptions);
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
            <Building2 className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Create Your Mess
          </h1>
          <p className="text-muted-foreground text-sm">
            Get started by naming your mess
          </p>
        </div>

        {session?.user && <ContinueMessButton user={session?.user} />}

        <div className="mt-8 bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
            <span className="text-primary">ℹ️</span>
            What happens next?
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>You will become the manager of this mess</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>You can invite members to join</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-0.5">•</span>
              <span>Start tracking meals and expenses</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
