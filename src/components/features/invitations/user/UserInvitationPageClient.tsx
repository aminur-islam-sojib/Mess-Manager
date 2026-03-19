"use client";

import { acceptInvitation } from "@/actions/invitations";
import { InvitationType } from "@/types/Invitations";
import { SessionUser } from "@/types/Model";
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  CheckCircle,
  Clock,
  Loader2,
  Shield,
  Users,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function UserInvitationPageClient({
  invitation,
  sessionUser,
  token,
}: {
  invitation: InvitationType;
  sessionUser: SessionUser;
  token: string;
}) {
  const [isAccepting, setIsAccepting] = useState(false);
  const [isAccepted, setIsAccepted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleAccept = async () => {
    setIsAccepting(true);
    setError(null);

    try {
      if (!sessionUser?.id) {
        setError("User not authenticated. Please log in and try again.");
        setIsAccepting(false);
        return;
      }

      const res = await acceptInvitation(token, sessionUser.id);
      setIsAccepting(false);

      if (res?.success) {
        setIsAccepted(true);
        setTimeout(() => {
          router.push("/dashboard");
        }, 2000);
      } else {
        const errorByCode: Record<string, string> = {
          AUTH_REQUIRED: "Please log in and try again.",
          INVITE_NOT_FOUND: "This invitation link is invalid.",
          INVITE_ALREADY_USED: "This invitation has already been used.",
          INVITE_EXPIRED_OR_INVALID:
            "This invitation has expired or is no longer valid.",
          ALREADY_MEMBER: "You are already a member of this mess.",
          SERVER_ERROR: "Server error while accepting invitation.",
        };

        const mappedMessage =
          (res && "errorCode" in res && typeof res.errorCode === "string"
            ? errorByCode[res.errorCode]
            : undefined) ??
          res?.message ??
          "Failed to accept invitation. Please try again.";

        setError(mappedMessage);
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
      setIsAccepting(false);
    }
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

  const formatTimeLeft = (expiryDate: Date) => {
    const now = new Date();
    const diff = expiryDate.getTime() - now.getTime();
    const hoursLeft = Math.floor(diff / (1000 * 60 * 60));
    const minutesLeft = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hoursLeft > 0) {
      return `${hoursLeft}h ${minutesLeft}m`;
    }

    return `${minutesLeft}m`;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 w-full">
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          <div className="bg-linear-to-br from-primary to-primary/80 p-8 text-center relative">
            <div className="absolute top-0 left-0 w-full h-full opacity-10">
              <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <pattern
                    id="grid-pattern"
                    width="40"
                    height="40"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 40 0 L 0 0 0 40"
                      fill="none"
                      stroke="white"
                      strokeWidth="1"
                    />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid-pattern)" />
              </svg>
            </div>

            <div className="relative">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-sm mb-4">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-12 h-12 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M8 3V5M16 3V5M4 9H20M6 21H18C19.1046 21 20 20.1046 20 19V7C20 5.89543 19.1046 5 18 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21Z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>

              <h1 className="text-3xl font-bold text-white mb-2">
                You&apos;re Invited!
              </h1>
              <p className="text-white/90 text-sm">
                Join the mess and start tracking expenses
              </p>
            </div>
          </div>

          <div className="p-8">
            <div className="bg-muted/50 rounded-2xl p-6 mb-6 border border-border">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-xs text-muted-foreground font-medium mb-1">
                    YOU&apos;VE BEEN INVITED TO
                  </p>
                  <h2 className="text-2xl font-bold text-foreground">
                    {invitation.messName}
                  </h2>
                </div>
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-primary" />
                </div>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Users className="w-4 h-4" />
                <span>
                  Invited by{" "}
                  <strong className="text-foreground">
                    {invitation.inviterName}
                  </strong>
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-background border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">
                    MEMBERS
                  </p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {invitation.memberCount}
                </p>
              </div>

              <div className="bg-background border border-border rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <p className="text-xs text-muted-foreground font-medium">
                    EXPIRES IN
                  </p>
                </div>
                <p className="text-2xl font-bold text-foreground">
                  {formatTimeLeft(new Date(invitation.expiresAt))}
                </p>
              </div>
            </div>

            <div className="bg-primary/5 rounded-2xl p-6 mb-6 border border-primary/20">
              <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                What you&apos;ll get
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Track your daily meals and expenses
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    View your balance and payment history
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Get notifications for due payments
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <span className="text-sm text-muted-foreground">
                    Access detailed monthly breakdowns
                  </span>
                </li>
              </ul>
            </div>

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

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3 mb-6">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground mb-1">
                    Error
                  </p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </div>
                <button
                  onClick={() => setError(null)}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-3">
              <Clock className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-1">
                  Time-Limited Invitation
                </p>
                <p className="text-xs text-muted-foreground">
                  This invitation expires on{" "}
                  {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 px-8 py-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              By accepting, you agree to the mess terms and conditions
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <button className="text-primary font-semibold hover:underline">
            Contact Support
          </button>
        </p>
      </div>
    </div>
  );
}
