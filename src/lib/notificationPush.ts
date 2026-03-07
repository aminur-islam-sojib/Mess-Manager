import { ObjectId } from "mongodb";
import { collections, dbConnect } from "@/lib/dbConnect";
import type {
  NotificationSerialized,
  PushSubscriptionDocument,
  PushSubscriptionPayload,
  PushSubscriptionRegisterInput,
} from "@/types/Notification";

const parseObjectId = (value: string | ObjectId | null | undefined) => {
  if (!value) return null;
  if (value instanceof ObjectId) return value;

  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const normalizeSubscription = (subscription: PushSubscriptionPayload) => ({
  endpoint: subscription.endpoint?.trim(),
  expirationTime: subscription.expirationTime ?? null,
  keys: {
    auth: subscription.keys?.auth,
    p256dh: subscription.keys?.p256dh,
  },
});

export async function registerPushSubscription(
  input: PushSubscriptionRegisterInput,
) {
  const userId = parseObjectId(input.userId);
  if (!userId) {
    throw new Error("Invalid user ID");
  }

  const messId = parseObjectId(input.messId ?? null);
  const normalized = normalizeSubscription(input.subscription);

  if (!normalized.endpoint) {
    throw new Error("Push subscription endpoint is required");
  }

  const subscriptionCollection = dbConnect(collections.PUSH_SUBSCRIPTIONS);
  const now = new Date();

  const document: PushSubscriptionDocument = {
    userId,
    messId,
    endpoint: normalized.endpoint,
    expirationTime: normalized.expirationTime,
    keys: normalized.keys,
    deviceType: input.deviceType ?? "web",
    userAgent: input.userAgent ?? null,
    isActive: true,
    createdAt: now,
    updatedAt: now,
    lastSeenAt: now,
  };

  await subscriptionCollection.updateOne(
    {
      userId,
      endpoint: normalized.endpoint,
    },
    {
      $set: {
        expirationTime: normalized.expirationTime,
        keys: normalized.keys,
        deviceType: input.deviceType ?? "web",
        userAgent: input.userAgent ?? null,
        messId,
        isActive: true,
        updatedAt: now,
        lastSeenAt: now,
      },
      $setOnInsert: {
        createdAt: now,
      },
    },
    { upsert: true },
  );

  return document;
}

export async function dispatchPushNotifications(
  userId: ObjectId,
  notification: NotificationSerialized,
) {
  const pushEndpoint = process.env.NOTIFICATION_PUSH_ENDPOINT;

  if (!pushEndpoint) {
    return {
      success: false,
      delivered: 0,
      skipped: true,
      reason: "Push provider is not configured",
    };
  }

  const subscriptionCollection = dbConnect(collections.PUSH_SUBSCRIPTIONS);
  const subscriptions = await subscriptionCollection
    .find({
      userId,
      isActive: true,
    })
    .toArray();

  if (!subscriptions.length) {
    return {
      success: false,
      delivered: 0,
      skipped: true,
      reason: "No push subscriptions registered",
    };
  }

  const response = await fetch(pushEndpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.NOTIFICATION_PUSH_SECRET
        ? {
            Authorization: `Bearer ${process.env.NOTIFICATION_PUSH_SECRET}`,
          }
        : {}),
    },
    body: JSON.stringify({
      notification,
      subscriptions: subscriptions.map((subscription) => ({
        endpoint: subscription.endpoint,
        expirationTime: subscription.expirationTime ?? null,
        keys: subscription.keys ?? {},
        deviceType: subscription.deviceType ?? "web",
      })),
    }),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => "");
    throw new Error(
      responseText || `Push provider returned status ${response.status}`,
    );
  }

  return {
    success: true,
    delivered: subscriptions.length,
    skipped: false,
  };
}
