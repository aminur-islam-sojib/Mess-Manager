"use client";

import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Modal from "@/components/ui/modal";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "default" | "warning" | "danger";
  isLoading?: boolean;
}

const variantStyles = {
  default: {
    iconWrap:
      "bg-primary/10 text-primary border-primary/20 dark:bg-primary/15 dark:border-primary/25",
    confirmVariant: "default" as const,
  },
  warning: {
    iconWrap:
      "bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/15 dark:text-amber-400 dark:border-amber-500/25",
    confirmVariant: "default" as const,
    confirmClass:
      "bg-amber-500 text-white hover:bg-amber-600 focus-visible:ring-amber-500/30",
  },
  danger: {
    iconWrap:
      "bg-destructive/10 text-destructive border-destructive/20 dark:bg-destructive/15 dark:border-destructive/25",
    confirmVariant: "destructive" as const,
  },
};

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default",
  isLoading = false,
}: ConfirmModalProps) {
  const styles = variantStyles[variant];

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm">
      <div className="space-y-5">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border",
              styles.iconWrap,
            )}
          >
            <AlertTriangle className="h-5 w-5" />
          </div>

          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">{title}</h2>
            <p className="text-sm leading-6 text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            {cancelText}
          </Button>
          <Button
            variant={styles.confirmVariant}
            className={styles.confirmClass}
            onClick={() => void onConfirm()}
            disabled={isLoading}
          >
            {isLoading ? "Processing..." : confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
