import type { ObjectId } from "mongodb";

export type NotificationEventKey =
  | "deposit.added"
  | "deposit.requested"
  | "deposit_request.approved"
  | "deposit_request.rejected"
  | "expense.added"
  | "expense.verified"
  | "expense.approved"
  | "expense.rejected"
  | "invitation.sent"
  | "invitation.accepted"
  | "invitation.cancelled"
  | "member.removed"
  | "member.left_mess"
  | "manager_role.transferred"
  | "meal.added"
  | "meal_settings.changed"
  | "meal_deadline.changed"
  | "mess_profile.changed"
  | "deposit_rules.changed"
  | "expense_rules.changed"
  | "budget.changed"
  | "mess.created"
  | "mess.deleted"
  | "mess.suspended"
  | "mess.activated"
  | "mess.archived"
  | "mess_data.reset"
  | "profile.updated"
  | "password.changed"
  | "account.deleted"
  | "account.suspended"
  | "account.activated";

export type NotificationChannel = "in_app" | "email" | "realtime";

export type NotificationSeverity = "info" | "success" | "warning" | "error";

export type NotificationMetadata = Record<
  string,
  string | number | boolean | null
>;

export type NotificationDocument = {
  recipientUserId: ObjectId;
  messId?: ObjectId;
  actorUserId?: ObjectId;
  eventKey: NotificationEventKey;
  channels: NotificationChannel[];
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: NotificationMetadata;
  dedupeKey?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type NotificationDocumentWithId = NotificationDocument & {
  _id: ObjectId;
};

export type NotificationSerialized = {
  id: string;
  recipientUserId: string;
  messId?: string;
  actorUserId?: string;
  eventKey: NotificationEventKey;
  channels: NotificationChannel[];
  severity: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: NotificationMetadata;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
  updatedAt: string;
};

export type EmitNotificationInput = {
  recipientUserIds: ObjectId[];
  messId?: ObjectId;
  actorUserId?: ObjectId;
  eventKey: NotificationEventKey;
  channels?: NotificationChannel[];
  severity?: NotificationSeverity;
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: NotificationMetadata;
  dedupeKey?: string;
  dedupeWindowMs?: number;
};
