import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { subscribeToNotificationStream } from "@/lib/notificationRealtime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  let cleanup: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const sendEvent = (event: string, payload: Record<string, unknown>) => {
        controller.enqueue(
          encoder.encode(
            `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`,
          ),
        );
      };

      sendEvent("connected", { timestamp: Date.now() });

      const unsubscribe = subscribeToNotificationStream(userId, (payload) => {
        sendEvent("message", payload);
      });

      const heartbeat = setInterval(() => {
        sendEvent("heartbeat", { timestamp: Date.now() });
      }, 25000);

      cleanup = () => {
        clearInterval(heartbeat);
        unsubscribe();
      };
    },
    cancel() {
      cleanup?.();
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
