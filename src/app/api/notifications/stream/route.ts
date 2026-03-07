import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  getNotificationsForUser,
  getNotificationsSince,
} from "@/lib/notificationService";
import { subscribeToRealtimeNotifications } from "@/lib/notificationRealtime";
import type { NotificationRealtimeEvent } from "@/types/Notification";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const encoder = new TextEncoder();

const formatEvent = (eventName: string, payload: unknown) =>
  encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(payload)}\n\n`);

const resolveCursor = (rawValue: string | null) => {
  const candidate = rawValue ? new Date(rawValue) : new Date();
  if (Number.isNaN(candidate.getTime())) {
    return new Date();
  }

  return candidate;
};

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  let cursor = resolveCursor(request.nextUrl.searchParams.get("cursor"));
  let unsubscribe: (() => void) | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let closed = false;
  let pollInFlight = false;
  let cleanup = () => {};

  const stream = new ReadableStream({
    async start(controller) {
      const push = (eventName: string, payload: NotificationRealtimeEvent | { timestamp: string }) => {
        if (closed) return;

        try {
          controller.enqueue(formatEvent(eventName, payload));
        } catch {
          cleanup();
        }
      };

      cleanup = () => {
        if (closed) return;
        closed = true;

        if (heartbeatTimer) {
          clearInterval(heartbeatTimer);
        }

        if (pollTimer) {
          clearInterval(pollTimer);
        }

        unsubscribe?.();

        try {
          controller.close();
        } catch {
          // The stream might already be closed by the runtime.
        }
      };

      request.signal.addEventListener("abort", cleanup);

      unsubscribe = subscribeToRealtimeNotifications(userId, (event) => {
        if (event.kind === "created") {
          const createdAt = new Date(event.notification.createdAt);
          if (!Number.isNaN(createdAt.getTime()) && createdAt > cursor) {
            cursor = createdAt;
          }
        }

        push("notification", event);
      });

      const initialState = await getNotificationsForUser(userId, 1);
      push("notification", {
        kind: "ready",
        unreadCount: initialState.unreadCount,
      });

      heartbeatTimer = setInterval(() => {
        push("ping", { timestamp: new Date().toISOString() });
      }, 20000);

      pollTimer = setInterval(() => {
        if (pollInFlight || closed) return;
        pollInFlight = true;

        void (async () => {
          try {
            const notifications = await getNotificationsSince(userId, cursor);

            if (notifications.length) {
              cursor = new Date(
                notifications[notifications.length - 1].createdAt,
              );
              const latest = await getNotificationsForUser(userId, 20);

              push("notification", {
                kind: "sync",
                notifications: latest.notifications,
                unreadCount: latest.unreadCount,
              });
            }
          } catch (error) {
            console.error("Notification stream sync error:", error);
          } finally {
            pollInFlight = false;
          }
        })();
      }, 15000);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
