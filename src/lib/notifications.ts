import { ObjectId } from "mongodb";
import { collections, dbConnect } from "@/lib/dbConnect";
import { transporter } from "@/lib/mailer";
import { publishNotificationSignal } from "@/lib/notificationRealtime";
import type {
  EmitNotificationInput,
  NotificationDocument,
  NotificationDocumentWithId,
  NotificationEventKey,
  NotificationSerialized,
} from "@/types/Notification";

type UserNotificationPreferences = {
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

const DEFAULT_DEDUPE_WINDOW_MS = 60 * 1000;
const DEFAULT_CHANNELS: Array<"in_app" | "email" | "realtime"> = [
  "in_app",
  "realtime",
];

const parseObjectId = (value: string | ObjectId): ObjectId => {
  if (value instanceof ObjectId) return value;
  return new ObjectId(value);
};

const normalizeBoolean = (value: unknown, fallback: boolean): boolean =>
  typeof value === "boolean" ? value : fallback;

const matchesEvent = (eventKey: NotificationEventKey, prefix: string) =>
  eventKey.startsWith(prefix);

const shouldSendEventByPreference = (
  preferences: UserNotificationPreferences | null,
  eventKey: NotificationEventKey,
): boolean => {
  if (!preferences) return true;

  const managerPrefs = preferences.notifications ?? {};
  const userPrefs = preferences.notificationSettings ?? {};

  if (matchesEvent(eventKey, "deposit")) {
    return (
      normalizeBoolean(userPrefs.depositUpdate, true) &&
      normalizeBoolean(managerPrefs.depositRequestNotifications, true)
    );
  }

  if (matchesEvent(eventKey, "expense")) {
    return (
      normalizeBoolean(userPrefs.expenseAlert, true) &&
      normalizeBoolean(managerPrefs.expenseNotifications, true)
    );
  }

  if (matchesEvent(eventKey, "meal")) {
    return (
      normalizeBoolean(userPrefs.mealReminder, false) ||
      normalizeBoolean(managerPrefs.mealReminders, false)
    );
  }

  return true;
};

const serializeNotification = (
  doc: NotificationDocumentWithId,
): NotificationSerialized => ({
  id: doc._id.toString(),
  recipientUserId: doc.recipientUserId.toString(),
  messId: doc.messId?.toString(),
  actorUserId: doc.actorUserId?.toString(),
  eventKey: doc.eventKey,
  channels: doc.channels,
  severity: doc.severity,
  title: doc.title,
  message: doc.message,
  actionUrl: doc.actionUrl,
  metadata: doc.metadata,
  isRead: doc.isRead,
  readAt: doc.readAt?.toISOString(),
  createdAt: doc.createdAt.toISOString(),
  updatedAt: doc.updatedAt.toISOString(),
});

async function resolveEligibleRecipientIds(
  recipientUserIds: ObjectId[],
  eventKey: NotificationEventKey,
): Promise<ObjectId[]> {
  const uniqueIds = Array.from(
    new Set(recipientUserIds.map((id) => id.toString())),
  ).map((id) => new ObjectId(id));

  if (!uniqueIds.length) {
    return [];
  }

  const users = await dbConnect(collections.USERS)
    .find(
      { _id: { $in: uniqueIds } },
      { projection: { notifications: 1, notificationSettings: 1 } },
    )
    .toArray();

  const allowedIdSet = new Set(
    users
      .filter((user) =>
        shouldSendEventByPreference(
          {
            notifications: user.notifications,
            notificationSettings: user.notificationSettings,
          },
          eventKey,
        ),
      )
      .map((user) => user._id.toString()),
  );

  return uniqueIds.filter((id) => allowedIdSet.has(id.toString()));
}

async function applyDedupeFilter(
  docs: NotificationDocument[],
  dedupeWindowMs: number,
): Promise<NotificationDocument[]> {
  const withKey = docs.filter((doc) => doc.dedupeKey);
  if (!withKey.length) {
    return docs;
  }

  const now = Date.now();
  const collection = dbConnect(collections.NOTIFICATIONS);

  const keepMap = new Map<string, boolean>();

  for (const doc of withKey) {
    const dedupeKey = doc.dedupeKey as string;
    const exists = await collection.findOne({
      recipientUserId: doc.recipientUserId,
      dedupeKey,
      createdAt: { $gte: new Date(now - dedupeWindowMs) },
    });

    keepMap.set(`${doc.recipientUserId.toString()}::${dedupeKey}`, !exists);
  }

  return docs.filter((doc) => {
    if (!doc.dedupeKey) return true;
    const key = `${doc.recipientUserId.toString()}::${doc.dedupeKey}`;
    return keepMap.get(key) ?? true;
  });
}

async function sendNotificationEmails(docs: NotificationDocument[]) {
  const emailDocs = docs.filter((doc) => doc.channels.includes("email"));
  if (!emailDocs.length) return;

  const recipientIds = Array.from(
    new Set(emailDocs.map((doc) => doc.recipientUserId.toString())),
  ).map((id) => new ObjectId(id));

  const recipients = await dbConnect(collections.USERS)
    .find({ _id: { $in: recipientIds } }, { projection: { email: 1, name: 1 } })
    .toArray();

  const recipientMap = new Map(
    recipients.map((user) => [user._id.toString(), user]),
  );

  for (const doc of emailDocs) {
    const recipient = recipientMap.get(doc.recipientUserId.toString());
    if (!recipient?.email) {
      continue;
    }

    await transporter.sendMail({
      from: `"Mess Manager" <${process.env.EMAIL_USER}>`,
      to: recipient.email,
      subject: doc.title,
      text: `${doc.message}${doc.actionUrl ? `\n\nOpen: ${doc.actionUrl}` : ""}`,
      html: `<p>${doc.message}</p>${
        doc.actionUrl
          ? `<p><a href="${doc.actionUrl}">Open in Mess Manager</a></p>`
          : ""
      }`,
    });
  }
}

export async function emitNotification(
  input: EmitNotificationInput,
): Promise<{ inserted: number }> {
  try {
    const channels = input.channels?.length ? input.channels : DEFAULT_CHANNELS;
    const severity = input.severity ?? "info";
    const dedupeWindowMs = input.dedupeWindowMs ?? DEFAULT_DEDUPE_WINDOW_MS;

    const eligibleRecipients = await resolveEligibleRecipientIds(
      input.recipientUserIds,
      input.eventKey,
    );

    if (!eligibleRecipients.length) {
      return { inserted: 0 };
    }

    const now = new Date();
    const docs: NotificationDocument[] = eligibleRecipients.map(
      (recipientUserId) => ({
        recipientUserId,
        messId: input.messId,
        actorUserId: input.actorUserId,
        eventKey: input.eventKey,
        channels,
        severity,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        metadata: input.metadata,
        dedupeKey: input.dedupeKey,
        isRead: false,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const finalDocs = await applyDedupeFilter(docs, dedupeWindowMs);
    if (!finalDocs.length) {
      return { inserted: 0 };
    }

    if (channels.includes("in_app") || channels.includes("realtime")) {
      await dbConnect(collections.NOTIFICATIONS).insertMany(finalDocs);
    }

    if (channels.includes("realtime")) {
      publishNotificationSignal(
        finalDocs.map((doc) => doc.recipientUserId.toString()),
      );
    }

    if (channels.includes("email")) {
      await sendNotificationEmails(finalDocs);
    }

    return { inserted: finalDocs.length };
  } catch (error) {
    console.error("emitNotification failed (non-blocking):", error);
    return { inserted: 0 };
  }
}

export async function getUnreadNotificationCountForUserId(
  userId: string | ObjectId,
): Promise<number> {
  try {
    const recipientUserId = parseObjectId(userId);
    return dbConnect(collections.NOTIFICATIONS).countDocuments({
      recipientUserId,
      isRead: false,
    });
  } catch (error) {
    console.error(
      "getUnreadNotificationCountForUserId failed (fallback=0):",
      error,
    );
    return 0;
  }
}

export async function getRecentNotificationsForUserId(
  userId: string | ObjectId,
  limit = 8,
): Promise<NotificationSerialized[]> {
  try {
    const recipientUserId = parseObjectId(userId);
    const docs = (await dbConnect(collections.NOTIFICATIONS)
      .find({ recipientUserId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .toArray()) as NotificationDocumentWithId[];

    return docs.map(serializeNotification);
  } catch (error) {
    console.error(
      "getRecentNotificationsForUserId failed (fallback=[]):",
      error,
    );
    return [];
  }
}

export async function markNotificationAsReadForUser(
  userId: string | ObjectId,
  notificationId: string,
): Promise<boolean> {
  try {
    const recipientUserId = parseObjectId(userId);
    const _id = parseObjectId(notificationId);

    const result = await dbConnect(collections.NOTIFICATIONS).updateOne(
      { _id, recipientUserId },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return result.modifiedCount > 0;
  } catch (error) {
    console.error(
      "markNotificationAsReadForUser failed (fallback=false):",
      error,
    );
    return false;
  }
}

export async function markAllNotificationsAsReadForUser(
  userId: string | ObjectId,
): Promise<number> {
  try {
    const recipientUserId = parseObjectId(userId);

    const result = await dbConnect(collections.NOTIFICATIONS).updateMany(
      { recipientUserId, isRead: false },
      {
        $set: {
          isRead: true,
          readAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return result.modifiedCount;
  } catch (error) {
    console.error(
      "markAllNotificationsAsReadForUser failed (fallback=0):",
      error,
    );
    return 0;
  }
}

export async function getActiveManagerIdsForMess(
  messId: ObjectId,
): Promise<ObjectId[]> {
  try {
    const members = await dbConnect(collections.MESS_MEMBERS)
      .find(
        {
          messId,
          role: "manager",
          status: "active",
        },
        { projection: { userId: 1 } },
      )
      .toArray();

    return members.map((member) => member.userId as ObjectId);
  } catch (error) {
    console.error("getActiveManagerIdsForMess failed (fallback=[]):", error);
    return [];
  }
}
