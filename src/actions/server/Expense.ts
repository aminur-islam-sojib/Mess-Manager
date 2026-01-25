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
} from "@/types/ExpenseType";

/* ===========================
   ADD EXPENSE
=========================== */
export async function addExpense(
  payload: AddExpensePayload,
): Promise<AddExpenseResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    // Basic validation
    if (!payload.title.trim() || payload.amount <= 0) {
      return { success: false, message: "Invalid expense data" };
    }

    /* 1️⃣ Resolve user's mess */
    const messMemberCollection = dbConnect(collections.MESS_MEMBERS);

    const messMember = await messMemberCollection.findOne({
      userId,
    });

    if (!messMember) {
      return { success: false, message: "User is not part of any mess" };
    }

    /* 2️⃣ Validate paidBy user belongs to same mess (manager only) */
    let paidByUserId: ObjectId;

    if (messMember.role === "manager") {
      paidByUserId = new ObjectId(payload.paidBy ?? userId.toString());

      const paidByMember = await messMemberCollection.findOne({
        userId: paidByUserId,
        messId: messMember.messId,
      });

      if (!paidByMember) {
        return {
          success: false,
          message: "Paid by user is not part of this mess",
        };
      }
    } else {
      // 👤 Normal user → paidBy is always himself
      paidByUserId = userId;
    }

    /* 3️⃣ Build expense document */
    const expenseDoc: ExpenseDocument = {
      messId: messMember.messId,
      addedBy: userId,
      paidBy: paidByUserId,

      title: payload.title.trim(),
      description: payload.description?.trim() ?? "",

      amount: payload.amount,
      category: payload.category,
      expenseDate: payload.expenseDate,

      status: messMember.role === "manager" ? "approved" : "pending",

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    /* 4️⃣ Insert expense */
    const expensesCollection = dbConnect(collections.EXPENSES);

    const result: InsertOneResult<ExpenseDocument> =
      await expensesCollection.insertOne(expenseDoc);

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

export async function getMonthlyExpensesSummary(
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
      categories: result[0]?.categories ?? [],
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
