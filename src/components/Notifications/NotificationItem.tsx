import {
  BellRing,
  Receipt,
  Settings2,
  Users,
  UtensilsCrossed,
  Wallet,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { NotificationSerialized } from "@/types/Notification";

type NotificationItemProps = {
  notification: NotificationSerialized;
  onClick?: () => void;
  compact?: boolean;
};

const categoryMeta = {
  deposit: {
    Icon: Wallet,
    className: "bg-emerald-500/10 text-emerald-600",
  },
  expense: {
    Icon: Receipt,
    className: "bg-amber-500/10 text-amber-600",
  },
  member_activity: {
    Icon: Users,
    className: "bg-sky-500/10 text-sky-600",
  },
  meal: {
    Icon: UtensilsCrossed,
    className: "bg-orange-500/10 text-orange-600",
  },
  system: {
    Icon: Settings2,
    className: "bg-slate-500/10 text-slate-600",
  },
} as const;

export default function NotificationItem({
  notification,
  onClick,
  compact = false,
}: NotificationItemProps) {
  const meta = categoryMeta[notification.category] ?? {
    Icon: BellRing,
    className: "bg-primary/10 text-primary",
  };
  const { Icon } = meta;

  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-2xl border border-border/70 px-3 py-3 text-left transition-colors hover:bg-accent/70 ${
        !notification.isRead ? "bg-primary/5" : "bg-transparent"
      } ${compact ? "px-2.5 py-2.5" : ""}`}
    >
      <div
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl ${meta.className}`}
      >
        <Icon className="h-4 w-4" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {notification.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {notification.message}
            </p>
          </div>

          {!notification.isRead && (
            <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
          )}
        </div>

        <p className="mt-2 text-[11px] font-medium text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
          })}
        </p>
      </div>
    </button>
  );
}
