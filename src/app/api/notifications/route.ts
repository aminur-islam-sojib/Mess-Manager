import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getNotificationsForUser } from "@/lib/notificationService";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return Response.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? "20");

  try {
    const result = await getNotificationsForUser(session.user.id, limitParam);

    return Response.json(
      {
        success: true,
        ...result,
      },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    return Response.json(
      {
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch notifications",
      },
      { status: 400 },
    );
  }
}
