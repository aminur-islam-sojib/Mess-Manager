import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@/lib/notificationService";

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { notificationId?: string; markAll?: boolean }
    | null;

  if (body?.markAll) {
    const result = await markAllNotificationsReadForUser(session.user.id);
    return Response.json(result);
  }

  if (!body?.notificationId || typeof body.notificationId !== "string") {
    return Response.json(
      { success: false, message: "Notification ID is required" },
      { status: 400 },
    );
  }

  try {
    const result = await markNotificationReadForUser(
      body.notificationId,
      session.user.id,
    );

    if (!result.success) {
      return Response.json(
        { success: false, message: "Notification not found" },
        { status: 404 },
      );
    }

    return Response.json(result);
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Failed to update notification",
      },
      { status: 400 },
    );
  }
}
