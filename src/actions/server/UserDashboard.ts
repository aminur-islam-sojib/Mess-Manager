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

type UserHomeAlert = {
  id: string;
  title: string;
  description: string;
  severity: "info" | "warning" | "critical";
  actionLabel: string;
  actionHref: string;
};

type UserHomeInsightsSuccess = {
  success: true;
  data: {
    user: UserDashboardSuccess["data"]["user"];
    mess: UserDashboardSuccess["data"]["mess"];
    summary: {
      currentBalance: number;
      monthlyExpense: number;
      monthlyDeposits: number;
      mealsThisMonth: number;
      pendingPayments: number;
      projectedMonthEndBalance: number;
    };
    trends: {
      financial14: Array<{
        date: string;
        label: string;
        dailyCost: number;
        dailyDeposit: number;
        cumulativeCost: number;
        cumulativeDeposit: number;
      }>;
      meals14: Array<{
        date: string;
        label: string;
        breakfast: number;
        lunch: number;
        dinner: number;
        totalMeals: number;
      }>;
    };
    progress: {
      depositCoveragePct: number;
      mealConsistencyPct: number;
      stableBalancePct: number;
    };
    alerts: UserHomeAlert[];
    quickActions: Array<{
      id: string;
      label: string;
      href: string;
    }>;
    recentTransactions: UserDashboardTransaction[];
    mealHistory: UserDashboardMealHistory[];
    upcomingBills: UserDashboardUpcomingBill[];
  };
};

type UserHomeInsightsError = {
  success: false;
  message: string;
};

export type UserHomeInsightsResponse =
  | UserHomeInsightsSuccess
  | UserHomeInsightsError;

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
    const currentBalance = round2(
      depositStats.totalDeposits - lifetimeMealCost,
    );
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

    const transactions: Array<UserDashboardTransaction & { sortKey: string }> =
      [
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
              : (session.user.image ?? null),
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

export async function getUserHomeInsights(): Promise<UserHomeInsightsResponse> {
  try {
    const overview = await getUserDashboardOverview();
    if (!overview.success) {
      return overview;
    }

    const userId = new ObjectId(overview.data.user.id);
    const messId = new ObjectId(overview.data.mess.id);

    const mealCollection = dbConnect(collections.MEAL_ENTRIES);
    const expenseCollection = dbConnect(collections.EXPENSES);
    const depositCollection = dbConnect(collections.DEPOSITS);

    const now = new Date();
    const todayKey = toDateKey(now);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const currentMonthStartKey = toDateKey(startOfMonth);
    const nextMonthStartKey = toDateKey(startOfNextMonth);

    const fourteenDaysAgo = new Date(now);
    fourteenDaysAgo.setDate(now.getDate() - 13);
    const trendStartKey = toDateKey(fourteenDaysAgo);

    const [
      userDailyMeals,
      messDailyMeals,
      messDailyExpenses,
      userDailyDeposits,
      monthlyDepositsAgg,
      userMonthMealDaysAgg,
    ] = await Promise.all([
      mealCollection
        .aggregate<{
          _id: string;
          breakfast: number;
          lunch: number;
          dinner: number;
          totalMeals: number;
        }>([
          {
            $match: {
              messId,
              userId,
              date: { $gte: trendStartKey, $lte: todayKey },
            },
          },
          {
            $group: {
              _id: "$date",
              breakfast: { $sum: { $ifNull: ["$breakdown.breakfast", 0] } },
              lunch: { $sum: { $ifNull: ["$breakdown.lunch", 0] } },
              dinner: { $sum: { $ifNull: ["$breakdown.dinner", 0] } },
              totalMeals: { $sum: { $ifNull: ["$meals", 0] } },
            },
          },
        ])
        .toArray(),
      mealCollection
        .aggregate<{ _id: string; totalMeals: number }>([
          {
            $match: {
              messId,
              date: { $gte: trendStartKey, $lte: todayKey },
            },
          },
          {
            $group: {
              _id: "$date",
              totalMeals: { $sum: { $ifNull: ["$meals", 0] } },
            },
          },
        ])
        .toArray(),
      expenseCollection
        .aggregate<{ _id: string; totalExpenses: number }>([
          {
            $match: {
              messId,
              status: "approved",
              expenseDate: { $gte: trendStartKey, $lte: todayKey },
            },
          },
          {
            $group: {
              _id: "$expenseDate",
              totalExpenses: { $sum: { $ifNull: ["$amount", 0] } },
            },
          },
        ])
        .toArray(),
      depositCollection
        .aggregate<{ _id: string; totalDeposits: number }>([
          {
            $match: {
              messId,
              userId,
              date: { $gte: trendStartKey, $lte: todayKey },
            },
          },
          {
            $group: {
              _id: "$date",
              totalDeposits: { $sum: { $ifNull: ["$amount", 0] } },
            },
          },
        ])
        .toArray(),
      depositCollection
        .aggregate<{ monthlyDeposits: number }>([
          {
            $match: {
              messId,
              userId,
              date: { $gte: currentMonthStartKey, $lt: nextMonthStartKey },
            },
          },
          {
            $group: {
              _id: null,
              monthlyDeposits: { $sum: { $ifNull: ["$amount", 0] } },
            },
          },
        ])
        .toArray(),
      mealCollection
        .aggregate<{ _id: string; totalMeals: number }>([
          {
            $match: {
              messId,
              userId,
              date: { $gte: currentMonthStartKey, $lte: todayKey },
            },
          },
          {
            $group: {
              _id: "$date",
              totalMeals: { $sum: { $ifNull: ["$meals", 0] } },
            },
          },
        ])
        .toArray(),
    ]);

    const userMealsMap = new Map(userDailyMeals.map((row) => [row._id, row]));
    const messMealsMap = new Map(
      messDailyMeals.map((row) => [row._id, row.totalMeals]),
    );
    const messExpenseMap = new Map(
      messDailyExpenses.map((row) => [row._id, row.totalExpenses]),
    );
    const depositMap = new Map(
      userDailyDeposits.map((row) => [row._id, row.totalDeposits]),
    );

    const dateKeys: string[] = [];
    for (let offset = 13; offset >= 0; offset -= 1) {
      const date = new Date(now);
      date.setDate(now.getDate() - offset);
      dateKeys.push(toDateKey(date));
    }

    let cumulativeCost = 0;
    let cumulativeDeposit = 0;

    const financial14 = dateKeys.map((dateKey) => {
      const messMeals = Number(messMealsMap.get(dateKey) || 0);
      const messExpense = Number(messExpenseMap.get(dateKey) || 0);
      const userMeals = Number(userMealsMap.get(dateKey)?.totalMeals || 0);
      const dailyCost =
        messMeals > 0 ? round2((messExpense / messMeals) * userMeals) : 0;
      const dailyDeposit = round2(Number(depositMap.get(dateKey) || 0));

      cumulativeCost = round2(cumulativeCost + dailyCost);
      cumulativeDeposit = round2(cumulativeDeposit + dailyDeposit);

      return {
        date: dateKey,
        label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        dailyCost,
        dailyDeposit,
        cumulativeCost,
        cumulativeDeposit,
      };
    });

    const meals14 = dateKeys.map((dateKey) => {
      const point = userMealsMap.get(dateKey);
      return {
        date: dateKey,
        label: new Date(`${dateKey}T00:00:00`).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        breakfast: Number(point?.breakfast || 0),
        lunch: Number(point?.lunch || 0),
        dinner: Number(point?.dinner || 0),
        totalMeals: Number(point?.totalMeals || 0),
      };
    });

    const monthlyDeposits = round2(
      Number(monthlyDepositsAgg[0]?.monthlyDeposits || 0),
    );

    const daysInMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    ).getDate();
    const elapsedDays = Math.max(1, now.getDate());
    const remainingDays = Math.max(0, daysInMonth - elapsedDays);
    const monthlyNet = overview.data.stats.monthlyExpense - monthlyDeposits;
    const projectedRemainingNet = round2(
      (monthlyNet / elapsedDays) * remainingDays,
    );
    const projectedMonthEndBalance = round2(
      overview.data.stats.currentBalance - projectedRemainingNet,
    );

    const daysWithTwoOrMoreMeals = userMonthMealDaysAgg.filter(
      (row) => Number(row.totalMeals || 0) >= 2,
    ).length;

    const mealConsistencyPct = round2(
      (daysWithTwoOrMoreMeals / elapsedDays) * 100,
    );
    const depositCoveragePct =
      overview.data.stats.monthlyExpense > 0
        ? round2((monthlyDeposits / overview.data.stats.monthlyExpense) * 100)
        : 100;

    const stableBalancePct =
      overview.data.stats.currentBalance >= 0
        ? Math.min(
            100,
            round2((overview.data.stats.currentBalance / 5000) * 100),
          )
        : 0;

    const alerts: UserHomeAlert[] = [];

    if (overview.data.stats.currentBalance < 0) {
      alerts.push({
        id: "balance-critical",
        title: "Outstanding balance requires attention",
        description: `You currently owe $${Math.abs(
          overview.data.stats.currentBalance,
        ).toLocaleString()}.`,
        severity: "critical",
        actionLabel: "Open deposits",
        actionHref: "/dashboard/user/deposits",
      });
    }

    if (depositCoveragePct < 50) {
      alerts.push({
        id: "coverage-warning",
        title: "Deposit coverage is low",
        description:
          "This month deposits are covering less than half of your current costs.",
        severity: "warning",
        actionLabel: "Review expenses",
        actionHref: "/dashboard/user/expenses",
      });
    }

    if (mealConsistencyPct < 45) {
      alerts.push({
        id: "meal-consistency",
        title: "Meal consistency is below target",
        description:
          "Consistent meal logging helps keep calculations fair and accurate.",
        severity: "info",
        actionLabel: "Open meal report",
        actionHref: "/dashboard/user/meals-report",
      });
    }

    return {
      success: true,
      data: {
        user: overview.data.user,
        mess: overview.data.mess,
        summary: {
          currentBalance: overview.data.stats.currentBalance,
          monthlyExpense: overview.data.stats.monthlyExpense,
          monthlyDeposits,
          mealsThisMonth: overview.data.stats.mealsThisMonth,
          pendingPayments: overview.data.stats.pendingPayments,
          projectedMonthEndBalance,
        },
        trends: {
          financial14,
          meals14,
        },
        progress: {
          depositCoveragePct: Math.max(0, Math.min(100, depositCoveragePct)),
          mealConsistencyPct: Math.max(0, Math.min(100, mealConsistencyPct)),
          stableBalancePct: Math.max(0, Math.min(100, stableBalancePct)),
        },
        alerts,
        quickActions: [
          {
            id: "deposits",
            label: "Add Deposit",
            href: "/dashboard/user/deposits",
          },
          {
            id: "expenses",
            label: "Track Expenses",
            href: "/dashboard/user/expenses",
          },
          {
            id: "meals",
            label: "Meal Report",
            href: "/dashboard/user/meals-report",
          },
        ],
        recentTransactions: overview.data.recentTransactions,
        mealHistory: overview.data.mealHistory,
        upcomingBills: overview.data.upcomingBills,
      },
    };
  } catch (error) {
    console.error("User home insights error:", error);
    return {
      success: false,
      message: "Failed to load user home insights",
    };
  }
}
