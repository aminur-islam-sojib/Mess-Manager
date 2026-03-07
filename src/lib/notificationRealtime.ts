import type { NotificationRealtimeEvent } from "@/types/Notification";

type Subscriber = (event: NotificationRealtimeEvent) => void;

type NotificationRealtimeState = {
  subscribers: Map<string, Set<Subscriber>>;
};

declare global {
  var __messManagerNotificationRealtime__: NotificationRealtimeState | undefined;
}

const state =
  globalThis.__messManagerNotificationRealtime__ ??
  (globalThis.__messManagerNotificationRealtime__ = {
    subscribers: new Map<string, Set<Subscriber>>(),
  });

export function subscribeToRealtimeNotifications(
  userId: string,
  subscriber: Subscriber,
) {
  const bucket = state.subscribers.get(userId) ?? new Set<Subscriber>();
  bucket.add(subscriber);
  state.subscribers.set(userId, bucket);

  return () => {
    const current = state.subscribers.get(userId);
    if (!current) return;

    current.delete(subscriber);
    if (current.size === 0) {
      state.subscribers.delete(userId);
    }
  };
}

export function triggerRealTimeNotification(
  userId: string,
  event: NotificationRealtimeEvent,
) {
  const subscribers = state.subscribers.get(userId);
  if (!subscribers?.size) return;

  for (const subscriber of subscribers) {
    try {
      subscriber(event);
    } catch (error) {
      console.error("Notification realtime subscriber error:", error);
    }
  }
}
