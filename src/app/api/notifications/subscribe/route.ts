import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { registerNotificationPushSubscription } from "@/lib/notificationService";
import type {
  PushSubscriptionDeviceType,
  PushSubscriptionPayload,
} from "@/types/Notification";

type SubscribeBody = {
  subscription?: PushSubscriptionPayload;
  deviceType?: PushSubscriptionDeviceType;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as SubscribeBody | null;

  if (!body?.subscription) {
    return Response.json(
      { success: false, message: "Subscription payload is required" },
      { status: 400 },
    );
  }

  try {
    await registerNotificationPushSubscription({
      userId: session.user.id,
      subscription: body.subscription,
      deviceType: body.deviceType,
      userAgent: request.headers.get("user-agent"),
    });

    return Response.json({
      success: true,
      message: "Push subscription registered",
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to register push subscription",
      },
      { status: 400 },
    );
  }
}
