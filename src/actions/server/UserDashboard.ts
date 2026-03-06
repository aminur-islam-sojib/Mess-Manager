"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

type UserDashboardTransaction = {
  id: string;
  title: string;
  amount: number;
  date: string;
  type: "bill" | "payment" | "expense";
  status: "pending" | "completed";
};

type UserDashboardMealHistory = {
  date: string;
  breakfast: boolean;
  lunch: boolean;
  dinner: boolean;
};

type UserDashboardUpcomingBill = {
  id: string;
  title: string;
  amount: number;
  dueDate: string;
  status: "pending";
};

type UserDashboardSuccess = {
  success: true;
  data: {
    user: {
      id: string;
      name: string;
      email: string;
      role: "user" | "manager" | "admin";
      image: string | null;
    };
    mess: {
      id: string;
      messName: string;
    };
    stats: {
      currentBalance: number;
      monthlyExpense: number;
      mealsThisMonth: number;
      pendingPayments: number;
    };
    recentTransactions: UserDashboardTransaction[];
    mealHistory: UserDashboardMealHistory[];
    upcomingBills: UserDashboardUpcomingBill[];
  };
};

type UserDashboardError = {
  success: false;
  message: string;
};

export type UserDashboardResponse = UserDashboardSuccess | UserDashboardError;

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const round2 = (value: number) => Number(value.toFixed(2));

const monthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "long",
  });

export async function getUserDashboardOverview(): Promise<UserDashboardResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const usersCollection = dbConnect(collections.USERS);
    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);
    const expenseCollection = dbConnect(collections.EXPENSES);
    const depositCollection = dbConnect(collections.DEPOSITS);

    const user = await usersCollection.findOne({ _id: userId });
    if (!user) {
      return { success: false, message: "User not found" };
    }

    const managedMess = await messCollection.findOne({
      managerId: userId,
      status: "active",
    });

    const membership = managedMess
      ? { messId: managedMess._id, role: "manager" as const }
      : await memberCollection.findOne({
          userId,
          status: "active",
        });

    if (!membership) {
      return { success: false, message: "Mess not found" };
    }

    const mess =
      managedMess ??
      (await messCollection.findOne({
        _id: membership.messId,
        status: "active",
      }));

    if (!mess) {
      return { success: false, message: "Mess not found" };
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const currentMonthStartKey = toDateKey(startOfMonth);
    const nextMonthStartKey = toDateKey(startOfNextMonth);
    const todayKey = toDateKey(now);
    const monthEndKey = toDateKey(endOfMonth);

    const [
      mealStatsAgg,
      expenseStatsAgg,
      depositStatsAgg,
      recentDeposits,
      recentExpenses,
      mealHistoryDocs,
    ] = await Promise.all([
      mealCollection
        .aggregate<{
          userMonthMeals: number;
          userLifetimeMeals: number;
          messMonthMeals: number;
          messLifetimeMeals: number;
        }>([
          { $match: { messId: mess._id } },
          {
            $group: {
              _id: null,
              userMonthMeals: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$userId", userId] },
                        { $gte: ["$date", currentMonthStartKey] },
                        { $lt: ["$date", nextMonthStartKey] },
                      ],
                    },
                    "$meals",
                    0,
                  ],
                },
              },
              userLifetimeMeals: {
                $sum: {
                  $cond: [{ $eq: ["$userId", userId] }, "$meals", 0],
                },
              },
              messMonthMeals: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$date", currentMonthStartKey] },
                        { $lt: ["$date", nextMonthStartKey] },
                      ],
                    },
                    "$meals",
                    0,
                  ],
                },
              },
              messLifetimeMeals: { $sum: "$meals" },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),
      expenseCollection
        .aggregate<{
          messMonthExpenses: number;
          messLifetimeExpenses: number;
          userPaidExpensesThisMonth: number;
        }>([
          {
            $match: {
              messId: mess._id,
              status: "approved",
            },
          },
          {
            $group: {
              _id: null,
              messMonthExpenses: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$expenseDate", currentMonthStartKey] },
                        { $lt: ["$expenseDate", nextMonthStartKey] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              messLifetimeExpenses: { $sum: "$amount" },
              userPaidExpensesThisMonth: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$paidBy", userId] },
                        { $gte: ["$expenseDate", currentMonthStartKey] },
                        { $lt: ["$expenseDate", nextMonthStartKey] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),
      depositCollection
        .aggregate<{
          totalDeposits: number;
        }>([
          { $match: { messId: mess._id, userId } },
          {
            $group: {
              _id: null,
              totalDeposits: { $sum: "$amount" },
            },
          },
          { $project: { _id: 0, totalDeposits: 1 } },
        ])
        .toArray(),
      depositCollection
        .find({
          messId: mess._id,
          userId,
        })
        .sort({ date: -1, createdAt: -1 })
        .limit(5)
        .toArray(),
      expenseCollection
        .find({
          messId: mess._id,
          paidBy: userId,
          status: { $in: ["approved", "pending"] },
        })
        .sort({ expenseDate: -1, createdAt: -1 })
        .limit(5)
        .toArray(),
      mealCollection
        .find({
          messId: mess._id,
          userId,
        })
        .sort({ date: -1, createdAt: -1 })
        .limit(3)
        .toArray(),
    ]);

    const mealStats = mealStatsAgg[0] ?? {
      userMonthMeals: 0,
      userLifetimeMeals: 0,
      messMonthMeals: 0,
      messLifetimeMeals: 0,
    };

    const expenseStats = expenseStatsAgg[0] ?? {
      messMonthExpenses: 0,
      messLifetimeExpenses: 0,
      userPaidExpensesThisMonth: 0,
    };

    const depositStats = depositStatsAgg[0] ?? {
      totalDeposits: 0,
    };

    const currentMonthCostPerMeal =
      mealStats.messMonthMeals > 0
        ? expenseStats.messMonthExpenses / mealStats.messMonthMeals
        : 0;
    const lifetimeCostPerMeal =
      mealStats.messLifetimeMeals > 0
        ? expenseStats.messLifetimeExpenses / mealStats.messLifetimeMeals
        : 0;

    const currentMonthMealCost = round2(
      mealStats.userMonthMeals * currentMonthCostPerMeal,
    );
    const lifetimeMealCost = round2(
      mealStats.userLifetimeMeals * lifetimeCostPerMeal,
    );
    const currentBalance = round2(depositStats.totalDeposits - lifetimeMealCost);
    const pendingPayments = currentBalance < 0 ? 1 : 0;

    const upcomingBills: UserDashboardUpcomingBill[] =
      pendingPayments > 0
        ? [
            {
              id: `bill-${userId.toString()}-${currentMonthStartKey}`,
              title: `${monthLabel(now)} Mess Bill`,
              amount: Math.abs(currentBalance),
              dueDate: monthEndKey,
              status: "pending",
            },
          ]
        : [];

    const transactions: Array<UserDashboardTransaction & { sortKey: string }> = [
      ...recentDeposits.map((deposit) => ({
        id: deposit._id.toString(),
        title: deposit.note?.trim() || "Payment Made",
        amount: Number(deposit.amount || 0),
        date: String(deposit.date || todayKey),
        type: "payment" as const,
        status: "completed" as const,
        sortKey: `${deposit.date || todayKey}-${deposit.createdAt?.toISOString?.() || ""}`,
      })),
      ...recentExpenses.map((expense) => ({
        id: expense._id.toString(),
        title: String(expense.title || "Expense"),
        amount: -Math.abs(Number(expense.amount || 0)),
        date: String(expense.expenseDate || todayKey),
        type: "expense" as const,
        status:
          expense.status === "pending"
            ? ("pending" as const)
            : ("completed" as const),
        sortKey: `${expense.expenseDate || todayKey}-${expense.createdAt?.toISOString?.() || ""}`,
      })),
    ];

    if (currentMonthMealCost > 0) {
      transactions.push({
        id: `meal-bill-${userId.toString()}-${currentMonthStartKey}`,
        title: `${monthLabel(now)} Meal Bill`,
        amount: -currentMonthMealCost,
        date: todayKey,
        type: "bill",
        status: pendingPayments > 0 ? "pending" : "completed",
        sortKey: `${todayKey}-zzzz`,
      });
    }

    const recentTransactions = transactions
      .sort((a, b) => b.sortKey.localeCompare(a.sortKey))
      .slice(0, 3)
      .map((transaction) => ({
        id: transaction.id,
        title: transaction.title,
        amount: transaction.amount,
        date: transaction.date,
        type: transaction.type,
        status: transaction.status,
      }));

    const mealHistory: UserDashboardMealHistory[] = mealHistoryDocs.map(
      (mealEntry) => ({
        date: String(mealEntry.date),
        breakfast: Number(mealEntry.breakdown?.breakfast ?? 0) > 0,
        lunch: Number(mealEntry.breakdown?.lunch ?? 0) > 0,
        dinner: Number(mealEntry.breakdown?.dinner ?? 0) > 0,
      }),
    );

    return {
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: String(user.name || session.user.name || "Member"),
          email: String(user.email || session.user.email || ""),
          role: (user.role || session.user.role || "user") as
            | "user"
            | "manager"
            | "admin",
          image:
            typeof user.image === "string"
              ? user.image
              : session.user.image ?? null,
        },
        mess: {
          id: mess._id.toString(),
          messName: String(mess.messName || "Unknown Mess"),
        },
        stats: {
          currentBalance,
          monthlyExpense: round2(
            currentMonthMealCost + expenseStats.userPaidExpensesThisMonth,
          ),
          mealsThisMonth: mealStats.userMonthMeals,
          pendingPayments,
        },
        recentTransactions,
        mealHistory,
        upcomingBills,
      },
    };
  } catch (error) {
    console.error("User dashboard overview error:", error);
    return {
      success: false,
      message: "Failed to load dashboard overview",
    };
  }
}
