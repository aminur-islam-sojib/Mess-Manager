"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell, CheckCheck, Radio } from "lucide-react";
import { useNotifications } from "@/components/Notifications/NotificationProvider";
import NotificationItem from "@/components/Notifications/NotificationItem";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

type NotificationBellProps = {
  align?: "start" | "center" | "end";
  buttonClassName?: string;
  iconClassName?: string;
  className?: string;
};

export default function NotificationBell({
  align = "end",
  buttonClassName,
  iconClassName,
  className,
}: NotificationBellProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const {
    notifications,
    unreadCount,
    isLoading,
    isConnected,
    canEnablePush,
    enablePushNotifications,
    markAllAsRead,
    markAsRead,
  } = useNotifications();

  const badgeLabel = unreadCount > 99 ? "99+" : String(unreadCount);

  const openNotification = async (notificationId: string, href: string) => {
    const target = notifications.find(
      (notification) => notification.id === notificationId,
    );

    if (target && !target.isRead) {
      await markAsRead(notificationId);
    }

    setOpen(false);
    router.push(href);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "relative rounded-xl p-2 transition-colors hover:bg-accent",
            buttonClassName,
            className,
          )}
          aria-label="Open notifications"
        >
          <Bell className={cn("h-5 w-5 text-foreground", iconClassName)} />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-primary-foreground">
              {badgeLabel}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        className="w-[min(92vw,25rem)] rounded-3xl border border-border/80 p-0 shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
      >
        <div className="border-b border-border/70 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-semibold text-foreground">
                  Notifications
                </h3>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    isConnected
                      ? "bg-emerald-500/10 text-emerald-600"
                      : "bg-amber-500/10 text-amber-600",
                  )}
                >
                  <Radio className="h-3 w-3" />
                  {isConnected ? "Live" : "Reconnecting"}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {unreadCount > 0
                  ? `${unreadCount} unread notifications`
                  : "All caught up"}
              </p>
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  void markAllAsRead();
                }}
                className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-accent"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Mark all
              </button>
            )}
          </div>

          {canEnablePush && (
            <button
              type="button"
              onClick={() => {
                void enablePushNotifications();
              }}
              className="mt-3 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-semibold text-primary transition-colors hover:bg-primary/15"
            >
              Enable browser alerts
            </button>
          )}
        </div>

        <ScrollArea className="max-h-96">
          <div className="space-y-2 p-3">
            {isLoading && notifications.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                Loading notifications...
              </div>
            )}

            {!isLoading && notifications.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No notifications yet.
              </div>
            )}

            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                compact
                onClick={() => {
                  void openNotification(notification.id, notification.href);
                }}
              />
            ))}
          </div>
        </ScrollArea>

        <div className="border-t border-border/70 px-4 py-3">
          <Link
            href="/dashboard/notifications"
            onClick={() => setOpen(false)}
            className="block rounded-2xl bg-accent px-4 py-3 text-center text-sm font-semibold text-foreground transition-colors hover:bg-accent/80"
          >
            View all notifications
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
