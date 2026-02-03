"use server";

import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { collections, dbConnect } from "@/lib/dbConnect";

/* ===========================
   TYPES
=========================== */

export type MemberSummary = {
  userId: string;
  name: string;
  totalMeals: number;
  totalExpense: number;
};

export type MemberSummaryResponse =
  | { success: true; data: MemberSummary[] }
  | { success: false; message: string };

/* ===========================
   HELPERS
=========================== */

function getMonthDateRange(from?: string, to?: string) {
  if (from && to) {
    return {
      from: new Date(from),
      to: new Date(`${to}T23:59:59.999Z`),
    };
  }

  const now = new Date();
  return {
    from: new Date(now.getFullYear(), now.getMonth(), 1),
    to: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
  };
}

/* ===========================
   MAIN FUNCTION
=========================== */

export async function getMemberMealAndCostSummary(
  fromDate?: string,
  toDate?: string,
): Promise<MemberSummaryResponse> {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = new ObjectId(session.user.id);

    /* 1️⃣ Resolve mess from MESS_MEMBERS */
    const messMemberCol = dbConnect(collections.MESS_MEMBERS);

    const messMember = await messMemberCol.findOne({ userId });

    if (!messMember) {
      return { success: false, message: "User is not part of any mess" };
    }

    const messId = messMember.messId;

    /* 2️⃣ Resolve date range */
    const { from, to } = getMonthDateRange(fromDate, toDate);

    /* 3️⃣ Aggregate meals per member */
    const mealCol = dbConnect(collections.MEAL_ENTRIES);

    const mealAgg = await mealCol
      .aggregate<{
        _id: ObjectId;
        totalMeals: number;
      }>([
        {
          $match: {
            messId,
            date: {
              $gte: from.toISOString().slice(0, 10),
              $lte: to.toISOString().slice(0, 10),
            },
          },
        },
        {
          $group: {
            _id: "$userId",
            totalMeals: { $sum: "$meals" },
          },
        },
      ])
      .toArray();

    /* 4️⃣ Aggregate approved expenses per member */
    const expenseCol = dbConnect(collections.EXPENSES);

    const expenseAgg = await expenseCol
      .aggregate<{
        _id: ObjectId;
        totalExpense: number;
      }>([
        {
          $match: {
            messId,
            status: "approved",
            expenseDate: { $gte: from, $lte: to },
          },
        },
        {
          $group: {
            _id: "$paidBy",
            totalExpense: { $sum: "$amount" },
          },
        },
      ])
      .toArray();

    /* 5️⃣ Fetch mess members with names */
    const members = await messMemberCol
      .aggregate<{
        userId: ObjectId;
        name: string;
      }>([
        { $match: { messId } },
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
          $project: {
            userId: "$user._id",
            name: "$user.name",
          },
        },
      ])
      .toArray();

    /* 6️⃣ Merge results */
    const mealMap = new Map(
      mealAgg.map((m) => [m._id.toString(), m.totalMeals]),
    );

    const expenseMap = new Map(
      expenseAgg.map((e) => [e._id.toString(), e.totalExpense]),
    );

    const result: MemberSummary[] = members.map((m) => ({
      userId: m.userId.toString(),
      name: m.name,
      totalMeals: mealMap.get(m.userId.toString()) ?? 0,
      totalExpense: expenseMap.get(m.userId.toString()) ?? 0,
    }));

    return { success: true, data: result };
  } catch (error) {
    console.error("❌ Member Summary Error:", error);
    return { success: false, message: "Failed to generate member summary" };
  }
}
