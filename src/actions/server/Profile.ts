"use server";

import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";

type BasicUserInfo = {
  id: string;
  name: string;
  email: string;
  role: "user" | "manager" | "admin";
  image: string | null;
  createdAt: string | null;
};

type UserProfileFinancialSummarySuccess = {
  success: true;
  data: {
    user: BasicUserInfo;
    currentMonth: {
      mealCount: number;
      messMealCount: number;
      messExpense: number;
      mealRate: number;
      userMealCost: number;
      deposits: number;
    };
    lifetime: {
      totalMeals: number;
      totalDeposits: number;
      totalExpensesPaid: number;
      totalMealCost: number;
    };
    wallet: {
      balance: number;
      totalDeposited: number;
      totalCost: number;
    };
  };
};

type UserProfileSummarySuccess = {
  success: true;
  data: {
    user: BasicUserInfo;
    currentMonth: {
      mealCount: number;
      mealCost: number;
      expenses: number;
      deposits: number;
      balance: number;
    };
    lifetime: {
      mealCount: number;
      totalCost: number;
      deposits: number;
      expenses: number;
    };
  };
};

type UserProfileError = {
  success: false;
  message: string;
};

export type UserProfileFinancialSummaryResponse =
  | UserProfileFinancialSummarySuccess
  | UserProfileError;

export type UserProfileSummaryResponse =
  | UserProfileSummarySuccess
  | UserProfileError;

export type CurrentMonthUserFinancialSummaryResponse =
  | {
      success: true;
      data: {
        userMeals: number;
        totalMessMeals: number;
        messTotalExpense: number;
        costPerMeal: number;
        userMealCost: number;
        userDeposits: number;
        walletBalance: number;
      };
    }
  | UserProfileError;

type TargetMembershipWithUser = {
  user: {
    _id: ObjectId;
    name?: string;
    email?: string;
    role?: "user" | "manager" | "admin";
    image?: string | null;
    createdAt?: Date | string;
  };
};

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseObjectId = (value: string): ObjectId | null => {
  try {
    return new ObjectId(value);
  } catch {
    return null;
  }
};

const round2 = (value: number) => Number(value.toFixed(2));

export async function getCurrentMonthUserFinancialSummary(
  userId: string,
): Promise<CurrentMonthUserFinancialSummaryResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const requesterId = new ObjectId(session.user.id);
    const requestedUserId = parseObjectId(userId);

    if (!requestedUserId) {
      return { success: false, message: "Invalid user ID" };
    }

    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);
    const expenseCollection = dbConnect(collections.EXPENSES);
    const depositCollection = dbConnect(collections.DEPOSITS);

    const requesterMembership = await memberCollection.findOne({
      userId: requesterId,
      status: "active",
    });

    if (!requesterMembership) {
      return { success: false, message: "Unauthorized access" };
    }

    const messId = requesterMembership.messId;

    const targetMembership = await memberCollection.findOne({
      messId,
      userId: requestedUserId,
      status: "active",
    });

    if (!targetMembership) {
      return { success: false, message: "Unauthorized access" };
    }

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    );
    const startDateKey = toDateKey(startOfCurrentMonth);
    const endDateKey = toDateKey(endOfCurrentMonth);

    const [mealAgg, expenseAgg, depositAgg] = await Promise.all([
      mealCollection
        .aggregate<{
          totalMessMealsCurrentMonth: number;
          userMealsCurrentMonth: number;
          totalMessMealsLifetime: number;
          userMealsLifetime: number;
        }>([
          { $match: { messId } },
          {
            $group: {
              _id: null,
              totalMessMealsCurrentMonth: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$date", startDateKey] },
                        { $lte: ["$date", endDateKey] },
                      ],
                    },
                    "$meals",
                    0,
                  ],
                },
              },
              userMealsCurrentMonth: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$userId", requestedUserId] },
                        { $gte: ["$date", startDateKey] },
                        { $lte: ["$date", endDateKey] },
                      ],
                    },
                    "$meals",
                    0,
                  ],
                },
              },
              totalMessMealsLifetime: { $sum: "$meals" },
              userMealsLifetime: {
                $sum: {
                  $cond: [{ $eq: ["$userId", requestedUserId] }, "$meals", 0],
                },
              },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),

      expenseCollection
        .aggregate<{
          messTotalExpenseCurrentMonth: number;
          messTotalExpenseLifetime: number;
        }>([
          {
            $match: {
              messId,
              status: "approved",
            },
          },
          {
            $group: {
              _id: null,
              messTotalExpenseCurrentMonth: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$expenseDate", startDateKey] },
                        { $lte: ["$expenseDate", endDateKey] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              messTotalExpenseLifetime: { $sum: "$amount" },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),

      depositCollection
        .aggregate<{
          userDepositsCurrentMonth: number;
          userDepositsLifetime: number;
        }>([
          { $match: { messId, userId: requestedUserId } },
          {
            $group: {
              _id: null,
              userDepositsCurrentMonth: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$date", startDateKey] },
                        { $lte: ["$date", endDateKey] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              userDepositsLifetime: { $sum: "$amount" },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),
    ]);

    const mealStats = mealAgg[0] ?? {
      totalMessMealsCurrentMonth: 0,
      userMealsCurrentMonth: 0,
      totalMessMealsLifetime: 0,
      userMealsLifetime: 0,
    };
    const expenseStats = expenseAgg[0] ?? {
      messTotalExpenseCurrentMonth: 0,
      messTotalExpenseLifetime: 0,
    };
    const depositStats = depositAgg[0] ?? {
      userDepositsCurrentMonth: 0,
      userDepositsLifetime: 0,
    };

    const costPerMeal =
      mealStats.totalMessMealsCurrentMonth > 0
        ? expenseStats.messTotalExpenseCurrentMonth /
          mealStats.totalMessMealsCurrentMonth
        : 0;
    const userMealCost = mealStats.userMealsCurrentMonth * costPerMeal;

    const lifetimeCostPerMeal =
      mealStats.totalMessMealsLifetime > 0
        ? expenseStats.messTotalExpenseLifetime /
          mealStats.totalMessMealsLifetime
        : 0;
    const lifetimeUserMealCost =
      mealStats.userMealsLifetime * lifetimeCostPerMeal;
    const walletBalance =
      depositStats.userDepositsLifetime - lifetimeUserMealCost;

    return {
      success: true,
      data: {
        userMeals: mealStats.userMealsCurrentMonth,
        totalMessMeals: mealStats.totalMessMealsCurrentMonth,
        messTotalExpense: round2(expenseStats.messTotalExpenseCurrentMonth),
        costPerMeal: round2(costPerMeal),
        userMealCost: round2(userMealCost),
        userDeposits: round2(depositStats.userDepositsCurrentMonth),
        walletBalance: round2(walletBalance),
      },
    };
  } catch (error) {
    console.error("Current month user financial summary error:", error);
    return {
      success: false,
      message: "Failed to fetch current month financial summary",
    };
  }
}

export async function getUserProfileSummary(
  userId: string,
): Promise<UserProfileSummaryResponse> {
  const financial = await getUserProfileFinancialSummary(userId);

  if (!financial.success) {
    return financial;
  }

  return {
    success: true,
    data: {
      user: financial.data.user,
      currentMonth: {
        mealCount: financial.data.currentMonth.mealCount,
        mealCost: financial.data.currentMonth.userMealCost,
        expenses: financial.data.currentMonth.messExpense,
        deposits: financial.data.currentMonth.deposits,
        balance: financial.data.wallet.balance,
      },
      lifetime: {
        mealCount: financial.data.lifetime.totalMeals,
        totalCost: financial.data.lifetime.totalMealCost,
        deposits: financial.data.lifetime.totalDeposits,
        expenses: financial.data.lifetime.totalExpensesPaid,
      },
    },
  };
}

export async function getUserProfileFinancialSummary(
  userId: string,
): Promise<UserProfileFinancialSummaryResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const requesterId = new ObjectId(session.user.id);
    const requestedUserId = parseObjectId(userId);

    if (!requestedUserId) {
      return { success: false, message: "Invalid user ID" };
    }

    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const messCollection = dbConnect(collections.MESS);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);
    const expenseCollection = dbConnect(collections.EXPENSES);
    const depositCollection = dbConnect(collections.DEPOSITS);

    const requesterMembership = await memberCollection.findOne({
      userId: requesterId,
      status: "active",
    });
    const requesterManagedMess = requesterMembership
      ? null
      : await messCollection.findOne({
          managerId: requesterId,
          status: "active",
        });

    const requesterMessId =
      requesterMembership?.messId ?? requesterManagedMess?._id;

    if (!requesterMessId) {
      return { success: false, message: "Unauthorized access" };
    }

    const [targetMembership] = await memberCollection
      .aggregate<TargetMembershipWithUser>([
        {
          $match: {
            messId: requesterMessId,
            userId: requestedUserId,
            status: "active",
          },
        },
        {
          $lookup: {
            from: collections.USERS,
            localField: "userId",
            foreignField: "_id",
            as: "user",
          },
        },
        { $unwind: "$user" },
        { $project: { _id: 0, user: 1 } },
      ])
      .toArray();

    if (!targetMembership?.user) {
      return { success: false, message: "Unauthorized access" };
    }

    const now = new Date();
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfCurrentMonth = new Date(
      now.getFullYear(),
      now.getMonth() + 1,
      0,
    );
    const startDateKey = toDateKey(startOfCurrentMonth);
    const endDateKey = toDateKey(endOfCurrentMonth);
    const messId = requesterMessId;

    const [mealAgg, expenseAgg, depositAgg] = await Promise.all([
      mealCollection
        .aggregate<{
          userMonthMeals: number;
          userLifetimeMeals: number;
          messMonthMeals: number;
          messLifetimeMeals: number;
        }>([
          { $match: { messId } },
          {
            $group: {
              _id: null,
              userMonthMeals: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $eq: ["$userId", requestedUserId] },
                        { $gte: ["$date", startDateKey] },
                        { $lte: ["$date", endDateKey] },
                      ],
                    },
                    "$meals",
                    0,
                  ],
                },
              },
              userLifetimeMeals: {
                $sum: {
                  $cond: [{ $eq: ["$userId", requestedUserId] }, "$meals", 0],
                },
              },
              messMonthMeals: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$date", startDateKey] },
                        { $lte: ["$date", endDateKey] },
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
          userLifetimeExpenses: number;
          messMonthExpenses: number;
          messLifetimeExpenses: number;
        }>([
          {
            $match: {
              messId,
              status: "approved",
            },
          },
          {
            $group: {
              _id: null,
              userLifetimeExpenses: {
                $sum: {
                  $cond: [{ $eq: ["$paidBy", requestedUserId] }, "$amount", 0],
                },
              },
              messMonthExpenses: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$expenseDate", startDateKey] },
                        { $lte: ["$expenseDate", endDateKey] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              messLifetimeExpenses: { $sum: "$amount" },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),

      depositCollection
        .aggregate<{
          userMonthDeposits: number;
          userLifetimeDeposits: number;
        }>([
          { $match: { messId, userId: requestedUserId } },
          {
            $group: {
              _id: null,
              userMonthDeposits: {
                $sum: {
                  $cond: [
                    {
                      $and: [
                        { $gte: ["$date", startDateKey] },
                        { $lte: ["$date", endDateKey] },
                      ],
                    },
                    "$amount",
                    0,
                  ],
                },
              },
              userLifetimeDeposits: { $sum: "$amount" },
            },
          },
          { $project: { _id: 0 } },
        ])
        .toArray(),
    ]);

    const mealStats = mealAgg[0] ?? {
      userMonthMeals: 0,
      userLifetimeMeals: 0,
      messMonthMeals: 0,
      messLifetimeMeals: 0,
    };
    const expenseStats = expenseAgg[0] ?? {
      userLifetimeExpenses: 0,
      messMonthExpenses: 0,
      messLifetimeExpenses: 0,
    };
    const depositStats = depositAgg[0] ?? {
      userMonthDeposits: 0,
      userLifetimeDeposits: 0,
    };

    const monthCostPerMeal =
      mealStats.messMonthMeals > 0
        ? expenseStats.messMonthExpenses / mealStats.messMonthMeals
        : 0;
    const lifetimeCostPerMeal =
      mealStats.messLifetimeMeals > 0
        ? expenseStats.messLifetimeExpenses / mealStats.messLifetimeMeals
        : 0;

    const mealCostThisMonth = round2(
      mealStats.userMonthMeals * monthCostPerMeal,
    );
    const lifetimeTotalCost = round2(
      mealStats.userLifetimeMeals * lifetimeCostPerMeal,
    );
    const walletBalance = round2(
      depositStats.userLifetimeDeposits - lifetimeTotalCost,
    );

    const createdAt = targetMembership.user.createdAt
      ? new Date(targetMembership.user.createdAt).toISOString()
      : null;

    return {
      success: true,
      data: {
        user: {
          id: targetMembership.user._id.toString(),
          name: targetMembership.user.name ?? "",
          email: targetMembership.user.email ?? "",
          role: targetMembership.user.role ?? "user",
          image: targetMembership.user.image ?? null,
          createdAt,
        },
        currentMonth: {
          mealCount: mealStats.userMonthMeals,
          messMealCount: mealStats.messMonthMeals,
          messExpense: round2(expenseStats.messMonthExpenses),
          mealRate: round2(monthCostPerMeal),
          userMealCost: mealCostThisMonth,
          deposits: round2(depositStats.userMonthDeposits),
        },
        lifetime: {
          totalMeals: mealStats.userLifetimeMeals,
          totalDeposits: round2(depositStats.userLifetimeDeposits),
          totalExpensesPaid: round2(expenseStats.userLifetimeExpenses),
          totalMealCost: lifetimeTotalCost,
        },
        wallet: {
          balance: walletBalance,
          totalDeposited: round2(depositStats.userLifetimeDeposits),
          totalCost: lifetimeTotalCost,
        },
      },
    };
  } catch (error) {
    console.error("User profile summary error:", error);
    return { success: false, message: "Failed to fetch profile summary" };
  }
}
