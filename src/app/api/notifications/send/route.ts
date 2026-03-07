import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  createNotification,
  createNotificationsForUsers,
  getActiveMembership,
  getMessRecipientUserIds,
} from "@/lib/notificationService";
import type { NotificationMetadata, NotificationType } from "@/types/Notification";

type SendBody = {
  type?: NotificationType | string;
  title?: string;
  message?: string;
  messId?: string;
  userId?: string;
  metadata?: NotificationMetadata;
  sendPush?: boolean;
  target?: "user" | "mess";
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const membership = await getActiveMembership(session.user.id);
  const isManager =
    session.user.role === "manager" && membership?.role === "manager";

  if (!isManager && session.user.role !== "admin") {
    return Response.json(
      { success: false, message: "Only manager can send notifications" },
      { status: 403 },
    );
  }

  const body = (await request.json().catch(() => null)) as SendBody | null;

  if (!body?.type || !body.title?.trim() || !body.message?.trim()) {
    return Response.json(
      {
        success: false,
        message: "Type, title, and message are required",
      },
      { status: 400 },
    );
  }

  const messId = body.messId ?? membership?.messId.toString();

  if (!messId) {
    return Response.json(
      { success: false, message: "Mess ID is required" },
      { status: 400 },
    );
  }

  if (
    session.user.role !== "admin" &&
    membership?.messId.toString() !== messId
  ) {
    return Response.json(
      {
        success: false,
        message: "You are not authorized to notify another mess",
      },
      { status: 403 },
    );
  }

  try {
    if (body.target === "user" || body.userId) {
      const notification = await createNotification({
        userId: body.userId as string,
        messId,
        type: body.type,
        title: body.title,
        message: body.message,
        metadata: body.metadata,
        sendPush: body.sendPush,
      });

      return Response.json({
        success: true,
        count: 1,
        notification,
      });
    }

    const userIds = await getMessRecipientUserIds(messId);
    const notifications = await createNotificationsForUsers({
      userIds,
      messId,
      type: body.type,
      title: body.title,
      message: body.message,
      metadata: body.metadata,
      sendPush: body.sendPush,
    });

    return Response.json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to send notification",
      },
      { status: 400 },
    );
  }
}
