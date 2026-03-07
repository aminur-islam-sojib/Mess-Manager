"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import NotificationItem from "@/components/Notifications/NotificationItem";
import { useNotifications } from "@/components/Notifications/NotificationProvider";
import type { NotificationSerialized } from "@/types/Notification";

export default function NotificationCenterClient({
  initialNotifications,
  initialUnreadCount,
}: {
  initialNotifications: NotificationSerialized[];
  initialUnreadCount: number;
}) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const { markAsRead, markAllAsRead, canEnablePush, enablePushNotifications } =
    useNotifications();

  const openNotification = async (notification: NotificationSerialized) => {
    if (!notification.isRead) {
      const success = await markAsRead(notification.id);
      if (success) {
        setNotifications((current) =>
          current.map((item) =>
            item.id === notification.id ? { ...item, isRead: true } : item,
          ),
        );
        setUnreadCount((current) => Math.max(0, current - 1));
      }
    }

    router.push(notification.href);
  };

  const handleMarkAll = async () => {
    const success = await markAllAsRead();
    if (!success) return;

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        isRead: true,
      })),
    );
    setUnreadCount(0);
  };

  return (
    <div className="space-y-6">
      <section className="rounded-[2rem] border border-border/80 bg-card/95 p-6 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-primary">Notification Center</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.02em] text-foreground">
              Recent activity
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {unreadCount > 0
                ? `${unreadCount} unread notifications need attention.`
                : "You have reviewed all notifications."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canEnablePush && (
              <button
                type="button"
                onClick={() => {
                  void enablePushNotifications();
                }}
                className="rounded-full border border-primary/25 bg-primary/8 px-4 py-2 text-sm font-semibold text-primary transition-colors hover:bg-primary/12"
              >
                Enable browser alerts
              </button>
            )}

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={() => {
                  void handleMarkAll();
                }}
                className="rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-accent"
              >
                Mark all as read
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border/80 bg-card/95 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.06)] md:p-5">
        {notifications.length === 0 ? (
          <div className="rounded-[1.5rem] border border-dashed border-border px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-foreground">
              No notifications yet
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Deposit, expense, member, meal, and system updates will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => {
                  void openNotification(notification);
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
