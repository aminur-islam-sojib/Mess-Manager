"use client";

import { InvitationType } from "@/types/Invitations";
import { ArrowRight, CheckCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export default function UserInvitationPageAcceptButton({
  invitation,
}: {
  invitation: InvitationType;
}) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const handleAccept = async () => {
    setIsAccepting(true);

    // Simulate API call
    setTimeout(() => {
      setIsAccepting(false);
      setIsAccepted(true);

      // Redirect after success
      setTimeout(() => {
        console.log("Redirecting to dashboard...");
        // router.push('/dashboard/user');
      }, 2000);
    }, 1500);
  };
  if (isAccepted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center">
          <div className="relative mb-8">
            <div className="absolute inset-0 bg-primary/20 rounded-full animate-ping"></div>
            <div className="relative w-24 h-24 mx-auto rounded-full bg-primary flex items-center justify-center shadow-2xl">
              <CheckCircle
                className="w-14 h-14 text-primary-foreground"
                strokeWidth={2.5}
              />
            </div>
          </div>

          <h2 className="text-3xl font-bold text-foreground mb-3">
            Welcome Aboard! 🎉
          </h2>
          <p className="text-muted-foreground text-lg mb-4">
            You&apos;ve successfully joined {invitation.messName}
          </p>
          <p className="text-sm text-muted-foreground">
            Redirecting to your dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleAccept}
      disabled={isAccepting}
      className="w-full py-4 px-6 rounded-xl font-semibold text-lg bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mb-4"
    >
      {isAccepting ? (
        <>
          <Loader2 className="w-5 h-5 animate-spin" />
          Accepting Invitation...
        </>
      ) : (
        <>
          Accept Invitation
          <ArrowRight className="w-5 h-5" />
        </>
      )}
    </button>
  );
}
