"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { AlertTriangle, Loader2, LogOut, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteUserAccount,
  leaveMess,
} from "@/actions/server/UserSettings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmModal from "@/components/ui/confirmation-modal";

type DangerAction = "leave" | "delete" | null;

export default function DangerZoneSettingsSection({
  messName,
}: {
  messName: string;
}) {
  const router = useRouter();
  const [dangerAction, setDangerAction] = useState<DangerAction>(null);
  const [isPending, startTransition] = useTransition();

  const executeDangerAction = () => {
    startTransition(async () => {
      if (dangerAction === "leave") {
        const result = await leaveMess();
        if (result.success) {
          toast.success(result.message);
          router.push("/dashboard/user");
          router.refresh();
          return;
        }

        toast.error(result.message);
        return;
      }

      if (dangerAction === "delete") {
        const result = await deleteUserAccount();
        if (result.success) {
          toast.success(result.message);
          await signOut({ callbackUrl: "/auth/login" });
          return;
        }

        toast.error(result.message);
      }
    });
  };

  return (
    <Card className="rounded-3xl border-destructive/20">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <CardTitle>Danger Zone</CardTitle>
            <CardDescription>
              These actions affect your account access and mess participation.
              Review them carefully before continuing.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border bg-background/70 p-5">
          <p className="font-medium text-foreground">Leave Mess</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave {messName} and remove your active membership. Your account
            will remain available for future use.
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2 text-amber-600 hover:text-amber-600"
            disabled={isPending}
            onClick={() => setDangerAction("leave")}
          >
            {isPending && dangerAction === "leave" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogOut className="h-4 w-4" />
            )}
            Leave Mess
          </Button>
        </div>

        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <p className="font-medium text-foreground">Delete Account</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently remove your account, memberships, deposits, deposit
            requests, and meal entries.
          </p>
          <Button
            variant="destructive"
            className="mt-4 gap-2"
            disabled={isPending}
            onClick={() => setDangerAction("delete")}
          >
            {isPending && dangerAction === "delete" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Account
          </Button>
        </div>
      </CardContent>

      <ConfirmModal
        isOpen={dangerAction !== null}
        onClose={() => setDangerAction(null)}
        onConfirm={async () => {
          await executeDangerAction();
          setDangerAction(null);
        }}
        title={
          dangerAction === "leave" ? "Leave this mess" : "Delete your account"
        }
        description={
          dangerAction === "leave"
            ? `You will lose access to ${messName} and any pending deposit requests for this mess will be removed.`
            : "This will permanently delete your account and related personal records."
        }
        confirmText={
          dangerAction === "leave" ? "Leave mess" : "Delete account"
        }
        variant="danger"
        isLoading={isPending}
      />
    </Card>
  );
}
