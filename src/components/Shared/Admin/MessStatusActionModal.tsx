"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { updateAdminMessStatus } from "@/actions/server/Admin";
import Modal from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

type MessStatusActionModalProps = {
  messId: string;
  messName: string;
  status: string;
};

export default function MessStatusActionModal({
  messId,
  messName,
  status,
}: MessStatusActionModalProps) {
  const [isPending, startTransition] = useTransition();
  const [reason, setReason] = useState("");
  const [reasonError, setReasonError] = useState<string | null>(null);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);

  const isSuspended = status === "suspended";

  // ✅ Activate (same as user control)
  const triggerActivate = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("messId", messId);
      formData.set("action", "activate");
      formData.set("reason", "");

      const result = await updateAdminMessStatus(formData);

      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  // ✅ Suspend with reason
  const confirmSuspend = () => {
    const trimmedReason = reason.trim();

    if (trimmedReason.length < 5) {
      setReasonError("Please provide at least 5 characters for the reason.");
      return;
    }

    setReasonError(null);

    startTransition(async () => {
      const formData = new FormData();
      formData.set("messId", messId);
      formData.set("action", "suspend");
      formData.set("reason", trimmedReason);

      const result = await updateAdminMessStatus(formData);

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
        // ✅ Activate Button
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={triggerActivate}
          disabled={isPending}
          className="border-emerald-300 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
        >
          {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
          Activate Mess
        </Button>
      ) : (
        // ✅ Suspend Button (opens modal)
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
          Suspend Mess
        </Button>
      )}

      {/* ✅ Modal (same UX as user control) */}
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
              You are about to suspend {messName || "this mess"}. Please provide
              a reason. This action is recorded in audit logs.
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Suspension Reason
            </label>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              minLength={5}
              maxLength={500}
              placeholder="Explain why this mess is being suspended"
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
