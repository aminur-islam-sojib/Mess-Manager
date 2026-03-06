"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  deleteMess,
  resetMessData,
  transferManagerRole,
} from "@/actions/server/ManagerSettings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import ConfirmModal from "@/components/ui/confirmation-modal";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SettingsMember } from "@/types/ManagerSettings";

type DangerAction = "transfer" | "reset" | "delete" | null;

export default function DangerZoneSettingsSection({
  members,
}: {
  members: SettingsMember[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [dangerAction, setDangerAction] = useState<DangerAction>(null);

  const transferCandidates = members.filter((member) => member.role !== "manager");

  const executeDangerAction = () => {
    startTransition(async () => {
      if (dangerAction === "transfer") {
        const result = await transferManagerRole(selectedMemberId);
        if (result.success) {
          toast.success(result.message);
          router.refresh();
          router.push("/dashboard/manager");
          return;
        }

        toast.error(result.message);
        return;
      }

      if (dangerAction === "reset") {
        const result = await resetMessData();
        if (result.success) {
          toast.success(result.message);
          router.refresh();
          return;
        }

        toast.error(result.message);
        return;
      }

      if (dangerAction === "delete") {
        const result = await deleteMess();
        if (result.success) {
          toast.success(result.message);
          router.push("/dashboard");
          router.refresh();
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
              Review carefully before making destructive changes. These actions
              affect access and historical data.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border border-border bg-background/70 p-5">
          <p className="font-medium text-foreground">Transfer manager role</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Move ownership of the mess to another active member.
          </p>
          <div className="mt-4 max-w-sm space-y-2">
            <Label>New manager</Label>
            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {transferCandidates.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {member.name} ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="mt-4 gap-2"
            disabled={!selectedMemberId || isPending}
            onClick={() => setDangerAction("transfer")}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldAlert className="h-4 w-4" />
            )}
            Transfer Role
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-background/70 p-5">
          <p className="font-medium text-foreground">Reset mess data</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Remove deposits, deposit requests, expenses, meals, and invitations
            while keeping the mess and members intact.
          </p>
          <Button
            variant="outline"
            className="mt-4 gap-2 text-destructive hover:text-destructive"
            disabled={isPending}
            onClick={() => setDangerAction("reset")}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Reset Data
          </Button>
        </div>

        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-5">
          <p className="font-medium text-foreground">Delete mess</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently remove the mess, memberships, invitations, and all
            finance and meal records.
          </p>
          <Button
            variant="destructive"
            className="mt-4 gap-2"
            disabled={isPending}
            onClick={() => setDangerAction("delete")}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete Mess
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
          dangerAction === "transfer"
            ? "Transfer manager role"
            : dangerAction === "reset"
              ? "Reset mess data"
              : "Delete mess"
        }
        description={
          dangerAction === "transfer"
            ? "The selected member will become the new manager and your role will be downgraded to user."
            : dangerAction === "reset"
              ? "This will erase deposits, requests, expenses, meals, and invitations for the current mess."
              : "This will permanently remove the mess and all related records."
        }
        confirmText={
          dangerAction === "transfer"
            ? "Transfer role"
            : dangerAction === "reset"
              ? "Reset data"
              : "Delete mess"
        }
        variant="danger"
        isLoading={isPending}
      />
    </Card>
  );
}
