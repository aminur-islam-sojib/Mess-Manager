import { getServerSession } from "next-auth";
import { notFound, redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getNotificationByIdForUser } from "@/lib/notificationService";
import NotificationDetailClient from "@/components/Notifications/NotificationDetailClient";

export default async function NotificationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect("/auth/login");
  }

  const { id } = await params;
  const notification = await getNotificationByIdForUser(id, session.user.id);

  if (!notification) {
    notFound();
  }

  return <NotificationDetailClient notification={notification} />;
}
