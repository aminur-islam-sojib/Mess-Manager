import { ObjectId } from "mongodb";

export type AddExpensePayload = {
  title: string;
  description?: string;
  amount: number;
  category: "grocery" | "utility" | "rent" | "others";
  expenseDate: string;
  paidBy?: string;
  paidFromAccountId?: string;
  paymentSource: "personal" | "mess_pool";
};

export type ExpenseDocument = {
  messId: ObjectId;
  addedBy: ObjectId;
  paidBy: ObjectId;
  title: string;
  description: string;
  amount: number;
  category: AddExpensePayload["category"];
  expenseDate: string;
  paymentSource: string;
  status: "pending" | "approved";

  createdAt: Date;
  updatedAt: Date;
};

export type MessMemberDocument = {
  _id: ObjectId;
  messId: ObjectId;
  userId: ObjectId;
  role: "manager" | "member";
  joinedAt: Date;
};

export type AddExpenseResponse =
  | { success: true; expenseId: string }
  | { success: false; message: string };

// types/ExpenseType.ts

export type ExpenseDocumentResponse = {
  _id?: ObjectId;
  messId: ObjectId;
  addedBy: ObjectId;
  paidBy: ObjectId;
  title: string;
  description: string;
  amount: number;
  category: "grocery" | "utility" | "rent" | "others";
  expenseDate: string; // YYYY-MM-DD
  status: "pending" | "approved";
  createdAt: Date;
  updatedAt: Date;
};

export type ExpenseDocumentSerialized = {
  messId: string;
  addedBy: string;
  paidBy: string;
  title: string;
  description: string;
  amount: number;
  category: "grocery" | "utility" | "rent" | "others";
  expenseDate: string;
  status: "pending" | "approved";
  createdAt: string;
  updatedAt: string;
  id: string;
  paymentSource: string;
};

export type GetExpensesResponse =
  | { success: true; expenses: ExpenseDocument[] }
  | { success: false; message: string };

export type GetExpensesSerializedResponse =
  | {
      success: true;
      expenses: ExpenseDocumentSerialized[];
      from: string;
      to: string;
    }
  | { success: false; message: string };

export type TodaysExpenseSummaryResponse = {
  success: boolean;
  data?: {
    messId: string;
    date: string;
    totalAmount: number;
    totalCount: number;
    byCategory: {
      category: string;
      amount: number;
    }[];
  };
  message?: string;
};
