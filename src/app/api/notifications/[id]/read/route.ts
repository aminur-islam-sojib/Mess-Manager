import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { markNotificationAsReadForUser } from "@/lib/notifications";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json(
      { success: false, message: "Unauthorized" },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const success = await markNotificationAsReadForUser(session.user.id, id);

  return Response.json({
    success,
    message: success ? "Notification marked as read" : "Notification not found",
  });
}
