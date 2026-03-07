"use server";

import { revalidatePath } from "next/cache";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";
import {
  createNotification as createNotificationRecord,
  createNotificationsForUsers,
  getMessRecipientUserIds,
} from "@/lib/notificationService";
import type {
  AddDepositPayload,
  DepositDocument,
  DepositMethod,
  DepositPageRole,
  DepositRequestDocument,
  DepositRequestSerialized,
  UserLedger,
} from "@/types/Deposit";

type ActiveMembership = {
  _id: ObjectId;
  messId: ObjectId;
  userId: ObjectId;
  role: "manager" | "member";
  status: "active" | string;
};

type DateRange = {
  from?: Date;
  to?: Date;
};

type ActionResponse =
  | { success: true; message: string; depositId?: string; requestId?: string }
  | { success: false; message: string };

type DepositRequestMongo = DepositRequestDocument & { _id: ObjectId };

const DEPOSIT_METHODS = new Set<DepositMethod>(["cash", "bkash", "nagad", "bank"]);
const DUPLICATE_WINDOW_MS = 60 * 1000;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseObjectId = (value: string | undefined | null): ObjectId | null => {
  if (!value) return null;
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const normalizeDateString = (value?: string): string | null => {
  if (!value) return toDateKey(new Date());

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

async function resolveActiveMess(userId: ObjectId): Promise<ActiveMembership> {
  const memberCollection = dbConnect(collections.MESS_MEMBERS);
  const membership = await memberCollection.findOne({
    userId,
    status: "active",
  });

  if (!membership) {
    throw new Error("User must belong to an active mess");
  }

  return membership as ActiveMembership;
}

async function validatePayload(
  payload: AddDepositPayload,
  actorId: ObjectId,
): Promise<{
  membership: ActiveMembership;
  messId: ObjectId;
  targetUserId: ObjectId;
  amount: number;
  method: DepositMethod;
  date: string;
  note: string | null;
}> {
  const membership = await resolveActiveMess(actorId);

  const messId = parseObjectId(payload.messId);
  if (!messId) {
    throw new Error("Invalid mess ID");
  }

  if (membership.messId.toString() !== messId.toString()) {
    throw new Error("You are not authorized to perform this action");
  }

  const targetUserId = parseObjectId(payload.userId);
  if (!targetUserId) {
    throw new Error("Invalid user ID");
  }

  const amount = Number(payload.amount);
  if (!Number.isFinite(amount)) {
    throw new Error("Deposit amount must be a valid number");
  }

  if (amount <= 0) {
    throw new Error("Deposit amount must be greater than 0");
  }

  if (!payload.method || !DEPOSIT_METHODS.has(payload.method)) {
    throw new Error("Valid payment method is required");
  }

  const date = normalizeDateString(payload.date);
  if (!date) {
    throw new Error("Valid deposit date is required");
  }

  const note = payload.note?.trim() ? payload.note.trim() : null;
  const memberCollection = dbConnect(collections.MESS_MEMBERS);
  const targetMembership = await memberCollection.findOne({
    messId,
    userId: targetUserId,
    status: "active",
  });

  if (!targetMembership) {
    throw new Error("User must belong to the same mess");
  }

  return {
    membership,
    messId,
    targetUserId,
    amount,
    method: payload.method,
    date,
    note,
  };
}

async function ensureNoDuplicateDeposit(
  doc: Pick<DepositDocument, "messId" | "userId" | "amount" | "method" | "date" | "addedBy" | "note">,
) {
  const deposits = dbConnect(collections.DEPOSITS);
  const recentDuplicate = await deposits.findOne({
    messId: doc.messId,
    userId: doc.userId,
    addedBy: doc.addedBy,
    amount: doc.amount,
    method: doc.method,
    date: doc.date,
    note: doc.note ?? null,
    createdAt: {
      $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS),
    },
  });

  if (recentDuplicate) {
    throw new Error("Duplicate deposit submission detected");
  }
}

async function ensureNoDuplicateRequest(
  doc: Pick<
    DepositRequestDocument,
    "messId" | "userId" | "requestedBy" | "amount" | "method" | "date" | "note"
  >,
) {
  const requests = dbConnect(collections.DEPOSIT_REQUESTS);
  const recentDuplicate = await requests.findOne({
    messId: doc.messId,
    userId: doc.userId,
    requestedBy: doc.requestedBy,
    amount: doc.amount,
    method: doc.method,
    date: doc.date,
    note: doc.note ?? null,
    status: "pending",
    createdAt: {
      $gte: new Date(Date.now() - DUPLICATE_WINDOW_MS),
    },
  });

  if (recentDuplicate) {
    throw new Error("Duplicate deposit request detected");
  }
}

const serializeDepositRequest = (
  request: DepositRequestMongo,
): DepositRequestSerialized => ({
  id: request._id.toString(),
  messId: request.messId.toString(),
  userId: request.userId.toString(),
  requestedBy: request.requestedBy.toString(),
  amount: request.amount,
  method: request.method,
  note: request.note ?? null,
  date: request.date,
  status: request.status,
  createdAt: request.createdAt.toISOString(),
  updatedAt: request.updatedAt.toISOString(),
  approvedAt: request.approvedAt?.toISOString(),
  approvedBy: request.approvedBy?.toString(),
  approvalNote: request.approvalNote,
});

const revalidateDepositPaths = () => {
  revalidatePath("/dashboard/manager/deposits");
  revalidatePath("/dashboard/user/deposits");
};

const runNotificationSafely = async (work: () => Promise<unknown>) => {
  try {
    await work();
  } catch (error) {
    console.error("Deposit notification error:", error);
  }
};

export async function addUserDeposit(
  payload: AddDepositPayload,
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const actorId = new ObjectId(session.user.id);
    const validated = await validatePayload(payload, actorId);

    if (validated.membership.role !== "manager") {
      return {
        success: false,
        message: "You are not authorized to perform this action",
      };
    }

    const depositDoc: DepositDocument = {
      messId: validated.messId,
      userId: validated.targetUserId,
      addedBy: actorId,
      amount: validated.amount,
      method: validated.method,
      note: validated.note,
      date: validated.date,
      createdAt: new Date(),
    };

    await ensureNoDuplicateDeposit(depositDoc);

    const deposits = dbConnect(collections.DEPOSITS);
    const result = await deposits.insertOne(depositDoc);
    revalidateDepositPaths();

    await runNotificationSafely(() =>
      createNotificationRecord({
        userId: validated.targetUserId,
        messId: validated.messId,
        type: "deposit_approved",
        title: `Deposit approved: ${validated.amount} BDT`,
        message: `${
          session.user.name ?? "Manager"
        } recorded a deposit of ${validated.amount} BDT for ${validated.date}.`,
        metadata: {
          depositId: result.insertedId.toString(),
          amount: validated.amount,
          method: validated.method,
          date: validated.date,
          targetPath:
            validated.targetUserId.toString() === actorId.toString()
              ? "/dashboard/manager/deposits"
              : "/dashboard/user/deposits",
        },
        sendPush: true,
      }),
    );

    return {
      success: true,
      message: "Deposit added successfully",
      depositId: result.insertedId.toString(),
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to add deposit",
    };
  }
}

export async function requestDeposit(
  payload: AddDepositPayload,
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const actorId = new ObjectId(session.user.id);
    const validated = await validatePayload(payload, actorId);

    if (validated.membership.role === "manager") {
      return {
        success: false,
        message: "Managers should add deposits directly",
      };
    }

    if (validated.targetUserId.toString() !== actorId.toString()) {
      return {
        success: false,
        message: "You are not authorized to perform this action",
      };
    }

    const requestDoc: DepositRequestDocument = {
      messId: validated.messId,
      userId: validated.targetUserId,
      requestedBy: actorId,
      amount: validated.amount,
      method: validated.method,
      note: validated.note,
      date: validated.date,
      status: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await ensureNoDuplicateRequest(requestDoc);

    const requests = dbConnect(collections.DEPOSIT_REQUESTS);
    const result = await requests.insertOne(requestDoc);
    revalidateDepositPaths();

    await runNotificationSafely(async () => {
      const managerIds = await getMessRecipientUserIds(validated.messId, {
        includeManagers: true,
        includeMembers: false,
      });

      if (!managerIds.length) {
        return;
      }

      await createNotificationsForUsers({
        userIds: managerIds,
        messId: validated.messId,
        type: "deposit_requested",
        title: `Deposit request: ${validated.amount} BDT`,
        message: `${
          session.user.name ?? "A member"
        } requested a deposit approval for ${validated.amount} BDT on ${
          validated.date
        }.`,
        metadata: {
          requestId: result.insertedId.toString(),
          requestedBy: actorId.toString(),
          requestedByName: session.user.name ?? "Member",
          amount: validated.amount,
          method: validated.method,
          date: validated.date,
          targetPath: "/dashboard/manager/deposits",
        },
        sendPush: true,
      });
    });

    return {
      success: true,
      message: "Deposit request sent to manager",
      requestId: result.insertedId.toString(),
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to request deposit",
    };
  }
}

export async function getDepositRequests(): Promise<
  { success: true; requests: DepositRequestSerialized[] } | { success: false; message: string }
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const actorId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(actorId);
    const requests = dbConnect(collections.DEPOSIT_REQUESTS);

    const query =
      membership.role === "manager"
        ? { messId: membership.messId }
        : { messId: membership.messId, requestedBy: actorId };

    const items = await requests
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: collections.USERS,
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return {
      success: true,
      requests: (items as (DepositRequestMongo & { user?: { name?: string; email?: string } })[]).map(
        (item) => ({
          ...serializeDepositRequest(item),
          userName: item.user?.name ?? "Unknown",
          userEmail: item.user?.email ?? "Unknown",
        }),
      ),
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

export async function getDepositRequestsForManager(): Promise<
  { success: true; requests: DepositRequestSerialized[] } | { success: false; message: string }
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const actorId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(actorId);

    if (membership.role !== "manager") {
      return {
        success: false,
        message: "You are not authorized to perform this action",
      };
    }

    const requests = dbConnect(collections.DEPOSIT_REQUESTS);
    const items = await requests
      .aggregate([
        { $match: { messId: membership.messId } },
        {
          $lookup: {
            from: collections.USERS,
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: { path: "$user", preserveNullAndEmptyArrays: true } },
        { $sort: { createdAt: -1 } },
      ])
      .toArray();

    return {
      success: true,
      requests: (items as (DepositRequestMongo & { user?: { name?: string; email?: string } })[]).map(
        (item) => ({
          ...serializeDepositRequest(item),
          userName: item.user?.name ?? "Unknown",
          userEmail: item.user?.email ?? "Unknown",
        }),
      ),
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

async function reviewDepositRequest(
  requestId: string,
  decision: "approved" | "rejected",
  note?: string,
): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const actorId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(actorId);
    if (membership.role !== "manager") {
      return {
        success: false,
        message: "You are not authorized to perform this action",
      };
    }

    const requestObjectId = parseObjectId(requestId);
    if (!requestObjectId) {
      return { success: false, message: "Invalid deposit request ID" };
    }

    const requests = dbConnect(collections.DEPOSIT_REQUESTS);
    const existing = (await requests.findOne({
      _id: requestObjectId,
      messId: membership.messId,
    })) as DepositRequestMongo | null;

    if (!existing) {
      return { success: false, message: "Deposit request not found" };
    }

    if (existing.status !== "pending") {
      return {
        success: false,
        message: `Deposit request is already ${existing.status}`,
      };
    }

    const reviewedAt = new Date();

    if (decision === "approved") {
      const depositDoc: DepositDocument = {
        messId: existing.messId,
        userId: existing.userId,
        addedBy: actorId,
        amount: existing.amount,
        method: existing.method,
        note: existing.note ?? null,
        date: existing.date,
        createdAt: reviewedAt,
      };

      await ensureNoDuplicateDeposit(depositDoc);
      await dbConnect(collections.DEPOSITS).insertOne(depositDoc);
    }

    await requests.updateOne(
      { _id: requestObjectId, messId: membership.messId, status: "pending" },
      {
        $set: {
          status: decision,
          approvedBy: actorId,
          approvedAt: reviewedAt,
          approvalNote: note?.trim() || undefined,
          updatedAt: reviewedAt,
        },
      },
    );

    revalidateDepositPaths();

    await runNotificationSafely(() =>
      createNotificationRecord({
        userId: existing.requestedBy,
        messId: existing.messId,
        type: decision === "approved" ? "deposit_approved" : "deposit_rejected",
        title: `${
          decision === "approved" ? "Deposit approved" : "Deposit rejected"
        }: ${existing.amount} BDT`,
        message:
          decision === "approved"
            ? `${
                session.user.name ?? "Manager"
              } approved your deposit request for ${existing.amount} BDT.`
            : `${
                session.user.name ?? "Manager"
              } rejected your deposit request for ${existing.amount} BDT${
                note?.trim() ? `: ${note.trim()}` : "."
              }`,
        metadata: {
          requestId,
          amount: existing.amount,
          method: existing.method,
          date: existing.date,
          approvalNote: note?.trim() ?? null,
          targetPath: "/dashboard/user/deposits",
        },
        sendPush: true,
      }),
    );

    return {
      success: true,
      message:
        decision === "approved"
          ? "Deposit request approved successfully"
          : "Deposit request rejected successfully",
      requestId,
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "Failed to review deposit request",
    };
  }
}

export async function approveDepositRequest(requestId: string) {
  return reviewDepositRequest(requestId, "approved");
}

export async function rejectDepositRequest(requestId: string, note?: string) {
  return reviewDepositRequest(requestId, "rejected", note);
}

export async function getUsersCostSummary(
  range?: DateRange,
): Promise<
  | {
      success: true;
      data: UserLedger[];
      dateRange: { from: Date; to: Date };
      role: DepositPageRole;
    }
  | { success: false; message: string; data: UserLedger[] }
> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(userId);
    const messId = membership.messId;

    const start =
      range?.from ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end =
      range?.to ??
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59,
      );

    const startDateStr = toDateKey(start);
    const endDateStr = toDateKey(end);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);

    const pipeline = [
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
      { $unwind: "$user" },
      {
        $lookup: {
          from: collections.EXPENSES,
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$paidBy", "$$uid"] },
                    { $eq: ["$messId", messId] },
                    { $eq: ["$status", "approved"] },
                    { $gte: ["$expenseDate", startDateStr] },
                    { $lte: ["$expenseDate", endDateStr] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalCost: { $sum: "$amount" },
              },
            },
          ],
          as: "expenseCost",
        },
      },
      {
        $lookup: {
          from: collections.DEPOSITS,
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },
                    { $eq: ["$messId", messId] },
                    { $gte: ["$date", startDateStr] },
                    { $lte: ["$date", endDateStr] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalDeposit: { $sum: "$amount" },
              },
            },
          ],
          as: "deposit",
        },
      },
      {
        $lookup: {
          from: collections.DEPOSIT_REQUESTS,
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },
                    { $eq: ["$messId", messId] },
                    { $eq: ["$status", "pending"] },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                pendingRequestCount: { $sum: 1 },
                pendingRequestAmount: { $sum: "$amount" },
              },
            },
          ],
          as: "pendingRequests",
        },
      },
      {
        $addFields: {
          totalCost: {
            $ifNull: [{ $arrayElemAt: ["$expenseCost.totalCost", 0] }, 0],
          },
          totalDeposit: {
            $ifNull: [{ $arrayElemAt: ["$deposit.totalDeposit", 0] }, 0],
          },
          pendingRequestCount: {
            $ifNull: [{ $arrayElemAt: ["$pendingRequests.pendingRequestCount", 0] }, 0],
          },
          pendingRequestAmount: {
            $ifNull: [{ $arrayElemAt: ["$pendingRequests.pendingRequestAmount", 0] }, 0],
          },
        },
      },
      {
        $project: {
          _id: 0,
          userId: { $toString: "$user._id" },
          name: "$user.name",
          email: "$user.email",
          role: "$role",
          totalCost: 1,
          totalDeposit: 1,
          pendingRequestCount: 1,
          pendingRequestAmount: 1,
          balance: {
            $subtract: ["$totalDeposit", "$totalCost"],
          },
        },
      },
      { $sort: { name: 1 } },
    ];

    const result = (await memberCollection.aggregate(pipeline).toArray()) as UserLedger[];

    return {
      success: true,
      data: result,
      dateRange: { from: start, to: end },
      role: membership.role === "manager" ? "manager" : "user",
    };
  } catch (error) {
    console.error("Deposit summary error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch cost summary",
      data: [],
    };
  }
}
