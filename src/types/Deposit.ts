import { ObjectId } from "mongodb";

export type DepositMethod = "cash" | "bkash" | "nagad" | "bank";
export type DepositRequestStatus = "pending" | "approved" | "rejected";
export type DepositPageRole = "manager" | "user";

export type AddDepositPayload = {
  messId: string;
  userId: string;
  amount: number;
  method: DepositMethod;
  note?: string;
  date?: string;
};

export type DepositDocument = {
  messId: ObjectId;
  userId: ObjectId;
  addedBy: ObjectId;
  amount: number;
  method: DepositMethod;
  note?: string | null;
  date: string;
  createdAt: Date;
};

export type DepositRequestDocument = {
  messId: ObjectId;
  userId: ObjectId;
  requestedBy: ObjectId;
  amount: number;
  method: DepositMethod;
  note?: string | null;
  date: string;
  status: DepositRequestStatus;
  createdAt: Date;
  updatedAt: Date;
  approvedAt?: Date;
  approvedBy?: ObjectId;
  approvalNote?: string;
};

export type DepositRequestSerialized = {
  id: string;
  messId: string;
  userId: string;
  requestedBy: string;
  amount: number;
  method: DepositMethod;
  note?: string | null;
  date: string;
  status: DepositRequestStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  approvalNote?: string;
  userName?: string;
  userEmail?: string;
};

export type UserLedger = {
  userId: string;
  name: string;
  email: string;
  role: string;
  totalCost: number;
  totalDeposit: number;
  balance: number;
  pendingRequestCount?: number;
  pendingRequestAmount?: number;
};
