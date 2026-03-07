"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BellRing, Loader2, LockKeyhole, Save, UserRound } from "lucide-react";
import { toast } from "sonner";
import {
  updateNotificationSettings,
  updatePassword,
  updateUserProfile,
} from "@/actions/server/UserSettings";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { UserSettingsUser } from "@/types/UserSettings";

export default function AccountSettingsSection({
  user,
}: {
  user: UserSettingsUser;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profile, setProfile] = useState({
    name: user.name,
    phone: user.phone,
    image: user.image ?? "",
  });
  const [password, setPassword] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [notifications, setNotifications] = useState(
    user.notificationSettings,
  );

  const runAction = (action: () => Promise<{ success: boolean; message: string }>) => {
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
              <UserRound className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Profile</CardTitle>
              <CardDescription>
                Update your personal details and public profile image.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="user-name">Name</Label>
              <Input
                id="user-name"
                value={profile.name}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
                placeholder="Your name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="user-phone">Phone</Label>
              <Input
                id="user-phone"
                value={profile.phone}
                onChange={(event) =>
                  setProfile((current) => ({
                    ...current,
                    phone: event.target.value,
                  }))
                }
                placeholder="+880..."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="user-image">Profile Image URL</Label>
            <Input
              id="user-image"
              value={profile.image}
              onChange={(event) =>
                setProfile((current) => ({
                  ...current,
                  image: event.target.value,
                }))
              }
              placeholder="https://example.com/avatar.png"
            />
          </div>

          <div className="rounded-2xl border border-border bg-muted/30 px-4 py-3 text-sm">
            <p className="font-medium text-foreground">{user.email}</p>
            <p className="mt-1 text-muted-foreground">
              Your email stays read-only here because it is tied to sign-in.
            </p>
          </div>

          <Button
            onClick={() =>
              runAction(() =>
                updateUserProfile({
                  name: profile.name,
                  phone: profile.phone,
                  image: profile.image,
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
            Save Profile
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-amber-500/10 p-3 text-amber-600">
              <LockKeyhole className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>
                Change your password after confirming your current one.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          {!user.canChangePassword && (
            <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-muted-foreground">
              Password updates are not available for social sign-in accounts.
            </div>
          )}

          <div className="grid gap-5 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={password.currentPassword}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    currentPassword: event.target.value,
                  }))
                }
                disabled={!user.canChangePassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={password.newPassword}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    newPassword: event.target.value,
                  }))
                }
                disabled={!user.canChangePassword}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={password.confirmPassword}
                onChange={(event) =>
                  setPassword((current) => ({
                    ...current,
                    confirmPassword: event.target.value,
                  }))
                }
                disabled={!user.canChangePassword}
              />
            </div>
          </div>

          <Button
            variant="outline"
            onClick={() =>
              runAction(async () => {
                const result = await updatePassword(password);
                if (result.success) {
                  setPassword({
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  });
                }
                return result;
              })
            }
            disabled={isPending || !user.canChangePassword}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LockKeyhole className="h-4 w-4" />
            )}
            Update Password
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-3xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-emerald-500/10 p-3 text-emerald-600">
              <BellRing className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>
                Control which account and mess updates should reach you.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <NotificationToggle
            label="Meal reminders"
            description="Receive reminders related to your meal entry routine."
            checked={notifications.mealReminder}
            onChange={(checked) =>
              setNotifications((current) => ({
                ...current,
                mealReminder: checked,
              }))
            }
          />
          <NotificationToggle
            label="Deposit updates"
            description="Stay informed about deposit request status changes."
            checked={notifications.depositUpdate}
            onChange={(checked) =>
              setNotifications((current) => ({
                ...current,
                depositUpdate: checked,
              }))
            }
          />
          <NotificationToggle
            label="Expense notifications"
            description="Receive updates when new mess expenses affect your record."
            checked={notifications.expenseAlert}
            onChange={(checked) =>
              setNotifications((current) => ({
                ...current,
                expenseAlert: checked,
              }))
            }
          />

          <Button
            onClick={() =>
              runAction(() => updateNotificationSettings(notifications))
            }
            disabled={isPending}
            className="gap-2"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Save Notifications
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function NotificationToggle({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-border bg-background/70 p-4 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className="inline-flex items-center gap-2 self-start rounded-full border border-border bg-muted px-3 py-1.5 text-sm font-medium text-foreground transition hover:bg-accent"
      >
        <Badge variant={checked ? "default" : "outline"}>
          {checked ? "Enabled" : "Disabled"}
        </Badge>
        <span>{checked ? "Turn off" : "Turn on"}</span>
      </button>
    </div>
  );
}
