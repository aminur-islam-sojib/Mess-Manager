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
  memberId?: string; // required if individual
};

export const addMealEntry = async (payload: MealPayload) => {
  try {
    // 🔐 Auth
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return { success: false, message: "Unauthorized" };
    }

    const managerId = new ObjectId(session.user.id);

    const messCollection = dbConnect(collections.MESS);
    const memberCollection = dbConnect(collections.MESS_MEMBERS);
    const mealCollection = dbConnect(collections.MEAL_ENTRIES);

    // 🏠 Get manager's mess
    const mess = await messCollection.findOne({
      managerId,
      status: "active",
    });

    if (!mess) {
      return { success: false, message: "Mess not found" };
    }

    // 🧮 Total meals
    const totalMeals =
      payload.meals.breakfast + payload.meals.lunch + payload.meals.dinner;

    if (totalMeals <= 0) {
      return { success: false, message: "Meals must be greater than 0" };
    }

    // ===============================
    // 🔹 INDIVIDUAL MODE
    // ===============================
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
        return {
          success: false,
          message: "User not part of this mess",
        };
      }

      await mealCollection.insertOne({
        messId: mess._id,
        userId: memberObjectId,
        date: payload.date,
        meals: totalMeals,
        breakdown: payload.meals, // 🔥 future-proof
        createdBy: managerId,
        createdAt: new Date(),
      });

      return { success: true, message: "Meal added for member" };
    }

    // ===============================
    // 🔹 ALL MEMBERS MODE
    // ===============================
    const members = await memberCollection
      .find({
        messId: mess._id,
        status: "active",
      })
      .toArray();

    if (members.length === 0) {
      return { success: false, message: "No active members found" };
    }

    const mealDocs = members.map((member) => ({
      messId: mess._id,
      userId: member.userId,
      date: payload.date,
      meals: totalMeals,
      breakdown: payload.meals,
      createdBy: managerId,
      createdAt: new Date(),
    }));

    // 🚀 BULK INSERT (FAST & ATOMIC)
    await mealCollection.insertMany(mealDocs);

    return {
      success: true,
      message: `Meal added for ${members.length} members`,
    };
  } catch (error: any) {
    if (error.code === 11000) {
      return {
        success: false,
        message: "Meal already exists for this date",
      };
    }

    console.error("❌ Add Meal Error:", error);
    return {
      success: false,
      message: "Failed to add meal entry",
    };
  }
};
