"use server";

import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";
import { enumerateDateKeys, getMealReportRange } from "@/lib/mealReportPeriods";
import { getUserMess } from "@/lib/getUserMess";
import {
  GetMealReportBundleResponse,
  MealMemberRankingItem,
  MealReportQuery,
} from "@/types/MealManagementTypes";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";

const round2 = (value: number) => Number(value.toFixed(2));

export async function getMealReportBundle(
  query: MealReportQuery = {},
): Promise<GetMealReportBundleResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);
    const mess = await getUserMess(userId);

    if (!mess) {
      return { success: false, message: "Mess not found" };
    }

    const period = query.period ?? "thisMonth";
    const range = getMealReportRange(period, query.from, query.to);

    const page =
      typeof query.page === "number" && query.page > 0
        ? Math.floor(query.page)
        : 1;
    const limit =
      typeof query.limit === "number" && query.limit > 0
        ? Math.min(Math.floor(query.limit), 100)
        : 20;

    const selectedMemberIds =
      query.memberIds
        ?.filter(Boolean)
        .map((id) => {
          try {
            return new ObjectId(id);
          } catch {
            return null;
          }
        })
        .filter((id): id is ObjectId => Boolean(id)) ?? [];

    const memberFilter =
      selectedMemberIds.length > 0
        ? { userId: { $in: selectedMemberIds } }
        : {};

    const mealCollection = dbConnect(collections.MEAL_ENTRIES);
    const expenseCollection = dbConnect(collections.EXPENSES);

    const mealMatch = {
      messId: mess._id,
      date: { $gte: range.from, $lte: range.to },
      ...memberFilter,
    };

    const expenseMatch = {
      messId: mess._id,
      status: "approved",
      expenseDate: { $gte: range.from, $lte: range.to },
    };

    const [dailyMeals, dailyExpenses, memberTotals, memberCountAgg] =
      await Promise.all([
        mealCollection
          .aggregate<{
            _id: string;
            breakfast: number;
            lunch: number;
            dinner: number;
            totalMeals: number;
          }>([
            { $match: mealMatch },
            {
              $group: {
                _id: "$date",
                breakfast: { $sum: "$breakdown.breakfast" },
                lunch: { $sum: "$breakdown.lunch" },
                dinner: { $sum: "$breakdown.dinner" },
                totalMeals: { $sum: "$meals" },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray(),
        expenseCollection
          .aggregate<{ _id: string; totalExpenses: number }>([
            { $match: expenseMatch },
            {
              $group: {
                _id: "$expenseDate",
                totalExpenses: { $sum: "$amount" },
              },
            },
            { $sort: { _id: 1 } },
          ])
          .toArray(),
        mealCollection
          .aggregate<{
            _id: ObjectId;
            name: string;
            email: string;
            breakfast: number;
            lunch: number;
            dinner: number;
            totalMeals: number;
            entries: number;
          }>([
            { $match: mealMatch },
            {
              $lookup: {
                from: collections.USERS,
                localField: "userId",
                foreignField: "_id",
                as: "user",
              },
            },
            { $unwind: "$user" },
            {
              $group: {
                _id: "$userId",
                name: { $first: "$user.name" },
                email: { $first: "$user.email" },
                breakfast: { $sum: "$breakdown.breakfast" },
                lunch: { $sum: "$breakdown.lunch" },
                dinner: { $sum: "$breakdown.dinner" },
                totalMeals: { $sum: "$meals" },
                entries: { $sum: 1 },
              },
            },
            { $sort: { totalMeals: -1, name: 1 } },
          ])
          .toArray(),
        mealCollection
          .aggregate<{ total: number }>([
            { $match: mealMatch },
            {
              $group: {
                _id: "$userId",
              },
            },
            { $count: "total" },
          ])
          .toArray(),
      ]);

    const expenseByDate = new Map(
      dailyExpenses.map((item) => [item._id, item.totalExpenses]),
    );
    const mealsByDate = new Map(dailyMeals.map((item) => [item._id, item]));

    const dateKeys = enumerateDateKeys(range.from, range.to);
    const trend = dateKeys.map((date) => {
      const meals = mealsByDate.get(date);
      const totalExpenses = expenseByDate.get(date) ?? 0;

      return {
        date,
        breakfast: meals?.breakfast ?? 0,
        lunch: meals?.lunch ?? 0,
        dinner: meals?.dinner ?? 0,
        totalMeals: meals?.totalMeals ?? 0,
        totalExpenses: round2(totalExpenses),
      };
    });

    const distribution = trend.reduce(
      (acc, point) => ({
        breakfast: acc.breakfast + point.breakfast,
        lunch: acc.lunch + point.lunch,
        dinner: acc.dinner + point.dinner,
        totalMeals: acc.totalMeals + point.totalMeals,
      }),
      { breakfast: 0, lunch: 0, dinner: 0, totalMeals: 0 },
    );

    const totalExpenses = trend.reduce(
      (sum, point) => sum + point.totalExpenses,
      0,
    );
    const costPerMeal =
      distribution.totalMeals > 0
        ? round2(totalExpenses / distribution.totalMeals)
        : 0;

    const rankingWithCost: MealMemberRankingItem[] = memberTotals.map(
      (member) => ({
        _id: member._id.toString(),
        name: member.name,
        email: member.email,
        breakfast: member.breakfast,
        lunch: member.lunch,
        dinner: member.dinner,
        totalMeals: member.totalMeals,
        entries: member.entries,
        estimatedCost: round2(member.totalMeals * costPerMeal),
      }),
    );

    const totalMembers = memberCountAgg[0]?.total ?? rankingWithCost.length;
    const totalPages = Math.max(1, Math.ceil(totalMembers / limit));
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * limit;
    const paginatedRanking = rankingWithCost.slice(start, start + limit);

    const report = {
      messId: mess._id.toString(),
      messName: mess.messName,
      range,
      overview: {
        totalMeals: distribution.totalMeals,
        totalExpenses: round2(totalExpenses),
        costPerMeal,
        avgMealsPerMember:
          totalMembers > 0 ? round2(distribution.totalMeals / totalMembers) : 0,
        activeMembers: totalMembers,
      },
      trend,
      heatmap: trend.map((point) => ({
        date: point.date,
        totalMeals: point.totalMeals,
      })),
      distribution,
      memberRanking: paginatedRanking,
      pagination: {
        page: safePage,
        limit,
        total: totalMembers,
        totalPages,
        hasNext: safePage < totalPages,
        hasPrev: safePage > 1,
      },
    };

    return {
      success: true,
      report,
    };
  } catch (error) {
    console.error("Meal report bundle error:", error);
    return {
      success: false,
      message: "Failed to load meal report",
    };
  }
}
