import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getNotificationsForUser } from "@/lib/notificationService";
import NotificationCenterClient from "@/components/Notifications/NotificationCenterClient";

export default async function NotificationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { notifications, unreadCount } = await getNotificationsForUser(
    session.user.id,
    100,
  );

  return (
    <NotificationCenterClient
      initialNotifications={notifications}
      initialUnreadCount={unreadCount}
    />
  );
}
