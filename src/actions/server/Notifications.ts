"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  getRecentNotificationsForUserId,
  getUnreadNotificationCountForUserId,
  markAllNotificationsAsReadForUser,
  markNotificationAsReadForUser,
} from "@/lib/notifications";

export async function getMyNotifications(limit = 30) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false as const, message: "Unauthorized" };
  }

  const [items, unreadCount] = await Promise.all([
    getRecentNotificationsForUserId(session.user.id, limit),
    getUnreadNotificationCountForUserId(session.user.id),
  ]);

  return {
    success: true as const,
    items,
    unreadCount,
  };
}

export async function markMyNotificationAsRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false as const, message: "Unauthorized" };
  }

  const updated = await markNotificationAsReadForUser(
    session.user.id,
    notificationId,
  );

  return {
    success: updated,
    message: updated ? "Notification marked as read" : "Notification not found",
  } as const;
}

export async function markAllMyNotificationsAsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false as const, message: "Unauthorized" };
  }

  const updatedCount = await markAllNotificationsAsReadForUser(session.user.id);

  return {
    success: true as const,
    updatedCount,
  };
}
