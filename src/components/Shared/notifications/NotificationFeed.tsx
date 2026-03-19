"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  Info,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import type { NotificationSerialized } from "@/types/Notification";
import { Button } from "@/components/ui/button";

type NotificationFeedProps = {
  items: NotificationSerialized[];
  unreadCount?: number;
  emptyMessage?: string;
  pageLimit?: number;
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

const severityClass = (severity: NotificationSerialized["severity"]) => {
  if (severity === "success") return "text-emerald-600";
  if (severity === "warning") return "text-amber-600";
  if (severity === "error") return "text-destructive";
  return "text-sky-600";
};

const humanizeToken = (token: string) =>
  token
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim()
    .replace(/^./, (char) => char.toUpperCase());

const readableValue = (value: string | number | boolean | null) => {
  if (value === null) return "None";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
};

export default function NotificationFeed({
  items: initialItems,
  unreadCount = 0,
  emptyMessage = "No notifications yet.",
  pageLimit = 40,
}: NotificationFeedProps) {
  const [items, setItems] = useState<NotificationSerialized[]>(initialItems);
  const [liveUnreadCount, setLiveUnreadCount] = useState(unreadCount);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isMarkingAll, setIsMarkingAll] = useState(false);

  useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  useEffect(() => {
    setLiveUnreadCount(unreadCount);
  }, [unreadCount]);

  const fetchLatest = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch(`/api/notifications?limit=${pageLimit}`, {
        method: "GET",
        cache: "no-store",
      });
      if (!response.ok) return;

      const data = (await response.json()) as NotificationsResponse;
      if (!data.success) return;

      setItems(Array.isArray(data.items) ? data.items : []);
      setLiveUnreadCount(
        typeof data.unreadCount === "number" ? data.unreadCount : 0,
      );
    } finally {
      setIsRefreshing(false);
    }
  }, [pageLimit]);

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
    setLiveUnreadCount((prev) => Math.max(0, prev - 1));
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
      setLiveUnreadCount(0);
    } finally {
      setIsMarkingAll(false);
    }
  };

  useEffect(() => {
    const eventSource = new EventSource("/api/notifications/stream");
    const onMessage = () => {
      fetchLatest();
    };

    eventSource.addEventListener("message", onMessage);
    return () => {
      eventSource.removeEventListener("message", onMessage);
      eventSource.close();
    };
  }, [fetchLatest]);

  const orderedItems = useMemo(
    () => [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [items],
  );

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Notifications
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void fetchLatest()}
            disabled={isRefreshing}
            className="h-8 px-2 text-xs"
          >
            {isRefreshing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Refresh"
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void markAllAsRead()}
            disabled={isMarkingAll || liveUnreadCount === 0}
            className="h-8 px-2 text-xs"
          >
            {isMarkingAll ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <CheckCheck className="h-3.5 w-3.5" />
            )}
            Mark all read
          </Button>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            Unread: {liveUnreadCount}
          </span>
        </div>
      </div>

      {orderedItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {emptyMessage}
        </div>
      ) : (
        <div className="space-y-3">
          {orderedItems.map((item) => {
            const Icon = severityIcon(item.severity);
            const metadataEntries = Object.entries(item.metadata ?? {});
            return (
              <article
                key={item.id}
                className={`rounded-xl border p-4 transition-colors ${
                  item.isRead
                    ? "border-border bg-background"
                    : "border-primary/30 bg-primary/5"
                }`}
              >
                <div className="flex items-start gap-3">
                  <Icon
                    className={`mt-0.5 h-5 w-5 ${severityClass(item.severity)}`}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </h3>
                      {!item.isRead && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-primary" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {item.message}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {formatDateTime(item.createdAt)}
                    </p>
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Event: {humanizeToken(item.eventKey)}
                    </p>
                    {metadataEntries.length > 0 && (
                      <div className="mt-2 rounded-md border border-border/80 bg-background/50 p-2">
                        <p className="text-xs font-semibold text-foreground">
                          What changed
                        </p>
                        <div className="mt-1 grid grid-cols-1 gap-1 text-xs text-muted-foreground sm:grid-cols-2">
                          {metadataEntries.map(([key, value]) => (
                            <p key={key}>
                              <span className="font-medium text-foreground">
                                {humanizeToken(key)}:
                              </span>{" "}
                              {readableValue(value)}
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                    {item.actionUrl && (
                      <a
                        href={item.actionUrl}
                        onClick={() => {
                          if (!item.isRead) {
                            void markOneAsRead(item.id);
                          }
                        }}
                        className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
                      >
                        Open details
                      </a>
                    )}
                    {!item.isRead && (
                      <button
                        type="button"
                        onClick={() => void markOneAsRead(item.id)}
                        className="ml-3 mt-2 inline-block text-sm font-medium text-muted-foreground hover:text-foreground"
                      >
                        Mark read
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
