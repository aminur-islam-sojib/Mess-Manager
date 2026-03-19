import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  getRecentNotificationsForUserId,
  getUnreadNotificationCountForUserId,
  markAllNotificationsAsReadForUser,
} from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") ?? "8");
  const limit = Number.isFinite(limitRaw)
    ? Math.max(1, Math.min(100, Math.floor(limitRaw)))
    : 8;

  const [items, unreadCount] = await Promise.all([
    getRecentNotificationsForUserId(session.user.id, limit),
    getUnreadNotificationCountForUserId(session.user.id),
  ]);

  return Response.json({
    success: true,
    items,
    unreadCount,
  });
}

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const updatedCount = await markAllNotificationsAsReadForUser(session.user.id);

  return Response.json({
    success: true,
    updatedCount,
  });
}
