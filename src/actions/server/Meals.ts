/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { collections, dbConnect } from "@/lib/dbConnect";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { getUserMess } from "@/lib/getUserMess";
import { MealMember } from "@/types/MealManagementTypes";

type MealPayload = {
  date: string; // "2024-12-26"
  meals: {
    breakfast: number;
    lunch: number;
    dinner: number;
  };
  mode: "all" | "individual";
  memberId?: string; // required for individual
};

// 🔧 helper to safely build increments
const buildInc = (meals: MealPayload["meals"]) => ({
  meals: meals.breakfast + meals.lunch + meals.dinner,
  "breakdown.breakfast": meals.breakfast,
  "breakdown.lunch": meals.lunch,
  "breakdown.dinner": meals.dinner,
});

export const addMealEntry = async (payload: MealPayload) => {
  try {
    /* ---------------------------------
       AUTH & BASIC VALIDATION
    ---------------------------------- */
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return { success: false as const, message: "Unauthorized" };
    }

    const managerId = new ObjectId(session.user.id);

    const totalMeals =
      payload.meals.breakfast + payload.meals.lunch + payload.meals.dinner;

    if (totalMeals <= 0) {
      return {
        success: false as const,
        message: "Meals must be greater than 0",
      };
    }

    /* ---------------------------------
       COLLECTIONS
    ---------------------------------- */
    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);

    /* ---------------------------------
       FIND MANAGER'S MESS
    ---------------------------------- */
    const mess = await messCollection.findOne({
      managerId,
      status: "active",
    });

    if (!mess) {
      return { success: false as const, message: "Mess not found" };
    }

    /* =================================
       🔹 INDIVIDUAL MEMBER MODE
    ================================== */
    if (payload.mode === "individual") {
      if (!payload.memberId) {
        return { success: false as const, message: "Member ID required" };
      }

      const memberObjectId = new ObjectId(payload.memberId);

      // Validate membership
      const isMember = await memberCollection.findOne({
        messId: mess._id,
        userId: memberObjectId,
        status: "active",
      });

      if (!isMember) {
        return {
          success: false as const,
          message: "User not part of this mess",
        };
      }

      // 🔥 UPSERT + INCREMENT
      await mealCollection.updateOne(
        {
          messId: mess._id,
          userId: memberObjectId,
          date: payload.date,
        },
        {
          $inc: buildInc(payload.meals),
          $set: { updatedAt: new Date() },
          $setOnInsert: {
            messId: mess._id,
            userId: memberObjectId,
            date: payload.date,
            createdBy: managerId,
            createdAt: new Date(),
          },
        },
        { upsert: true },
      );

      return {
        success: true as const,
        message: "Meal updated successfully for member",
      };
    }

    /* =================================
       🔹 ALL MEMBERS MODE
    ================================== */
    const members = await memberCollection
      .find({
        messId: mess._id,
        status: "active",
      })
      .toArray();

    if (members.length === 0) {
      return { success: false as const, message: "No active members found" };
    }

    // 🚀 BULK UPSERT (FAST + SAFE)
    const operations = members.map((member) => ({
      updateOne: {
        filter: {
          messId: mess._id,
          userId: member.userId,
          date: payload.date,
        },
        update: {
          $inc: buildInc(payload.meals),
          $set: { updatedAt: new Date() },
          $setOnInsert: {
            messId: mess._id,
            userId: member.userId,
            date: payload.date,
            createdBy: managerId,
            createdAt: new Date(),
          },
        },
        upsert: true,
      },
    }));

    await mealCollection.bulkWrite(operations);

    return {
      success: true as const,
      message: `Meal updated for ${members.length} members`,
    };
  } catch (error: any) {
    console.error("❌ Add Meal Error:", error);

    return {
      success: false as const,
      message: "Failed to add meal entry",
    };
  }
};

//  GET TODAYS MEAL
export const getTodayMeals = async () => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false as const, message: "Unauthorized" };
    }

    const userObjectId = new ObjectId(session.user.id);
    const mess = await getUserMess(userObjectId);

    if (!mess) {
      return { success: false as const, message: "Mess not found" };
    }

    const today = new Date().toISOString().slice(0, 10);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);

    const data = (await mealCollection
      .aggregate([
        { $match: { messId: mess._id, date: today } },
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
            _id: { $toString: "$userId" },
            name: { $first: "$user.name" },
            breakfast: { $sum: "$breakdown.breakfast" },
            lunch: { $sum: "$breakdown.lunch" },
            dinner: { $sum: "$breakdown.dinner" },
            totalMeals: { $sum: "$meals" },
          },
        },
      ])
      .toArray()) as unknown as MealMember[];

    return {
      success: true as const,
      date: today,
      messId: mess._id.toString(),
      messName: mess.messName,
      data,
    };
  } catch (err) {
    console.error("❌ Today meals error", err);
    return { success: false as const, message: "Failed to load today meals" };
  }
};

// GET MONTHLY MEAL DETAILS
export const getMonthlyMeals = async ({
  month,
  year,
}: {
  month: number;
  year: number;
}) => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { success: false as const, message: "Unauthorized" };
  }

  const userObjectId = new ObjectId(session.user.id);
  const mess = await getUserMess(userObjectId);

  if (!mess) {
    return { success: false as const, message: "Mess not found" };
  }

  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  const mealCollection = dbConnect(collections.MEAL_ENTRIES);

  const data = (await mealCollection
    .aggregate([
      {
        $match: {
          messId: mess._id,
          createdAt: { $gte: start, $lt: end },
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
      {
        $group: {
          _id: { $toString: "$userId" },
          name: { $first: "$user.name" },
          breakfast: { $sum: "$breakdown.breakfast" },
          lunch: { $sum: "$breakdown.lunch" },
          dinner: { $sum: "$breakdown.dinner" },
          totalMeals: { $sum: "$meals" },
        },
      },
    ])
    .toArray()) as unknown as MealMember[];

  return {
    success: true as const,
    messId: mess._id.toString(),
    messName: mess.messName,
    month,
    year,
    data,
  };
};

// GET MEA
export const getMealsByDateRange = async ({
  from,
  to,
}: {
  from?: string;
  to?: string;
}) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false as const, message: "Unauthorized" };
    }

    const userObjectId = new ObjectId(session.user.id);
    const mess = await getUserMess(userObjectId);

    if (!mess) {
      return { success: false as const, message: "Mess not found" };
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 6);

    const finalFrom = from ?? sevenDaysAgo.toISOString().slice(0, 10);
    const finalTo = to ?? today.toISOString().slice(0, 10);

    const mealCollection = dbConnect(collections.MEAL_ENTRIES);

    const data = (await mealCollection
      .aggregate([
        {
          $match: {
            messId: mess._id,
            date: { $gte: finalFrom, $lte: finalTo },
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
        {
          $group: {
            _id: { $toString: "$userId" },
            name: { $first: "$user.name" },
            breakfast: { $sum: "$breakdown.breakfast" },
            lunch: { $sum: "$breakdown.lunch" },
            dinner: { $sum: "$breakdown.dinner" },
            totalMeals: { $sum: "$meals" },
            entries: { $sum: 1 },
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray()) as unknown as MealMember[];

    return {
      success: true as const,
      from: finalFrom,
      to: finalTo,
      messId: mess._id.toString(),
      messName: mess.messName,
      data,
    };
  } catch (err) {
    console.error("❌ Range meal error", err);
    return { success: false as const, message: "Failed to load meals" };
  }
};
