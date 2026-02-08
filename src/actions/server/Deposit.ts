"use server";

import { ObjectId } from "mongodb";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { dbConnect, collections } from "@/lib/dbConnect";

interface AddDepositPayload {
  messId: string;
  userId: string;
  amount: number;
  method: "cash" | "bkash" | "nagad" | "bank";
  note?: string;
  date?: string; // optional, defaults to today
}

export const addUserDeposit = async (payload: AddDepositPayload) => {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const managerId = new ObjectId(session.user.id);
  const messObjectId = new ObjectId(payload.messId);
  const userObjectId = new ObjectId(payload.userId);

  if (payload.amount <= 0) {
    throw new Error("Deposit amount must be greater than zero");
  }

  const messMemberCollection = dbConnect(collections.MESS_MEMBERS);

  /* ---------- VERIFY MANAGER ---------- */
  const managerMembership = await messMemberCollection.findOne({
    messId: messObjectId,
    userId: managerId,
    role: "manager",
  });

  if (!managerMembership) {
    throw new Error("Only manager can add deposits");
  }

  /* ---------- VERIFY TARGET USER ---------- */
  const userMembership = await messMemberCollection.findOne({
    messId: messObjectId,
    userId: userObjectId,
  });

  if (!userMembership) {
    throw new Error("User is not a member of this mess");
  }

  /* ---------- CREATE DEPOSIT ---------- */
  const depositDoc = {
    messId: messObjectId,
    userId: userObjectId,
    addedBy: managerId,

    amount: payload.amount,
    method: payload.method,
    note: payload.note || null,

    date: payload.date || new Date().toISOString().slice(0, 10),
    createdAt: new Date(),
  };

  const depositsCollections = dbConnect(collections.DEPOSITS);
  const result = await depositsCollections.insertOne(depositDoc);

  return {
    success: true,
    depositId: result.insertedId.toString(),
  };
};

interface DateRange {
  from?: Date;
  to?: Date;
}

export const getUsersCostSummary = async (range?: DateRange) => {
  try {
    /* ---------- AUTH ---------- */
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = new ObjectId(session.user.id);

    /* ---------- VERIFY MANAGER ---------- */
    const messMemberCollection = dbConnect(collections.MESS_MEMBERS);
    const managerMembership = await messMemberCollection.findOne({
      userId,
      role: "manager",
    });

    if (!managerMembership) {
      throw new Error("Access denied: Manager only");
    }

    const messId = managerMembership.messId;

    /* ---------- DATE RANGE (DEFAULT CURRENT MONTH) ---------- */
    const start =
      range?.from ??
      new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    const end =
      range?.to ??
      new Date(
        new Date().getFullYear(),
        new Date().getMonth() + 1,
        0,
        23,
        59,
        59,
      );

    /* ---------- AGGREGATION ---------- */
    const pipeline = [
      {
        $match: {
          messId,
        },
      },

      /* JOIN USER INFO */
      {
        $lookup: {
          from: collections.USERS,
          localField: "userId",
          foreignField: "_id",
          as: "user",
        },
      },
      { $unwind: "$user" },

      /* MEAL COST */
      {
        $lookup: {
          from: collections.MEAL_ENTRIES,
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },
                    { $eq: ["$messId", messId] },
                    {
                      $gte: [{ $toDate: "$date" }, start],
                    },
                    {
                      $lte: [{ $toDate: "$date" }, end],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalCost: { $sum: "$totalCost" },
              },
            },
          ],
          as: "mealCost",
        },
      },

      /* DEPOSITS */
      {
        $lookup: {
          from: collections.DEPOSITS,
          let: { uid: "$userId" },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ["$userId", "$$uid"] },
                    { $eq: ["$messId", messId] },
                    {
                      $gte: [{ $toDate: "$date" }, start],
                    },
                    {
                      $lte: [{ $toDate: "$date" }, end],
                    },
                  ],
                },
              },
            },
            {
              $group: {
                _id: null,
                totalDeposit: { $sum: "$amount" },
              },
            },
          ],
          as: "deposit",
        },
      },

      /* FORMAT DATA */
      {
        $addFields: {
          totalCost: {
            $ifNull: [{ $arrayElemAt: ["$mealCost.totalCost", 0] }, 0],
          },
          totalDeposit: {
            $ifNull: [{ $arrayElemAt: ["$deposit.totalDeposit", 0] }, 0],
          },
        },
      },

      {
        $project: {
          _id: 0,
          userId: { $toString: "$user._id" },
          name: "$user.name",
          email: "$user.email",
          role: "$user.role",
          totalCost: 1,
          totalDeposit: 1,
          balance: {
            $subtract: ["$totalDeposit", "$totalCost"],
          },
        },
      },

      { $sort: { name: 1 } },
    ];

    const result = await messMemberCollection.aggregate(pipeline).toArray();

    return {
      success: true,
      data: result,
      dateRange: { from: start, to: end },
    };
  } catch (error) {
    console.error("❌ Cost Summary Error:", error);
    return {
      success: false,
      message:
        error instanceof Error ? error.message : "Failed to fetch cost summary",
      data: [],
    };
  }
};
