"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import {
  createNotification as createNotificationRecord,
  createNotificationsForUsers,
  getNotificationByIdForUser,
  getNotificationsForUser,
  getMessRecipientUserIds,
  markAllNotificationsReadForUser,
  markNotificationReadForUser,
} from "@/lib/notificationService";
import type {
  NotificationBulkCreateInput,
  NotificationCreateInput,
  NotificationListResponse,
} from "@/types/Notification";

export async function createNotification(input: NotificationCreateInput) {
  return createNotificationRecord(input);
}

export async function createNotifications(input: NotificationBulkCreateInput) {
  return createNotificationsForUsers(input);
}

export async function getUserNotifications(
  userId: string,
  limit = 50,
): Promise<NotificationListResponse> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.id !== userId) {
    throw new Error("Unauthorized");
  }

  return getNotificationsForUser(userId, limit);
}

export async function getMyNotifications(limit = 50) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return getNotificationsForUser(session.user.id, limit);
}

export async function getMyNotificationById(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return getNotificationByIdForUser(notificationId, session.user.id);
}

export async function markNotificationRead(notificationId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return markNotificationReadForUser(notificationId, session.user.id);
}

export async function markAllNotificationsRead() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  return markAllNotificationsReadForUser(session.user.id);
}

export async function sendMealReminderNotifications({
  messId,
  title,
  message,
  metadata,
  sendPush = true,
}: {
  messId: string;
  title: string;
  message: string;
  metadata?: NotificationCreateInput["metadata"];
  sendPush?: boolean;
}) {
  const recipientIds = await getMessRecipientUserIds(messId);

  return createNotificationsForUsers({
    userIds: recipientIds,
    messId,
    type: "meal_reminder",
    title,
    message,
    metadata,
    sendPush,
  });
}
