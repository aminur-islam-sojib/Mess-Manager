"use server";
import { collections, dbConnect } from "@/lib/dbConnect";
import { AuthorizationError, requireAdminRole } from "@/lib/auth.utils";
import { InputUser } from "@/types/Model";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { emitNotification } from "@/lib/notifications";

export type AdminUserSortBy = "createdAt" | "name" | "email" | "role";
export type AdminUserSortOrder = "asc" | "desc";
export type AdminUserRoleFilter = "all" | "user" | "manager" | "admin";
export type AdminUserStatusFilter = "all" | "active" | "suspended";

export interface AdminUsersListParams {
  page?: number;
  pageSize?: number;
  q?: string;
  role?: AdminUserRoleFilter;
  status?: AdminUserStatusFilter;
  provider?: string;
  sortBy?: AdminUserSortBy;
  order?: AdminUserSortOrder;
}

export interface AdminUserListItem {
  id: string;
  name: string;
  email: string;
  role: string;
  provider: string;
  status: string;
  messCount: number;
  createdAt: Date;
}

export type AdminUsersListResponse =
  | {
      success: true;
      items: AdminUserListItem[];
      pagination: {
        totalItems: number;
        totalPages: number;
        page: number;
        pageSize: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
      filters: {
        q: string;
        role: AdminUserRoleFilter;
        status: AdminUserStatusFilter;
        provider: string;
        sortBy: AdminUserSortBy;
        order: AdminUserSortOrder;
      };
    }
  | {
      success: false;
      message: string;
    };

export type AdminStatusActionResponse =
  | {
      success: true;
      message: string;
    }
  | {
      success: false;
      message: string;
    };

const ALLOWED_PAGE_SIZES = new Set([10, 20, 50, 100]);
const ALLOWED_ROLES = new Set<AdminUserRoleFilter>([
  "all",
  "user",
  "manager",
  "admin",
]);
const ALLOWED_STATUSES = new Set<AdminUserStatusFilter>([
  "all",
  "active",
  "suspended",
]);
const ALLOWED_SORT_BY = new Set<AdminUserSortBy>([
  "createdAt",
  "name",
  "email",
  "role",
]);
const ALLOWED_ORDER = new Set<AdminUserSortOrder>(["asc", "desc"]);
const ALLOWED_ACCESS_ROLES = new Set(["user", "manager", "admin"]);

function parseObjectId(value: FormDataEntryValue | null): ObjectId | null {
  if (typeof value !== "string" || !value.trim()) {
    return null;
  }

  try {
    return new ObjectId(value.trim());
  } catch {
    return null;
  }
}

function escapeRegex(query: string) {
  return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeAdminUsersParams(params?: AdminUsersListParams) {
  const page = Number.isFinite(params?.page)
    ? Math.max(1, Math.floor(Number(params?.page)))
    : 1;

  const requestedPageSize = Number.isFinite(params?.pageSize)
    ? Math.max(1, Math.floor(Number(params?.pageSize)))
    : 20;
  const pageSize = ALLOWED_PAGE_SIZES.has(requestedPageSize)
    ? requestedPageSize
    : 20;

  const q = (params?.q ?? "").trim().slice(0, 80);

  const role = ALLOWED_ROLES.has(params?.role as AdminUserRoleFilter)
    ? (params?.role as AdminUserRoleFilter)
    : "all";

  const status = ALLOWED_STATUSES.has(params?.status as AdminUserStatusFilter)
    ? (params?.status as AdminUserStatusFilter)
    : "all";

  const provider = (params?.provider ?? "").trim().slice(0, 32);

  const sortBy = ALLOWED_SORT_BY.has(params?.sortBy as AdminUserSortBy)
    ? (params?.sortBy as AdminUserSortBy)
    : "createdAt";

  const order = ALLOWED_ORDER.has(params?.order as AdminUserSortOrder)
    ? (params?.order as AdminUserSortOrder)
    : "desc";

  return {
    page,
    pageSize,
    q,
    role,
    status,
    provider,
    sortBy,
    order,
  };
}

/* ----------------------------------------
   GET USERS
---------------------------------------- */
export const getUsers = async () => {
  try {
    await requireAdminRole();
    const collection = await dbConnect(collections.USERS);
    const users = await collection.find().toArray();
    return users;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }

    console.error("❌ Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
};

/* ----------------------------------------
   GET USERS BY ID
---------------------------------------- */
export const getUser = async (email: string) => {
  try {
    await requireAdminRole();
    const collection = await dbConnect(collections.USERS);
    const users = await collection.findOne({ email });
    return users;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      throw error;
    }

    console.error("❌ Error fetching users:", error);
    throw new Error("Failed to fetch users");
  }
};

/* ----------------------------------------
   ADMIN USERS LIST (PAGINATED)
---------------------------------------- */
export const getAdminUsersList = async (
  params?: AdminUsersListParams,
): Promise<AdminUsersListResponse> => {
  try {
    await requireAdminRole();

    const normalized = normalizeAdminUsersParams(params);

    const usersCollection = dbConnect(collections.USERS);
    const matchQuery: Record<string, unknown> = {};

    if (normalized.q) {
      const regex = new RegExp(escapeRegex(normalized.q), "i");
      matchQuery.$or = [{ name: regex }, { email: regex }];
    }

    if (normalized.role !== "all") {
      matchQuery.role = normalized.role;
    }

    if (normalized.status === "suspended") {
      matchQuery.status = "suspended";
    }

    if (normalized.status === "active") {
      matchQuery.$and = [
        ...(Array.isArray(matchQuery.$and)
          ? (matchQuery.$and as unknown[])
          : []),
        {
          $or: [
            { status: { $exists: false } },
            { status: { $ne: "suspended" } },
          ],
        },
      ];
    }

    if (normalized.provider) {
      matchQuery.provider = normalized.provider;
    }

    const sortDirection = normalized.order === "asc" ? 1 : -1;
    const skip = (normalized.page - 1) * normalized.pageSize;

    const [totalItems, rows] = await Promise.all([
      usersCollection.countDocuments(matchQuery),
      usersCollection
        .aggregate([
          { $match: matchQuery },
          {
            $lookup: {
              from: collections.MESS_MEMBERS,
              let: { userId: "$_id" },
              pipeline: [
                {
                  $match: {
                    $expr: { $eq: ["$userId", "$$userId"] },
                    status: "active",
                  },
                },
                { $count: "count" },
              ],
              as: "messMembershipStats",
            },
          },
          {
            $addFields: {
              messCount: {
                $ifNull: [{ $first: "$messMembershipStats.count" }, 0],
              },
            },
          },
          {
            $project: {
              _id: 1,
              name: 1,
              email: 1,
              role: 1,
              provider: 1,
              status: 1,
              messCount: 1,
              createdAt: 1,
            },
          },
          {
            $sort: {
              [normalized.sortBy]: sortDirection,
              _id: 1,
            },
          },
          { $skip: skip },
          { $limit: normalized.pageSize },
        ])
        .toArray(),
    ]);

    const totalPages = Math.max(1, Math.ceil(totalItems / normalized.pageSize));

    return {
      success: true,
      items: rows.map((user) => ({
        id: user._id.toString(),
        name:
          typeof user.name === "string" && user.name.trim()
            ? user.name
            : "Unknown",
        email: typeof user.email === "string" ? user.email : "-",
        role: typeof user.role === "string" ? user.role : "user",
        provider:
          typeof user.provider === "string" ? user.provider : "credentials",
        status:
          typeof user.status === "string" && user.status.trim()
            ? user.status
            : "active",
        messCount: typeof user.messCount === "number" ? user.messCount : 0,
        createdAt:
          user.createdAt instanceof Date
            ? user.createdAt
            : new Date(user.createdAt ?? Date.now()),
      })),
      pagination: {
        totalItems,
        totalPages,
        page: normalized.page,
        pageSize: normalized.pageSize,
        hasNext: normalized.page < totalPages,
        hasPrev: normalized.page > 1,
      },
      filters: {
        q: normalized.q,
        role: normalized.role,
        status: normalized.status,
        provider: normalized.provider,
        sortBy: normalized.sortBy,
        order: normalized.order,
      },
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("❌ Error fetching admin users list:", error);
    return {
      success: false,
      message: "Failed to fetch users list",
    };
  }
};

/* ----------------------------------------
   ADMIN USER STATUS (SUSPEND / ACTIVATE)
---------------------------------------- */
export const updateAdminUserStatus = async (
  formData: FormData,
): Promise<AdminStatusActionResponse> => {
  try {
    const session = await requireAdminRole();
    const usersCollection = dbConnect(collections.USERS);
    const auditCollection = dbConnect(collections.AUDIT_LOGS);

    const userId = parseObjectId(formData.get("userId"));
    const action = String(formData.get("action") || "").trim();
    const reason = String(formData.get("reason") || "").trim();

    if (!userId) {
      return { success: false, message: "Invalid user ID" };
    }

    if (action !== "suspend" && action !== "activate") {
      return { success: false, message: "Invalid action" };
    }

    if (session.user.id === userId.toString()) {
      return {
        success: false,
        message: "You cannot change your own account status",
      };
    }

    if (action === "suspend" && reason.length < 5) {
      return {
        success: false,
        message: "Suspend reason must be at least 5 characters",
      };
    }

    if (reason.length > 500) {
      return {
        success: false,
        message: "Reason is too long",
      };
    }

    const existingUser = await usersCollection.findOne(
      { _id: userId },
      { projection: { _id: 1, name: 1, email: 1, role: 1, status: 1 } },
    );

    if (!existingUser) {
      return { success: false, message: "User not found" };
    }

    const previousStatus =
      typeof existingUser.status === "string" && existingUser.status.trim()
        ? existingUser.status
        : "active";

    const nextStatus = action === "suspend" ? "suspended" : "active";

    if (previousStatus === nextStatus) {
      return {
        success: true,
        message:
          nextStatus === "suspended"
            ? "User is already suspended"
            : "User is already active",
      };
    }

    let actorObjectId: ObjectId | null = null;
    try {
      actorObjectId = session.user.id ? new ObjectId(session.user.id) : null;
    } catch {
      actorObjectId = null;
    }

    const result = await usersCollection.updateOne(
      { _id: userId },
      nextStatus === "suspended"
        ? {
            $set: {
              status: nextStatus,
              suspensionReason: reason,
              suspendedAt: new Date(),
              suspendedBy: actorObjectId,
              updatedAt: new Date(),
            },
          }
        : {
            $set: {
              status: nextStatus,
              updatedAt: new Date(),
            },
            $unset: {
              suspensionReason: "",
              suspendedAt: "",
              suspendedBy: "",
            },
          },
    );

    if (result.matchedCount === 0) {
      return { success: false, message: "User not found" };
    }

    await auditCollection.insertOne({
      action: action === "suspend" ? "user.suspended" : "user.activated",
      actorUserId: actorObjectId,
      actorName: session.user.name ?? null,
      actorEmail: session.user.email ?? null,
      targetUserId: userId,
      targetUserName:
        typeof existingUser.name === "string" ? existingUser.name : null,
      targetUserEmail:
        typeof existingUser.email === "string" ? existingUser.email : null,
      reason: reason || null,
      before: {
        status: previousStatus,
      },
      after: {
        status: nextStatus,
      },
      createdAt: new Date(),
    });

    await emitNotification({
      recipientUserIds: [userId],
      actorUserId: actorObjectId ?? undefined,
      eventKey:
        action === "suspend" ? "account.suspended" : "account.activated",
      channels: ["in_app", "realtime", "email"],
      severity: action === "suspend" ? "warning" : "success",
      title:
        action === "suspend"
          ? "Your account has been suspended"
          : "Your account has been reactivated",
      message:
        action === "suspend"
          ? `Access is temporarily limited. Reason: ${reason}`
          : "Your account access has been restored by an administrator.",
      actionUrl: "/auth/suspended",
      metadata: {
        action,
        reason: reason || null,
      },
      dedupeKey: `account-status:${userId.toString()}:${nextStatus}`,
    });

    revalidatePath("/dashboard/admin/users");

    return {
      success: true,
      message:
        nextStatus === "suspended"
          ? "User suspended successfully"
          : "User activated successfully",
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("❌ Error updating user status:", error);
    return {
      success: false,
      message: "Failed to update user status",
    };
  }
};

/* ----------------------------------------
   ADMIN USER ROLE ACCESS
---------------------------------------- */
export const updateAdminUserRole = async (
  formData: FormData,
): Promise<void> => {
  try {
    const session = await requireAdminRole();
    const usersCollection = dbConnect(collections.USERS);

    const userId = parseObjectId(formData.get("userId"));
    const nextRole = String(formData.get("role") || "").trim();

    if (!userId) {
      return;
    }

    if (!ALLOWED_ACCESS_ROLES.has(nextRole)) {
      return;
    }

    if (session.user.id === userId.toString() && nextRole !== "admin") {
      return;
    }

    const result = await usersCollection.updateOne(
      { _id: userId },
      {
        $set: {
          role: nextRole,
          updatedAt: new Date(),
        },
      },
    );

    if (result.matchedCount === 0) {
      return;
    }

    revalidatePath("/dashboard/admin/users");
  } catch (error) {
    if (error instanceof AuthorizationError) return;

    console.error("❌ Error updating user role:", error);
  }
};

/* ----------------------------------------
   CREATE USER
---------------------------------------- */
export const createUser = async (payload: InputUser) => {
  const { fullName, email, confirmPassword, role = "user" } = payload;

  const hashedPassword = await bcrypt.hash(confirmPassword, 10);

  const user = {
    name: fullName,
    email,
    password: hashedPassword,
    role,
    createdAt: new Date(),
  };

  try {
    const collection = await dbConnect(collections.USERS);

    const isExist = await collection.findOne({ email });
    if (isExist) {
      return { success: false, message: "User Already Exist!" };
    }

    const result = await collection.insertOne(user);

    return {
      success: true,
      userId: result.insertedId.toString(),
      message: "User Created Successfully!",
    };
  } catch (error) {
    console.error("❌ Error creating user:", error);
    return {
      success: false,
      message: "Failed to create user",
    };
  }
};
