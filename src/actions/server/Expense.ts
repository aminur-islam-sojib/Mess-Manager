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

    /* 2️⃣ Validate paidBy user belongs to same mess */
    const paidByUserId = new ObjectId(payload.paidBy ?? userId.toString());

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

/* ===========================
   GET ALL EXPENSES (MESS BASED)
=========================== */
export async function getAllExpenses(): Promise<GetExpensesSerializedResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    /* 1️⃣ Resolve user's mess */
    const messMemberCollection = dbConnect(collections.MESS_MEMBERS);

    const messMember = await messMemberCollection.findOne({
      userId,
    });

    if (!messMember) {
      return { success: false, message: "User is not part of any mess" };
    }

    const messId = messMember.messId;

    /* 2️⃣ Fetch mess expenses */
    const expensesCollection = dbConnect(collections.EXPENSES);

    const expenses = await expensesCollection
      .find({ messId })
      .sort({ expenseDate: -1 })
      .toArray();

    /* 3️⃣ Serialize for client */
    const serializedExpenses = expenses.map((expense) => ({
      id: expense._id.toString(),
      messId: expense.messId.toString(),
      addedBy: expense.addedBy.toString(),
      paidBy: expense.paidBy.toString(),

      title: expense.title,
      description: expense.description,
      amount: expense.amount,
      category: expense.category,
      expenseDate: expense.expenseDate,
      status: expense.status,

      createdAt: expense.createdAt.toISOString(),
      updatedAt: expense.updatedAt.toISOString(),
    }));

    return {
      success: true,
      expenses: serializedExpenses,
    };
  } catch (error) {
    console.error("Get all expenses error:", error);
    return { success: false, message: "Failed to fetch expenses" };
  }
}
