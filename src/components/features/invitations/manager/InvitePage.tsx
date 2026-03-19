/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { sendInvitationAction } from "@/actions/invitations";
import { useState } from "react";
import { EmailInviteCard } from "../shared/EmailInviteCard";
import { InviteHeader } from "../shared/InviteHeader";
import { ShareLinkCard } from "../shared/ShareLinkCard";

export default function InvitePage({ session, messData }: any) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isInviting, setIsInviting] = useState(false);
  const [invitedEmails, setInvitedEmails] = useState<string[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [invitedLink, setInvitedLink] = useState("");

  const mockInviteLink = "https://messmanager.app/invite/abc123xyz";
  if (!messData || !session) return null;

  const handleInvite = async () => {
    if (!email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      return;
    }

    try {
      setIsInviting(true);
      setError("");

      const result = await sendInvitationAction(email);
      if (!result.success) {
        setError(result.message || "Failed to send invitation");
        return;
      }

      if (result.inviteLink) {
        setInvitedLink(result.inviteLink);
        setInvitedEmails([...invitedEmails, email]);
        setShowSuccess(true);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to send invitation");
    } finally {
      setIsInviting(false);
      setEmail("");
    }
  };

  return (
    <div>
      <InviteHeader showSuccess={showSuccess} />

      <div className="grid lg:grid-cols-2 gap-6">
        <EmailInviteCard
          email={email}
          setEmail={setEmail}
          error={error}
          isInviting={isInviting}
          onInvite={handleInvite}
          onKeyPress={(e) => e.key === "Enter" && handleInvite()}
          invitedEmails={invitedEmails}
          onRemoveEmail={(mail) =>
            setInvitedEmails(
              invitedEmails.filter((invitedEmail) => invitedEmail !== mail),
            )
          }
        />

        <div className="space-y-6">
          <ShareLinkCard
            link={invitedLink || mockInviteLink}
            onCopy={() => {
              navigator.clipboard.writeText(invitedLink || mockInviteLink);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            copied={copiedLink}
          />

          <div className="bg-primary/5 border border-primary/10 rounded-2xl ">
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              ℹ️ How it works
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground italic">
              <li>• Send invitations to specific members</li>
              <li>• You can approve or reject join requests</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
