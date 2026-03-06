"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Copy,
  Loader2,
  Mail,
  MapPin,
  Save,
  Trash2,
  UserMinus,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import {
  cancelInvitation,
  removeMessMember,
  sendMessInvitation,
} from "@/actions/server/ManagerSettings";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmModal from "@/components/ui/confirmation-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updateMessProfile } from "@/actions/server/ManagerSettings";
import type {
  ManagerSettingsMess,
  PendingInvitation,
  SettingsMember,
} from "@/types/ManagerSettings";

export default function MessManagementSettingsSection({
  mess,
  members,
  pendingInvitations,
}: {
  mess: ManagerSettingsMess;
  members: SettingsMember[];
  pendingInvitations: PendingInvitation[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [messProfile, setMessProfile] = useState({
    messName: mess.messName,
    messAddress: mess.messAddress,
    description: mess.description,
    image: mess.image ?? "",
  });
  const [inviteEmail, setInviteEmail] = useState("");
  const [latestInviteLink, setLatestInviteLink] = useState(
    pendingInvitations[0]?.inviteLink ?? "",
  );
  const [memberToRemove, setMemberToRemove] = useState<SettingsMember | null>(null);
  const [invitationToCancel, setInvitationToCancel] =
    useState<PendingInvitation | null>(null);

  const activeMembers = useMemo(
    () =>
      [...members].sort((left, right) =>
        left.role === right.role
          ? left.name.localeCompare(right.name)
          : left.role === "manager"
            ? -1
            : 1,
      ),
    [members],
  );

  const withFeedback = (action: () => Promise<{ success: boolean; message: string }>) => {
    startTransition(async () => {
      const result = await action();
      if (result.success) {
        toast.success(result.message);
        router.refresh();
        return;
      }

      toast.error(result.message);
    });
  };

  return (
    <div className="space-y-6">
      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <MapPin className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Mess Profile</CardTitle>
              <CardDescription>
                Keep your mess details accurate for the rest of the system.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="mess-name">Mess Name</Label>
              <Input
                id="mess-name"
                value={messProfile.messName}
                onChange={(event) =>
                  setMessProfile((current) => ({
                    ...current,
                    messName: event.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="mess-address">Mess Address</Label>
              <Input
                id="mess-address"
                value={messProfile.messAddress}
                onChange={(event) =>
                  setMessProfile((current) => ({
                    ...current,
                    messAddress: event.target.value,
                  }))
                }
                placeholder="House, road, city"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="mess-description">Description</Label>
            <Textarea
              id="mess-description"
              value={messProfile.description}
              onChange={(event) =>
                setMessProfile((current) => ({
                  ...current,
                  description: event.target.value,
                }))
              }
              placeholder="A quick summary of how your mess operates"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="mess-image">Mess Image URL</Label>
            <Input
              id="mess-image"
              value={messProfile.image}
              onChange={(event) =>
                setMessProfile((current) => ({
                  ...current,
                  image: event.target.value,
                }))
              }
              placeholder="https://example.com/mess-cover.png"
            />
          </div>

          <Button
            onClick={() =>
              withFeedback(() =>
                updateMessProfile({
                  messName: messProfile.messName,
                  messAddress: messProfile.messAddress,
                  description: messProfile.description,
                  image: messProfile.image,
                }),
              )
            }
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Mess Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Members</CardTitle>
              <CardDescription>
                Review active members and remove access when needed.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {activeMembers.map((member) => (
            <div
              key={member.id}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
            >
              <div className="flex items-center gap-3">
                <Avatar size="lg">
                  <AvatarImage src={member.image ?? ""} />
                  <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-foreground">{member.name}</p>
                    <Badge variant={member.role === "manager" ? "default" : "outline"}>
                      {member.role}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{member.email}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Joined {new Date(member.joinDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                variant="outline"
                className="gap-2 text-destructive hover:text-destructive"
                disabled={member.role === "manager" || isPending}
                onClick={() => setMemberToRemove(member)}
              >
                <UserMinus className="h-4 w-4" />
                Remove Member
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-sky-500/10 p-3 text-sky-600">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Invitations</CardTitle>
              <CardDescription>
                Send email invites, generate links, and manage pending invitations.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_auto]">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(event) => setInviteEmail(event.target.value)}
              placeholder="member@example.com"
            />
            <Button
              onClick={() =>
                startTransition(async () => {
                  const result = await sendMessInvitation({ email: inviteEmail });
                  if (result.success) {
                    toast.success(result.message);
                    setInviteEmail("");
                    setLatestInviteLink(result.inviteLink ?? "");
                    router.refresh();
                    return;
                  }

                  toast.error(result.message);
                })
              }
              disabled={isPending}
              className="gap-2"
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Mail className="h-4 w-4" />
              )}
              Send Invitation
            </Button>
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-medium text-foreground">Latest invite link</p>
                <p className="mt-1 break-all text-sm text-muted-foreground">
                  {latestInviteLink || "Create an invitation to generate a link."}
                </p>
              </div>
              <Button
                variant="outline"
                className="gap-2"
                disabled={!latestInviteLink}
                onClick={async () => {
                  await navigator.clipboard.writeText(latestInviteLink);
                  toast.success("Invite link copied");
                }}
              >
                <Copy className="h-4 w-4" />
                Copy Link
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              Pending Invitations
            </p>

            {pendingInvitations.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-background/50 p-6 text-sm text-muted-foreground">
                No pending invitations right now.
              </div>
            ) : (
              pendingInvitations.map((invitation) => (
                <div
                  key={invitation.id}
                  className="flex flex-col gap-4 rounded-2xl border border-border bg-background/70 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-foreground">{invitation.email}</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Created {new Date(invitation.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={async () => {
                        await navigator.clipboard.writeText(invitation.inviteLink);
                        toast.success("Invite link copied");
                      }}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      className="gap-2 text-destructive hover:text-destructive"
                      onClick={() => setInvitationToCancel(invitation)}
                    >
                      <Trash2 className="h-4 w-4" />
                      Cancel
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmModal
        isOpen={Boolean(memberToRemove)}
        onClose={() => setMemberToRemove(null)}
        onConfirm={async () => {
          if (!memberToRemove) return;
          const result = await removeMessMember(memberToRemove.id);
          if (result.success) {
            toast.success(result.message);
            setMemberToRemove(null);
            router.refresh();
            return;
          }

          toast.error(result.message);
        }}
        title="Remove member"
        description={
          memberToRemove
            ? `Remove ${memberToRemove.name} from the mess. This will revoke their current mess access.`
            : ""
        }
        confirmText="Remove member"
        variant="danger"
        isLoading={isPending}
      />

      <ConfirmModal
        isOpen={Boolean(invitationToCancel)}
        onClose={() => setInvitationToCancel(null)}
        onConfirm={async () => {
          if (!invitationToCancel) return;
          const result = await cancelInvitation(invitationToCancel.id);
          if (result.success) {
            toast.success(result.message);
            setInvitationToCancel(null);
            router.refresh();
            return;
          }

          toast.error(result.message);
        }}
        title="Cancel invitation"
        description={
          invitationToCancel
            ? `Cancel the pending invitation for ${invitationToCancel.email}. The invite link will stop working.`
            : ""
        }
        confirmText="Cancel invitation"
        variant="warning"
        isLoading={isPending}
      />
    </div>
  );
}
