"use server";

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { normalizeProfileImage } from "@/lib/profileImage";
import { requestDeposit } from "@/actions/server/Deposit";
import { collections, dbConnect } from "@/lib/dbConnect";
import type { DepositMethod, DepositRequestStatus } from "@/types/Deposit";
import type {
  UserDepositRecord,
  UserDepositRequest,
  UserMealPreferences,
  UserMessInfo,
  UserMessMember,
  UserNotificationSettings,
  UserSettingsData,
  UserSettingsUser,
} from "@/types/UserSettings";

type ActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

type UserDocument = {
  _id: ObjectId;
  name?: string;
  email?: string;
  phone?: string;
  image?: string | null;
  password?: string;
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
  mealPreferences?: {
    defaultMealCount?: number;
    reminderEnabled?: boolean;
  };
};

type MessDocument = {
  _id: ObjectId;
  messName?: string;
  messAddress?: string;
  description?: string;
  image?: string | null;
  managerId: ObjectId;
  managerEmail?: string;
  status?: string;
  depositSettings?: {
    minimumDeposit?: number;
  };
  mealSettings?: {
    enabled?: boolean;
    defaultMealCount?: number;
  };
};

type MembershipDocument = {
  _id: ObjectId;
  messId: ObjectId;
  userId: ObjectId;
  role: "manager" | "member" | string;
  status: string;
  joinDate?: Date;
};

type MemberAggregate = {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  joinDate?: Date | string;
  image?: string | null;
};

type DepositDocument = {
  _id: ObjectId;
  amount?: number;
  method?: DepositMethod;
  note?: string | null;
  date?: string;
  createdAt?: Date;
};

type DepositRequestDocument = {
  _id: ObjectId;
  amount?: number;
  method?: DepositMethod;
  note?: string | null;
  date?: string;
  status?: DepositRequestStatus;
  createdAt?: Date;
  updatedAt?: Date;
  approvedAt?: Date;
  approvalNote?: string;
};

type AuthenticatedUserContext = {
  userId: ObjectId;
  user: UserDocument;
};

type ActiveMemberContext = AuthenticatedUserContext & {
  membership: MembershipDocument;
  mess: MessDocument;
  managerUser: UserDocument | null;
};

type GetterResult<T> =
  | { success: true; data: T }
  | { success: false; message: string };

type DepositRequestsResult =
  | { success: true; requests: UserDepositRequest[] }
  | { success: false; message: string };

type DepositsResult =
  | { success: true; deposits: UserDepositRecord[] }
  | { success: false; message: string };

type MembersResult =
  | { success: true; members: UserMessMember[] }
  | { success: false; message: string };

const DEFAULT_NOTIFICATION_SETTINGS: UserNotificationSettings = {
  mealReminder: false,
  depositUpdate: true,
  expenseAlert: true,
};

const DEFAULT_MEAL_PREFERENCES: UserMealPreferences = {
  defaultMealCount: 1,
  reminderEnabled: false,
};

const DEPOSIT_METHODS = new Set<DepositMethod>([
  "cash",
  "bkash",
  "nagad",
  "bank",
]);

const USER_SETTINGS_REVALIDATE_PATHS = [
  "/dashboard",
  "/dashboard/user",
  "/dashboard/user/settings",
  "/dashboard/user/deposits",
  "/dashboard/user/expenses",
  "/dashboard/user/meals-report",
  "/dashboard/user/members",
];

const trimText = (value: string | null | undefined) => value?.trim() ?? "";

const normalizeBoolean = (value: unknown) => value === true;

const isValidPhone = (value: string) =>
  value === "" || /^[0-9+()\-\s]{7,20}$/.test(value);

const isValidImageUrl = (value: string) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
};

const isTrustedImgBbUrl = (value: string) => {
  if (!value) return true;

  try {
    const url = new URL(value);
    const host = url.hostname.toLowerCase();

    return (
      (url.protocol === "https:" || url.protocol === "http:") &&
      (host === "i.ibb.co" || host.endsWith(".i.ibb.co"))
    );
  } catch {
    return false;
  }
};

const normalizeDateString = (value?: string): string | null => {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }

  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return trimmed;
};

const revalidateUserSettingsPaths = () => {
  for (const path of USER_SETTINGS_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
};

async function getAuthenticatedUserContext(): Promise<AuthenticatedUserContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "user") {
    throw new Error("You are not authorized");
  }

  const userId = new ObjectId(session.user.id);
  const user = await dbConnect(collections.USERS).findOne({
    _id: userId,
  });

  if (!user) {
    throw new Error("User not found");
  }

  return {
    userId,
    user: user as UserDocument,
  };
}

async function getActiveMemberContext(): Promise<ActiveMemberContext> {
  const auth = await getAuthenticatedUserContext();
  const membership = await dbConnect(collections.MESS_MEMBERS).findOne({
    userId: auth.userId,
    status: "active",
  });

  if (!membership) {
    throw new Error("Active mess membership not found");
  }

  if (membership.role === "manager") {
    throw new Error("Managers must use the manager settings page");
  }

  const mess = await dbConnect(collections.MESS).findOne({
    _id: membership.messId,
    status: "active",
  });

  if (!mess) {
    throw new Error("Mess not found");
  }

  const managerUser = await dbConnect(collections.USERS).findOne({
    _id: mess.managerId,
  });

  return {
    ...auth,
    membership: membership as MembershipDocument,
    mess: mess as MessDocument,
    managerUser: (managerUser as UserDocument | null) ?? null,
  };
}

const getUserNotificationSettings = (
  user: UserDocument,
  reminderFallback = DEFAULT_NOTIFICATION_SETTINGS.mealReminder,
): UserNotificationSettings => {
  const legacy = user.notifications ?? {};
  const next = user.notificationSettings ?? {};

  return {
    mealReminder: normalizeBoolean(
      next.mealReminder ?? legacy.mealReminders ?? reminderFallback,
    ),
    depositUpdate: normalizeBoolean(
      next.depositUpdate ??
        legacy.depositRequestNotifications ??
        DEFAULT_NOTIFICATION_SETTINGS.depositUpdate,
    ),
    expenseAlert: normalizeBoolean(
      next.expenseAlert ??
        legacy.expenseNotifications ??
        DEFAULT_NOTIFICATION_SETTINGS.expenseAlert,
    ),
  };
};

const getUserMealPreferences = (
  user: UserDocument,
  messDefaultMealCount: number,
  reminderFallback = DEFAULT_MEAL_PREFERENCES.reminderEnabled,
): UserMealPreferences => ({
  defaultMealCount:
    typeof user.mealPreferences?.defaultMealCount === "number" &&
    user.mealPreferences.defaultMealCount >= 0
      ? user.mealPreferences.defaultMealCount
      : messDefaultMealCount,
  reminderEnabled: normalizeBoolean(
    user.mealPreferences?.reminderEnabled ?? reminderFallback,
  ),
});

const serializeMessMember = (member: MemberAggregate): UserMessMember => ({
  id: member.id,
  name: typeof member.name === "string" ? member.name : "Unknown",
  email: typeof member.email === "string" ? member.email : "Unknown",
  role: member.role === "manager" ? "manager" : "member",
  joinDate: new Date(member.joinDate ?? new Date(0)).toISOString(),
  image: typeof member.image === "string" ? member.image : null,
});

const serializeDeposit = (deposit: DepositDocument): UserDepositRecord => ({
  id: deposit._id.toString(),
  amount: Number(deposit.amount ?? 0),
  method: DEPOSIT_METHODS.has(deposit.method ?? "cash")
    ? (deposit.method as DepositMethod)
    : "cash",
  note: typeof deposit.note === "string" ? deposit.note : null,
  date:
    typeof deposit.date === "string"
      ? deposit.date
      : new Date(deposit.createdAt ?? new Date()).toISOString().slice(0, 10),
  status: "approved",
  createdAt: (deposit.createdAt ?? new Date()).toISOString(),
});

const serializeDepositRequest = (
  request: DepositRequestDocument,
): UserDepositRequest => ({
  id: request._id.toString(),
  amount: Number(request.amount ?? 0),
  method: DEPOSIT_METHODS.has(request.method ?? "cash")
    ? (request.method as DepositMethod)
    : "cash",
  note: typeof request.note === "string" ? request.note : null,
  date:
    typeof request.date === "string"
      ? request.date
      : new Date(request.createdAt ?? new Date()).toISOString().slice(0, 10),
  status:
    request.status === "approved" ||
    request.status === "rejected" ||
    request.status === "pending"
      ? request.status
      : "pending",
  createdAt: (request.createdAt ?? new Date()).toISOString(),
  updatedAt: (
    request.updatedAt ??
    request.createdAt ??
    new Date()
  ).toISOString(),
  approvedAt: request.approvedAt?.toISOString(),
  approvalNote:
    typeof request.approvalNote === "string" ? request.approvalNote : undefined,
});

async function loadMessMembers(messId: ObjectId): Promise<UserMessMember[]> {
  const members = await dbConnect(collections.MESS_MEMBERS)
    .aggregate<MemberAggregate>([
      {
        $match: {
          messId,
          status: "active",
        },
      },
      {
        $lookup: {
          from: collections.USERS,
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 0,
          id: { $toString: "$userId" },
          name: "$user.name",
          email: "$user.email",
          role: {
            $cond: [{ $eq: ["$role", "manager"] }, "manager", "member"],
          },
          joinDate: "$joinDate",
          image: "$user.image",
        },
      },
      { $sort: { role: 1, name: 1 } },
    ])
    .toArray();

  return members.map(serializeMessMember);
}

async function loadUserDeposits(
  messId: ObjectId,
  userId: ObjectId,
): Promise<UserDepositRecord[]> {
  const deposits = await dbConnect(collections.DEPOSITS)
    .find({
      messId,
      userId,
    })
    .sort({ date: -1, createdAt: -1 })
    .toArray();

  return (deposits as DepositDocument[]).map(serializeDeposit);
}

async function loadDepositRequests(
  messId: ObjectId,
  userId: ObjectId,
): Promise<UserDepositRequest[]> {
  const requests = await dbConnect(collections.DEPOSIT_REQUESTS)
    .find({
      messId,
      userId,
    })
    .sort({ createdAt: -1 })
    .toArray();

  return (requests as DepositRequestDocument[]).map(serializeDepositRequest);
}

function buildMessInfo(
  context: ActiveMemberContext,
  totalMembers: number,
): UserMessInfo {
  return {
    id: context.mess._id.toString(),
    messName:
      typeof context.mess.messName === "string" ? context.mess.messName : "",
    messAddress:
      typeof context.mess.messAddress === "string"
        ? context.mess.messAddress
        : "",
    description:
      typeof context.mess.description === "string"
        ? context.mess.description
        : "",
    image: typeof context.mess.image === "string" ? context.mess.image : null,
    managerName:
      typeof context.managerUser?.name === "string"
        ? context.managerUser.name
        : "Manager",
    managerEmail:
      typeof context.managerUser?.email === "string"
        ? context.managerUser.email
        : typeof context.mess.managerEmail === "string"
          ? context.mess.managerEmail
          : "",
    managerImage:
      typeof context.managerUser?.image === "string"
        ? context.managerUser.image
        : null,
    totalMembers,
    joinedDate: new Date(
      context.membership.joinDate ?? new Date(),
    ).toISOString(),
    mealTrackingEnabled: context.mess.mealSettings?.enabled !== false,
    messDefaultMealCount:
      typeof context.mess.mealSettings?.defaultMealCount === "number" &&
      context.mess.mealSettings.defaultMealCount >= 0
        ? context.mess.mealSettings.defaultMealCount
        : DEFAULT_MEAL_PREFERENCES.defaultMealCount,
    minimumDeposit:
      typeof context.mess.depositSettings?.minimumDeposit === "number" &&
      context.mess.depositSettings.minimumDeposit >= 0
        ? context.mess.depositSettings.minimumDeposit
        : 0,
  };
}

async function buildUserSettingsData(
  context: ActiveMemberContext,
): Promise<UserSettingsData> {
  const [members, deposits, depositRequests] = await Promise.all([
    loadMessMembers(context.mess._id),
    loadUserDeposits(context.mess._id, context.userId),
    loadDepositRequests(context.mess._id, context.userId),
  ]);

  const mess = buildMessInfo(context, members.length);
  const notificationSettings = getUserNotificationSettings(
    context.user,
    normalizeBoolean(context.user.mealPreferences?.reminderEnabled),
  );
  const mealPreferences = getUserMealPreferences(
    context.user,
    mess.messDefaultMealCount,
    notificationSettings.mealReminder,
  );

  const user: UserSettingsUser = {
    id: context.userId.toString(),
    name: typeof context.user.name === "string" ? context.user.name : "",
    email: typeof context.user.email === "string" ? context.user.email : "",
    phone: typeof context.user.phone === "string" ? context.user.phone : "",
    image: typeof context.user.image === "string" ? context.user.image : null,
    canChangePassword: Boolean(context.user.password),
    notificationSettings,
    mealPreferences,
  };

  return {
    user,
    mess,
    members,
    deposits,
    depositRequests,
  };
}

export async function getUserSettingsData(): Promise<UserSettingsData> {
  const context = await getActiveMemberContext();
  return buildUserSettingsData(context);
}

export async function updateUserProfile(payload: {
  name: string;
  phone: string;
  image?: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await getAuthenticatedUserContext();
    const name = trimText(payload.name);
    const phone = trimText(payload.phone);
    const image = trimText(payload.image) || null;
    const normalizedImage = normalizeProfileImage(image);

    if (name.length < 2) {
      return { success: false, message: "Name must be at least 2 characters" };
    }

    if (!isValidPhone(phone)) {
      return { success: false, message: "Phone number format is invalid" };
    }

    if (image && !isValidImageUrl(image)) {
      return { success: false, message: "Profile image must be a valid URL" };
    }

    if (image && !isTrustedImgBbUrl(image)) {
      return {
        success: false,
        message: "Profile image must be uploaded from ImgBB",
      };
    }

    await dbConnect(collections.USERS).updateOne(
      { _id: userId },
      {
        $set: {
          name,
          phone,
          image: normalizedImage.image,
          imageUploadedAt: normalizedImage.imageUploadedAt,
          updatedAt: new Date(),
        },
      },
    );

    revalidateUserSettingsPaths();
    return { success: true, message: "Profile updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update profile",
    };
  }
}

export async function updatePassword(payload: {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await getAuthenticatedUserContext();
    const currentPassword = payload.currentPassword ?? "";
    const newPassword = payload.newPassword ?? "";
    const confirmPassword = payload.confirmPassword ?? "";

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: "All password fields are required" };
    }

    if (newPassword.length < 8) {
      return {
        success: false,
        message: "New password must be at least 8 characters",
      };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New passwords do not match" };
    }

    const user = await dbConnect(collections.USERS).findOne({ _id: userId });
    if (!user?.password) {
      return {
        success: false,
        message: "Password updates are unavailable for this account",
      };
    }

    const isValidPassword = await bcrypt.compare(
      currentPassword,
      user.password,
    );
    if (!isValidPassword) {
      return { success: false, message: "Current password is incorrect" };
    }

    const samePassword = await bcrypt.compare(newPassword, user.password);
    if (samePassword) {
      return {
        success: false,
        message: "New password must be different from current password",
      };
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await dbConnect(collections.USERS).updateOne(
      { _id: userId },
      {
        $set: {
          password: hashedPassword,
          updatedAt: new Date(),
        },
      },
    );

    return { success: true, message: "Password updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update password",
    };
  }
}

export async function updateNotificationSettings(
  preferences: UserNotificationSettings,
): Promise<ActionResult> {
  try {
    const { userId } = await getAuthenticatedUserContext();
    const mealReminder = normalizeBoolean(preferences.mealReminder);
    const depositUpdate = normalizeBoolean(preferences.depositUpdate);
    const expenseAlert = normalizeBoolean(preferences.expenseAlert);

    await dbConnect(collections.USERS).updateOne(
      { _id: userId },
      {
        $set: {
          notificationSettings: {
            mealReminder,
            depositUpdate,
            expenseAlert,
          },
          notifications: {
            depositRequestNotifications: depositUpdate,
            expenseNotifications: expenseAlert,
            mealReminders: mealReminder,
          },
          "mealPreferences.reminderEnabled": mealReminder,
          updatedAt: new Date(),
        },
      },
    );

    revalidateUserSettingsPaths();
    return { success: true, message: "Notification settings updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update notification settings",
    };
  }
}

export async function getUserMessInfo(): Promise<GetterResult<UserMessInfo>> {
  try {
    const context = await getActiveMemberContext();
    const totalMembers = await dbConnect(
      collections.MESS_MEMBERS,
    ).countDocuments({
      messId: context.mess._id,
      status: "active",
    });

    return {
      success: true,
      data: buildMessInfo(context, totalMembers),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch mess details",
    };
  }
}

export async function getMessMembers(): Promise<MembersResult> {
  try {
    const context = await getActiveMemberContext();
    return {
      success: true,
      members: await loadMessMembers(context.mess._id),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch mess members",
    };
  }
}

export async function getUserDeposits(): Promise<DepositsResult> {
  try {
    const context = await getActiveMemberContext();
    return {
      success: true,
      deposits: await loadUserDeposits(context.mess._id, context.userId),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch deposits",
    };
  }
}

export async function createDepositRequest(payload: {
  amount: number;
  method: DepositMethod;
  note?: string;
  date?: string;
}): Promise<ActionResult> {
  try {
    const context = await getActiveMemberContext();
    const amount = Number(payload.amount);

    if (!Number.isFinite(amount) || amount <= 0) {
      return {
        success: false,
        message: "Deposit amount must be greater than 0",
      };
    }

    if (!DEPOSIT_METHODS.has(payload.method)) {
      return { success: false, message: "Valid payment method is required" };
    }

    const date = normalizeDateString(payload.date);
    if (!date) {
      return { success: false, message: "Valid deposit date is required" };
    }

    const minimumDeposit =
      typeof context.mess.depositSettings?.minimumDeposit === "number" &&
      context.mess.depositSettings.minimumDeposit > 0
        ? context.mess.depositSettings.minimumDeposit
        : 0;

    if (minimumDeposit > 0 && amount < minimumDeposit) {
      return {
        success: false,
        message: `Minimum deposit request is ${minimumDeposit}`,
      };
    }

    const result = await requestDeposit({
      messId: context.mess._id.toString(),
      userId: context.userId.toString(),
      amount,
      method: payload.method,
      note: trimText(payload.note),
      date,
    });

    if (result.success) {
      revalidateUserSettingsPaths();
      return {
        success: true,
        message: "Deposit request submitted",
      };
    }

    return result;
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to create deposit request",
    };
  }
}

export async function getDepositRequests(): Promise<DepositRequestsResult> {
  try {
    const context = await getActiveMemberContext();
    return {
      success: true,
      requests: await loadDepositRequests(context.mess._id, context.userId),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch deposit requests",
    };
  }
}

export async function updateMealPreferences(
  preferences: UserMealPreferences,
): Promise<ActionResult> {
  try {
    const { userId } = await getAuthenticatedUserContext();
    const defaultMealCount = Number(preferences.defaultMealCount);

    if (!Number.isFinite(defaultMealCount) || defaultMealCount < 0) {
      return {
        success: false,
        message: "Default meal count must be 0 or greater",
      };
    }

    const reminderEnabled = normalizeBoolean(preferences.reminderEnabled);

    await dbConnect(collections.USERS).updateOne(
      { _id: userId },
      {
        $set: {
          mealPreferences: {
            defaultMealCount,
            reminderEnabled,
          },
          "notificationSettings.mealReminder": reminderEnabled,
          "notifications.mealReminders": reminderEnabled,
          updatedAt: new Date(),
        },
      },
    );

    revalidateUserSettingsPaths();
    return { success: true, message: "Meal preferences updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update meal preferences",
    };
  }
}

export async function leaveMess(): Promise<ActionResult> {
  try {
    const context = await getActiveMemberContext();

    if (context.membership.role === "manager") {
      return {
        success: false,
        message: "Managers cannot leave the mess before transferring ownership",
      };
    }

    await Promise.all([
      dbConnect(collections.MESS_MEMBERS).updateOne(
        { _id: context.membership._id, status: "active" },
        {
          $set: {
            status: "left",
            leftAt: new Date(),
            updatedAt: new Date(),
          },
        },
      ),
      dbConnect(collections.USERS).updateOne(
        { _id: context.userId },
        {
          $set: {
            role: "user",
            updatedAt: new Date(),
          },
          $unset: {
            messId: "",
            activeMessId: "",
            currentMessId: "",
          },
        },
      ),
      dbConnect(collections.DEPOSIT_REQUESTS).deleteMany({
        messId: context.mess._id,
        userId: context.userId,
        status: "pending",
      }),
    ]);

    revalidateUserSettingsPaths();
    return { success: true, message: "You left the mess successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to leave mess",
    };
  }
}

export async function deleteUserAccount(): Promise<ActionResult> {
  try {
    const { userId } = await getAuthenticatedUserContext();
    const activeMembership = await dbConnect(collections.MESS_MEMBERS).findOne({
      userId,
      status: "active",
    });

    if (activeMembership?.role === "manager") {
      return {
        success: false,
        message:
          "Managers cannot delete their account before transferring ownership",
      };
    }

    await Promise.all([
      dbConnect(collections.USERS).deleteOne({ _id: userId }),
      dbConnect(collections.MESS_MEMBERS).deleteMany({ userId }),
      dbConnect(collections.DEPOSITS).deleteMany({ userId }),
      dbConnect(collections.MEAL_ENTRIES).deleteMany({ userId }),
      dbConnect(collections.DEPOSIT_REQUESTS).deleteMany({ userId }),
    ]);

    revalidateUserSettingsPaths();
    return { success: true, message: "Account deleted successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to delete account",
    };
  }
}
