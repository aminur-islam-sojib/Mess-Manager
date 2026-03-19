import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { AlertTriangle, LogOut, ShieldAlert } from "lucide-react";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

export default async function SuspendedPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const status = session.user.status;
  const reason = session.user.suspensionReason;

  if (status !== "suspended") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl rounded-3xl border border-amber-200 bg-card p-8 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-xl bg-amber-100 p-2 text-amber-700">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Account Suspended
            </h1>
            <p className="text-sm text-muted-foreground">
              Your account currently has limited access.
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-muted/40 p-4">
          <div className="mb-2 flex items-center gap-2 text-amber-700">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-semibold">Suspension Reason</p>
          </div>
          <p className="text-sm text-foreground">
            {reason?.trim() ||
              "Your account was suspended by an administrator. Please contact support for details."}
          </p>
        </div>

        <div className="mt-5 rounded-2xl border border-border p-4">
          <p className="text-sm font-medium text-foreground">
            Limited Access Policy
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            <li>You can review this suspension notice.</li>
            <li>You can read your notifications.</li>
            <li>All operational actions are blocked until reactivation.</li>
          </ul>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/dashboard/user/notifications"
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-accent"
          >
            Open Notifications
          </Link>
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Link>
        </div>
      </div>
    </div>
  );
}
