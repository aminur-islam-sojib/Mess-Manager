"use client";

import {
  AlertTriangle,
  Clock,
  Home,
  Mail,
  ShieldAlert,
  XCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

type ErrorType =
  | "expired"
  | "invalid"
  | "used"
  | "notfound"
  | "unauthorized"
  | "general";

interface InvalidInvitationProps {
  errorType?: ErrorType;
  errorMessage?: string;
}

export default function InvalidInvitation({
  errorType = "general",
  errorMessage,
}: InvalidInvitationProps) {
  const router = useRouter();

  const getErrorConfig = () => {
    switch (errorType) {
      case "expired":
        return {
          icon: <Clock className="w-16 h-16 text-orange-500" />,
          title: "Invitation Expired",
          description:
            "This invitation link has expired and is no longer valid.",
          details:
            "Invitations are valid for 24 hours after being sent. Please request a new invitation from the mess manager.",
          bgColor: "bg-orange-500/10",
          borderColor: "border-orange-500/20",
          iconBg: "bg-orange-500/10",
        };
      case "invalid":
        return {
          icon: <XCircle className="w-16 h-16 text-destructive" />,
          title: "Invalid Invitation",
          description:
            "This invitation link is not valid or has been corrupted.",
          details:
            "The link you followed appears to be incorrect. Please check the link and try again, or request a new invitation.",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
          iconBg: "bg-destructive/10",
        };
      case "used":
        return {
          icon: <ShieldAlert className="w-16 h-16 text-blue-500" />,
          title: "Already Accepted",
          description: "This invitation has already been used.",
          details:
            "You've already accepted this invitation. If you're having trouble accessing the mess, please contact the manager.",
          bgColor: "bg-blue-500/10",
          borderColor: "border-blue-500/20",
          iconBg: "bg-blue-500/10",
        };
      case "notfound":
        return {
          icon: <AlertTriangle className="w-16 h-16 text-destructive" />,
          title: "Invitation Not Found",
          description: "We couldn't find this invitation in our system.",
          details:
            "The invitation may have been deleted or never existed. Please verify the link with the person who invited you.",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
          iconBg: "bg-destructive/10",
        };
      case "unauthorized":
        return {
          icon: <ShieldAlert className="w-16 h-16 text-destructive" />,
          title: "Unauthorized Access",
          description: "You don't have permission to access this invitation.",
          details:
            "This invitation may be intended for a different email address. Make sure you're logged in with the correct account.",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
          iconBg: "bg-destructive/10",
        };
      default:
        return {
          icon: <AlertTriangle className="w-16 h-16 text-destructive" />,
          title: "Invalid or Expired Invitation",
          description: "This invitation link is no longer valid.",
          details:
            errorMessage ||
            "Please contact the mess manager for a new invitation link.",
          bgColor: "bg-destructive/10",
          borderColor: "border-destructive/20",
          iconBg: "bg-destructive/10",
        };
    }
  };

  const config = getErrorConfig();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-destructive/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2"></div>
      </div>

      <div className="relative z-10 w-full">
        <div className="bg-card border border-border rounded-3xl shadow-2xl overflow-hidden">
          <div className="pt-12 pb-6 text-center">
            <div
              className={`inline-flex items-center justify-center w-24 h-24 rounded-full ${config.iconBg} mb-6 animate-pulse`}
            >
              {config.icon}
            </div>

            <h1 className="text-3xl font-bold text-foreground mb-3 px-6">
              {config.title}
            </h1>
            <p className="text-muted-foreground text-lg px-6">
              {config.description}
            </p>
          </div>

          <div className="px-8 pb-8">
            <div
              className={`${config.bgColor} border ${config.borderColor} rounded-2xl p-6 mb-6`}
            >
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <span className="text-xl">ℹ️</span>
                What happened?
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {config.details}
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-3.5 px-6 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                <Home className="w-5 h-5" />
                Go to Dashboard
              </button>
            </div>

            <div className="mt-8 pt-6 border-t border-border">
              <h3 className="font-semibold text-foreground mb-3 text-sm">
                Common Solutions:
              </h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Check if you&apos;re using the latest invitation link
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>
                    Make sure you&apos;re logged in with the correct email
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Contact the mess manager for a new invitation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">•</span>
                  <span>Verify the link wasn&apos;t altered or truncated</span>
                </li>
              </ul>

              <div className="mt-4 p-4 bg-primary/10 border-2 border-primary rounded-xl">
                <div className="flex items-start gap-3">
                  <Mail className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-bold text-foreground mb-1">
                      📧 Check Your Email
                    </p>
                    <p className="text-sm text-foreground">
                      Go back to your email inbox and click the invitation link
                      directly from the email again. Do not use bookmarked or
                      copied links.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted/30 px-8 py-4 border-t border-border">
            <p className="text-xs text-center text-muted-foreground">
              Need assistance?{" "}
              <button
                onClick={() => (window.location.href = "/support")}
                className="text-primary font-semibold hover:underline"
              >
                Contact Support
              </button>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Error Code:{" "}
            <code className="px-2 py-1 bg-muted rounded text-xs font-mono">
              {errorType.toUpperCase()}_INVITATION
            </code>
          </p>
        </div>
      </div>
    </div>
  );
}
