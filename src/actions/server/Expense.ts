/* eslint-disable @typescript-eslint/no-unused-vars */
"use server";

import { getServerSession } from "next-auth";
import { ObjectId, InsertOneResult } from "mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";

import type {
  AddExpensePayload,
  AddExpenseResponse,
  ExpenseDocument,
  GetExpensesSerializedResponse,
  TodaysExpenseSummaryResponse,
} from "@/types/ExpenseType";

/* ===========================
   ADD EXPENSE
=========================== */

export async function addExpense(
  payload: AddExpensePayload,
): Promise<AddExpenseResponse> {
  try {
    console.log(payload);
    /* ---------- AUTH ---------- */
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    /* ---------- VALIDATION ---------- */
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
      console.error("Payment source is missing:", { payload });
      return { success: false, message: "Please add the payment source" };
    }

    if (!["personal", "mess_pool"].includes(payload.paymentSource)) {
      return {
        success: false,
        message: "Invalid payment source. Choose 'personal' or 'mess_pool'",
      };
    }

    const expenseDate = new Date(payload.expenseDate);
    expenseDate.setHours(0, 0, 0, 0);
    const expenseDateStr = expenseDate.toISOString().split("T")[0];

    /* ---------- RESOLVE USER'S MESS ---------- */
    const messMembers = dbConnect(collections.MESS_MEMBERS);

    const member = await messMembers.findOne({ userId });

    if (!member) {
      return { success: false, message: "User is not part of any mess" };
    }

    /* ---------- PAYMENT SOURCE RULE ---------- */
    if (payload.paymentSource === "mess_pool" && member.role !== "manager") {
      return {
        success: false,
        message: "Only manager can use mess pool balance",
      };
    }

    /* ---------- PAID BY LOGIC ---------- */
    let paidByUserId = userId;

    if (member.role === "manager" && payload.paidBy) {
      const candidate = new ObjectId(payload.paidBy);

      const validMember = await messMembers.findOne({
        userId: candidate,
        messId: member.messId,
      });

      if (!validMember) {
        return {
          success: false,
          message: "Paid-by user is not part of this mess",
        };
      }

      paidByUserId = candidate;
    }

    /* ---------- EXPENSE DOCUMENT ---------- */
    const expenseDoc: ExpenseDocument = {
      messId: member.messId,

      title: payload.title.trim(),
      description: payload.description?.trim() ?? "",

      amount: payload.amount,
      category: payload.category ?? "general",

      expenseDate: expenseDateStr,
      paymentSource: payload.paymentSource,

      paidBy: paidByUserId,
      addedBy: userId,

      status: member.role === "manager" ? "approved" : "pending",

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /* ---------- INSERT ---------- */
    const expenses = dbConnect(collections.EXPENSES);

    const result: InsertOneResult<ExpenseDocument> =
      await expenses.insertOne(expenseDoc);

    return {
      success: true,
      expenseId: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("Add expense error:", error);
    return { success: false, message: "Failed to add expense" };
  }
}

async function resolveActiveMess(userId: ObjectId) {
  const memberCollection = dbConnect(collections.MESS_MEMBERS);

  const membership = await memberCollection.findOne({
    userId,
    status: "active",
  });

  if (!membership) {
    throw new Error("User is not part of any active mess");
  }

  return membership; // contains messId + role
}

/* ===========================
   GET ALL EXPENSES (MESS BASED)
=========================== */
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

    // 🔐 Resolve mess + role
    const membership = await resolveActiveMess(userId);
    const { messId, role } = membership;

    const expensesCollection = dbConnect(collections.EXPENSES);

    // 📅 DEFAULT → CURRENT MONTH (UTC)
    let startDate: Date;
    let endDate: Date;

    if (fromDate && toDate) {
      // 🔹 Custom date range
      startDate = new Date(fromDate);
      endDate = new Date(toDate);
    } else {
      // 🔹 Current month
      const now = new Date();
      startDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0),
      );
      endDate = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0),
      );
    }

    // 👤 Role-based visibility
    const baseQuery =
      role === "manager"
        ? { messId }
        : {
            messId,
            $or: [{ status: "approved" }, { addedBy: userId }],
          };

    // 🔥 Convert dates to YYYY-MM-DD string format for comparison
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    // 🔥 FINAL QUERY - Compare string to string since expenseDate is stored as "YYYY-MM-DD"
    const query = {
      ...baseQuery,
      expenseDate: {
        $gte: startDateStr,
        $lt: endDateStr,
      },
    };

    const expenses = await expensesCollection
      .find(query)
      .sort({ expenseDate: -1 })
      .toArray();

    const serializedExpenses = expenses.map((expense) => ({
      id: expense._id.toString(),
      messId: expense.messId.toString(),
      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate,
      status: expense.status,
      paymentSource: expense.paymentSource,
      paidBy: expense.paidBy.toString(),
      addedBy: expense.addedBy.toString(),
      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    }));

    return {
      success: true,
      from: startDate.toISOString(),
      to: endDate.toISOString(),
      expenses: serializedExpenses,
    };
  } catch (error) {
    console.error("Get expenses error:", error);
    return { success: false, message: "Failed to fetch expenses" };
  }
}

async function getMonthlyTotalMeals(
  messId: ObjectId,
  startDate: Date,
  endDate: Date,
) {
  const mealCollection = dbConnect(collections.MEAL_ENTRIES);

  const result = await mealCollection
    .aggregate([
      {
        $addFields: {
          mealDateObj: { $toDate: "$date" },
        },
      },
      {
        $match: {
          messId,
          mealDateObj: {
            $gte: startDate,
            $lt: endDate,
          },
        },
      },
      {
        $group: {
          _id: null,
          totalMeals: { $sum: "$meals" }, // ✅ THIS IS THE FIX
        },
      },
    ])
    .toArray();

  return result[0]?.totalMeals ?? 0;
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

    // 💰 EXPENSE SUMMARY
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

    const totalCost = expenseResult[0]?.totalCost ?? 0;
    const categories = expenseResult[0]?.categories ?? [];

    // 🍽️ TOTAL MEALS (REAL DATA)
    const totalMeals = await getMonthlyTotalMeals(messId, startDate, endDate);

    // 🧮 COST PER MEAL
    const costPerMeal =
      totalMeals > 0 ? Number((totalCost / totalMeals).toFixed(2)) : 0;

    return {
      success: true,
      month: targetMonth + 1,
      year: targetYear,
      totalCost,
      totalMeals,
      costPerMeal,
      categories,
    };
  } catch (error) {
    console.error("Monthly summary error:", error);
    return { success: false, message: "Failed to fetch monthly summary" };
  }
}

export const approveExpense = async (expenseId: string) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const membership = await resolveActiveMess(userId);

    if (membership.role !== "manager") {
      return { success: false, message: "Only manager can approve expenses" };
    }

    const expenseCollection = dbConnect(collections.EXPENSES);

    const result = await expenseCollection.updateOne(
      {
        _id: new ObjectId(expenseId),
        messId: membership.messId, // 🔥 CRITICAL
        status: "pending",
      },
      {
        $set: {
          status: "approved",
          updatedAt: new Date(),
        },
      },
    );

    if (!result.matchedCount) {
      return { success: false, message: "Expense not found" };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: "Approval failed" };
  }
};

export async function getTodaysExpenseSummary(): Promise<TodaysExpenseSummaryResponse> {
  try {
    // 🔐 Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    // 🏠 Resolve mess & role
    const { messId, role } = await resolveActiveMess(userId);

    const expensesCollection = dbConnect(collections.EXPENSES);

    // 📅 Today range (convert to YYYY-MM-DD string format)
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0]; // "2026-01-26"
    const tomorrowStr = new Date(today.getTime() + 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0]; // "2026-01-27"

    console.log("🔍 getTodaysExpenseSummary Debug:", {
      userId: userId.toString(),
      messId: messId.toString(),
      role,
      todayStr,
      tomorrowStr,
    });

    // 👤 Role-based visibility
    const baseMatch =
      role === "manager"
        ? { messId }
        : {
            messId,
            $or: [{ status: "approved" }, { addedBy: userId }],
          };

    // 🔥 Debug: Check if there are ANY expenses for this mess
    const allExpensesCount = await expensesCollection.countDocuments({
      messId,
    });
    console.log(`📊 Total expenses for this mess: ${allExpensesCount}`);

    // 🔥 Debug: Check sample expenses
    const sampleExpenses = await expensesCollection
      .find({ messId })
      .limit(5)
      .toArray();
    console.log("📊 Sample expenses:", JSON.stringify(sampleExpenses, null, 2));

    // 🔥 Debug: Check if there are expenses for today
    const todayExpensesCount = await expensesCollection.countDocuments({
      messId,
      expenseDate: {
        $gte: todayStr,
        $lt: tomorrowStr,
      },
    });
    console.log(`📊 Today's expenses: ${todayExpensesCount}`);

    // 🔥 Debug: Check sample today expenses
    const sampleTodayExpenses = await expensesCollection
      .find({
        messId,
        expenseDate: {
          $gte: todayStr,
          $lt: tomorrowStr,
        },
      })
      .limit(5)
      .toArray();
    console.log(
      "📊 Sample today expenses:",
      JSON.stringify(sampleTodayExpenses, null, 2),
    );

    // 🔥 Aggregation
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

    console.log("📊 Aggregation result:", result);

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

export async function getMonthlyTotalExpenses(
  year?: number,
  month?: number, // 0 = Jan
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const { messId } = await resolveActiveMess(userId);

    const expenseCollection = dbConnect(collections.EXPENSES);

    // 📅 Default → current month
    const now = new Date();
    const targetYear = year ?? now.getFullYear();
    const targetMonth = month ?? now.getMonth();

    const startDate = new Date(targetYear, targetMonth, 1);
    const endDate = new Date(targetYear, targetMonth + 1, 1);

    const result = await expenseCollection
      .aggregate([
        // 🔥 Convert string → Date
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
