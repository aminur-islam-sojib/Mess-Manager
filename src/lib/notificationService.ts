import { ObjectId } from "mongodb";
import { collections, dbConnect } from "@/lib/dbConnect";
import { triggerRealTimeNotification } from "@/lib/notificationRealtime";
import {
  dispatchPushNotifications,
  registerPushSubscription,
} from "@/lib/notificationPush";
import type {
  NotificationBulkCreateInput,
  NotificationCategory,
  NotificationCreateInput,
  NotificationDocument,
  NotificationDocumentMongo,
  NotificationListResponse,
  NotificationMetadata,
  NotificationMetadataValue,
  NotificationSerialized,
  NotificationType,
  PushSubscriptionDeviceType,
  PushSubscriptionPayload,
} from "@/types/Notification";

type ActiveMembership = {
  _id: ObjectId;
  messId: ObjectId;
  userId: ObjectId;
  role: "manager" | "member";
  status: string;
};

type UserNotificationPreferences = {
  role?: string;
  notifications?: {
    depositRequestNotifications?: boolean;
    expenseNotifications?: boolean;
    mealReminders?: boolean;
  };
  notificationSettings?: {
    mealReminder?: boolean;
    depositUpdate?: boolean;
    expenseAlert?: boolean;
  };
};

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const parseObjectId = (
  value: string | ObjectId | null | undefined,
): ObjectId | null => {
  if (!value) return null;
  if (value instanceof ObjectId) return value;

  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const sanitizeMetadataValue = (
  value: NotificationMetadataValue | unknown,
): NotificationMetadataValue => {
  if (value === null) return null;

  if (value instanceof ObjectId) {
    return value.toString();
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadataValue(item));
  }

  if (typeof value === "object") {
    return sanitizeMetadata((value as NotificationMetadata) ?? {});
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value;
  }

  return String(value ?? "");
};

const sanitizeMetadata = (metadata?: NotificationMetadata): NotificationMetadata =>
  Object.fromEntries(
    Object.entries(metadata ?? {}).map(([key, value]) => [
      key,
      sanitizeMetadataValue(value),
    ]),
  );

const clampLimit = (limit?: number) => {
  if (!limit || Number.isNaN(limit)) return DEFAULT_LIMIT;
  return Math.min(Math.max(limit, 1), MAX_LIMIT);
};

export const getNotificationCategory = (
  type: NotificationType | string,
): NotificationCategory => {
  if (type.startsWith("deposit_")) return "deposit";
  if (type.startsWith("expense_")) return "expense";
  if (type.startsWith("meal_")) return "meal";
  if (
    type.startsWith("member_") ||
    type.startsWith("invitation_")
  ) {
    return "member_activity";
  }
  return "system";
};

const getNotificationTargetPath = (metadata: NotificationMetadata) => {
  const targetPath = metadata.targetPath;
  return typeof targetPath === "string" ? targetPath : null;
};

export const serializeNotification = (
  notification: NotificationDocumentMongo,
): NotificationSerialized => {
  const metadata = sanitizeMetadata(notification.metadata);

  return {
    id: notification._id.toString(),
    userId: notification.userId.toString(),
    messId: notification.messId.toString(),
    type: notification.type,
    category: getNotificationCategory(notification.type),
    title: notification.title,
    message: notification.message,
    metadata,
    isRead: notification.isRead,
    createdAt: notification.createdAt.toISOString(),
    sendPush: Boolean(notification.sendPush),
    href: `/dashboard/notifications/${notification._id.toString()}`,
    targetPath: getNotificationTargetPath(metadata),
  };
};

export async function getActiveMembership(
  userId: string | ObjectId,
): Promise<ActiveMembership | null> {
  const userObjectId = parseObjectId(userId);
  if (!userObjectId) return null;

  const memberCollection = dbConnect(collections.MESS_MEMBERS);
  const membership = await memberCollection.findOne({
    userId: userObjectId,
    status: "active",
  });

  return (membership as ActiveMembership | null) ?? null;
}

const assertRecipientInMess = async (userId: ObjectId, messId: ObjectId) => {
  const memberCollection = dbConnect(collections.MESS_MEMBERS);
  const membership = await memberCollection.findOne({
    userId,
    messId,
    status: "active",
  });

  if (!membership) {
    throw new Error("Notification recipient must belong to the target mess");
  }
};

const getUnreadCountByUserId = async (userId: ObjectId) => {
  const notificationCollection = dbConnect(collections.NOTIFICATIONS);
  return notificationCollection.countDocuments({
    userId,
    isRead: false,
  });
};

const shouldSendPushNotification = async (
  userId: ObjectId,
  type: NotificationType | string,
) => {
  const usersCollection = dbConnect(collections.USERS);
  const user = (await usersCollection.findOne({
    _id: userId,
  })) as UserNotificationPreferences | null;

  if (!user) {
    return false;
  }

  const category = getNotificationCategory(type);

  if (user.role === "manager") {
    const preferences = user.notifications ?? {};

    if (category === "deposit") {
      return preferences.depositRequestNotifications !== false;
    }

    if (category === "expense") {
      return preferences.expenseNotifications !== false;
    }

    if (category === "meal") {
      return preferences.mealReminders !== false;
    }

    return true;
  }

  const preferences = user.notificationSettings ?? {};

  if (category === "deposit") {
    return preferences.depositUpdate !== false;
  }

  if (category === "expense") {
    return preferences.expenseAlert !== false;
  }

  if (category === "meal") {
    return preferences.mealReminder !== false;
  }

  return true;
};

const broadcastCreatedEvent = async (
  userId: ObjectId,
  notification: NotificationSerialized,
) => {
  const unreadCount = await getUnreadCountByUserId(userId);

  triggerRealTimeNotification(userId.toString(), {
    kind: "created",
    notification,
    unreadCount,
  });
};

const deliverPushIfEnabled = async (
  userId: ObjectId,
  notification: NotificationSerialized,
) => {
  try {
    const shouldSend = await shouldSendPushNotification(userId, notification.type);
    if (!shouldSend || !notification.sendPush) {
      return;
    }

    await dispatchPushNotifications(userId, notification);
  } catch (error) {
    console.error("Push delivery failed:", error);
  }
};

export async function createNotificationsForUsers(
  input: NotificationBulkCreateInput,
) {
  const messId = parseObjectId(input.messId);
  if (!messId) {
    throw new Error("Invalid mess ID");
  }

  const requestedUserIds = Array.from(
    new Set(
      input.userIds
        .map((value) => parseObjectId(value))
        .filter((value): value is ObjectId => Boolean(value))
        .map((value) => value.toString()),
    ),
  ).map((value) => new ObjectId(value));

  if (!requestedUserIds.length) {
    return [] as NotificationSerialized[];
  }

  const memberCollection = dbConnect(collections.MESS_MEMBERS);
  const activeMembers = await memberCollection
    .find({
      messId,
      userId: { $in: requestedUserIds },
      status: "active",
    })
    .project<{ userId: ObjectId }>({ userId: 1 })
    .toArray();

  const activeUserIds = activeMembers.map((member) => member.userId);
  if (!activeUserIds.length) {
    return [] as NotificationSerialized[];
  }

  const now = new Date();
  const metadata = sanitizeMetadata(input.metadata);
  const documents: NotificationDocument[] = activeUserIds.map((userId) => ({
    userId,
    messId,
    type: input.type,
    title: input.title.trim(),
    message: input.message.trim(),
    metadata,
    isRead: false,
    createdAt: now,
    sendPush: input.sendPush !== false,
  }));

  const notificationCollection = dbConnect(collections.NOTIFICATIONS);
  const insertedIds =
    documents.length === 1
      ? [(await notificationCollection.insertOne(documents[0])).insertedId]
      : Object.values((await notificationCollection.insertMany(documents)).insertedIds);

  const serialized = documents.map((document, index) =>
    serializeNotification({
      ...document,
      _id: insertedIds[index],
    }),
  );

  await Promise.all(
    serialized.map(async (notification, index) => {
      const userId = activeUserIds[index];
      await Promise.all([
        broadcastCreatedEvent(userId, notification),
        deliverPushIfEnabled(userId, notification),
      ]);
    }),
  );

  return serialized;
}

export async function createNotification(input: NotificationCreateInput) {
  const userId = parseObjectId(input.userId);
  const messId = parseObjectId(input.messId);

  if (!userId) {
    throw new Error("Invalid user ID");
  }

  if (!messId) {
    throw new Error("Invalid mess ID");
  }

  await assertRecipientInMess(userId, messId);

  const [notification] = await createNotificationsForUsers({
    ...input,
    userIds: [userId],
  });

  if (!notification) {
    throw new Error("Failed to create notification");
  }

  return notification;
}

export async function getNotificationsForUser(
  userId: string | ObjectId,
  limit = DEFAULT_LIMIT,
): Promise<NotificationListResponse> {
  const userObjectId = parseObjectId(userId);
  if (!userObjectId) {
    throw new Error("Invalid user ID");
  }

  const notificationCollection = dbConnect(collections.NOTIFICATIONS);
  const notifications = (await notificationCollection
    .find({ userId: userObjectId })
    .sort({ createdAt: -1 })
    .limit(clampLimit(limit))
    .toArray()) as NotificationDocumentMongo[];

  const unreadCount = await getUnreadCountByUserId(userObjectId);

  return {
    notifications: notifications.map(serializeNotification),
    unreadCount,
  };
}

export async function getNotificationsSince(
  userId: string | ObjectId,
  since: string | Date,
) {
  const userObjectId = parseObjectId(userId);
  if (!userObjectId) {
    throw new Error("Invalid user ID");
  }

  const sinceDate =
    since instanceof Date ? since : new Date(typeof since === "string" ? since : "");

  if (Number.isNaN(sinceDate.getTime())) {
    return [] as NotificationSerialized[];
  }

  const notificationCollection = dbConnect(collections.NOTIFICATIONS);
  const notifications = (await notificationCollection
    .find({
      userId: userObjectId,
      createdAt: { $gt: sinceDate },
    })
    .sort({ createdAt: 1 })
    .limit(MAX_LIMIT)
    .toArray()) as NotificationDocumentMongo[];

  return notifications.map(serializeNotification);
}

export async function getNotificationByIdForUser(
  notificationId: string,
  userId: string | ObjectId,
) {
  const notificationObjectId = parseObjectId(notificationId);
  const userObjectId = parseObjectId(userId);

  if (!notificationObjectId) {
    throw new Error("Invalid notification ID");
  }

  if (!userObjectId) {
    throw new Error("Invalid user ID");
  }

  const notificationCollection = dbConnect(collections.NOTIFICATIONS);
  const notification = (await notificationCollection.findOne({
    _id: notificationObjectId,
    userId: userObjectId,
  })) as NotificationDocumentMongo | null;

  if (!notification) {
    return null;
  }

  return serializeNotification(notification);
}

export async function markNotificationReadForUser(
  notificationId: string,
  userId: string | ObjectId,
) {
  const notificationObjectId = parseObjectId(notificationId);
  const userObjectId = parseObjectId(userId);

  if (!notificationObjectId) {
    throw new Error("Invalid notification ID");
  }

  if (!userObjectId) {
    throw new Error("Invalid user ID");
  }

  const notificationCollection = dbConnect(collections.NOTIFICATIONS);
  const result = await notificationCollection.updateOne(
    {
      _id: notificationObjectId,
      userId: userObjectId,
    },
    {
      $set: {
        isRead: true,
      },
    },
  );

  const unreadCount = await getUnreadCountByUserId(userObjectId);

  if (result.matchedCount > 0) {
    triggerRealTimeNotification(userObjectId.toString(), {
      kind: "read",
      notificationId,
      unreadCount,
    });
  }

  return {
    success: result.matchedCount > 0,
    unreadCount,
  };
}

export async function markAllNotificationsReadForUser(userId: string | ObjectId) {
  const userObjectId = parseObjectId(userId);
  if (!userObjectId) {
    throw new Error("Invalid user ID");
  }

  await dbConnect(collections.NOTIFICATIONS).updateMany(
    {
      userId: userObjectId,
      isRead: false,
    },
    {
      $set: {
        isRead: true,
      },
    },
  );

  triggerRealTimeNotification(userObjectId.toString(), {
    kind: "all-read",
    unreadCount: 0,
  });

  return {
    success: true,
    unreadCount: 0,
  };
}

export async function registerNotificationPushSubscription({
  userId,
  subscription,
  deviceType,
  userAgent,
}: {
  userId: string | ObjectId;
  subscription: PushSubscriptionPayload;
  deviceType?: PushSubscriptionDeviceType;
  userAgent?: string | null;
}) {
  const membership = await getActiveMembership(userId);

  return registerPushSubscription({
    userId,
    messId: membership?.messId ?? null,
    subscription,
    deviceType,
    userAgent,
  });
}

export async function getMessRecipientUserIds(
  messId: string | ObjectId,
  options?: {
    includeManagers?: boolean;
    includeMembers?: boolean;
  },
) {
  const messObjectId = parseObjectId(messId);
  if (!messObjectId) {
    throw new Error("Invalid mess ID");
  }

  const includeManagers = options?.includeManagers !== false;
  const includeMembers = options?.includeMembers !== false;
  const roles: Array<"manager" | "member"> = [];

  if (includeManagers) {
    roles.push("manager");
  }

  if (includeMembers) {
    roles.push("member");
  }

  if (!roles.length) {
    return [] as string[];
  }

  const members = await dbConnect(collections.MESS_MEMBERS)
    .find({
      messId: messObjectId,
      role: { $in: roles },
      status: "active",
    })
    .project<{ userId: ObjectId }>({ userId: 1 })
    .toArray();

  return members.map((member) => member.userId.toString());
}
