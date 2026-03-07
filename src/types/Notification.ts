import type { ObjectId } from "mongodb";

export type NotificationCategory =
  | "deposit"
  | "expense"
  | "member_activity"
  | "meal"
  | "system";

export type NotificationType =
  | "deposit_requested"
  | "deposit_approved"
  | "deposit_rejected"
  | "expense_added"
  | "expense_deleted"
  | "expense_approved"
  | "expense_rejected"
  | "member_joined"
  | "member_removed"
  | "invitation_accepted"
  | "meal_reminder"
  | "meal_entry_updated"
  | "system_update"
  | "manager_role_transferred";

export type NotificationMetadataPrimitive = string | number | boolean | null;

export type NotificationMetadataValue =
  | NotificationMetadataPrimitive
  | NotificationMetadataValue[]
  | NotificationMetadata;

export interface NotificationMetadata {
  [key: string]: NotificationMetadataValue;
}

export type NotificationDocument = {
  userId: ObjectId;
  messId: ObjectId;
  type: NotificationType | string;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  isRead: boolean;
  createdAt: Date;
  sendPush: boolean;
};

export type NotificationDocumentMongo = NotificationDocument & {
  _id: ObjectId;
};

export type NotificationSerialized = {
  id: string;
  userId: string;
  messId: string;
  type: NotificationType | string;
  category: NotificationCategory;
  title: string;
  message: string;
  metadata: NotificationMetadata;
  isRead: boolean;
  createdAt: string;
  sendPush: boolean;
  href: string;
  targetPath: string | null;
};

export type NotificationListResponse = {
  notifications: NotificationSerialized[];
  unreadCount: number;
};

export type NotificationRealtimeEvent =
  | {
      kind: "created";
      notification: NotificationSerialized;
      unreadCount: number;
    }
  | {
      kind: "read";
      notificationId: string;
      unreadCount: number;
    }
  | {
      kind: "all-read";
      unreadCount: number;
    }
  | {
      kind: "sync";
      notifications: NotificationSerialized[];
      unreadCount: number;
    }
  | {
      kind: "ready";
      unreadCount: number;
    };

export type NotificationCreateInput = {
  userId: string | ObjectId;
  messId: string | ObjectId;
  type: NotificationType | string;
  title: string;
  message: string;
  metadata?: NotificationMetadata;
  sendPush?: boolean;
};

export type NotificationBulkCreateInput = Omit<NotificationCreateInput, "userId"> & {
  userIds: Array<string | ObjectId>;
};

export type PushSubscriptionDeviceType = "web" | "android" | "ios" | "unknown";

export type PushSubscriptionKeys = {
  auth?: string;
  p256dh?: string;
};

export type PushSubscriptionPayload = {
  endpoint: string;
  expirationTime?: number | null;
  keys?: PushSubscriptionKeys;
};

export type PushSubscriptionDocument = {
  userId: ObjectId;
  messId?: ObjectId | null;
  endpoint: string;
  expirationTime?: number | null;
  keys: PushSubscriptionKeys;
  deviceType: PushSubscriptionDeviceType;
  userAgent: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastSeenAt: Date;
};

export type PushSubscriptionDocumentMongo = PushSubscriptionDocument & {
  _id: ObjectId;
};

export type PushSubscriptionRegisterInput = {
  userId: string | ObjectId;
  messId?: string | ObjectId | null;
  deviceType?: PushSubscriptionDeviceType;
  subscription: PushSubscriptionPayload;
  userAgent?: string | null;
};
