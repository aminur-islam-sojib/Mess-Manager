"use server";

import { dbConnect, collections } from "@/lib/dbConnect";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { ObjectId, WithId, Document } from "mongodb";

// Proper Expense document type
interface ExpenseDocument extends Document {
  _id: ObjectId;
  messId: ObjectId;
  title: string;
  amount: number;
  category: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  paidBy: ObjectId;
  addedBy: ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

// Success response
interface ManagerDashboardSuccess {
  success: true;
  messId: string;
  messName: string;
  stats: {
    totalMembers: number;
    activeMembers: number;
    totalCostThisMonth: number;
    totalCostLastMonth: number;
    pendingExpenses: number;
    averageDailyCost: number;
  };
  recentExpenses: Array<{
    _id: ObjectId;
    title: string;
    amount: number;
    status: string;
    paidBy: ObjectId;
    addedBy: ObjectId;
    createdAt: Date;
  }>;
}

// Error response
interface ManagerDashboardError {
  success: false;
  message: string;
}

// Discriminated union type
export type ManagerDashboardResponse =
  | ManagerDashboardSuccess
  | ManagerDashboardError;

export const getManagerDashboardOverview =
  async (): Promise<ManagerDashboardResponse> => {
    try {
      /* ---------- AUTH ---------- */
      const session = await getServerSession(authOptions);
      if (!session?.user?.id) {
        return { success: false, message: "Unauthorized" };
      }

      const managerId = new ObjectId(session.user.id);

      const messCollection = dbConnect(collections.MESS);
      const memberCollection = dbConnect(collections.MESS_MEMBERS);
      const expenseCollection = dbConnect(collections.EXPENSES);

      /* ---------- FIND ACTIVE MESS ---------- */
      const mess = await messCollection.findOne({
        managerId,
        status: "active",
      });

      if (!mess) {
        return { success: false, message: "Mess not found" };
      }

      /* ---------- DATE HELPERS ---------- */
      const now = new Date();

      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = monthStart;

      /* =========================================================
       1️⃣ MEMBER COUNTS
    ========================================================= */
      const totalMembersPromise = memberCollection.countDocuments({
        messId: mess._id,
      });

      const activeMembersPromise = memberCollection.countDocuments({
        messId: mess._id,
        status: "active",
      });

      /* =========================================================
       2️⃣ THIS MONTH EXPENSE STATS
    ========================================================= */
      const thisMonthExpensePromise = expenseCollection
        .aggregate([
          {
            $match: {
              messId: mess._id,
              createdAt: { $gte: monthStart, $lt: monthEnd },
            },
          },
          {
            $group: {
              _id: null,
              totalCost: { $sum: "$amount" },
              pendingCost: {
                $sum: {
                  $cond: [{ $eq: ["$status", "pending"] }, "$amount", 0],
                },
              },
            },
          },
        ])
        .toArray();

      /* =========================================================
       3️⃣ LAST MONTH TOTAL COST
    ========================================================= */
      const lastMonthExpensePromise = expenseCollection
        .aggregate([
          {
            $match: {
              messId: mess._id,
              createdAt: {
                $gte: lastMonthStart,
                $lt: lastMonthEnd,
              },
            },
          },
          {
            $group: {
              _id: null,
              totalCost: { $sum: "$amount" },
            },
          },
        ])
        .toArray();

      /* =========================================================
       4️⃣ RECENT 3 EXPENSES
    ========================================================= */
      const recentExpensesPromise = expenseCollection
        .find({ messId: mess._id })
        .sort({ createdAt: -1 })
        .limit(3)
        .toArray();

      /* ---------- PARALLEL EXECUTION ---------- */
      const [
        totalMembers,
        activeMembers,
        thisMonthExpenseArr,
        lastMonthExpenseArr,
        recentExpenses,
      ] = await Promise.all([
        totalMembersPromise,
        activeMembersPromise,
        thisMonthExpensePromise,
        lastMonthExpensePromise,
        recentExpensesPromise,
      ]);

      const thisMonthStats = thisMonthExpenseArr[0] || {
        totalCost: 0,
        pendingCost: 0,
      };

      const lastMonthTotalCost = lastMonthExpenseArr[0]?.totalCost || 0;

      /* =========================================================
       5️⃣ AVERAGE DAILY COST (THIS MONTH)
    ========================================================= */
      const daysPassed =
        Math.floor(
          (now.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24),
        ) + 1;

      const averageDailyCost =
        thisMonthStats.totalCost / Math.max(daysPassed, 1);

      /* ---------- FINAL RESPONSE ---------- */
      return {
        success: true,
        messId: mess._id.toString(),
        messName: mess.messName,

        stats: {
          totalMembers,
          activeMembers,
          totalCostThisMonth: thisMonthStats.totalCost,
          totalCostLastMonth: lastMonthTotalCost, // ✅ NEW
          pendingExpenses: thisMonthStats.pendingCost,
          averageDailyCost: Number(averageDailyCost.toFixed(2)),
        },

        recentExpenses: recentExpenses.map((exp) => ({
          _id: exp._id,
          title: String(exp.title || ""),
          amount: Number(exp.amount || 0),
          status: String(exp.status || "pending"),
          paidBy:
            exp.paidBy instanceof ObjectId
              ? exp.paidBy
              : new ObjectId(String(exp.paidBy)),
          addedBy:
            exp.addedBy instanceof ObjectId
              ? exp.addedBy
              : new ObjectId(String(exp.addedBy)),
          createdAt:
            exp.createdAt instanceof Date
              ? exp.createdAt
              : new Date(exp.createdAt),
        })),
      };
    } catch (error) {
      console.error("❌ Admin Overview Error:", error);
      return {
        success: false,
        message: "Failed to load dashboard overview",
      };
    }
  };
