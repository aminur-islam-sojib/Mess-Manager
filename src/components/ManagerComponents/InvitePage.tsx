"use client";
import { useState } from "react";
import { Mail, Send, Copy, Check, X, Loader2 } from "lucide-react";
import { sendInvitationAction } from "@/actions/server/Invitations";
import { sendInvitationEmail } from "./SendInvitationMail";
import { SessionUser } from "@/types/Model";
import { MessResponseType } from "@/types/MessTypes";
export default function InvitePage({
  session,
  messData,
}: {
  session: SessionUser;
  messData: MessResponseType;
}) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitedLink, setInvitedLink] = useState("");

  const mockInviteLink = "https://messmanager.app/invite/abc123xyz";

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };
  if (!messData || !session) {
    return null;
  }
  const messName = messData.mess?.messName ?? "";
  const inviterName = session.name ?? "";
  const handleInvite = async () => {
    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    if (!validateEmail(email)) {
      setError("Please enter a valid email");
      return;
    }

    if (invitedEmails.includes(email)) {
      setError("This email has already been invited");
      return;
    }

    try {
      setIsInviting(true);
      const result = await sendInvitationAction(email);
      if (!result.inviteLink || result.inviteLink === "") {
        return;
      }
      if (result.inviteLink) {
        setInvitedLink(result.inviteLink);
        const res = await sendInvitationEmail(
          email,
          invitedLink,
          messName,
          inviterName
        );
        console.log(res);
      }
      console.log(result);
      setIsInviting(false);
      setShowSuccess(true);
    } catch (error) {
      console.log(error);
      return { success: false, message: error };
    } finally {
      setEmail("");
      setError("");
    }
  };

  const handleRemoveEmail = (emailToRemove: string) => {
    setInvitedEmails(invitedEmails.filter((e) => e !== emailToRemove));
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(invitedLink || mockInviteLink);
    setCopiedLink(true);
    setTimeout(() => {
      setCopiedLink(false);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleInvite();
    }
  };

  return (
    <div>
      {/* Success Message */}
      {showSuccess && (
        <div className="mb-6 bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-center gap-3 animate-in fade-in duration-300">
          <Check className="w-5 h-5 text-primary shrink-0" />
          <p className="text-sm text-foreground">
            Invitation sent successfully! The member will receive an email
            shortly.
          </p>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Left Column - Send Invitation */}
        <div className="space-y-6">
          {/* Email Invitation Form */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Send Email Invitation
            </h2>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-foreground mb-2"
                >
                  Member Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError("");
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="member@example.com"
                    className={`w-full pl-12 pr-4 py-3 rounded-xl border-2 bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-all ${
                      error
                        ? "border-destructive"
                        : "border-input focus:border-primary"
                    }`}
                    disabled={isInviting}
                  />
                </div>
                {error && (
                  <p className="mt-2 text-xs text-destructive flex items-center gap-1">
                    <span>⚠️</span>
                    {error}
                  </p>
                )}
              </div>

              <button
                onClick={handleInvite}
                disabled={isInviting || !email.trim()}
                className="w-full py-3 px-4 rounded-xl font-semibold text-base bg-primary text-primary-foreground hover:opacity-90 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isInviting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending Invitation...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Send Invitation
                  </>
                )}
              </button>
            </div>

            {/* Invited Emails List */}
            {invitedEmails.length > 0 && (
              <div className="mt-6 pt-6 border-t border-border">
                <h3 className="text-sm font-semibold text-foreground mb-3">
                  Invited ({invitedEmails.length})
                </h3>
                <div className="space-y-2">
                  {invitedEmails.map((invitedEmail, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mail className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm text-foreground">
                          {invitedEmail}
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveEmail(invitedEmail)}
                        className="p-1 hover:bg-destructive/10 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Invite Link */}
        <div className="space-y-6">
          {/* Share Link */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
              <Copy className="w-5 h-5 text-primary" />
              Share Invite Link
            </h2>

            <p className="text-sm text-muted-foreground mb-4">
              Anyone with this link can join your mess. Share it via WhatsApp,
              SMS, or any messaging app.
            </p>

            <div className="space-y-3">
              <div className="p-4 bg-muted rounded-xl border border-border">
                <p className="text-sm text-foreground font-mono break-all">
                  {invitedLink || mockInviteLink}
                </p>
              </div>

              <button
                onClick={handleCopyLink}
                className="w-full py-3 px-4 rounded-xl font-semibold text-base bg-card text-foreground border-2 border-input hover:bg-accent hover:border-primary/50 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-5 h-5 text-primary" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    Copy Link
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
              <span className="text-primary">ℹ️</span>
              How it works
            </h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Send email invitations to specific members</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Members receive a link to join your mess</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>You can approve or reject join requests</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary mt-0.5">•</span>
                <span>Track all pending invitations in your dashboard</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
