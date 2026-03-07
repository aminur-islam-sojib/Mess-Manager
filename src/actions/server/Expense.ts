"use server";

import { getServerSession } from "next-auth";
import { InsertOneResult, ObjectId } from "mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";

import type {
  AddExpensePayload,
  AddExpenseResponse,
  ExpenseCategory,
  ExpenseDocument,
  ExpenseDocumentSerialized,
  ExpensePaymentSource,
  ExpenseStatus,
  GetExpensesSerializedResponse,
  TodaysExpenseSummaryResponse,
  VerifyExpenseDecision,
  VerifyExpenseResponse,
} from "@/types/ExpenseType";

type ActiveMembership = {
  _id: ObjectId;
  messId: ObjectId;
  userId: ObjectId;
  role: "manager" | "member";
  status: "active" | string;
};

type MongoExpenseDocument = ExpenseDocument & { _id: ObjectId };

const EXPENSE_CATEGORIES = new Set<ExpenseCategory>([
  "grocery",
  "utility",
  "rent",
  "others",
]);

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const parseObjectId = (value: string | undefined | null): ObjectId | null => {
  if (!value) return null;
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const normalizePaymentSource = (
  value: AddExpensePayload["paymentSource"],
): ExpensePaymentSource => (value === "mess_pool" ? "mess_pool" : "individual");

const normalizeExpenseDateString = (dateValue: string): string | null => {
  const trimmed = dateValue.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return null;
  }

  const parsed = new Date(`${trimmed}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return trimmed;
};

const serializeExpense = (
  expense: MongoExpenseDocument,
): ExpenseDocumentSerialized => ({
  id: expense._id.toString(),
  messId: expense.messId.toString(),
  title: expense.title,
  description: expense.description,
  amount: expense.amount,
  category: expense.category,
  expenseDate: expense.expenseDate,
  status: expense.status,
  paymentSource:
    expense.paymentSource === "mess_pool" ? "mess_pool" : "individual",
  paidBy: expense.paidBy.toString(),
  addedBy: expense.addedBy.toString(),
  createdAt: expense.createdAt.toISOString(),
  updatedAt: expense.updatedAt.toISOString(),
  verifiedBy: expense.verifiedBy?.toString(),
  verifiedAt: expense.verifiedAt?.toISOString(),
  approvalNote: expense.approvalNote,
});

async function resolveActiveMess(userId: ObjectId): Promise<ActiveMembership> {
  const memberCollection = dbConnect(collections.MESS_MEMBERS);

  const membership = await memberCollection.findOne({
    userId,
    status: "active",
  });

  if (!membership) {
    throw new Error("User is not part of any active mess");
  }

  return membership as ActiveMembership;
}

async function getMessExpenseAccessRule(messId: ObjectId) {
  const mess = await dbConnect(collections.MESS).findOne({ _id: messId });
  return mess?.settings?.expenseRules?.whoCanAddExpenses === "membersAllowed"
    ? "membersAllowed"
    : "managerOnly";
}

const resolveInitialStatus = (
  paymentSource: ExpensePaymentSource,
  role: ActiveMembership["role"],
): ExpenseStatus => {
  if (paymentSource === "mess_pool") return "approved";
  if (role === "manager") return "approved";
  return "pending";
};

async function resolvePaidByTargets(
  payload: AddExpensePayload,
  membership: ActiveMembership,
  userId: ObjectId,
): Promise<
  { success: true; userIds: ObjectId[] } | { success: false; message: string }
> {
  const messMembers = dbConnect(collections.MESS_MEMBERS);
  const isManager = membership.role === "manager";

  if (!isManager) {
    if (payload.assignToAllMembers || (payload.paidByIds?.length ?? 0) > 0) {
      return {
        success: false,
        message: "Only manager can submit expenses for multiple members",
      };
    }

    if (payload.paidBy) {
      const paidById = parseObjectId(payload.paidBy);
      if (!paidById) {
        return { success: false, message: "Invalid paid-by user ID" };
      }

      if (paidById.toString() !== userId.toString()) {
        return {
          success: false,
          message: "Members can only submit expenses for themselves",
        };
      }
    }

    return { success: true, userIds: [userId] };
  }

  if (payload.assignToAllMembers) {
    const allActiveMembers = await messMembers
      .find({
        messId: membership.messId,
        status: "active",
      })
      .toArray();

    if (!allActiveMembers.length) {
      return {
        success: false,
        message: "No active members found in this mess",
      };
    }

    return { success: true, userIds: allActiveMembers.map((m) => m.userId) };
  }

  const rawTargets = [
    ...(payload.paidByIds ?? []),
    ...(payload.paidBy ? [payload.paidBy] : []),
  ]
    .map((value) => value.trim())
    .filter(Boolean);
  const uniqueTargets = Array.from(new Set(rawTargets));

  if (!uniqueTargets.length) {
    return { success: true, userIds: [userId] };
  }

  const requestedIds: ObjectId[] = [];
  for (const target of uniqueTargets) {
    const objectId = parseObjectId(target);
    if (!objectId) {
      return {
        success: false,
        message: "One or more selected members are invalid",
      };
    }
    requestedIds.push(objectId);
  }

  const validMembers = await messMembers
    .find({
      userId: { $in: requestedIds },
      messId: membership.messId,
      status: "active",
    })
    .toArray();

  if (validMembers.length !== requestedIds.length) {
    return {
      success: false,
      message: "One or more selected members are not part of this mess",
    };
  }

  return { success: true, userIds: requestedIds };
}

export async function addExpense(
  payload: AddExpensePayload,
): Promise<AddExpenseResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    if (!payload.title?.trim()) {
      return { success: false, message: "Expense title is required" };
    }

    if (!payload.amount || payload.amount <= 0) {
      return {
        success: false,
        message: "Expense amount must be greater than 0",
      };
    }

    if (!payload.expenseDate) {
      return { success: false, message: "Expense date is required" };
    }

    if (!payload.paymentSource) {
      return { success: false, message: "Payment source is required" };
    }

    if (!EXPENSE_CATEGORIES.has(payload.category)) {
      return { success: false, message: "Invalid expense category" };
    }

    const paymentSource = normalizePaymentSource(payload.paymentSource);
    const expenseDateStr = normalizeExpenseDateString(payload.expenseDate);
    if (!expenseDateStr) {
      return {
        success: false,
        message: "Invalid expense date format (YYYY-MM-DD)",
      };
    }

    const membership = await resolveActiveMess(userId);

    if (membership.role !== "manager") {
      const expenseAccessRule = await getMessExpenseAccessRule(membership.messId);
      if (expenseAccessRule === "managerOnly") {
        return {
          success: false,
          message: "Only manager can add expenses for this mess",
        };
      }
    }

    if (paymentSource === "mess_pool" && membership.role !== "manager") {
      return {
        success: false,
        message: "Only manager can use mess pool payment source",
      };
    }

    const targetResult = await resolvePaidByTargets(
      payload,
      membership,
      userId,
    );
    if (!targetResult.success) {
      return { success: false, message: targetResult.message };
    }

    if (!targetResult.userIds.length) {
      return { success: false, message: "Please select at least one member" };
    }

    const status = resolveInitialStatus(paymentSource, membership.role);
    const now = new Date();
    const autoVerified = status === "approved";

    const expenseDocs: ExpenseDocument[] = targetResult.userIds.map(
      (paidByUserId) => ({
        messId: membership.messId,
        title: payload.title.trim(),
        description: payload.description?.trim() ?? "",
        amount: payload.amount,
        category: payload.category,
        expenseDate: expenseDateStr,
        paymentSource,
        paidBy: paidByUserId,
        addedBy: userId,
        status,
        verifiedBy: autoVerified ? userId : undefined,
        verifiedAt: autoVerified ? now : undefined,
        approvalNote: autoVerified
          ? paymentSource === "mess_pool"
            ? "Auto-approved as manager mess-pool expense"
            : "Auto-approved by manager"
          : undefined,
        createdAt: now,
        updatedAt: now,
      }),
    );

    const expenses = dbConnect(collections.EXPENSES);

    let insertedIds: ObjectId[] = [];
    if (expenseDocs.length === 1) {
      const result: InsertOneResult<ExpenseDocument> = await expenses.insertOne(
        expenseDocs[0],
      );
      insertedIds = [result.insertedId];
    } else {
      const result = await expenses.insertMany(expenseDocs);
      insertedIds = Object.values(result.insertedIds);
    }

    const serializedExpenses = expenseDocs.map((doc, index) =>
      serializeExpense({ ...doc, _id: insertedIds[index] }),
    );

    return {
      success: true,
      expenseId: insertedIds[0].toString(),
      status,
      paymentSource,
      createdCount: expenseDocs.length,
      requiresManagerVerification: status === "pending",
      expenses: serializedExpenses,
    };
  } catch (error) {
    console.error("Add expense error:", error);
    return { success: false, message: "Failed to add expense" };
  }
}

export async function getAllExpenses(
  fromDate?: Date,
  toDate?: Date,
): Promise<GetExpensesSerializedResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(userId);
    const { messId, role } = membership;

    const expensesCollection = dbConnect(collections.EXPENSES);

    const hasDateFilter = Boolean(fromDate || toDate);
    let startDate: Date | undefined;
    let toDateInclusive: Date | undefined;

    if (hasDateFilter) {
      if (fromDate && toDate) {
        startDate = new Date(fromDate);
        toDateInclusive = new Date(toDate);
      } else if (fromDate) {
        startDate = new Date(fromDate);
        toDateInclusive = new Date(fromDate);
      } else if (toDate) {
        startDate = new Date(toDate);
        toDateInclusive = new Date(toDate);
      }
    }

    const baseQuery =
      role === "manager"
        ? { messId }
        : {
            messId,
            $or: [
              { status: { $in: ["approved", "pending"] } },
              { addedBy: userId },
            ],
          };

    const query =
      startDate && toDateInclusive
        ? {
            ...baseQuery,
            expenseDate: {
              $gte: toDateKey(startDate),
              $lt: toDateKey(addDays(toDateInclusive, 1)),
            },
          }
        : baseQuery;

    const expenses = (await expensesCollection
      .find(query)
      .sort({ expenseDate: -1, createdAt: -1 })
      .toArray()) as MongoExpenseDocument[];

    const from = expenses.length
      ? expenses[expenses.length - 1].expenseDate
      : toDateKey(new Date());
    const to = expenses.length
      ? expenses[0].expenseDate
      : toDateKey(new Date());

    return {
      success: true,
      from,
      to,
      expenses: expenses.map(serializeExpense),
    };
  } catch (error) {
    console.error("Get expenses error:", error);
    return { success: false, message: "Failed to fetch expenses" };
  }
}

export async function getMonthlyExpensesSummary(year?: number, month?: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const { messId } = await resolveActiveMess(userId);

    const expenseCollection = dbConnect(collections.EXPENSES);

    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 1);

    const expenseResult = await expenseCollection
      .aggregate([
        {
          $addFields: {
            expenseDateObj: { $toDate: "$expenseDate" },
          },
        },
        {
          $match: {
            messId,
            status: "approved",
            expenseDateObj: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            categories: {
              $push: {
                category: "$_id",
                totalAmount: "$totalAmount",
                count: "$count",
              },
            },
          },
        },
      ])
      .toArray();

    const categories = expenseResult[0]?.categories ?? [];

    /**
     * Reuse CPM logic
     */
    const cpmResult = await getCurrentMonthCostPerMeal();

    if (!cpmResult.success || !cpmResult.data) {
      return { success: false, message: "Failed to calculate CPM" };
    }

    const { totalMeals, totalExpenses, costPerMeal } = cpmResult.data;

    return {
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      totalCost: totalExpenses,
      totalMeals,
      costPerMeal,
      categories,
    };
  } catch (error) {
    console.error("Monthly summary error:", error);
    return { success: false, message: "Failed to fetch monthly summary" };
  }
}

export async function getCurrentMonthCostPerMeal() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const { messId } = await resolveActiveMess(userId);

    const mealCollection = dbConnect(collections.MEAL_ENTRIES);
    const expenseCollection = dbConnect(collections.EXPENSES);

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    );

    const startDateKey = toDateKey(startOfCurrentMonth);
    const endDateKey = toDateKey(endOfCurrentMonth);

    const [mealAgg, expenseAgg] = await Promise.all([
      mealCollection
        .aggregate<{ totalMeals: number }>([
          {
            $match: {
              messId,
              date: {
                $gte: startDateKey,
                $lte: endDateKey,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalMeals: { $sum: "$meals" },
            },
          },
          { $project: { _id: 0, totalMeals: 1 } },
        ])
        .toArray(),
      expenseCollection
        .aggregate<{ totalExpenses: number }>([
          {
            $match: {
              messId,
              status: "approved",
              expenseDate: {
                $gte: startDateKey,
                $lte: endDateKey,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalExpenses: { $sum: "$amount" },
            },
          },
          { $project: { _id: 0, totalExpenses: 1 } },
        ])
        .toArray(),
    ]);

    const totalMeals = mealAgg[0]?.totalMeals ?? 0;
    const totalExpenses = expenseAgg[0]?.totalExpenses ?? 0;
    const costPerMeal =
      totalMeals > 0 ? Number((totalExpenses / totalMeals).toFixed(2)) : 0;

    return {
      success: true,
      data: {
        totalMeals,
        totalExpenses,
        costPerMeal,
      },
    };
  } catch (error) {
    console.error("Current month CPM error:", error);
    return { success: false, message: "Failed to fetch current month CPM" };
  }
}

export const verifyExpense = async (
  expenseId: string,
  decision: VerifyExpenseDecision,
  note?: string,
): Promise<VerifyExpenseResponse> => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const managerUserId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(managerUserId);

    if (membership.role !== "manager") {
      return { success: false, message: "Only manager can verify expenses" };
    }

    const expenseObjectId = parseObjectId(expenseId);
    if (!expenseObjectId) {
      return { success: false, message: "Invalid expense ID" };
    }

    const expenseCollection = dbConnect(collections.EXPENSES);
    const existing = (await expenseCollection.findOne({
      _id: expenseObjectId,
      messId: membership.messId,
    })) as MongoExpenseDocument | null;

    if (!existing) {
      return { success: false, message: "Expense not found" };
    }

    if (existing.paymentSource === "mess_pool") {
      return {
        success: false,
        message:
          "Mess-pool expenses are auto-approved and cannot be re-verified",
      };
    }

    if (existing.status !== "pending") {
      return {
        success: false,
        message: `Expense is already ${existing.status}`,
      };
    }

    const verifiedAt = new Date();
    await expenseCollection.updateOne(
      { _id: expenseObjectId, messId: membership.messId, status: "pending" },
      {
        $set: {
          status: decision,
          verifiedBy: managerUserId,
          verifiedAt,
          approvalNote: note?.trim() || undefined,
          updatedAt: verifiedAt,
        },
      },
    );

    const updatedExpense = (await expenseCollection.findOne({
      _id: expenseObjectId,
      messId: membership.messId,
    })) as MongoExpenseDocument | null;

    if (!updatedExpense) {
      return { success: false, message: "Expense update failed" };
    }

    return {
      success: true,
      expense: serializeExpense(updatedExpense),
    };
  } catch (error) {
    console.error("Verify expense error:", error);
    return { success: false, message: "Expense verification failed" };
  }
};

export const approveExpense = async (
  expenseId: string,
): Promise<VerifyExpenseResponse> => verifyExpense(expenseId, "approved");

export const rejectExpense = async (expenseId: string, note?: string) =>
  verifyExpense(expenseId, "rejected", note);

export async function getPendingIndividualExpenses() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(userId);

    if (membership.role !== "manager") {
      return {
        success: false,
        message: "Only manager can view pending expenses",
      };
    }

    const expenseCollection = dbConnect(collections.EXPENSES);

    const expenses = (await expenseCollection
      .find({
        messId: membership.messId,
        paymentSource: "individual",
        status: "pending",
      })
      .sort({ expenseDate: -1, createdAt: -1 })
      .toArray()) as MongoExpenseDocument[];

    return {
      success: true,
      total: expenses.length,
      expenses: expenses.map(serializeExpense),
    };
  } catch (error) {
    console.error("Get pending individual expenses error:", error);
    return { success: false, message: "Failed to fetch pending expenses" };
  }
}

export async function getTodaysExpenseSummary(): Promise<TodaysExpenseSummaryResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const { messId, role } = await resolveActiveMess(userId);
    const expensesCollection = dbConnect(collections.EXPENSES);

    const today = new Date();
    const todayStr = toDateKey(today);
    const tomorrowStr = toDateKey(addDays(today, 1));

    const baseMatch =
      role === "manager"
        ? { messId }
        : {
            messId,
            $or: [
              { status: { $in: ["approved", "pending"] } },
              { addedBy: userId },
            ],
          };

    const result = await expensesCollection
      .aggregate([
        {
          $match: {
            ...baseMatch,
            expenseDate: {
              $gte: todayStr,
              $lt: tomorrowStr,
            },
          },
        },
        {
          $facet: {
            summary: [
              {
                $group: {
                  _id: null,
                  totalAmount: { $sum: "$amount" },
                  totalCount: { $sum: 1 },
                },
              },
            ],
            byCategory: [
              {
                $group: {
                  _id: "$category",
                  amount: { $sum: "$amount" },
                },
              },
              {
                $project: {
                  _id: 0,
                  category: "$_id",
                  amount: 1,
                },
              },
            ],
          },
        },
      ])
      .toArray();

    const summary = result[0]?.summary[0] ?? {
      totalAmount: 0,
      totalCount: 0,
    };

    return {
      success: true,
      data: {
        messId: messId.toString(),
        date: todayStr,
        totalAmount: summary.totalAmount,
        totalCount: summary.totalCount,
        byCategory: result[0]?.byCategory ?? [],
      },
    };
  } catch (error) {
    console.error("Today's expense summary error:", error);
    return {
      success: false,
      message: "Failed to fetch today's expense summary",
    };
  }
}

export async function getMonthlyTotalExpenses(year?: number, month?: number) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const { messId } = await resolveActiveMess(userId);

    const expenseCollection = dbConnect(collections.EXPENSES);

    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 1);

    const result = await expenseCollection
      .aggregate([
        {
          $addFields: {
            expenseDateObj: { $toDate: "$expenseDate" },
          },
        },
        {
          $match: {
            messId,
            status: "approved",
            expenseDateObj: {
              $gte: startDate,
              $lt: endDate,
            },
          },
        },
        {
          $group: {
            _id: "$category",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        {
          $group: {
            _id: null,
            totalCost: { $sum: "$totalAmount" },
            categories: {
              $push: {
                category: "$_id",
                totalAmount: "$totalAmount",
                count: "$count",
              },
            },
          },
        },
      ])
      .toArray();

    return {
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      totalCost: result[0]?.totalCost ?? 0,
    };
  } catch (error) {
    console.error("Monthly summary error:", error);
    return { success: false, message: "Failed to fetch monthly summary" };
  }
}
