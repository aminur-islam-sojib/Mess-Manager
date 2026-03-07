"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import type {
  NotificationListResponse,
  NotificationRealtimeEvent,
  NotificationSerialized,
  PushSubscriptionDeviceType,
  PushSubscriptionPayload,
} from "@/types/Notification";

type PushPermissionState = NotificationPermission | "unsupported";

type NotificationContextValue = {
  notifications: NotificationSerialized[];
  unreadCount: number;
  isLoading: boolean;
  isConnected: boolean;
  pushPermission: PushPermissionState;
  canEnablePush: boolean;
  refreshNotifications: (limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<boolean>;
  markAllAsRead: () => Promise<boolean>;
  enablePushNotifications: () => Promise<boolean>;
};

const NotificationContext = createContext<NotificationContextValue | null>(null);

const INITIAL_LIMIT = 20;

const sortNotifications = (notifications: NotificationSerialized[]) =>
  [...notifications].sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
  );

const mergeNotifications = (
  current: NotificationSerialized[],
  incoming: NotificationSerialized[],
) => {
  const merged = new Map(
    current.map((notification) => [notification.id, notification]),
  );

  for (const notification of incoming) {
    const existing = merged.get(notification.id);
    merged.set(notification.id, {
      ...existing,
      ...notification,
    });
  }

  return sortNotifications(Array.from(merged.values()));
};

const detectDeviceType = (): PushSubscriptionDeviceType => {
  if (typeof navigator === "undefined") return "web";

  const userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.includes("android")) return "android";
  if (userAgent.includes("iphone") || userAgent.includes("ipad")) return "ios";
  return "web";
};

const decodeVapidKey = (base64Key: string) => {
  const padding = "=".repeat((4 - (base64Key.length % 4)) % 4);
  const normalized = (base64Key + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const decoded = atob(normalized);

  return Uint8Array.from(decoded, (character) => character.charCodeAt(0));
};

const showRealtimeToast = (notification: NotificationSerialized) => {
  const isError =
    notification.type.endsWith("_rejected") ||
    notification.type === "member_removed";

  if (isError) {
    toast.error(notification.title, {
      description: notification.message,
    });
    return;
  }

  toast.success(notification.title, {
    description: notification.message,
  });
};

const showErrorToast = (error: unknown, fallbackMessage: string) => {
  toast.error(error instanceof Error ? error.message : fallbackMessage);
};

export default function NotificationProvider({
  children,
}: {
  children: ReactNode;
}) {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<NotificationSerialized[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [pushPermission, setPushPermission] =
    useState<PushPermissionState>("unsupported");

  const canEnablePush =
    pushPermission !== "unsupported" &&
    pushPermission !== "granted" &&
    Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY);

  const refreshNotifications = async (limit = INITIAL_LIMIT) => {
    if (status !== "authenticated") return;

    const response = await fetch(`/api/notifications?limit=${limit}`, {
      cache: "no-store",
    });
    const payload = (await response.json().catch(() => null)) as
      | ({ success: boolean; message?: string } & Partial<NotificationListResponse>)
      | null;

    if (!response.ok || !payload?.success) {
      throw new Error(payload?.message || "Failed to load notifications");
    }

    setNotifications(sortNotifications(payload.notifications ?? []));
    setUnreadCount(payload.unreadCount ?? 0);
  };

  const subscribeToPushNotifications = async (promptForPermission: boolean) => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPushPermission("unsupported");
      return false;
    }

    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidPublicKey) {
      throw new Error("Browser push is not configured for this environment");
    }

    let permission = Notification.permission;
    if (promptForPermission && permission !== "granted") {
      permission = await Notification.requestPermission();
    }

    setPushPermission(permission);

    if (permission !== "granted") {
      return false;
    }

    if (!window.isSecureContext) {
      throw new Error("Push notifications require a secure context");
    }

    const registration = await navigator.serviceWorker.register("/sw.js");
    const existingSubscription = await registration.pushManager.getSubscription();
    const subscription =
      existingSubscription ??
      (await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: decodeVapidKey(vapidPublicKey),
      }));

    const payload = subscription.toJSON() as PushSubscriptionPayload;
    const response = await fetch("/api/notifications/subscribe", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        subscription: payload,
        deviceType: detectDeviceType(),
      }),
    });
    const responsePayload = (await response.json().catch(() => null)) as
      | { success: boolean; message?: string }
      | null;

    if (!response.ok || !responsePayload?.success) {
      throw new Error(
        responsePayload?.message || "Failed to register push subscription",
      );
    }

    return true;
  };

  useEffect(() => {
    if (status !== "authenticated") {
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      setIsConnected(false);
      return;
    }

    let active = true;
    let eventSource: EventSource | null = null;

    const handleRealtimeEvent = (event: NotificationRealtimeEvent) => {
      if (event.kind === "ready") {
        setUnreadCount(event.unreadCount);
        return;
      }

      if (event.kind === "created") {
        setNotifications((current) =>
          mergeNotifications(current, [event.notification]).slice(0, INITIAL_LIMIT),
        );
        setUnreadCount(event.unreadCount);
        showRealtimeToast(event.notification);
        return;
      }

      if (event.kind === "sync") {
        setNotifications(sortNotifications(event.notifications).slice(0, INITIAL_LIMIT));
        setUnreadCount(event.unreadCount);
        return;
      }

      if (event.kind === "read") {
        setNotifications((current) =>
          current.map((notification) =>
            notification.id === event.notificationId
              ? { ...notification, isRead: true }
              : notification,
          ),
        );
        setUnreadCount(event.unreadCount);
        return;
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
      setUnreadCount(event.unreadCount);
    };

    const start = async () => {
      setIsLoading(true);

      try {
        const response = await fetch(`/api/notifications?limit=${INITIAL_LIMIT}`, {
          cache: "no-store",
        });
        const payload = (await response.json().catch(() => null)) as
          | ({ success: boolean; message?: string } & Partial<NotificationListResponse>)
          | null;

        if (!active) return;

        if (!response.ok || !payload?.success) {
          throw new Error(payload?.message || "Failed to load notifications");
        }

        const notificationPayload: NotificationListResponse = {
          notifications: payload.notifications ?? [],
          unreadCount: payload.unreadCount ?? 0,
        };
        setNotifications(sortNotifications(notificationPayload.notifications));
        setUnreadCount(notificationPayload.unreadCount);

        const latestCursor =
          notificationPayload.notifications[0]?.createdAt ??
          new Date().toISOString();

        eventSource = new EventSource(
          `/api/notifications/stream?cursor=${encodeURIComponent(latestCursor)}`,
        );
        eventSource.onopen = () => {
          if (active) {
            setIsConnected(true);
          }
        };
        eventSource.onerror = () => {
          if (active) {
            setIsConnected(false);
          }
        };
        eventSource.addEventListener("notification", (event) => {
          const parsed = JSON.parse(
            (event as MessageEvent<string>).data,
          ) as NotificationRealtimeEvent;
          handleRealtimeEvent(parsed);
        });
      } catch (error) {
        if (active) {
          showErrorToast(error, "Failed to load notifications");
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void start();

    return () => {
      active = false;
      eventSource?.close();
      setIsConnected(false);
    };
  }, [status]);

  useEffect(() => {
    if (
      typeof window === "undefined" ||
      !("Notification" in window) ||
      !("serviceWorker" in navigator) ||
      !("PushManager" in window)
    ) {
      setPushPermission("unsupported");
      return;
    }

    setPushPermission(Notification.permission);

    if (status === "authenticated" && Notification.permission === "granted") {
      const restorePushSubscription = async () => {
        try {
          await subscribeToPushNotifications(false);
        } catch (error) {
          console.error("Push subscription restore failed:", error);
        }
      };

      void restorePushSubscription();
    }
  }, [status]);

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ notificationId }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success: boolean; unreadCount?: number; message?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(payload?.message || "Failed to mark notification as read");
      }

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? { ...notification, isRead: true }
            : notification,
        ),
      );
      setUnreadCount(payload.unreadCount ?? 0);
      return true;
    } catch (error) {
      showErrorToast(error, "Failed to update notification");
      return false;
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ markAll: true }),
      });
      const payload = (await response.json().catch(() => null)) as
        | { success: boolean; unreadCount?: number; message?: string }
        | null;

      if (!response.ok || !payload?.success) {
        throw new Error(
          payload?.message || "Failed to mark notifications as read",
        );
      }

      setNotifications((current) =>
        current.map((notification) => ({
          ...notification,
          isRead: true,
        })),
      );
      setUnreadCount(payload.unreadCount ?? 0);
      return true;
    } catch (error) {
      showErrorToast(error, "Failed to update notifications");
      return false;
    }
  };

  const enablePushNotifications = async () => {
    try {
      const success = await subscribeToPushNotifications(true);
      if (success) {
        toast.success("Browser alerts enabled");
        return true;
      }

      toast.error("Browser alerts are disabled");
      return false;
    } catch (error) {
      showErrorToast(error, "Failed to enable browser alerts");
      return false;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        isLoading,
        isConnected,
        pushPermission,
        canEnablePush,
        refreshNotifications: refreshNotifications,
        markAsRead,
        markAllAsRead,
        enablePushNotifications,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);

  if (!context) {
    throw new Error("useNotifications must be used within NotificationProvider");
  }

  return context;
}
