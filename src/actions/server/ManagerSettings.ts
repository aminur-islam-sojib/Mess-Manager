"use server";

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { sendInvitationEmail } from "@/components/ManagerComponents/SendInvitationMail";
import { collections, dbConnect } from "@/lib/dbConnect";
import type { DepositDocument } from "@/types/Deposit";
import type { ExpenseDocument } from "@/types/ExpenseType";
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

type ExportFormat = "csv" | "json" | "pdf";
type ExportType = "deposits" | "expenses" | "meals";

type ExportResult =
  | {
      success: true;
      message: string;
      filename: string;
      mimeType: string;
      content: string;
      contentEncoding: "utf-8" | "base64";
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
    ? `${APP_URL}/dashboard/user/invite?token=${invitation.token}`
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

    const inviteLink = `${APP_URL}/dashboard/user/invite?token=${token}`;

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

type ReportColumn = {
  key: string;
  header: string;
  align?: "left" | "center" | "right";
  width?: number;
};

type ReportRow = Record<string, string>;

type ReportSummaryItem = {
  label: string;
  value: string;
};

type ReportDataset = {
  title: string;
  subtitle: string;
  messName: string;
  generatedAt: string;
  columns: ReportColumn[];
  rows: ReportRow[];
  summary: ReportSummaryItem[];
  orientation: "portrait" | "landscape";
  emptyState: string;
};

type ExportUserDocument = {
  _id: ObjectId;
  name?: string;
  email?: string;
};

type DepositReportDocument = DepositDocument & { _id: ObjectId };
type ExpenseReportDocument = ExpenseDocument & { _id: ObjectId };
type MealEntryReportDocument = {
  _id: ObjectId;
  messId: ObjectId;
  userId: ObjectId;
  date?: string;
  meals?: number;
  breakdown?: {
    breakfast?: number;
    lunch?: number;
    dinner?: number;
  };
  createdBy?: ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
};

const REPORT_DATE_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Dhaka",
});

const REPORT_DATE_TIME_FORMATTER = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Asia/Dhaka",
});

const REPORT_CURRENCY_FORMATTER = new Intl.NumberFormat("en-BD", {
  style: "currency",
  currency: "BDT",
  maximumFractionDigits: 0,
});

const REPORT_LABELS: Record<
  ExportType,
  { title: string; subtitle: string; emptyState: string }
> = {
  deposits: {
    title: "Deposit Report",
    subtitle:
      "Readable deposit activity with member identity, payment method, and recorder details.",
    emptyState: "No deposits have been recorded for this mess yet.",
  },
  expenses: {
    title: "Expense Report",
    subtitle:
      "Readable expense activity with payer identity, status, and approval context.",
    emptyState: "No expenses have been recorded for this mess yet.",
  },
  meals: {
    title: "Meal Report",
    subtitle:
      "Readable meal entries with member identity and breakfast, lunch, dinner totals.",
    emptyState: "No meal entries have been recorded for this mess yet.",
  },
};

const createCsv = (columns: ReportColumn[], rows: ReportRow[]) => {
  const escapeCsv = (value: unknown) => {
    const stringValue = formatValue(value).replace(/"/g, '""');
    return /[",\n]/.test(stringValue) ? `"${stringValue}"` : stringValue;
  };

  const lines = [
    columns.map((column) => escapeCsv(column.header)).join(","),
    ...rows.map((row) =>
      columns.map((column) => escapeCsv(row[column.key] ?? "")).join(","),
    ),
  ];

  return lines.join("\n");
};

const toObjectIdString = (value: unknown): string | null => {
  if (value === null || value === undefined) {
    return null;
  }

  const stringValue =
    typeof value === "string"
      ? value
      : typeof value === "object" && "toString" in value
        ? value.toString()
        : "";

  return ObjectId.isValid(stringValue) ? stringValue : null;
};

const toTitleCase = (value: string) =>
  value
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

const formatMethodLabel = (value: unknown) => {
  if (typeof value !== "string" || !value.trim()) return "Cash";

  if (value === "bkash") return "bKash";
  if (value === "nagad") return "Nagad";
  return toTitleCase(value);
};

const formatStatusLabel = (value: unknown) =>
  typeof value === "string" && value.trim() ? toTitleCase(value) : "Unknown";

const formatPaymentSourceLabel = (value: unknown) =>
  value === "mess_pool" ? "Mess Pool" : "Individual";

const parseDateLikeValue = (value: unknown) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value;
  }

  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  const parsed = new Date(
    value.length === 10 ? `${value}T00:00:00+06:00` : value,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateLabel = (value: unknown) => {
  const date = parseDateLikeValue(value);
  return date ? REPORT_DATE_FORMATTER.format(date) : "-";
};

const formatDateTimeLabel = (value: unknown) => {
  const date = parseDateLikeValue(value);
  return date ? REPORT_DATE_TIME_FORMATTER.format(date) : "-";
};

const formatCurrencyLabel = (value: unknown) => {
  const numericValue = Number(value ?? 0);
  return Number.isFinite(numericValue)
    ? REPORT_CURRENCY_FORMATTER.format(numericValue)
    : REPORT_CURRENCY_FORMATTER.format(0);
};

const formatTextLabel = (value: unknown, fallback = "No note") => {
  if (typeof value === "string" && value.trim()) {
    return value.trim();
  }

  return fallback;
};

const collectReportUserIds = (
  records: Array<Record<string, unknown>>,
  keys: string[],
) => {
  const userIds = new Set<string>();

  records.forEach((record) => {
    keys.forEach((key) => {
      const userId = toObjectIdString(record[key]);
      if (userId) {
        userIds.add(userId);
      }
    });
  });

  return Array.from(userIds);
};

const loadUserLookup = async (userIds: string[]) => {
  if (!userIds.length) {
    return new Map<string, { name: string; email: string }>();
  }

  const objectIds = userIds.map((userId) => new ObjectId(userId));
  const users = (await dbConnect(collections.USERS)
    .find({ _id: { $in: objectIds } })
    .project({ name: 1, email: 1 })
    .toArray()) as ExportUserDocument[];

  return new Map(
    users.map((user) => [
      user._id.toString(),
      {
        name:
          typeof user.name === "string" && user.name.trim()
            ? user.name.trim()
            : "Unknown Member",
        email:
          typeof user.email === "string" && user.email.trim()
            ? user.email.trim()
            : "-",
      },
    ]),
  );
};

const resolveUserName = (
  userMap: Map<string, { name: string; email: string }>,
  userId: unknown,
  fallback = "Unknown Member",
) => {
  const normalizedId = toObjectIdString(userId);
  return normalizedId
    ? (userMap.get(normalizedId)?.name ?? fallback)
    : fallback;
};

const resolveUserEmail = (
  userMap: Map<string, { name: string; email: string }>,
  userId: unknown,
  fallback = "-",
) => {
  const normalizedId = toObjectIdString(userId);
  return normalizedId
    ? (userMap.get(normalizedId)?.email ?? fallback)
    : fallback;
};

const formatDateRangeLabel = (values: string[]) => {
  const filteredValues = values.filter(Boolean).sort();
  if (!filteredValues.length) return "-";

  const start = formatDateLabel(filteredValues[0]);
  const end = formatDateLabel(filteredValues[filteredValues.length - 1]);
  return start === end ? start : `${start} to ${end}`;
};

const buildDepositReportDataset = async (
  messName: string,
  generatedAt: string,
  records: DepositReportDocument[],
): Promise<ReportDataset> => {
  const userMap = await loadUserLookup(
    collectReportUserIds(records as Array<Record<string, unknown>>, [
      "userId",
      "addedBy",
    ]),
  );

  const rows = records.map((record) => ({
    date: formatDateLabel(record.date ?? record.createdAt),
    memberName: resolveUserName(userMap, record.userId),
    memberEmail: resolveUserEmail(userMap, record.userId),
    amount: formatCurrencyLabel(record.amount),
    method: formatMethodLabel(record.method),
    recordedBy: resolveUserName(userMap, record.addedBy, "Manager"),
    note: formatTextLabel(record.note, "No note"),
    createdAt: formatDateTimeLabel(record.createdAt),
  }));

  const methodsUsed = new Set(
    records.map((record) => formatMethodLabel(record.method)).filter(Boolean),
  );
  const memberCount = new Set(
    records.map((record) => toObjectIdString(record.userId)).filter(Boolean),
  ).size;

  return {
    title: REPORT_LABELS.deposits.title,
    subtitle: REPORT_LABELS.deposits.subtitle,
    messName,
    generatedAt,
    orientation: "landscape",
    emptyState: REPORT_LABELS.deposits.emptyState,
    columns: [
      { key: "date", header: "Date", width: 68 },
      { key: "memberName", header: "Member", width: 100 },
      { key: "memberEmail", header: "Email", width: 150 },
      { key: "amount", header: "Amount", align: "right", width: 84 },
      { key: "method", header: "Method", width: 70 },
      { key: "recordedBy", header: "Recorded By", width: 95 },
      { key: "note", header: "Note", width: 130 },
      { key: "createdAt", header: "Created At", width: 92 },
    ],
    rows,
    summary: [
      { label: "Entries", value: String(records.length) },
      {
        label: "Total Deposited",
        value: formatCurrencyLabel(
          records.reduce((sum, record) => sum + Number(record.amount ?? 0), 0),
        ),
      },
      { label: "Members", value: String(memberCount) },
      { label: "Methods Used", value: String(methodsUsed.size) },
    ],
  };
};

const buildExpenseReportDataset = async (
  messName: string,
  generatedAt: string,
  records: ExpenseReportDocument[],
): Promise<ReportDataset> => {
  const userMap = await loadUserLookup(
    collectReportUserIds(records as Array<Record<string, unknown>>, [
      "paidBy",
      "addedBy",
      "verifiedBy",
    ]),
  );

  const rows = records.map((record) => {
    const noteParts = [
      formatTextLabel(record.description, ""),
      formatTextLabel(record.approvalNote, ""),
    ].filter(Boolean);

    return {
      date: formatDateLabel(record.expenseDate),
      title: formatTextLabel(record.title, "Untitled expense"),
      category: formatMethodLabel(record.category),
      payerName:
        record.paymentSource === "mess_pool"
          ? "Mess Pool"
          : resolveUserName(userMap, record.paidBy),
      payerEmail:
        record.paymentSource === "mess_pool"
          ? "-"
          : resolveUserEmail(userMap, record.paidBy),
      amount: formatCurrencyLabel(record.amount),
      source: formatPaymentSourceLabel(record.paymentSource),
      status: formatStatusLabel(record.status),
      verifiedBy:
        record.status === "approved" || record.status === "rejected"
          ? resolveUserName(userMap, record.verifiedBy, "System")
          : "Pending review",
      note: noteParts.join(" | ") || "No note",
    };
  });

  const approvedCount = records.filter(
    (record) => record.status === "approved",
  ).length;
  const pendingCount = records.filter(
    (record) => record.status === "pending",
  ).length;

  return {
    title: REPORT_LABELS.expenses.title,
    subtitle: REPORT_LABELS.expenses.subtitle,
    messName,
    generatedAt,
    orientation: "landscape",
    emptyState: REPORT_LABELS.expenses.emptyState,
    columns: [
      { key: "date", header: "Date", width: 68 },
      { key: "title", header: "Title", width: 110 },
      { key: "category", header: "Category", width: 72 },
      { key: "payerName", header: "Paid By", width: 88 },
      { key: "payerEmail", header: "Email", width: 145 },
      { key: "amount", header: "Amount", align: "right", width: 84 },
      { key: "source", header: "Source", width: 72 },
      { key: "status", header: "Status", width: 72 },
      { key: "verifiedBy", header: "Reviewed By", width: 86 },
      { key: "note", header: "Details", width: 140 },
    ],
    rows,
    summary: [
      { label: "Entries", value: String(records.length) },
      {
        label: "Total Spent",
        value: formatCurrencyLabel(
          records.reduce((sum, record) => sum + Number(record.amount ?? 0), 0),
        ),
      },
      { label: "Approved", value: String(approvedCount) },
      { label: "Pending", value: String(pendingCount) },
    ],
  };
};

const buildMealReportDataset = async (
  messName: string,
  generatedAt: string,
  records: MealEntryReportDocument[],
): Promise<ReportDataset> => {
  const userMap = await loadUserLookup(
    collectReportUserIds(records as Array<Record<string, unknown>>, [
      "userId",
      "createdBy",
    ]),
  );

  const rows = records.map((record) => ({
    date: formatDateLabel(record.date ?? record.createdAt),
    memberName: resolveUserName(userMap, record.userId),
    memberEmail: resolveUserEmail(userMap, record.userId),
    breakfast: String(Number(record.breakdown?.breakfast ?? 0)),
    lunch: String(Number(record.breakdown?.lunch ?? 0)),
    dinner: String(Number(record.breakdown?.dinner ?? 0)),
    totalMeals: String(Number(record.meals ?? 0)),
    recordedBy: resolveUserName(userMap, record.createdBy, "Manager"),
    updatedAt: formatDateTimeLabel(record.updatedAt ?? record.createdAt),
  }));

  const totalBreakfast = records.reduce(
    (sum, record) => sum + Number(record.breakdown?.breakfast ?? 0),
    0,
  );
  const totalLunch = records.reduce(
    (sum, record) => sum + Number(record.breakdown?.lunch ?? 0),
    0,
  );
  const totalDinner = records.reduce(
    (sum, record) => sum + Number(record.breakdown?.dinner ?? 0),
    0,
  );
  const totalMeals = records.reduce(
    (sum, record) => sum + Number(record.meals ?? 0),
    0,
  );

  return {
    title: REPORT_LABELS.meals.title,
    subtitle: REPORT_LABELS.meals.subtitle,
    messName,
    generatedAt,
    orientation: "landscape",
    emptyState: REPORT_LABELS.meals.emptyState,
    columns: [
      { key: "date", header: "Date", width: 72 },
      { key: "memberName", header: "Member", width: 94 },
      { key: "memberEmail", header: "Email", width: 150 },
      { key: "breakfast", header: "Breakfast", align: "center", width: 58 },
      { key: "lunch", header: "Lunch", align: "center", width: 52 },
      { key: "dinner", header: "Dinner", align: "center", width: 52 },
      { key: "totalMeals", header: "Total", align: "center", width: 48 },
      { key: "recordedBy", header: "Recorded By", width: 86 },
      { key: "updatedAt", header: "Updated At", width: 96 },
    ],
    rows,
    summary: [
      { label: "Entries", value: String(records.length) },
      { label: "Total Meals", value: String(totalMeals) },
      {
        label: "Meal Split",
        value: `${totalBreakfast}/${totalLunch}/${totalDinner}`,
      },
      {
        label: "Date Range",
        value: formatDateRangeLabel(
          records.map((record) => record.date ?? "").filter(Boolean),
        ),
      },
    ],
  };
};

const buildReportDataset = async (
  mess: ManagerContext["mess"],
  type: ExportType,
) => {
  const generatedAt = formatDateTimeLabel(new Date());
  const messName =
    typeof mess.messName === "string" && mess.messName.trim()
      ? mess.messName.trim()
      : "Current Mess";

  if (type === "deposits") {
    const records = (await dbConnect(collections.DEPOSITS)
      .find({ messId: mess._id })
      .sort({ date: -1, createdAt: -1 })
      .toArray()) as DepositReportDocument[];

    return buildDepositReportDataset(messName, generatedAt, records);
  }

  if (type === "expenses") {
    const records = (await dbConnect(collections.EXPENSES)
      .find({ messId: mess._id })
      .sort({ expenseDate: -1, createdAt: -1 })
      .toArray()) as ExpenseReportDocument[];

    return buildExpenseReportDataset(messName, generatedAt, records);
  }

  const records = (await dbConnect(collections.MEAL_ENTRIES)
    .find({ messId: mess._id })
    .sort({ date: -1, createdAt: -1 })
    .toArray()) as MealEntryReportDocument[];

  return buildMealReportDataset(messName, generatedAt, records);
};

const createPdfReportContent = async (dataset: ReportDataset) => {
  const [{ jsPDF }, autoTableModule] = await Promise.all([
    import("jspdf"),
    import("jspdf-autotable"),
  ]);

  const autoTable = autoTableModule.default;
  const doc = new jsPDF({
    orientation: dataset.orientation,
    unit: "pt",
    format: "a4",
    compress: true,
  });

  const marginX = 36;
  const headerHeight = 108;
  const summaryY = 126;
  const summaryHeight = 58;
  const tableStartY = summaryY + summaryHeight + 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const drawHeader = () => {
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    doc.setFillColor(245, 158, 11);
    doc.roundedRect(pageWidth - 154, 28, 118, 24, 12, 12, "F");

    doc.setTextColor(15, 23, 42);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("PDF", pageWidth - 95, 44, { align: "center" });

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Mess Manager Export", marginX, 32);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(dataset.title, marginX, 62);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(dataset.messName, marginX, 84);
    doc.text(`Generated ${dataset.generatedAt}`, marginX, 98);
  };

  const drawFooter = (pageNumber: number) => {
    doc.setDrawColor(226, 232, 240);
    doc.line(marginX, pageHeight - 26, pageWidth - marginX, pageHeight - 26);

    doc.setTextColor(100, 116, 139);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(dataset.subtitle, marginX, pageHeight - 10);
    doc.text(`Page ${pageNumber}`, pageWidth - marginX, pageHeight - 10, {
      align: "right",
    });
  };

  const drawSummaryCards = () => {
    const cards = dataset.summary.slice(0, 4);
    if (!cards.length) return;

    const gap = 10;
    const cardWidth =
      (pageWidth - marginX * 2 - gap * (cards.length - 1)) / cards.length;

    cards.forEach((item, index) => {
      const x = marginX + index * (cardWidth + gap);

      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(226, 232, 240);
      doc.roundedRect(x, summaryY, cardWidth, summaryHeight, 14, 14, "FD");

      doc.setTextColor(100, 116, 139);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(item.label.toUpperCase(), x + 12, summaryY + 18);

      doc.setTextColor(15, 23, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      const valueLines = doc.splitTextToSize(item.value, cardWidth - 24);
      doc.text(valueLines, x + 12, summaryY + 38);
    });
  };

  const tableBody = dataset.rows.length
    ? dataset.rows.map((row) =>
        dataset.columns.map((column) => row[column.key] ?? ""),
      )
    : [
        [
          dataset.emptyState,
          ...Array(Math.max(dataset.columns.length - 1, 0)).fill(""),
        ],
      ];

  const columnStyles: Record<
    number,
    { halign: "left" | "center" | "right"; cellWidth: number | "auto" }
  > = {};

  dataset.columns.forEach((column, index) => {
    columnStyles[index] = {
      halign: column.align ?? "left",
      cellWidth: column.width ?? "auto",
    };
  });

  autoTable(doc, {
    startY: tableStartY,
    margin: { top: tableStartY, right: marginX, bottom: 38, left: marginX },
    head: [dataset.columns.map((column) => column.header)],
    body: tableBody,
    theme: "grid",
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [248, 250, 252],
      fontStyle: "bold",
      fontSize: 9,
      lineColor: [30, 41, 59],
    },
    bodyStyles: {
      textColor: [15, 23, 42],
      fontSize: 8.5,
      cellPadding: 7,
      lineColor: [226, 232, 240],
      overflow: "linebreak",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles,
    didDrawPage: (hookData) => {
      drawHeader();
      drawFooter(hookData.pageNumber);

      if (hookData.pageNumber === 1) {
        drawSummaryCards();
      }
    },
  });

  return Buffer.from(doc.output("arraybuffer")).toString("base64");
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

    if (!["csv", "json", "pdf"].includes(payload.format)) {
      return { success: false, message: "Invalid report format" };
    }

    const dataset = await buildReportDataset(mess, payload.type);

    const content =
      payload.format === "json"
        ? JSON.stringify(dataset, null, 2)
        : payload.format === "pdf"
          ? await createPdfReportContent(dataset)
          : createCsv(dataset.columns, dataset.rows);

    return {
      success: true,
      message: `${payload.type} report exported successfully`,
      filename: `${payload.type}-report.${payload.format}`,
      mimeType:
        payload.format === "json"
          ? "application/json"
          : payload.format === "pdf"
            ? "application/pdf"
            : "text/csv;charset=utf-8",
      content,
      contentEncoding: payload.format === "pdf" ? "base64" : "utf-8",
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
