"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateAdminUserStatus } from "@/actions/server/Users";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { Textarea } from "@/components/ui/textarea";

type UserStatusControlProps = {
  userId: string;
  userName: string;
  status: string;
};

export default function UserStatusControl({
  userId,
  userName,
  status,
}: UserStatusControlProps) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const isSuspended = status === "suspended";

  const triggerActivate = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("action", "activate");
      formData.set("reason", "");

      const result = await updateAdminUserStatus(formData);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  const confirmSuspend = () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < 5) {
      setReasonError("Please provide at least 5 characters for the reason.");
      return;
    }

    setReasonError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("userId", userId);
      formData.set("action", "suspend");
      formData.set("reason", trimmedReason);

      const result = await updateAdminUserStatus(formData);

      if (result.success) {
        toast.success(result.message);
        setIsSuspendModalOpen(false);
        setReason("");
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <>
      {isSuspended ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerActivate}
          disabled={isPending}
          className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        >
          {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
          Activate Account
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            setReasonError(null);
            setIsSuspendModalOpen(true);
          }}
          className="border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100"
        >
          Suspend Account
        </Button>
      )}

      <Modal
        isOpen={isSuspendModalOpen}
        onClose={() => {
          if (isPending) return;
          setIsSuspendModalOpen(false);
          setReasonError(null);
        }}
        size="sm"
      >
        <div className="space-y-4 p-5">
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Confirm Suspension
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              You are about to suspend {userName || "this user"}. Please provide
              a reason. This action is recorded in audit logs.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Suspension Reason
            </label>
            <Textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              minLength={5}
              maxLength={500}
              placeholder="Explain why this account is being suspended"
              className="min-h-24"
              disabled={isPending}
            />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {reasonError ? (
                  <span className="text-destructive">{reasonError}</span>
                ) : (
                  "Minimum 5 characters"
                )}
              </span>
              <span>{reason.length}/500</span>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setIsSuspendModalOpen(false);
                setReasonError(null);
              }}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={confirmSuspend}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Suspending...
                </>
              ) : (
                "Confirm Suspend"
              )}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
