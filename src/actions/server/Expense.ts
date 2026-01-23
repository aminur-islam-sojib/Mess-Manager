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

export async function addExpense(
  payload: AddExpensePayload,
): Promise<AddExpenseResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = session.user.id;

    if (!payload.title.trim() || payload.amount <= 0) {
      return { success: false, message: "Invalid expense data" };
    }

    // 🔑 Resolve mess from mess_member
    const messMemberCollection = dbConnect(collections.MESS_MEMBERS);

    const messMember = await messMemberCollection.findOne({
      userId: new ObjectId(userId),
    });

    if (!messMember) {
      return { success: false, message: "User is not part of any mess" };
    }

    const expenseDoc: ExpenseDocument = {
      messId: messMember.messId,
      addedBy: new ObjectId(userId),
      paidBy: new ObjectId(payload.paidBy ?? userId),

      title: payload.title.trim(),
      description: payload.description?.trim() ?? "",

      amount: payload.amount,
      category: payload.category,
      expenseDate: payload.expenseDate,

      status: messMember.role === "manager" ? "approved" : "pending",

      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const expensesCollection = dbConnect(collections.EXPENSES);

    const result: InsertOneResult<ExpenseDocument> =
      await expensesCollection.insertOne(expenseDoc);

    return {
      success: true,
      expenseId: result.insertedId.toString(),
    };
  } catch (error) {
    console.error("Add expense error:", error);
    return {
      success: false,
      message: "Failed to add expense",
    };
  }
}

export async function getAllExpenses(): Promise<GetExpensesSerializedResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = session.user.id;

    // 1️⃣ Find messId from MESS_MEMBERS
    const messMemberCollection = dbConnect(collections.MESS_MEMBERS);

    const messMember = await messMemberCollection.findOne({
      userId: new ObjectId(userId),
    });

    if (!messMember) {
      return { success: false, message: "User is not part of any mess" };
    }

    const messId = messMember.messId;

    // 2️⃣ Fetch all expenses for this mess
    const expensesCollection = dbConnect(collections.EXPENSES);

    const expenses = (await expensesCollection
      .find({ messId })
      .sort({ expenseDate: -1 }) // latest first
      .toArray()) as unknown as ExpenseDocument[];

    // 3️⃣ Serialize the expenses before returning
    const serializedExpenses = expenses.map((expense) => ({
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

    return { success: true, expenses: serializedExpenses };
  } catch (error) {
    console.error("Get all expenses error:", error);
    return { success: false, message: "Failed to fetch expenses" };
  }
}
