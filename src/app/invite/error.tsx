"use client";

import { AlertTriangle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function InviteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-card border border-border rounded-2xl p-8">
        <div className="flex items-start gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              Invitation page failed to load
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Please retry once. If the issue continues, open the invitation
              link again from your email.
            </p>
          </div>
        </div>

        <div className="bg-muted/40 border border-border rounded-xl p-4 mb-6">
          <p className="text-xs text-muted-foreground mb-1">
            Technical details
          </p>
          <p className="text-sm text-foreground wrap-break-word">
            {error.message || "Unexpected invitation route error"}
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 py-3 rounded-xl font-semibold bg-primary text-primary-foreground hover:opacity-90 transition-all"
          >
            Try again
          </button>
          <button
            onClick={() => router.push("/auth/login")}
            className="flex-1 py-3 rounded-xl font-semibold border border-input text-foreground hover:bg-muted transition-all"
          >
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}
