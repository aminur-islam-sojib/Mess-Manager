import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getUnreadNotificationCountForUserId } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const unreadCount = await getUnreadNotificationCountForUserId(
    session.user.id,
  );

  return Response.json({
    success: true,
    unreadCount,
  });
}
