"use server";

import { dbConnect, collections } from "@/lib/dbConnect";
import {
  AuthorizationError,
  requireAdminRole,
  requireManagerRole,
} from "@/lib/auth.utils";
import { ObjectId } from "mongodb";

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

interface AdminDashboardSuccess {
  success: true;
  stats: {
    totalUsers: number;
    totalManagers: number;
    totalMembers: number;
    totalMesses: number;
    activeMesses: number;
    totalExpenses: number;
    totalDeposits: number;
    pendingInvitations: number;
    pendingExpenses: number;
    pendingDepositRequests: number;
    totalPendingOperations: number;
  };
  recentUsers: Array<{
    _id: ObjectId;
    name: string;
    email: string;
    role: string;
    createdAt: Date;
  }>;
}

interface AdminDashboardError {
  success: false;
  message: string;
}

export type AdminGroupExpenseSortBy =
  | "totalExpenseAmount"
  | "totalDepositAmount"
  | "netCost"
  | "pendingExpenseAmount";

export type AdminGroupExpenseSortOrder = "asc" | "desc";

interface AdminExpenseGroupRow {
  messId: string;
  messName: string;
  status: string;
  expenseCount: number;
  depositCount: number;
  totalExpenseAmount: number;
  totalDepositAmount: number;
  netCost: number;
  pendingExpenseCount: number;
  pendingExpenseAmount: number;
  pendingDepositRequestCount: number;
  pendingDepositRequestAmount: number;
}

interface AdminExpenseInsightsSuccess {
  success: true;
  summary: {
    totalExpensesCount: number;
    totalDepositsCount: number;
    totalExpenseAmount: number;
    totalDepositAmount: number;
    pendingExpenseCount: number;
    pendingExpenseAmount: number;
    pendingDepositRequestCount: number;
    pendingDepositRequestAmount: number;
    pendingInvitationCount: number;
    totalPendingOperations: number;
    totalGroups: number;
  };
  groups: AdminExpenseGroupRow[];
  filters: {
    search: string;
    minCost: number;
    sortBy: AdminGroupExpenseSortBy;
    sortOrder: AdminGroupExpenseSortOrder;
  };
}

interface AdminExpenseInsightsError {
  success: false;
  message: string;
}

export type AdminExpenseInsightsResponse =
  | AdminExpenseInsightsSuccess
  | AdminExpenseInsightsError;

export type AdminDashboardResponse =
  | AdminDashboardSuccess
  | AdminDashboardError;

const DEFAULT_GROUP_SORT_BY: AdminGroupExpenseSortBy = "totalExpenseAmount";
const DEFAULT_GROUP_SORT_ORDER: AdminGroupExpenseSortOrder = "desc";

export const getManagerDashboardOverview =
  async (): Promise<ManagerDashboardResponse> => {
    try {
      const session = await requireManagerRole();

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
      if (error instanceof AuthorizationError) {
        return {
          success: false,
          message: error.message,
        };
      }

      console.error("❌ Manager Overview Error:", error);
      return {
        success: false,
        message: "Failed to load dashboard overview",
      };
    }
  };

export const getAdminDashboardOverview =
  async (): Promise<AdminDashboardResponse> => {
    try {
      await requireAdminRole();

      const usersCollection = dbConnect(collections.USERS);
      const messCollection = dbConnect(collections.MESS);
      const membersCollection = dbConnect(collections.MESS_MEMBERS);
      const expenseCollection = dbConnect(collections.EXPENSES);
      const depositCollection = dbConnect(collections.DEPOSITS);
      const depositRequestCollection = dbConnect(collections.DEPOSIT_REQUESTS);
      const invitationsCollection = dbConnect(collections.INVITATIONS);

      const [
        totalUsers,
        totalManagers,
        totalMembers,
        totalMesses,
        activeMesses,
        totalExpenses,
        totalDeposits,
        pendingInvitations,
        pendingExpenses,
        pendingDepositRequests,
        recentUsers,
      ] = await Promise.all([
        usersCollection.countDocuments({}),
        usersCollection.countDocuments({ role: "manager" }),
        membersCollection.countDocuments({ status: "active" }),
        messCollection.countDocuments({}),
        messCollection.countDocuments({ status: "active" }),
        expenseCollection.countDocuments({}),
        depositCollection.countDocuments({}),
        invitationsCollection.countDocuments({ status: "pending" }),
        expenseCollection.countDocuments({ status: "pending" }),
        depositRequestCollection.countDocuments({ status: "pending" }),
        usersCollection.find({}).sort({ createdAt: -1 }).limit(5).toArray(),
      ]);

      return {
        success: true,
        stats: {
          totalUsers,
          totalManagers,
          totalMembers,
          totalMesses,
          activeMesses,
          totalExpenses,
          totalDeposits,
          pendingInvitations,
          pendingExpenses,
          pendingDepositRequests,
          totalPendingOperations:
            pendingInvitations + pendingExpenses + pendingDepositRequests,
        },
        recentUsers: recentUsers.map((user) => ({
          _id: user._id,
          name: String(user.name || "Unknown"),
          email: String(user.email || "-"),
          role: String(user.role || "user"),
          createdAt:
            user.createdAt instanceof Date
              ? user.createdAt
              : new Date(user.createdAt || Date.now()),
        })),
      };
    } catch (error) {
      if (error instanceof AuthorizationError) {
        return {
          success: false,
          message: error.message,
        };
      }

      console.error("❌ Admin Dashboard Overview Error:", error);
      return {
        success: false,
        message: "Failed to load admin dashboard overview",
      };
    }
  };

export const getAdminExpenseInsights = async (params?: {
  search?: string;
  minCost?: number;
  sortBy?: AdminGroupExpenseSortBy;
  sortOrder?: AdminGroupExpenseSortOrder;
}): Promise<AdminExpenseInsightsResponse> => {
  try {
    await requireAdminRole();

    const search = params?.search?.trim() ?? "";
    const minCost = Number.isFinite(params?.minCost)
      ? Math.max(Number(params?.minCost), 0)
      : 0;

    const sortBy: AdminGroupExpenseSortBy =
      params?.sortBy ?? DEFAULT_GROUP_SORT_BY;
    const sortOrder: AdminGroupExpenseSortOrder =
      params?.sortOrder ?? DEFAULT_GROUP_SORT_ORDER;

    const messCollection = dbConnect(collections.MESS);
    const invitationsCollection = dbConnect(collections.INVITATIONS);

    const pipeline: object[] = [
      {
        $lookup: {
          from: collections.EXPENSES,
          let: { messId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$messId", "$$messId"] },
              },
            },
            {
              $group: {
                _id: null,
                expenseCount: { $sum: 1 },
                totalExpenseAmount: { $sum: { $ifNull: ["$amount", 0] } },
                pendingExpenseCount: {
                  $sum: {
                    $cond: [{ $eq: ["$status", "pending"] }, 1, 0],
                  },
                },
                pendingExpenseAmount: {
                  $sum: {
                    $cond: [
                      { $eq: ["$status", "pending"] },
                      { $ifNull: ["$amount", 0] },
                      0,
                    ],
                  },
                },
              },
            },
          ],
          as: "expenseStats",
        },
      },
      {
        $lookup: {
          from: collections.DEPOSITS,
          let: { messId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$messId", "$$messId"] },
              },
            },
            {
              $group: {
                _id: null,
                depositCount: { $sum: 1 },
                totalDepositAmount: { $sum: { $ifNull: ["$amount", 0] } },
              },
            },
          ],
          as: "depositStats",
        },
      },
      {
        $lookup: {
          from: collections.DEPOSIT_REQUESTS,
          let: { messId: "$_id" },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ["$messId", "$$messId"] },
                status: "pending",
              },
            },
            {
              $group: {
                _id: null,
                pendingDepositRequestCount: { $sum: 1 },
                pendingDepositRequestAmount: {
                  $sum: { $ifNull: ["$amount", 0] },
                },
              },
            },
          ],
          as: "pendingDepositStats",
        },
      },
      {
        $addFields: {
          expenseStats: { $ifNull: [{ $first: "$expenseStats" }, {}] },
          depositStats: { $ifNull: [{ $first: "$depositStats" }, {}] },
          pendingDepositStats: {
            $ifNull: [{ $first: "$pendingDepositStats" }, {}],
          },
        },
      },
      {
        $project: {
          _id: 1,
          messName: { $ifNull: ["$messName", "Unnamed Group"] },
          status: { $ifNull: ["$status", "unknown"] },
          expenseCount: { $ifNull: ["$expenseStats.expenseCount", 0] },
          depositCount: { $ifNull: ["$depositStats.depositCount", 0] },
          totalExpenseAmount: {
            $ifNull: ["$expenseStats.totalExpenseAmount", 0],
          },
          totalDepositAmount: {
            $ifNull: ["$depositStats.totalDepositAmount", 0],
          },
          pendingExpenseCount: {
            $ifNull: ["$expenseStats.pendingExpenseCount", 0],
          },
          pendingExpenseAmount: {
            $ifNull: ["$expenseStats.pendingExpenseAmount", 0],
          },
          pendingDepositRequestCount: {
            $ifNull: ["$pendingDepositStats.pendingDepositRequestCount", 0],
          },
          pendingDepositRequestAmount: {
            $ifNull: ["$pendingDepositStats.pendingDepositRequestAmount", 0],
          },
          netCost: {
            $subtract: [
              { $ifNull: ["$expenseStats.totalExpenseAmount", 0] },
              { $ifNull: ["$depositStats.totalDepositAmount", 0] },
            ],
          },
        },
      },
    ];

    if (search) {
      pipeline.push({
        $match: {
          messName: {
            $regex: search,
            $options: "i",
          },
        },
      });
    }

    if (minCost > 0) {
      pipeline.push({
        $match: {
          totalExpenseAmount: {
            $gte: minCost,
          },
        },
      });
    }

    pipeline.push({
      $sort: {
        [sortBy]: sortOrder === "asc" ? 1 : -1,
        messName: 1,
      },
    });

    const groupRows = await messCollection.aggregate(pipeline).toArray();
    const pendingInvitationCount = await invitationsCollection.countDocuments({
      status: "pending",
    });

    const summaryBase = groupRows.reduce<{
      totalExpensesCount: number;
      totalDepositsCount: number;
      totalExpenseAmount: number;
      totalDepositAmount: number;
      pendingExpenseCount: number;
      pendingExpenseAmount: number;
      pendingDepositRequestCount: number;
      pendingDepositRequestAmount: number;
    }>(
      (acc, row) => {
        const expenseCount = Number(row.expenseCount || 0);
        const depositCount = Number(row.depositCount || 0);
        const totalExpenseAmount = Number(row.totalExpenseAmount || 0);
        const totalDepositAmount = Number(row.totalDepositAmount || 0);
        const pendingExpenseCount = Number(row.pendingExpenseCount || 0);
        const pendingExpenseAmount = Number(row.pendingExpenseAmount || 0);
        const pendingDepositRequestCount = Number(
          row.pendingDepositRequestCount || 0,
        );
        const pendingDepositRequestAmount = Number(
          row.pendingDepositRequestAmount || 0,
        );

        return {
          totalExpensesCount: acc.totalExpensesCount + expenseCount,
          totalDepositsCount: acc.totalDepositsCount + depositCount,
          totalExpenseAmount: acc.totalExpenseAmount + totalExpenseAmount,
          totalDepositAmount: acc.totalDepositAmount + totalDepositAmount,
          pendingExpenseCount: acc.pendingExpenseCount + pendingExpenseCount,
          pendingExpenseAmount: acc.pendingExpenseAmount + pendingExpenseAmount,
          pendingDepositRequestCount:
            acc.pendingDepositRequestCount + pendingDepositRequestCount,
          pendingDepositRequestAmount:
            acc.pendingDepositRequestAmount + pendingDepositRequestAmount,
        };
      },
      {
        totalExpensesCount: 0,
        totalDepositsCount: 0,
        totalExpenseAmount: 0,
        totalDepositAmount: 0,
        pendingExpenseCount: 0,
        pendingExpenseAmount: 0,
        pendingDepositRequestCount: 0,
        pendingDepositRequestAmount: 0,
      },
    );

    const groups: AdminExpenseGroupRow[] = groupRows.map((row) => ({
      messId:
        row._id instanceof ObjectId ? row._id.toString() : String(row._id),
      messName: String(row.messName || "Unnamed Group"),
      status: String(row.status || "unknown"),
      expenseCount: Number(row.expenseCount || 0),
      depositCount: Number(row.depositCount || 0),
      totalExpenseAmount: Number(row.totalExpenseAmount || 0),
      totalDepositAmount: Number(row.totalDepositAmount || 0),
      netCost: Number(row.netCost || 0),
      pendingExpenseCount: Number(row.pendingExpenseCount || 0),
      pendingExpenseAmount: Number(row.pendingExpenseAmount || 0),
      pendingDepositRequestCount: Number(row.pendingDepositRequestCount || 0),
      pendingDepositRequestAmount: Number(row.pendingDepositRequestAmount || 0),
    }));

    return {
      success: true,
      summary: {
        totalExpensesCount: summaryBase.totalExpensesCount,
        totalDepositsCount: summaryBase.totalDepositsCount,
        totalExpenseAmount: summaryBase.totalExpenseAmount,
        totalDepositAmount: summaryBase.totalDepositAmount,
        pendingExpenseCount: summaryBase.pendingExpenseCount,
        pendingExpenseAmount: summaryBase.pendingExpenseAmount,
        pendingDepositRequestCount: summaryBase.pendingDepositRequestCount,
        pendingDepositRequestAmount: summaryBase.pendingDepositRequestAmount,
        pendingInvitationCount,
        totalPendingOperations:
          summaryBase.pendingExpenseCount +
          summaryBase.pendingDepositRequestCount +
          pendingInvitationCount,
        totalGroups: groups.length,
      },
      groups,
      filters: {
        search,
        minCost,
        sortBy,
        sortOrder,
      },
    };
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return {
        success: false,
        message: error.message,
      };
    }

    console.error("❌ Admin Expense Insights Error:", error);
    return {
      success: false,
      message: "Failed to load admin expense insights",
    };
  }
};
