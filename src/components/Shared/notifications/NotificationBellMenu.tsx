"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AppRole } from "@/types/auth";
import type { NotificationSerialized } from "@/types/Notification";

type NotificationBellMenuProps = {
  role: AppRole;
  initialUnreadCount?: number;
  initialItems?: NotificationSerialized[];
};

type NotificationsResponse = {
  success?: boolean;
  unreadCount?: number;
  items?: NotificationSerialized[];
};

const formatDateTime = (isoString: string) => {
  const date = new Date(isoString);
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
};

const severityIcon = (severity: NotificationSerialized["severity"]) => {
  if (severity === "success") return CheckCircle2;
  if (severity === "warning") return CircleAlert;
  if (severity === "error") return ShieldAlert;
  return Info;
};

export default function NotificationBellMenu({
  role,
  initialUnreadCount = 0,
  initialItems = [],
}: NotificationBellMenuProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const [items, setItems] = useState<NotificationSerialized[]>(initialItems);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);

  const detailsHref = useMemo(() => `/dashboard/${role}/notifications`, [role]);

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/notifications?limit=8", {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = (await response.json()) as NotificationsResponse;
      if (data.success) {
        setItems(Array.isArray(data.items) ? data.items : []);
        setUnreadCount(
          typeof data.unreadCount === "number" ? data.unreadCount : 0,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const markOneAsRead = async (id: string) => {
    const response = await fetch(`/api/notifications/${id}/read`, {
      method: "PATCH",
    });

    if (!response.ok) return;

    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              isRead: true,
              readAt: item.readAt ?? new Date().toISOString(),
            }
          : item,
      ),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    setIsMarkingAll(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
      });
      if (!response.ok) return;

      setItems((prev) =>
        prev.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        })),
      );
      setUnreadCount(0);
    } finally {
      setIsMarkingAll(false);
    }
  };

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");
    const onMessage = () => {
      fetchNotifications();
    };

    eventSource.addEventListener("message", onMessage);

    return () => {
      eventSource.removeEventListener("message", onMessage);
      eventSource.close();
    };
  }, []);

  useEffect(() => {
    if (open) {
      fetchNotifications();
    }
  }, [open]);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="relative rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          aria-label="Open notifications"
        >
          <span className="inline-flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="absolute -right-2 -top-2 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-primary-foreground">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="w-90 rounded-xl p-0"
      >
        <div className="border-b border-border p-3">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Notifications
            </h3>
            <span className="text-xs text-muted-foreground">
              Unread: {unreadCount}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={markAllAsRead}
              disabled={isMarkingAll || unreadCount === 0}
              className="h-7 px-2 text-xs"
            >
              {isMarkingAll ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Mark all read
            </Button>
            <Link
              href={detailsHref}
              className="text-xs font-medium text-primary hover:underline"
            >
              View details page
            </Link>
          </div>
        </div>

        <ScrollArea className="h-85">
          <div className="p-2">
            {isLoading ? (
              <div className="flex items-center gap-2 p-3 text-xs text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading notifications...
              </div>
            ) : items.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">
                You are all caught up.
              </div>
            ) : (
              <div className="space-y-1">
                {items.map((item) => {
                  const Icon = severityIcon(item.severity);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-lg border p-2.5 ${
                        item.isRead
                          ? "border-border bg-background"
                          : "border-primary/20 bg-primary/5"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-semibold text-foreground">
                            {item.title}
                          </p>
                          <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                            {item.message}
                          </p>
                          <p className="mt-1 text-[11px] text-muted-foreground">
                            {formatDateTime(item.createdAt)}
                          </p>
                          <div className="mt-2 flex items-center gap-3">
                            {item.actionUrl && (
                              <Link
                                href={item.actionUrl}
                                onClick={() => {
                                  if (!item.isRead) {
                                    void markOneAsRead(item.id);
                                  }
                                  setOpen(false);
                                }}
                                className="text-xs font-medium text-primary hover:underline"
                              >
                                Open update
                              </Link>
                            )}
                            {!item.isRead && (
                              <button
                                type="button"
                                onClick={() => void markOneAsRead(item.id)}
                                className="text-xs font-medium text-muted-foreground hover:text-foreground"
                              >
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
