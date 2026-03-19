"use server";

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { sendInvitationEmail } from "@/actions/invitations";
import { collections, dbConnect } from "@/lib/dbConnect";
import type {
  DepositApprovalMode,
  ExpenseRuleAccess,
  ManagerSettingsData,
  MealCalculationMode,
  NotificationPreferences,
  PendingInvitation,
  SettingsMember,
} from "@/types/ManagerSettings";

type ActionResult =
  | { success: true; message: string }
  | { success: false; message: string };

type ExportFormat = "csv" | "json";
type ExportType = "deposits" | "expenses" | "meals";

type ExportResult =
  | {
      success: true;
      message: string;
      filename: string;
      mimeType: string;
      content: string;
    }
  | { success: false; message: string };

type ManagerContext = {
  userId: ObjectId;
  sessionUser: {
    name?: string | null;
    email?: string | null;
  };
  mess: {
    _id: ObjectId;
    messName?: string;
    managerId: ObjectId;
    managerEmail?: string;
    [key: string]: unknown;
  };
};

type InvitationDocument = {
  _id: ObjectId;
  messId: ObjectId;
  email?: string;
  invitedEmail?: string;
  status: string;
  token?: string;
  createdAt: Date;
};

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  depositRequestNotifications: true,
  expenseNotifications: true,
  mealReminders: false,
};

const SETTINGS_REVALIDATE_PATHS = [
  "/dashboard/manager",
  "/dashboard/manager/settings",
  "/dashboard/manager/members",
  "/dashboard/manager/invite",
  "/dashboard/manager/deposits",
  "/dashboard/manager/expenses",
  "/dashboard/manager/meals",
  "/dashboard/user",
];

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

const parseObjectId = (value: string | null | undefined): ObjectId | null => {
  if (!value) return null;

  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const trimText = (value: string | null | undefined) => value?.trim() ?? "";

const isValidEmail = (value: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

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

const isValidTimeString = (value: string) =>
  /^(0[1-9]|1[0-2]):[0-5][0-9] (AM|PM)$/.test(value);

const serializeInvitation = (
  invitation: InvitationDocument,
): PendingInvitation => ({
  id: invitation._id.toString(),
  email: invitation.email ?? invitation.invitedEmail ?? "",
  status: invitation.status,
  createdAt: invitation.createdAt.toISOString(),
  inviteLink: invitation.token
    ? `${APP_URL}/invite?token=${invitation.token}`
    : "",
});

const normalizeBoolean = (value: unknown) => value === true;

const revalidateManagerSettingsPaths = () => {
  for (const path of SETTINGS_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
};

async function getManagerContext(): Promise<ManagerContext> {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id || session.user.role !== "manager") {
    throw new Error("You are not authorized");
  }

  const userId = new ObjectId(session.user.id);
  const messCollection = dbConnect(collections.MESS);
  const mess = await messCollection.findOne({
    managerId: userId,
    status: "active",
  });

  if (!mess) {
    throw new Error("Mess not found");
  }

  return {
    userId,
    sessionUser: session.user,
    mess: mess as ManagerContext["mess"],
  };
}

async function getMessMemberOrThrow(messId: ObjectId, memberId: string) {
  const memberObjectId = parseObjectId(memberId);
  if (!memberObjectId) {
    throw new Error("Invalid member ID");
  }

  const membership = await dbConnect(collections.MESS_MEMBERS).findOne({
    messId,
    userId: memberObjectId,
    status: "active",
  });

  if (!membership) {
    throw new Error("Member not found");
  }

  return {
    membership,
    memberObjectId,
  };
}

export async function getManagerSettingsData(): Promise<ManagerSettingsData> {
  const { userId, mess } = await getManagerContext();
  const messConfig = mess as typeof mess & {
    depositSettings?: {
      minimumDeposit?: number;
      approvalMode?: string;
    };
    settings?: {
      expenseRules?: {
        whoCanAddExpenses?: string;
      };
    };
    mealSettings?: {
      enabled?: boolean;
      defaultMealCount?: number;
      calculationMode?: string;
      deadline?: string;
    };
  };

  const [user, members, invitations] = await Promise.all([
    dbConnect(collections.USERS).findOne({ _id: userId }),
    dbConnect(collections.MESS_MEMBERS)
      .aggregate([
        {
          $match: {
            messId: mess._id,
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
        { $unwind: "$user" },
        {
          $project: {
            _id: 0,
            id: { $toString: "$user._id" },
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
      .toArray(),
    dbConnect(collections.INVITATIONS)
      .find({
        messId: mess._id,
        status: "pending",
      })
      .sort({ createdAt: -1 })
      .toArray(),
  ]);

  if (!user) {
    throw new Error("User not found");
  }

  const notifications = user.notifications ?? DEFAULT_NOTIFICATIONS;

  return {
    user: {
      id: user._id.toString(),
      name: typeof user.name === "string" ? user.name : "",
      email: typeof user.email === "string" ? user.email : "",
      phone: typeof user.phone === "string" ? user.phone : "",
      image: typeof user.image === "string" ? user.image : null,
      notifications: {
        depositRequestNotifications: normalizeBoolean(
          notifications.depositRequestNotifications,
        ),
        expenseNotifications: normalizeBoolean(
          notifications.expenseNotifications,
        ),
        mealReminders: normalizeBoolean(notifications.mealReminders),
      },
    },
    mess: {
      id: mess._id.toString(),
      messName: typeof mess.messName === "string" ? mess.messName : "",
      messAddress: typeof mess.messAddress === "string" ? mess.messAddress : "",
      description: typeof mess.description === "string" ? mess.description : "",
      image: typeof mess.image === "string" ? mess.image : null,
      budget: typeof mess.budget === "number" ? mess.budget : 0,
      depositSettings: {
        minimumDeposit:
          typeof messConfig.depositSettings?.minimumDeposit === "number"
            ? messConfig.depositSettings.minimumDeposit
            : 0,
        approvalMode:
          messConfig.depositSettings?.approvalMode === "automatic"
            ? "automatic"
            : "manual",
      },
      settings: {
        expenseRules: {
          whoCanAddExpenses:
            messConfig.settings?.expenseRules?.whoCanAddExpenses ===
            "membersAllowed"
              ? "membersAllowed"
              : "managerOnly",
        },
      },
      mealSettings: {
        enabled: messConfig.mealSettings?.enabled !== false,
        defaultMealCount:
          typeof messConfig.mealSettings?.defaultMealCount === "number"
            ? messConfig.mealSettings.defaultMealCount
            : 1,
        calculationMode:
          messConfig.mealSettings?.calculationMode === "daily"
            ? "daily"
            : "monthly",
        deadline:
          typeof messConfig.mealSettings?.deadline === "string"
            ? messConfig.mealSettings.deadline
            : "10:00 PM",
      },
    },
    members: (members as SettingsMember[]).map((member) => ({
      ...member,
      joinDate: new Date(member.joinDate).toISOString(),
      image: member.image ?? null,
    })),
    pendingInvitations: (invitations as InvitationDocument[]).map(
      serializeInvitation,
    ),
  };
}

export async function updateUserProfile(payload: {
  name: string;
  phone: string;
  image?: string;
}): Promise<ActionResult> {
  try {
    const { userId } = await getManagerContext();
    const name = trimText(payload.name);
    const phone = trimText(payload.phone);
    const image = trimText(payload.image) || null;

    if (name.length < 2) {
      return { success: false, message: "Name must be at least 2 characters" };
    }

    if (!isValidPhone(phone)) {
      return { success: false, message: "Phone number format is invalid" };
    }

    if (image && !isValidImageUrl(image)) {
      return { success: false, message: "Profile image must be a valid URL" };
    }

    await dbConnect(collections.USERS).updateOne(
      { _id: userId },
      {
        $set: {
          name,
          phone,
          image,
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Profile updated successfully" };
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
    const { userId } = await getManagerContext();
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

    return { success: true, message: "Password updated successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update password",
    };
  }
}

export async function updateNotificationSettings(
  preferences: NotificationPreferences,
): Promise<ActionResult> {
  try {
    const { userId } = await getManagerContext();

    await dbConnect(collections.USERS).updateOne(
      { _id: userId },
      {
        $set: {
          notifications: {
            depositRequestNotifications: normalizeBoolean(
              preferences.depositRequestNotifications,
            ),
            expenseNotifications: normalizeBoolean(
              preferences.expenseNotifications,
            ),
            mealReminders: normalizeBoolean(preferences.mealReminders),
          },
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
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

export async function updateMessProfile(payload: {
  messName: string;
  messAddress: string;
  description: string;
  image?: string;
}): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();
    const messName = trimText(payload.messName);
    const messAddress = trimText(payload.messAddress);
    const description = trimText(payload.description);
    const image = trimText(payload.image) || null;

    if (messName.length < 2) {
      return {
        success: false,
        message: "Mess name must be at least 2 characters",
      };
    }

    if (image && !isValidImageUrl(image)) {
      return { success: false, message: "Mess image must be a valid URL" };
    }

    await dbConnect(collections.MESS).updateOne(
      { _id: mess._id, managerId: mess.managerId },
      {
        $set: {
          messName,
          messAddress,
          description,
          image,
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Mess profile updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update mess profile",
    };
  }
}

export async function removeMessMember(
  memberId: string,
): Promise<ActionResult> {
  try {
    const { userId, mess } = await getManagerContext();
    const { membership, memberObjectId } = await getMessMemberOrThrow(
      mess._id,
      memberId,
    );

    if (memberObjectId.toString() === userId.toString()) {
      return { success: false, message: "Manager cannot remove themselves" };
    }

    if (membership.role === "manager") {
      return { success: false, message: "Cannot remove the current manager" };
    }

    await dbConnect(collections.MESS_MEMBERS).updateOne(
      { _id: membership._id },
      {
        $set: {
          status: "removed",
          removedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Member removed successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to remove member",
    };
  }
}

export async function sendMessInvitation(payload: {
  email: string;
}): Promise<ActionResult & { inviteLink?: string }> {
  try {
    const { mess, sessionUser } = await getManagerContext();
    const email = trimText(payload.email).toLowerCase();

    if (!isValidEmail(email)) {
      return { success: false, message: "A valid email address is required" };
    }

    const existingUser = await dbConnect(collections.USERS).findOne({ email });
    if (existingUser) {
      const membership = await dbConnect(collections.MESS_MEMBERS).findOne({
        messId: mess._id,
        userId: existingUser._id,
        status: "active",
      });

      if (membership) {
        return {
          success: false,
          message: "This user is already a member of your mess",
        };
      }
    }

    const invitationCollection = dbConnect(collections.INVITATIONS);
    const existingPending = await invitationCollection.findOne({
      messId: mess._id,
      $or: [{ email }, { invitedEmail: email }],
      status: "pending",
    });

    if (existingPending) {
      return {
        success: false,
        message: "A pending invitation already exists for this email",
      };
    }

    const token = crypto.randomUUID().replace(/-/g, "");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await invitationCollection.insertOne({
      messId: mess._id,
      messName: mess.messName,
      managerId: mess.managerId,
      email,
      invitedEmail: email,
      token,
      status: "pending",
      expiresAt,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const inviteLink = `${APP_URL}/invite?token=${token}`;

    await sendInvitationEmail(
      email,
      inviteLink,
      typeof mess.messName === "string" ? mess.messName : "your mess",
      sessionUser.name ?? "Manager",
    );

    revalidateManagerSettingsPaths();
    return {
      success: true,
      message: "Invitation sent successfully",
      inviteLink,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to send invitation",
    };
  }
}

export async function getPendingInvitations(): Promise<
  | { success: true; invitations: PendingInvitation[] }
  | { success: false; message: string }
> {
  try {
    const { mess } = await getManagerContext();
    const invitations = await dbConnect(collections.INVITATIONS)
      .find({
        messId: mess._id,
        status: "pending",
      })
      .sort({ createdAt: -1 })
      .toArray();

    return {
      success: true,
      invitations: (invitations as InvitationDocument[]).map(
        serializeInvitation,
      ),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to fetch pending invitations",
    };
  }
}

export async function cancelInvitation(
  invitationId: string,
): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();
    const invitationObjectId = parseObjectId(invitationId);

    if (!invitationObjectId) {
      return { success: false, message: "Invalid invitation ID" };
    }

    const result = await dbConnect(collections.INVITATIONS).updateOne(
      {
        _id: invitationObjectId,
        messId: mess._id,
        status: "pending",
      },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
          cancelledAt: new Date(),
        },
      },
    );

    if (!result.matchedCount) {
      return { success: false, message: "Invitation not found" };
    }

    revalidateManagerSettingsPaths();
    return { success: true, message: "Invitation cancelled" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to cancel invitation",
    };
  }
}

export async function updateDepositRules(payload: {
  minimumDeposit: number;
  approvalMode: DepositApprovalMode;
}): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();
    const minimumDeposit = Number(payload.minimumDeposit);

    if (!Number.isFinite(minimumDeposit) || minimumDeposit < 0) {
      return {
        success: false,
        message: "Minimum deposit must be 0 or greater",
      };
    }

    if (!["manual", "automatic"].includes(payload.approvalMode)) {
      return { success: false, message: "Invalid deposit approval mode" };
    }

    await dbConnect(collections.MESS).updateOne(
      { _id: mess._id },
      {
        $set: {
          depositSettings: {
            minimumDeposit,
            approvalMode: payload.approvalMode,
          },
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Deposit rules updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update deposit rules",
    };
  }
}

export async function updateExpenseRules(payload: {
  whoCanAddExpenses: ExpenseRuleAccess;
}): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();

    if (
      !["managerOnly", "membersAllowed"].includes(payload.whoCanAddExpenses)
    ) {
      return { success: false, message: "Invalid expense rule" };
    }

    await dbConnect(collections.MESS).updateOne(
      { _id: mess._id },
      {
        $set: {
          "settings.expenseRules.whoCanAddExpenses": payload.whoCanAddExpenses,
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Expense rules updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update expense rules",
    };
  }
}

export async function updateMonthlyBudget(payload: {
  budget: number;
}): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();
    const budget = Number(payload.budget);

    if (!Number.isFinite(budget) || budget < 0) {
      return { success: false, message: "Budget must be 0 or greater" };
    }

    await dbConnect(collections.MESS).updateOne(
      { _id: mess._id },
      {
        $set: {
          budget,
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Monthly budget updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to update budget",
    };
  }
}

export async function updateMealSettings(payload: {
  enabled: boolean;
  defaultMealCount: number;
  calculationMode: MealCalculationMode;
}): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();
    const defaultMealCount = Number(payload.defaultMealCount);

    if (!Number.isFinite(defaultMealCount) || defaultMealCount < 0) {
      return {
        success: false,
        message: "Default meal count must be 0 or greater",
      };
    }

    if (!["daily", "monthly"].includes(payload.calculationMode)) {
      return { success: false, message: "Invalid meal calculation mode" };
    }

    await dbConnect(collections.MESS).updateOne(
      { _id: mess._id },
      {
        $set: {
          "mealSettings.enabled": normalizeBoolean(payload.enabled),
          "mealSettings.defaultMealCount": defaultMealCount,
          "mealSettings.calculationMode": payload.calculationMode,
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Meal settings updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update meal settings",
    };
  }
}

export async function updateMealDeadline(payload: {
  deadline: string;
}): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();
    const deadline = trimText(payload.deadline).toUpperCase();

    if (!isValidTimeString(deadline)) {
      return {
        success: false,
        message: "Deadline must use the format HH:MM AM/PM",
      };
    }

    await dbConnect(collections.MESS).updateOne(
      { _id: mess._id },
      {
        $set: {
          "mealSettings.deadline": deadline,
          updatedAt: new Date(),
        },
      },
    );

    revalidateManagerSettingsPaths();
    return { success: true, message: "Meal deadline updated" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to update meal deadline",
    };
  }
}

const formatValue = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

const createCsv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "";

  const headers = Array.from(
    rows.reduce((set, row) => {
      Object.keys(row).forEach((key) => set.add(key));
      return set;
    }, new Set<string>()),
  );

  const escapeCsv = (value: unknown) => {
    const stringValue = formatValue(value).replace(/"/g, '""');
    return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
  };

  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers.map((header) => escapeCsv(row[header])).join(","),
    ),
  ];

  return lines.join("\n");
};

export async function exportMessReport(payload: {
  type: ExportType;
  format: ExportFormat;
}): Promise<ExportResult> {
  try {
    const { mess } = await getManagerContext();

    if (!["deposits", "expenses", "meals"].includes(payload.type)) {
      return { success: false, message: "Invalid report type" };
    }

    if (!["csv", "json"].includes(payload.format)) {
      return { success: false, message: "Invalid report format" };
    }

    const collectionName =
      payload.type === "deposits"
        ? collections.DEPOSITS
        : payload.type === "expenses"
          ? collections.EXPENSES
          : collections.MEAL_ENTRIES;

    const records = await dbConnect(collectionName)
      .find({ messId: mess._id })
      .sort({ createdAt: -1 })
      .toArray();

    const normalizedRows = records.map((record) => ({
      ...record,
      _id: record._id.toString(),
      messId: record.messId?.toString?.() ?? record.messId,
      userId: record.userId?.toString?.() ?? record.userId,
      addedBy: record.addedBy?.toString?.() ?? record.addedBy,
      paidBy: record.paidBy?.toString?.() ?? record.paidBy,
      createdBy: record.createdBy?.toString?.() ?? record.createdBy,
      verifiedBy: record.verifiedBy?.toString?.() ?? record.verifiedBy,
      approvedBy: record.approvedBy?.toString?.() ?? record.approvedBy,
      createdAt:
        record.createdAt instanceof Date
          ? record.createdAt.toISOString()
          : record.createdAt,
      updatedAt:
        record.updatedAt instanceof Date
          ? record.updatedAt.toISOString()
          : record.updatedAt,
      verifiedAt:
        record.verifiedAt instanceof Date
          ? record.verifiedAt.toISOString()
          : record.verifiedAt,
      approvedAt:
        record.approvedAt instanceof Date
          ? record.approvedAt.toISOString()
          : record.approvedAt,
    }));

    const content =
      payload.format === "json"
        ? JSON.stringify(normalizedRows, null, 2)
        : createCsv(normalizedRows);

    return {
      success: true,
      message: `${payload.type} report exported successfully`,
      filename: `${payload.type}-report.${payload.format}`,
      mimeType:
        payload.format === "json"
          ? "application/json"
          : "text/csv;charset=utf-8",
      content,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to export report",
    };
  }
}

export async function transferManagerRole(
  newManagerId: string,
): Promise<ActionResult> {
  try {
    const { userId, mess } = await getManagerContext();
    const { membership, memberObjectId } = await getMessMemberOrThrow(
      mess._id,
      newManagerId,
    );

    if (memberObjectId.toString() === userId.toString()) {
      return {
        success: false,
        message: "Select a different member to transfer ownership",
      };
    }

    const newManager = await dbConnect(collections.USERS).findOne({
      _id: memberObjectId,
    });

    if (!newManager) {
      return { success: false, message: "New manager account not found" };
    }

    await Promise.all([
      dbConnect(collections.MESS).updateOne(
        { _id: mess._id, managerId: userId },
        {
          $set: {
            managerId: memberObjectId,
            managerEmail: newManager.email,
            updatedAt: new Date(),
          },
        },
      ),
      dbConnect(collections.MESS_MEMBERS).updateOne(
        { messId: mess._id, userId, status: "active" },
        { $set: { role: "member", updatedAt: new Date() } },
      ),
      dbConnect(collections.MESS_MEMBERS).updateOne(
        { _id: membership._id },
        { $set: { role: "manager", updatedAt: new Date() } },
      ),
      dbConnect(collections.USERS).updateOne(
        { _id: userId },
        { $set: { role: "user", updatedAt: new Date() } },
      ),
      dbConnect(collections.USERS).updateOne(
        { _id: memberObjectId },
        { $set: { role: "manager", updatedAt: new Date() } },
      ),
    ]);

    revalidateManagerSettingsPaths();
    return { success: true, message: "Manager role transferred successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to transfer manager role",
    };
  }
}

export async function deleteMess(): Promise<ActionResult> {
  try {
    const { userId, mess } = await getManagerContext();
    const memberCollection = dbConnect(collections.MESS_MEMBERS);

    const activeMemberships = await memberCollection
      .find({ messId: mess._id, status: "active" })
      .toArray();

    await Promise.all([
      dbConnect(collections.MESS).deleteOne({
        _id: mess._id,
        managerId: userId,
      }),
      memberCollection.deleteMany({ messId: mess._id }),
      dbConnect(collections.INVITATIONS).deleteMany({ messId: mess._id }),
      dbConnect(collections.DEPOSITS).deleteMany({ messId: mess._id }),
      dbConnect(collections.EXPENSES).deleteMany({ messId: mess._id }),
      dbConnect(collections.MEAL_ENTRIES).deleteMany({ messId: mess._id }),
      dbConnect(collections.DEPOSIT_REQUESTS).deleteMany({ messId: mess._id }),
      dbConnect(collections.USERS).updateMany(
        { _id: { $in: activeMemberships.map((item) => item.userId) } },
        { $set: { role: "user", updatedAt: new Date() } },
      ),
    ]);

    revalidateManagerSettingsPaths();
    return { success: true, message: "Mess deleted successfully" };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to delete mess",
    };
  }
}

export async function resetMessData(): Promise<ActionResult> {
  try {
    const { mess } = await getManagerContext();

    await Promise.all([
      dbConnect(collections.DEPOSITS).deleteMany({ messId: mess._id }),
      dbConnect(collections.DEPOSIT_REQUESTS).deleteMany({ messId: mess._id }),
      dbConnect(collections.EXPENSES).deleteMany({ messId: mess._id }),
      dbConnect(collections.MEAL_ENTRIES).deleteMany({ messId: mess._id }),
      dbConnect(collections.INVITATIONS).deleteMany({ messId: mess._id }),
    ]);

    revalidateManagerSettingsPaths();
    return { success: true, message: "Mess data reset successfully" };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to reset mess data",
    };
  }
}
