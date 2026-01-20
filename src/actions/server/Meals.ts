/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { collections, dbConnect } from "@/lib/dbConnect";
import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";

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
      return { success: false, message: "Unauthorized" };
    }

    const managerId = new ObjectId(session.user.id);

    const totalMeals =
      payload.meals.breakfast + payload.meals.lunch + payload.meals.dinner;

    if (totalMeals <= 0) {
      return { success: false, message: "Meals must be greater than 0" };
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
      return { success: false, message: "Mess not found" };
    }

    /* =================================
       🔹 INDIVIDUAL MEMBER MODE
    ================================== */
    if (payload.mode === "individual") {
      if (!payload.memberId) {
        return { success: false, message: "Member ID required" };
      }

      const memberObjectId = new ObjectId(payload.memberId);

      // Validate membership
      const isMember = await memberCollection.findOne({
        messId: mess._id,
        userId: memberObjectId,
        status: "active",
      });

      if (!isMember) {
        return { success: false, message: "User not part of this mess" };
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
        { upsert: true }
      );

      return {
        success: true,
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
      return { success: false, message: "No active members found" };
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
      success: true,
      message: `Meal updated for ${members.length} members`,
    };
  } catch (error: any) {
    console.error("❌ Add Meal Error:", error);

    return {
      success: false,
      message: "Failed to add meal entry",
    };
  }
};

export const getTodayMeals = async () => {
  try {
    /* ---------- AUTH ---------- */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const userId = session.user.id; // STRING (IMPORTANT)

    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);

    /* ---------- FIND ACTIVE MESS ---------- */
    let mess = await messCollection.findOne({
      managerId: new ObjectId(userId),
      status: "active",
    });

    if (!mess) {
      const membership = await memberCollection.findOne({
        userId, // STRING
        status: "active",
      });

      if (!membership) {
        return { success: false, message: "Mess not found" };
      }

      mess = await messCollection.findOne({
        _id: membership.messId,
        status: "active",
      });
    }

    if (!mess) {
      return { success: false, message: "Mess not found" };
    }

    /* ---------- TODAY (LOCAL SAFE) ---------- */
    const today = new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD

    /* ---------- AGGREGATION ---------- */
    const data = await mealCollection
      .aggregate([
        {
          $match: {
            messId: mess._id, // ✅ ObjectId match
            date: today,
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
        {
          $unwind: {
            path: "$user",
            preserveNullAndEmptyArrays: true,
          },
        },
        {
          $group: {
            _id: { $toString: "$userId" }, // ✅ Convert ObjectId to string

            name: { $first: "$user.name" },
            email: { $first: "$user.email" },

            breakfast: {
              $sum: { $ifNull: ["$breakdown.breakfast", 0] },
            },
            lunch: {
              $sum: { $ifNull: ["$breakdown.lunch", 0] },
            },
            dinner: {
              $sum: { $ifNull: ["$breakdown.dinner", 0] },
            },

            totalMeals: { $sum: { $ifNull: ["$meals", 0] } },
            entries: { $sum: 1 },
          },
        },
        { $sort: { name: 1 } },
      ])
      .toArray();

    /* ---------- SUMMARY ---------- */
    const summary = data.reduce(
      (acc, user) => {
        acc.breakfast += user.breakfast;
        acc.lunch += user.lunch;
        acc.dinner += user.dinner;
        acc.totalMeals += user.totalMeals;
        acc.entries += user.entries;
        return acc;
      },
      {
        breakfast: 0,
        lunch: 0,
        dinner: 0,
        totalMeals: 0,
        entries: 0,
      }
    );

    return {
      success: true,
      date: today,
      messId: mess._id.toString(),
      messName: mess.messName,
      summary,
      data,
    };
  } catch (error) {
    console.error("❌ Get Today Meals Error:", error);
    return {
      success: false,
      message: "Failed to fetch today's meals",
    };
  }
};
