import { ObjectId } from "mongodb";

export type ExpenseCategory = "grocery" | "utility" | "rent" | "others";
export type ExpensePaymentSource = "individual" | "mess_pool";
export type ExpenseStatus = "pending" | "approved" | "rejected";

export type AddExpensePayload = {
  title: string;
  description?: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  paidBy?: string;
  paidByIds?: string[];
  assignToAllMembers?: boolean;
  paidFromAccountId?: string;
  paymentSource: ExpensePaymentSource;
};

export type ExpenseDocument = {
  messId: ObjectId;
  addedBy: ObjectId;
  paidBy: ObjectId;
  title: string;
  description: string;
  amount: number;
  category: ExpenseCategory;
  expenseDate: string;
  paymentSource: ExpensePaymentSource;
  status: ExpenseStatus;
  verifiedBy?: ObjectId;
  verifiedAt?: Date;
  approvalNote?: string;

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
  | {
      success: true;
      expenseId: string;
      status: ExpenseStatus;
      paymentSource: ExpensePaymentSource;
      createdCount?: number;
      requiresManagerVerification: boolean;
      expenses: ExpenseDocumentSerialized[];
    }
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
  category: ExpenseCategory;
  expenseDate: string; // YYYY-MM-DD
  status: ExpenseStatus;
  paymentSource: ExpensePaymentSource;
  verifiedBy?: ObjectId;
  verifiedAt?: Date;
  approvalNote?: string;
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
  category: ExpenseCategory;
  expenseDate: string;
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  id: string;
  paymentSource: ExpensePaymentSource;
  verifiedBy?: string;
  verifiedAt?: string;
  approvalNote?: string;
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

export type VerifyExpenseDecision = "approved" | "rejected";

export type VerifyExpenseResponse =
  | {
      success: true;
      expense: ExpenseDocumentSerialized;
    }
  | {
      success: false;
      message: string;
    };
