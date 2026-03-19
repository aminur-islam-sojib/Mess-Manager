type NotificationStreamPayload = {
  type: "notification";
  timestamp: number;
};

type NotificationStreamListener = (payload: NotificationStreamPayload) => void;

type RealtimeStore = Map<string, Set<NotificationStreamListener>>;

declare global {
  var __messManagerNotificationStore__: RealtimeStore | undefined;
}

function getStore(): RealtimeStore {
  if (!globalThis.__messManagerNotificationStore__) {
    globalThis.__messManagerNotificationStore__ = new Map();
  }
  return globalThis.__messManagerNotificationStore__;
}

export function subscribeToNotificationStream(
  userId: string,
  listener: NotificationStreamListener,
): () => void {
  const store = getStore();
  const current = store.get(userId) ?? new Set<NotificationStreamListener>();
  current.add(listener);
  store.set(userId, current);

  return () => {
    const listeners = store.get(userId);
    if (!listeners) return;
    listeners.delete(listener);
    if (listeners.size === 0) {
      store.delete(userId);
    }
  };
}

export function publishNotificationSignal(userIds: string[]) {
  if (!userIds.length) return;

  const uniqueUserIds = Array.from(new Set(userIds));
  const payload: NotificationStreamPayload = {
    type: "notification",
    timestamp: Date.now(),
  };

  const store = getStore();
  for (const userId of uniqueUserIds) {
    const listeners = store.get(userId);
    if (!listeners?.size) continue;

    for (const listener of listeners) {
      listener(payload);
    }
  }
}
